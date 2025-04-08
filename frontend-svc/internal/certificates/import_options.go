package certificates

import "github.com/labstack/echo/v4"

type ImportOptions struct {
	CheckIfExists  *bool `json:"check_if_exists" form:"check_if_exists" validate:"omitempty"`
	ErrorIfExists  *bool `json:"error_if_exists" form:"error_if_exists" validate:"omitempty"`
	SkipExpired    *bool `json:"skip_expired" form:"skip_expired" validate:"omitempty"`
	ErrorIfExpired *bool `json:"error_if_expired" form:"error_if_expired" validate:"omitempty"`
	AsFile         *bool `json:"as_file" form:"as_file" validate:"omitempty"`
}

func (i *ImportOptions) BindFromEcho(c echo.Context) error {
	if err := c.Bind(i); err != nil {
		return err
	}
	return c.Validate(i)
}

func (i *ImportOptions) FillDefaults() {
	if i.CheckIfExists == nil {
		i.CheckIfExists = new(bool)
		*i.CheckIfExists = true
	}
	if i.ErrorIfExists == nil {
		i.ErrorIfExists = new(bool)
		*i.ErrorIfExists = false
	}
	if i.SkipExpired == nil {
		i.SkipExpired = new(bool)
		*i.SkipExpired = true
	}
	if i.ErrorIfExpired == nil {
		i.ErrorIfExpired = new(bool)
		*i.ErrorIfExpired = false
	}
	if i.AsFile == nil {
		i.AsFile = new(bool)
		*i.AsFile = false
	}
}

func (i *ImportOptions) IsCheckIfExists() bool {
	if i.CheckIfExists == nil {
		i.FillDefaults()
	}
	return *i.CheckIfExists
}

func (i *ImportOptions) IsErrorIfExists() bool {
	if i.ErrorIfExists == nil {
		i.FillDefaults()
	}
	return *i.ErrorIfExists
}

func (i *ImportOptions) IsSkipExpired() bool {
	if i.SkipExpired == nil {
		i.FillDefaults()
	}
	return *i.SkipExpired
}

func (i *ImportOptions) IsErrorIfExpired() bool {
	if i.ErrorIfExpired == nil {
		i.FillDefaults()
	}
	return *i.ErrorIfExpired
}

func (i *ImportOptions) IsAsFile() bool {
	if i.AsFile == nil {
		i.FillDefaults()
	}
	return *i.AsFile
}
