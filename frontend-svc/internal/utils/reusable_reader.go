package utils

import (
	"bytes"
	"io"
)

type ReusableReader struct {
	io.Reader
	readBuf *bytes.Buffer
	backBuf *bytes.Buffer
	closed  bool
}

var _ io.ReadCloser = (*ReusableReader)(nil)

func NewReusableReader(r io.Reader) (*ReusableReader, error) {
	readBuf := bytes.Buffer{}
	_, err := readBuf.ReadFrom(r)
	if err != nil {
		return nil, err
	}
	backBuf := bytes.Buffer{}

	return &ReusableReader{
		io.TeeReader(&readBuf, &backBuf),
		&readBuf,
		&backBuf,
		false,
	}, nil
}

func (r ReusableReader) Read(p []byte) (int, error) {
	if r.closed || r.Reader == nil {
		return 0, io.ErrClosedPipe
	}

	n, err := r.Reader.Read(p)
	if err == io.EOF {
		err = r.reset()
		if err != nil {
			return n, err
		}
	}
	return n, err
}

func (r *ReusableReader) Close() error {
	r.closed = true
	r.backBuf = nil
	r.readBuf = nil
	r.Reader = nil
	return nil
}

func (r ReusableReader) reset() error {
	_, err := io.Copy(r.readBuf, r.backBuf)
	return err
}
