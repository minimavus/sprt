package scep

import (
	"bytes"
	"context"
	"net/url"
	"strings"
	"sync"

	"github.com/go-kit/kit/endpoint"
	httptransport "github.com/go-kit/kit/transport/http"
	scepserver "github.com/micromdm/scep/v2/server"
)

// possible SCEP operations
const (
	getCACaps     = "GetCACaps"
	getCACert     = "GetCACert"
	pkiOperation  = "PKIOperation"
	getNextCACert = "GetNextCACert"
)

type Endpoints struct {
	GetEndpoint  endpoint.Endpoint
	PostEndpoint endpoint.Endpoint

	mtx          sync.RWMutex
	capabilities []byte
}

func (e *Endpoints) GetCACaps(ctx context.Context) ([]byte, error) {
	request := scepserver.SCEPRequest{Operation: getCACaps}
	response, err := e.GetEndpoint(ctx, request)
	if err != nil {
		return nil, err
	}
	resp := response.(scepserver.SCEPResponse)

	e.mtx.Lock()
	e.capabilities = resp.Data
	e.mtx.Unlock()

	return resp.Data, resp.Err
}

func (e *Endpoints) Supports(cap string) bool {
	e.mtx.RLock()
	defer e.mtx.RUnlock()

	if len(e.capabilities) == 0 {
		e.mtx.RUnlock()
		e.GetCACaps(context.Background())
		e.mtx.RLock()
	}
	return bytes.Contains(e.capabilities, []byte(cap))
}

func (e *Endpoints) GetCACert(ctx context.Context, message string) ([]byte, int, error) {
	request := scepserver.SCEPRequest{Operation: getCACert, Message: []byte(message)}
	response, err := e.GetEndpoint(ctx, request)
	if err != nil {
		return nil, 0, err
	}
	resp := response.(scepserver.SCEPResponse)
	return resp.Data, resp.CACertNum, resp.Err
}

func (e *Endpoints) PKIOperation(ctx context.Context, msg []byte) ([]byte, error) {
	var ee endpoint.Endpoint
	if e.Supports("POSTPKIOperation") || e.Supports("SCEPStandard") {
		ee = e.PostEndpoint
	} else {
		ee = e.GetEndpoint
	}

	request := scepserver.SCEPRequest{Operation: pkiOperation, Message: msg}
	response, err := ee(ctx, request)
	if err != nil {
		return nil, err
	}
	resp := response.(scepserver.SCEPResponse)
	return resp.Data, resp.Err
}

func (e *Endpoints) GetNextCACert(ctx context.Context) ([]byte, error) {
	var request scepserver.SCEPRequest
	response, err := e.GetEndpoint(ctx, request)
	if err != nil {
		return nil, err
	}
	resp := response.(scepserver.SCEPResponse)
	return resp.Data, resp.Err
}

// MakeClientEndpoints returns an Endpoints struct where each endpoint invokes
// the corresponding method on the remote instance, via a transport/http.Client.
// Useful in a SCEP client.
func MakeClientEndpoints(instance string, options ...httptransport.ClientOption) (*Endpoints, error) {
	if !strings.HasPrefix(instance, "http") {
		instance = "http://" + instance
	}
	tgt, err := url.Parse(instance)
	if err != nil {
		return nil, err
	}

	if options == nil {
		options = []httptransport.ClientOption{}
	}

	return &Endpoints{
		GetEndpoint: httptransport.NewClient(
			"GET",
			tgt,
			scepserver.EncodeSCEPRequest,
			scepserver.DecodeSCEPResponse,
			options...).Endpoint(),
		PostEndpoint: httptransport.NewClient(
			"POST",
			tgt,
			scepserver.EncodeSCEPRequest,
			scepserver.DecodeSCEPResponse,
			options...).Endpoint(),
	}, nil
}
