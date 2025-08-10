package dictionaries

import (
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries/radius"
)

type (
	NameTitle struct {
		Name  DictionaryType `json:"name"`
		Title string         `json:"title"`
	}

	ValidationRequest struct {
		Type    string
		Content string
	}

	DictionaryType string
)

const (
	UA           DictionaryType = "ua"
	Credentials  DictionaryType = "credentials"
	Form         DictionaryType = "form"
	MAC          DictionaryType = "mac"
	IP           DictionaryType = "ip"
	RADIUS       DictionaryType = "radius"
	Unclassified DictionaryType = "unclassified"
)

func GetValidTypes() []NameTitle {
	return []NameTitle{
		{Name: UA, Title: "User Agents"},
		{Name: Credentials, Title: "Credentials"},
		{Name: Form, Title: "Form Fields"},
		{Name: MAC, Title: "MAC Addresses"},
		{Name: IP, Title: "IP Addresses"},
		{Name: RADIUS, Title: "RADIUS Attributes"},
		{Name: Unclassified, Title: "Unclassified"},
	}
}

func isValidType(t string) error {
	if DictionaryType(t).isValid() {
		return nil
	}
	return fmt.Errorf("incorrect dictionary type '%s'", t)
}

func (t DictionaryType) isValid() bool {
	switch t {
	case UA, Credentials, Form, MAC, IP, RADIUS, Unclassified:
		return true
	default:
		return false
	}
}

func (t DictionaryType) isValidContent(content string) error {
	switch t {
	case RADIUS:
		return radius.IsValidRadiusDictionaryContent(content)
	default:
		return nil
	}
}

func IsValid(r ValidationRequest) error {
	if err := isValidType(r.Type); err != nil {
		return err
	}
	return DictionaryType(r.Type).isValidContent(r.Content)
}
