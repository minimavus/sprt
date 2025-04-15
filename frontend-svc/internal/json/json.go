package json

import (
	"io"

	jsoniter "github.com/json-iterator/go"
)

type RawMessage = jsoniter.RawMessage

var Json = jsoniter.ConfigCompatibleWithStandardLibrary

func Marshal(v interface{}) ([]byte, error) {
	return Json.Marshal(v)
}

func Unmarshal(data []byte, v interface{}) error {
	return Json.Unmarshal(data, v)
}

func NewEncoder(writer io.Writer) *jsoniter.Encoder {
	return Json.NewEncoder(writer)
}

func NewDecoder(reader io.Reader) *jsoniter.Decoder {
	return Json.NewDecoder(reader)
}
