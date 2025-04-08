package templates

import "io/fs"

type (
	options struct {
		indexFS          fs.FS
		templatesFS      fs.FS
		overwriteDefault bool
	}

	TemplatesOption func(*options)
)

func WithIndexFS(f fs.FS) TemplatesOption {
	return func(o *options) {
		o.indexFS = f
	}
}

func WithTemplatesFS(f fs.FS) TemplatesOption {
	return func(o *options) {
		o.templatesFS = f
	}
}

func WithOverwriteDefault() TemplatesOption {
	return func(o *options) {
		o.overwriteDefault = true
	}
}

func applyOptions(o *options, opts ...TemplatesOption) {
	for _, v := range opts {
		v(o)
	}
}
