package utils

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
)

func Zero[V any]() (_ V) {
	return
}

func PtrOf[V any](val V) *V {
	return &val
}

func Sha1Hash(s string) string {
	h := sha1.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func NestedMapLookup[V any](m map[string]interface{}, ks ...string) (rval V, err error) {
	var (
		ok  bool
		raw any
	)

	if len(ks) == 0 { // degenerate input
		return Zero[V](), fmt.Errorf("map empty")
	}
	if raw, ok = m[ks[0]]; !ok {
		return Zero[V](), fmt.Errorf("key not found; remaining keys: %v", ks)
	} else if len(ks) == 1 { // we've reached the final key
		if rval, ok = raw.(V); !ok {
			return Zero[V](), fmt.Errorf("incorrect type of value")
		}
		return rval, nil
	} else if m, ok = raw.(map[string]interface{}); !ok {
		return Zero[V](), fmt.Errorf("malformed structure at %#v", rval)
	}

	return NestedMapLookup[V](m, ks[1:]...)
}
