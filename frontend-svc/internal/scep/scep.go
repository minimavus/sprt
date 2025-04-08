package scep

import (
	"context"
	"crypto/rand"
	"crypto/tls"

	"crypto/x509"
	"encoding/pem"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-kit/kit/log"
	httptransport "github.com/go-kit/kit/transport/http"
	scepclient "github.com/micromdm/scep/v2/client"
	scepserver "github.com/micromdm/scep/v2/server"
	"github.com/smallstep/pkcs7"
	"github.com/smallstep/scep"
	"github.com/smallstep/scep/x509util"

	"github.com/cisco-open/sprt/frontend-svc/internal/certificates"
	"github.com/cisco-open/sprt/frontend-svc/internal/config"
)

type (
	SCEPClient interface {
		scepclient.Client

		GetParsedCACert(ctx context.Context, message string) ([]*x509.Certificate, error)
		Enroll(ctx context.Context, tpl certificates.CertTemplateContent, opts ...EnrollOption) (*x509.Certificate, any, error)
	}

	scepClient struct {
		scepclient.Client

		logger log.Logger
		mscep  bool
	}
)

func NewClient(app *config.AppConfig, url string) (SCEPClient, error) {
	logger := log.LoggerFunc(func(keyvals ...interface{}) error {
		ev := app.Logger().Info()
		for i := 0; i < len(keyvals); i += 2 {
			ev = ev.Interface(keyvals[i].(string), keyvals[i+1])
		}
		ev.Msg("")
		return nil
	})

	if strings.HasSuffix(url, "mscep.dll") {
		url += "/pkiclient.exe"
	}

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr, Timeout: 20 * time.Second}

	endpoints, err := MakeClientEndpoints(url, httptransport.SetClient(client))
	if err != nil {
		return nil, err
	}
	endpoints.GetEndpoint = scepserver.EndpointLoggingMiddleware(logger)(endpoints.GetEndpoint)
	endpoints.PostEndpoint = scepserver.EndpointLoggingMiddleware(logger)(endpoints.PostEndpoint)

	newClient := &scepClient{Client: endpoints, logger: logger}
	if strings.HasSuffix(url, "mscep.dll") {
		newClient.mscep = true
	}

	return newClient, nil
}

func (c *scepClient) GetParsedCACert(ctx context.Context, message string) ([]*x509.Certificate, error) {
	encoded, _, err := c.Client.GetCACert(ctx, message)
	if err != nil {
		return nil, err
	}

	p, err := pkcs7.Parse(encoded)
	if err != nil {
		return nil, err
	}

	return p.Certificates, nil
}

const (
	csrPEMBlockType = "CERTIFICATE REQUEST"
)

type enrollOptions struct {
	challenge string
	signCert  *x509.Certificate
	signPriv  any
	timeout   time.Duration
	sleep     time.Duration
}

type EnrollOption func(*enrollOptions)

func WithChallenge(challenge string) EnrollOption {
	return func(o *enrollOptions) {
		o.challenge = challenge
	}
}

func WithSignerCertificate(cert *x509.Certificate, privateKey any) EnrollOption {
	return func(o *enrollOptions) {
		o.signCert = cert
		o.signPriv = privateKey
	}
}

func WithTimeout(timeout time.Duration) EnrollOption {
	return func(o *enrollOptions) {
		o.timeout = timeout
	}
}

func WithSleep(sleep time.Duration) EnrollOption {
	return func(o *enrollOptions) {
		o.sleep = sleep
	}
}

func defaultEnrollOptions() *enrollOptions {
	return &enrollOptions{
		timeout: 5 * time.Minute,
		sleep:   30 * time.Second,
	}
}

func (o *enrollOptions) apply(opts ...EnrollOption) {
	for _, opt := range opts {
		opt(o)
	}
}

