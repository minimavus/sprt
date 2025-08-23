package utils

import (
	"fmt"
	"strings"
)

func PtrOf[T any](v T) *T {
	return &v
}

// GetByPath retrieves a value from a nested map[string]any using a dot-separated path.
func GetByPath(data map[string]any, path string) (any, error) {
	parts := strings.Split(path, ".")
	var current any = data

	for _, part := range parts {
		m, ok := current.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("path is not a map at segment '%s'", part)
		}
		val, exists := m[part]
		if !exists {
			return nil, fmt.Errorf("path not found: '%s'", path)
		}
		current = val
	}
	return current, nil
}
