package utils

import "strings"

func ReplaceAll(tmpls string, replacements map[string]string) string {
	for k, v := range replacements {
		tmpls = strings.ReplaceAll(tmpls, "{{"+k+"}}", v)
	}
	return tmpls
}