func (c *scepClient) Enroll(ctx context.Context, tpl certificates.CertTemplateContent, opts ...EnrollOption) (*x509.Certificate, any, error) {
	o := defaultEnrollOptions()
	o.apply(opts...)

	c.logger.Log("msg", "generating private key for template")
	priv, err := getPrivateKeyForTemplate(tpl)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get private key for template: %w", err)
	}

	c.logger.Log("msg", "generating CSR from template")
	csr, err := makeCsrFromTemplate(tpl)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to make CSR from template: %w", err)
	}

	csr.ChallengePassword = o.challenge
	c.logger.Log("msg", "Using challenge password", "challenge", csr.ChallengePassword)

	c.logger.Log("msg", "creating CSR request, der")
	derBytes, err := x509util.CreateCertificateRequest(rand.Reader, csr, priv)
	// derBytes, err := x509.CreateCertificateRequest(rand.Reader, &csr.CertificateRequest, priv)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create certificate request: %w", err)
	}

	pemBlock := &pem.Block{
		Type:  csrPEMBlockType,
		Bytes: derBytes,
	}
	writer := &strings.Builder{}
	if err := pem.Encode(writer, pemBlock); err != nil {
		return nil, nil, err
	}

	c.logger.Log("pem", writer.String())

	c.logger.Log("msg", "parsing CSR request")
	req, err := x509.ParseCertificateRequest(derBytes)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse CSR request: %w", err)
	}

	c.logger.Log("msg", "getting CA certs")
	caCerts, err := c.GetParsedCACert(ctx, "SPRT SCEP enrollment")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get CA certs: %w", err)
	}

	msgType := scep.PKCSReq

	tmpl := &scep.PKIMessage{
		MessageType: msgType,
		Recipients:  caCerts,
		SignerKey:   o.signPriv,
		SignerCert:  o.signCert,
	}
	if o.challenge != "" {
		tmpl.CSRReqMessage = &scep.CSRReqMessage{
			ChallengePassword: o.challenge,
		}
	}
	c.logger.Log("msg", "creating CSR request")
	msg, err := scep.NewCSRRequest(req, tmpl,
		scep.WithLogger(c.logger),
		scep.WithCertsSelector(scep.EnciphermentCertsSelector()))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CSR request: %w", err)
	}

	c.logger.Log("msg", "sending CSR request")
	respMsg, err := c.waitForResponse(ctx, msg, caCerts, o)
	if err != nil {
		return nil, nil, err
	}

	c.logger.Log("msg", "decrypting PKI envelope")
	if err := respMsg.DecryptPKIEnvelope(o.signCert, o.signPriv); err != nil {
		return nil, nil, fmt.Errorf("decrypt pkiEnvelope, msgType: %s, status %s: %w", msgType, respMsg.PKIStatus, err)
	}

	respCert := respMsg.CertRepMessage.Certificate
	return respCert, priv, nil
}

func (c *scepClient) waitForResponse(ctx context.Context, msg *scep.PKIMessage, caCerts []*x509.Certificate, o *enrollOptions) (*scep.PKIMessage, error) {
	ctx, cancel := context.WithTimeout(ctx, o.timeout)
	defer cancel()

	ticker := time.NewTicker(o.sleep)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled or timeout reached: %w", ctx.Err())
		case <-ticker.C:
			respBytes, err := c.PKIOperation(ctx, msg.Raw)
			if err != nil {
				return nil, fmt.Errorf("PKIOperation for %s: %w", msg.MessageType, err)
			}

			respMsg, err := scep.ParsePKIMessage(respBytes, scep.WithLogger(c.logger), scep.WithCACerts(caCerts))
			if err != nil {
				return nil, fmt.Errorf("parsing pkiMessage response %s: %w", msg.MessageType, err)
			}

			switch respMsg.PKIStatus {
			case scep.FAILURE:
				return nil, fmt.Errorf("%s request failed, failInfo: %s", msg.MessageType, respMsg.FailInfo)
			case scep.PENDING:
				c.logger.Log("pkiStatus", "PENDING", "msg", "still waiting, retrying...")
				// Continue waiting
			case scep.SUCCESS:
				c.logger.Log("pkiStatus", "SUCCESS", "msg", "server returned a certificate.")
				return respMsg, nil
			}
		}
	}
}
