package certificates

import (
	"archive/tar"
	"bytes"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"time"

	"github.com/rs/zerolog/log"
)

type CertificatesPacker struct {
	c []*Certificate

	addedFiles map[string]struct{}
	tw         *tar.Writer
}

var (
	unsafeNameRe = regexp.MustCompile(`[^A-Za-z0-9\-\.=]`)

	MaxSafeNameLength = 230
)

func NewPacker(certs []*Certificate) CertificatesPacker {
	return CertificatesPacker{c: certs}
}

// PrepareTarFile creates a tar file with all the certificates and keys
func (c *CertificatesPacker) PrepareTarFile(includeKeys bool, password string) (io.Reader, error) {
	c.addedFiles = make(map[string]struct{})

	buf := &bytes.Buffer{}

	c.tw = tar.NewWriter(buf)
	defer c.tw.Close()

	for _, cert := range c.c {
		if err := c.addCertToTar(cert, "", includeKeys, password); err != nil {
			return nil, err
		}
	}

	return buf, nil
}

func (c *CertificatesPacker) addCertToTar(cert *Certificate, folder string, includeKeys bool, password string) error {
	safeName := composeSafeName(cert)
	if folder == "" {
		folder = c.ensureUniqueFolder(safeName)
		err := c.tw.WriteHeader(&tar.Header{
			Name:     folder,
			ModTime:  time.Now(),
			Mode:     0755,
			Typeflag: tar.TypeDir,
		})
		if err != nil {
			return fmt.Errorf("failed to write folder %s to tar: %w", folder, err)
		}
		c.addedFiles[folder] = struct{}{}
		log.Debug().Str("folder", folder).Msg("Added folder to tar")
	}

	filename := c.ensureUniqueFilename(folder, safeName, ".pem")
	reader, size, err := cert.getReader()
	if err != nil {
		return fmt.Errorf("failed to get reader for %s: %w", filename, err)
	}

	header := &tar.Header{
		Name:    filename,
		Size:    size,
		ModTime: time.Now(),
		Mode:    0644,
	}

	if err = c.tw.WriteHeader(header); err != nil {
		return fmt.Errorf("failed to write header for %s: %w", filename, err)
	}

	_, err = io.Copy(c.tw, reader)
	if err != nil {
		return fmt.Errorf("failed to write %s to tar: %w", filename, err)
	}

	c.addedFiles[filename] = struct{}{}

	log.Debug().Str("filename", filename).Msg("Added file to tar")

	if includeKeys {
		if err := c.addKeysToTar(cert, folder, safeName, password); err != nil {
			return err
		}
	}

	if cert.Chain != nil {
		if err := c.addCertToTar(cert.Chain, folder, false, ""); err != nil {
			return err
		}
	}

	return nil
}

func (c *CertificatesPacker) addKeysToTar(cert *Certificate, folder string, safeName string, password string) error {
	if err := cert.loadKeys(); err != nil {
		return fmt.Errorf("failed to load keys for %s: %w", safeName, err)
	}

	if cert.keys.Private == "" {
		return nil
	}

	filename := c.ensureUniqueFilename(folder, safeName, ".pvk")
	var (
		bytes []byte
		err   error
	)
	if password != "" {
		bytes, err = cert.encryptPrivateKey(password)
		if err != nil {
			return fmt.Errorf("failed to encrypt private key for %s: %w", safeName, err)
		}
	} else {
		bytes = []byte(cert.keys.Private)
	}

	header := &tar.Header{
		Name:    filename,
		Size:    int64(len(bytes)),
		ModTime: time.Now(),
		Mode:    0644,
	}
	if err = c.tw.WriteHeader(header); err != nil {
		return fmt.Errorf("failed to write header for %s: %w", filename, err)
	}

	_, err = c.tw.Write(bytes)
	if err != nil {
		return fmt.Errorf("failed to write %s to tar: %w", filename, err)
	}

	c.addedFiles[filename] = struct{}{}

	return nil
}

func (c *CertificatesPacker) ensureUniqueFolder(folder string) string {
	if _, exists := c.addedFiles[folder+"/"]; !exists {
		return folder + "/"
	}

	i := 1
	for {
		newFolder := folder + "_" + strconv.Itoa(i)
		if _, exists := c.addedFiles[newFolder+"/"]; !exists {
			return newFolder + "/"
		}
		i++
	}
}

func (c *CertificatesPacker) ensureUniqueFilename(folder, filename, ext string) string {
	if _, exists := c.addedFiles[folder+filename+ext]; !exists {
		return folder + filename + ext
	}

	i := 1
	for {
		newFilename := filename + "_" + strconv.Itoa(i)
		if _, exists := c.addedFiles[folder+newFilename+ext]; !exists {
			return folder + newFilename + ext
		}
		i++
	}
}

func composeSafeName(cert *Certificate) string {
	return composeSafeNameFromFriendlyName(cert.FriendlyName.String)
}

func composeSafeNameFromFriendlyName(friendlyName string) string {
	safeName := unsafeNameRe.ReplaceAllString(friendlyName, "_")
	if len(safeName) > MaxSafeNameLength {
		safeName = safeName[:MaxSafeNameLength]
	}
	return safeName
}
