package certificates

import (
	"context"
	"fmt"
	"os"
	"os/user"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

type Importer []*models.Certificate

type InvalidCertificate struct {
	*models.Certificate
	Reason string `json:"reason"`
}

// FilterExpiredWithErrors filters out expired certificates and returns an error if any are found
func (c Importer) FilterExpiredWithErrors() (Importer, []InvalidCertificate, error) {
	var (
		valid   Importer
		invalid []InvalidCertificate
	)

	for _, cert := range c {
		if cert.ValidTo.Time.Before(time.Now()) {
			invalid = append(invalid, InvalidCertificate{cert, "expired"})
		} else {
			valid = append(valid, cert)
		}
	}

	return valid, invalid, nil
}

type FilterPredicate func(*models.Certificate) (bool, string, error)

// FilterFuncWithErrors filters out certificates based on a function and returns an error if any are found
func (c Importer) FilterFuncWithErrors(f FilterPredicate) (Importer, []InvalidCertificate, error) {
	var (
		valid   Importer
		invalid []InvalidCertificate
	)

	for _, cert := range c {
		isValid, reason, err := f(cert)
		if err != nil {
			return nil, nil, err
		}

		if isValid {
			valid = append(valid, cert)
		} else {
			invalid = append(invalid, InvalidCertificate{cert, reason})
		}
	}

	return valid, invalid, nil
}

func (c Importer) ValidateWithOptions(ctx context.Context, app *config.AppConfig, opts ImportOptions) (Importer, []InvalidCertificate, error) {
	var err error

	var invalid []InvalidCertificate
	validated := c
	if opts.IsSkipExpired() {
		validated, invalid, err = validated.FilterExpiredWithErrors()
		if opts.IsErrorIfExists() && err != nil {
			return nil, invalid, err
		}
	}

	if opts.IsCheckIfExists() {
		app.Logger().Debug().Msg("Checking if certificates exist in the database")
		var filtered []InvalidCertificate
		validated, filtered, err = validated.FilterFuncWithErrors(func(c *models.Certificate) (bool, string, error) {
			app.Logger().Debug().Str("subject", c.Subject.String).
				Str("thumbprint", c.Thumbprint.String).Str("serial", c.Serial.String).Str("type", c.Type.String()).
				Msg("Checking if certificate exists in the database")
			exists, err := db.Exec(app).CertificateExists(ctx, c)
			if err != nil {
				return false, "", err
			}
			reason := ""
			if exists {
				reason = "exists"
			}
			if exists && opts.IsErrorIfExists() {
				return false, reason, fmt.Errorf("certificate with subject %s already exists", c.Subject.String)
			}
			return !exists, reason, nil
		})
		if err != nil {
			return nil, nil, err
		}
		invalid = append(invalid, filtered...)
	}

	return validated, invalid, nil
}

// StoreCertificates stores the certificates in the database and optionally as files
func (c Importer) StoreCertificates(ctx context.Context, app *config.AppConfig, asFile bool) (int64, error) {
	var err error

	if err = c.populateIDs(); err != nil {
		return 0, err
	}

	if asFile {
		err = c.storeFiles(app, lookupUser(app.Specs.Store.User))
		if err != nil {
			return 0, fmt.Errorf("failed to store certificates as files: %w", err)
		}
	}

	inserted, err := db.Exec(app).StoreCertificates(ctx, models.CertificateSlice(c))
	if err != nil {
		return 0, fmt.Errorf("failed to store certificates in the database: %w", err)
	}

	app.Logger().Debug().Int64("inserted", inserted).Msg("Stored certificates in the database")

	return inserted, nil
}

// storeFiles stores the files of the certificates in a directory and updates the owner of the files
func (c Importer) storeFiles(app *config.AppConfig, u *user.User) error {
	if app.Specs.Store.CertificatesDirectory == "" {
		return fmt.Errorf("no certificates directory specified")
	}

	var storedFiles []string
	defer func() {
		if len(storedFiles) > 0 {
			app.Logger().Info().Strs("files", storedFiles).Msg("Stored certificate files, cleaning up")
			for _, f := range storedFiles {
				if e := os.Remove(f); e != nil {
					app.Logger().Error().Err(e).Str("file", f).Msg("Failed to delete file")
				}
			}
		}
	}()

	for _, cert := range c {
		newFiles, err := storeFilesOfCert(cert, app.Specs.Store.CertificatesDirectory)
		if err != nil {
			return fmt.Errorf("failed to store files for certificate %s: %w", cert.ID, err)
		}
		storedFiles = append(storedFiles, newFiles...)
	}

	if err := updateOwnerOfFiles(u, storedFiles...); err != nil {
		return err
	}

	storedFiles = nil

	return nil
}

// populateIDs populates the IDs of the certificates with new ones if they are empty
func (c Importer) populateIDs() error {
	for _, cert := range c {
		if cert.ID == "" {
			newId, err := uuid.NewV7()
			if err != nil {
				return fmt.Errorf("failed to generate new ID for certificate: %w", err)
			}
			cert.ID = newId.String()
		}
	}

	return nil
}

// storeFilesOfCert stores the files of a certificate
// (certificate, private key, public key) in a directory
func storeFilesOfCert(cert *models.Certificate, dir string) ([]string, error) {
	if cert.ID == "" {
		return nil, fmt.Errorf("certificate has no ID")
	}

	safeName := composeSafeNameFromFriendlyName(cert.FriendlyName.String)

	realDir, err := generateAndEnsureDirectory(cert, safeName, dir)
	if err != nil {
		return nil, err
	}

	var storedFiles []string

	certFile := fmt.Sprintf("%s/%s.pem", realDir, safeName)
	if err := os.WriteFile(certFile, []byte(cert.Content), 0644); err != nil {
		return nil, fmt.Errorf("failed to write certificate file %s: %w", certFile, err)
	}
	cert.Content = withFilePrefix(certFile)
	storedFiles = append(storedFiles, certFile)

	if cert.Keys.Valid {
		k := keys{}
		if err := cert.Keys.Unmarshal(&k); err != nil {
			return nil, fmt.Errorf("failed to unmarshal keys: %w", err)
		}

		kf, err := storeKeyInFile(k.Private, "private", realDir, safeName)
		if err != nil {
			return nil, err
		}
		if kf != "" {
			k.Private = withFilePrefix(kf)
			storedFiles = append(storedFiles, kf)
		}

		kf, err = storeKeyInFile(k.Public, "public", realDir, safeName)
		if err != nil {
			return nil, err
		}
		if kf != "" {
			k.Public = withFilePrefix(kf)
			storedFiles = append(storedFiles, kf)
		}
	}

	return storedFiles, nil
}

// generateAndEnsureDirectory generates a directory path from a template and ensures it exists
func generateAndEnsureDirectory(cert *models.Certificate, safeName string, dir string) (string, error) {
	replacements := map[string]string{
		"id":            cert.ID,
		"type":          cert.Type.String(),
		"user":          cert.Owner,
		"friendly_name": safeName,
	}
	realDir := utils.ReplaceAll(dir, replacements)
	if err := os.MkdirAll(realDir, 0755); err != nil {
		if !os.IsExist(err) {
			return "", fmt.Errorf("failed to create directory %s: %w", realDir, err)
		}
	}
	return realDir, nil
}

// storeKeyInFile stores a key in a file and returns the path to the file
func storeKeyInFile(key, kind, dir, safeName string) (string, error) {
	if key == "" {
		return "", nil
	}

	keyFile := fmt.Sprintf("%s/%s.%s.key", dir, safeName, kind)
	if err := os.WriteFile(keyFile, []byte(key), 0644); err != nil {
		return "", fmt.Errorf("failed to write key file %s: %w", keyFile, err)
	}

	return keyFile, nil
}

// lookupUser looks up a user by name and returns it, or nil if the user is not found
func lookupUser(name string) *user.User {
	if name == "" {
		return nil
	}

	looked, err := user.Lookup(name)
	if err != nil {
		log.Error().Err(err).Str("user", name).Msg("Failed to lookup user, using current user instead")
		return nil
	}

	return looked
}

// updateOwnerOfFiles updates the owner of the given files to the given user
func updateOwnerOfFiles(u *user.User, files ...string) error {
	if u == nil {
		return nil
	}

	uid, err := strconv.Atoi(u.Uid)
	gid, err := strconv.Atoi(u.Gid)
	if err != nil {
		log.Error().Err(err).Str("user", u.Username).Msg("Failed to convert user ID or group ID to int")
		return nil
	}

	for _, f := range files {
		if err := os.Chown(f, uid, gid); err != nil {
			return fmt.Errorf("failed to change owner of file %s: %w", f, err)
		}
	}

	return nil
}

// withFilePrefix returns a string with a file prefix: "file:" + file
func withFilePrefix(file string) string {
	prefix := "file:"
	if !strings.HasPrefix(file, "/") {
		prefix += "/"
	}
	return prefix + file
}
