package radius

import (
	"io"
	"strings"

	"layeh.com/radius/dictionary"
)

type virtualFile struct {
	name string
	io.Reader
}

var _ dictionary.File = (*virtualFile)(nil)

func newVirtualFile(name, content string) dictionary.File {
	stringReader := strings.NewReader(content)
	return &virtualFile{name: name, Reader: stringReader}
}

func (f *virtualFile) Close() error {
	return nil
}

func (f *virtualFile) Name() string {
	if f.name != "" {
		return f.name
	}
	return "virtual"
}
