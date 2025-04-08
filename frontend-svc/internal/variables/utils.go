package variables

func withDefault[T any](value *T, defaultValue T) T {
	if value == nil {
		return defaultValue
	}
	return *value
}

func ptr[T any](value T) *T {
	return &value
}
