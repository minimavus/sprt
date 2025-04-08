package radius

import (
	"fmt"
	"strings"
	"time"

	"layeh.com/radius/dictionary"
)

var parser = dictionary.Parser{IgnoreIdenticalAttributes: true}

func ParseFromString(content string) (*dictionary.Dictionary, string, error) {
	fname := fmt.Sprintf("virtual-%s", time.Now().Format(time.RFC3339Nano))
	d, err := parser.Parse(newVirtualFile(fname, content))
	return d, fname, err
}

func IsValidRadiusDictionaryContent(content string) error {
	_, fname, err := ParseFromString(content)
	if err != nil {
		tmp := strings.Replace(err.Error(), fname, "", -1)
		err = fmt.Errorf("invalid RADIUS dictionary content: %s", tmp)
	}
	return err
}
