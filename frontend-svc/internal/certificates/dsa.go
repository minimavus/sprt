package certificates

import (
	"crypto/dsa"
	"encoding/asn1"
	"errors"
	"math/big"
)

type dsaOpenssl struct {
	Version int
	P       *big.Int
	Q       *big.Int
	G       *big.Int
	Pub     *big.Int
	Priv    *big.Int
}

func parseDSAPrivateKey(der []byte) (*dsa.PrivateKey, error) {
	var k dsaOpenssl

	rest, err := asn1.Unmarshal(der, &k)
	if err != nil {
		return nil, errors.New("failed to parse DSA key: " + err.Error())
	}
	if len(rest) > 0 {
		return nil, errors.New("garbage after DSA key")
	}

	return &dsa.PrivateKey{
		PublicKey: dsa.PublicKey{
			Parameters: dsa.Parameters{
				P: k.P,
				Q: k.Q,
				G: k.G,
			},
			Y: k.Pub,
		},
		X: k.Priv,
	}, nil
}

// https://github.com/golang/crypto/blob/master/ssh/keys.go#L793-L804
func marshalDSAPrivateKey(pk *dsa.PrivateKey) ([]byte, error) {
	k := dsaOpenssl{
		Version: 0,
		P:       pk.P,
		Q:       pk.Q,
		G:       pk.G,
		Pub:     pk.Y,
		Priv:    pk.X,
	}

	return asn1.Marshal(k)
}
