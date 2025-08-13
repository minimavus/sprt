package schemas

import (
	"fmt"
	"reflect"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

type GenerateJSON struct {
	// Coa corresponds to the JSON schema field "coa".
	// Coa *GenerateJSONCoa `json:"coa,omitempty" yaml:"coa,omitempty" mapstructure:"coa,omitempty"`

	// General corresponds to the JSON schema field "general".
	General GenerateJSONGeneral `json:"general" yaml:"general" mapstructure:"general"`

	// Guest corresponds to the JSON schema field "guest".
	// Guest *GenerateJSONGuest `json:"guest,omitempty" yaml:"guest,omitempty" mapstructure:"guest,omitempty"`

	// IpAddresses corresponds to the JSON schema field "ipAddresses".
	IPAddresses any `json:"ipAddresses" yaml:"ipAddresses" mapstructure:"ipAddresses"`

	// MacAddresses corresponds to the JSON schema field "macAddresses".
	MacAddresses any `json:"macAddresses" yaml:"macAddresses" mapstructure:"macAddresses"`

	// Radius corresponds to the JSON schema field "radius".
	Radius GenerateJSONRadius `json:"radius" yaml:"radius" mapstructure:"radius"`

	// Scheduler corresponds to the JSON schema field "scheduler".
	Scheduler any `json:"scheduler,omitempty" yaml:"scheduler,omitempty" mapstructure:"scheduler,omitempty"`

	// Other is here to capture any additional fields that are not explicitly defined in the schema.
	Other map[string]any `mapstructure:",remain"`
}

type GenerateJSONCoa struct {
	// OnBounceHostPort corresponds to the JSON schema field "onBounceHostPort".
	OnBounceHostPort any `json:"onBounceHostPort,omitempty" yaml:"onBounceHostPort,omitempty" mapstructure:"onBounceHostPort,omitempty"`

	// OnDefault corresponds to the JSON schema field "onDefault".
	OnDefault any `json:"onDefault,omitempty" yaml:"onDefault,omitempty" mapstructure:"onDefault,omitempty"`

	// OnDisableHostPort corresponds to the JSON schema field "onDisableHostPort".
	OnDisableHostPort any `json:"onDisableHostPort,omitempty" yaml:"onDisableHostPort,omitempty" mapstructure:"onDisableHostPort,omitempty"`

	// OnReauthenticateDefault corresponds to the JSON schema field
	// "onReauthenticateDefault".
	OnReauthenticateDefault any `json:"onReauthenticateDefault,omitempty" yaml:"onReauthenticateDefault,omitempty" mapstructure:"onReauthenticateDefault,omitempty"`

	// OnReauthenticateLast corresponds to the JSON schema field
	// "onReauthenticateLast".
	OnReauthenticateLast any `json:"onReauthenticateLast,omitempty" yaml:"onReauthenticateLast,omitempty" mapstructure:"onReauthenticateLast,omitempty"`

	// OnReauthenticateRerun corresponds to the JSON schema field
	// "onReauthenticateRerun".
	OnReauthenticateRerun any `json:"onReauthenticateRerun,omitempty" yaml:"onReauthenticateRerun,omitempty" mapstructure:"onReauthenticateRerun,omitempty"`
}

type GenerateJSONGeneral struct {
	// Job corresponds to the JSON schema field "job".
	Job GenerateJSONGeneralJob `json:"job" yaml:"job" mapstructure:"job"`

	// Nas corresponds to the JSON schema field "nas".
	Nas GenerateJSONGeneralNas `json:"nas" yaml:"nas" mapstructure:"nas"`

	// Server corresponds to the JSON schema field "server".
	Server GenerateJSONGeneralServer `json:"server" yaml:"server" mapstructure:"server"`
}

type GenerateJSONGeneralJob struct {
	// BulkName corresponds to the JSON schema field "bulkName".
	BulkName string `json:"bulkName" yaml:"bulkName" mapstructure:"bulkName"`

	// Latency corresponds to the JSON schema field "latency".
	Latency any `json:"latency" yaml:"latency" mapstructure:"latency"`

	// LatencyAcctStart corresponds to the JSON schema field "latencyAcctStart".
	LatencyAcctStart any `json:"latencyAcctStart" yaml:"latencyAcctStart" mapstructure:"latencyAcctStart"`

	// MultiThread corresponds to the JSON schema field "multiThread".
	MultiThread bool `json:"multiThread" yaml:"multiThread" mapstructure:"multiThread"`

	// Name corresponds to the JSON schema field "name".
	Name string `json:"name" yaml:"name" mapstructure:"name"`

	// SaveSessions corresponds to the JSON schema field "saveSessions".
	SaveSessions bool `json:"saveSessions" yaml:"saveSessions" mapstructure:"saveSessions"`

	// SessionsAmount corresponds to the JSON schema field "sessionsAmount".
	SessionsAmount float64 `json:"sessionsAmount" yaml:"sessionsAmount" mapstructure:"sessionsAmount"`

	// WithAcctStart corresponds to the JSON schema field "withAcctStart".
	WithAcctStart bool `json:"withAcctStart" yaml:"withAcctStart" mapstructure:"withAcctStart"`

	// WithDACL corresponds to the JSON schema field "withDACL".
	WithDACL bool `json:"withDACL" yaml:"withDACL" mapstructure:"withDACL"`

	// Proto corresponds to the JSON schema field "proto".
	Proto string `json:"proto" yaml:"proto" mapstructure:"proto"`
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONGeneralJob) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["bulkName"]; raw != nil && !ok {
		return fmt.Errorf("field bulkName in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["latency"]; raw != nil && !ok {
		return fmt.Errorf("field latency in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["latencyAcctStart"]; raw != nil && !ok {
		return fmt.Errorf("field latencyAcctStart in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["multiThread"]; raw != nil && !ok {
		return fmt.Errorf("field multiThread in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["name"]; raw != nil && !ok {
		return fmt.Errorf("field name in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["saveSessions"]; raw != nil && !ok {
		return fmt.Errorf("field saveSessions in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["sessionsAmount"]; raw != nil && !ok {
		return fmt.Errorf("field sessionsAmount in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["withAcctStart"]; raw != nil && !ok {
		return fmt.Errorf("field withAcctStart in GenerateJSONGeneralJob: required")
	}
	if _, ok := raw["withDACL"]; raw != nil && !ok {
		return fmt.Errorf("field withDACL in GenerateJSONGeneralJob: required")
	}
	type Plain GenerateJSONGeneralJob
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	if 1 > plain.SessionsAmount {
		return fmt.Errorf("field %s: must be >= %v", "sessionsAmount", 1)
	}
	*j = GenerateJSONGeneralJob(plain)
	return nil
}

type GenerateJSONGeneralNas struct {
	// ConnectionType corresponds to the JSON schema field "connectionType".
	ConnectionType string `json:"connectionType" yaml:"connectionType" mapstructure:"connectionType"`

	// Mtu corresponds to the JSON schema field "mtu".
	Mtu float64 `json:"mtu" yaml:"mtu" mapstructure:"mtu"`

	// NasIP corresponds to the JSON schema field "nasIp".
	NasIP string `json:"nasIp" yaml:"nasIp" mapstructure:"nasIp"`

	// Retransmits corresponds to the JSON schema field "retransmits".
	Retransmits float64 `json:"retransmits" yaml:"retransmits" mapstructure:"retransmits"`

	// SessionIDTemplate corresponds to the JSON schema field "sessionIdTemplate".
	SessionIDTemplate string `json:"sessionIdTemplate" yaml:"sessionIdTemplate" mapstructure:"sessionIdTemplate"`

	// Timeout corresponds to the JSON schema field "timeout".
	Timeout float64 `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONGeneralNas) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["connectionType"]; raw != nil && !ok {
		return fmt.Errorf("field connectionType in GenerateJSONGeneralNas: required")
	}
	if _, ok := raw["mtu"]; raw != nil && !ok {
		return fmt.Errorf("field mtu in GenerateJSONGeneralNas: required")
	}
	if _, ok := raw["nasIp"]; raw != nil && !ok {
		return fmt.Errorf("field nasIp in GenerateJSONGeneralNas: required")
	}
	if _, ok := raw["retransmits"]; raw != nil && !ok {
		return fmt.Errorf("field retransmits in GenerateJSONGeneralNas: required")
	}
	if _, ok := raw["sessionIdTemplate"]; raw != nil && !ok {
		return fmt.Errorf("field sessionIdTemplate in GenerateJSONGeneralNas: required")
	}
	if _, ok := raw["timeout"]; raw != nil && !ok {
		return fmt.Errorf("field timeout in GenerateJSONGeneralNas: required")
	}
	type Plain GenerateJSONGeneralNas
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	if len(plain.ConnectionType) < 1 {
		return fmt.Errorf("field %s length: must be >= %d", "connectionType", 1)
	}
	if 1 > plain.Mtu {
		return fmt.Errorf("field %s: must be >= %v", "mtu", 1)
	}
	if len(plain.NasIP) < 1 {
		return fmt.Errorf("field %s length: must be >= %d", "nasIp", 1)
	}
	if 0 > plain.Retransmits {
		return fmt.Errorf("field %s: must be >= %v", "retransmits", 0)
	}
	if len(plain.SessionIDTemplate) < 1 {
		return fmt.Errorf("field %s length: must be >= %d", "sessionIdTemplate", 1)
	}
	if 0 > plain.Timeout {
		return fmt.Errorf("field %s: must be >= %v", "timeout", 0)
	}
	*j = GenerateJSONGeneralNas(plain)
	return nil
}

type GenerateJSONGeneralServer struct {
	// AcctPort corresponds to the JSON schema field "acctPort".
	AcctPort float64 `json:"acctPort" yaml:"acctPort" mapstructure:"acctPort"`

	// Address corresponds to the JSON schema field "address".
	Address string `json:"address" yaml:"address" mapstructure:"address"`

	// AuthPort corresponds to the JSON schema field "authPort".
	AuthPort float64 `json:"authPort" yaml:"authPort" mapstructure:"authPort"`

	// LoadedId corresponds to the JSON schema field "loadedId".
	LoadedID *string `json:"loadedId,omitempty" yaml:"loadedId,omitempty" mapstructure:"loadedId,omitempty"`

	// Save corresponds to the JSON schema field "save".
	Save bool `json:"save" yaml:"save" mapstructure:"save"`

	// Secret corresponds to the JSON schema field "secret".
	Secret string `json:"secret" yaml:"secret" mapstructure:"secret"`
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONGeneralServer) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["acctPort"]; raw != nil && !ok {
		return fmt.Errorf("field acctPort in GenerateJSONGeneralServer: required")
	}
	if _, ok := raw["address"]; raw != nil && !ok {
		return fmt.Errorf("field address in GenerateJSONGeneralServer: required")
	}
	if _, ok := raw["authPort"]; raw != nil && !ok {
		return fmt.Errorf("field authPort in GenerateJSONGeneralServer: required")
	}
	if _, ok := raw["save"]; raw != nil && !ok {
		return fmt.Errorf("field save in GenerateJSONGeneralServer: required")
	}
	if _, ok := raw["secret"]; raw != nil && !ok {
		return fmt.Errorf("field secret in GenerateJSONGeneralServer: required")
	}
	type Plain GenerateJSONGeneralServer
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	if 65535 < plain.AcctPort {
		return fmt.Errorf("field %s: must be <= %v", "acctPort", 65535)
	}
	if 0 >= plain.AcctPort {
		return fmt.Errorf("field %s: must be > %v", "acctPort", 0)
	}
	if len(plain.Address) < 1 {
		return fmt.Errorf("field %s length: must be >= %d", "address", 1)
	}
	if 65535 < plain.AuthPort {
		return fmt.Errorf("field %s: must be <= %v", "authPort", 65535)
	}
	if 0 >= plain.AuthPort {
		return fmt.Errorf("field %s: must be > %v", "authPort", 0)
	}
	*j = GenerateJSONGeneralServer(plain)
	return nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONGeneral) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["job"]; raw != nil && !ok {
		return fmt.Errorf("field job in GenerateJSONGeneral: required")
	}
	if _, ok := raw["nas"]; raw != nil && !ok {
		return fmt.Errorf("field nas in GenerateJSONGeneral: required")
	}
	if _, ok := raw["server"]; raw != nil && !ok {
		return fmt.Errorf("field server in GenerateJSONGeneral: required")
	}
	type Plain GenerateJSONGeneral
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	*j = GenerateJSONGeneral(plain)
	return nil
}

type GenerateJSONGuest struct {
	// GuestFlow corresponds to the JSON schema field "guestFlow".
	GuestFlow any `json:"guestFlow,omitempty" yaml:"guestFlow,omitempty" mapstructure:"guestFlow,omitempty"`

	// UserAgents corresponds to the JSON schema field "userAgents".
	UserAgents *GenerateJSONGuestUserAgents `json:"userAgents,omitempty" yaml:"userAgents,omitempty" mapstructure:"userAgents,omitempty"`
}

type GenerateJSONGuestUserAgents struct {
	// AllowRepeats corresponds to the JSON schema field "allowRepeats".
	AllowRepeats *bool `json:"allowRepeats,omitempty" yaml:"allowRepeats,omitempty" mapstructure:"allowRepeats,omitempty"`

	// Dictionaries corresponds to the JSON schema field "dictionaries".
	Dictionaries []string `json:"dictionaries,omitempty" yaml:"dictionaries,omitempty" mapstructure:"dictionaries,omitempty"`

	// Select corresponds to the JSON schema field "select".
	Select *GenerateJSONGuestUserAgentsSelect `json:"select,omitempty" yaml:"select,omitempty" mapstructure:"select,omitempty"`
}

type GenerateJSONGuestUserAgentsSelect string

const GenerateJSONGuestUserAgentsSelectRandom GenerateJSONGuestUserAgentsSelect = "random"
const GenerateJSONGuestUserAgentsSelectSequential GenerateJSONGuestUserAgentsSelect = "sequential"

var enumValues_GenerateJSONGuestUserAgentsSelect = []any{
	"sequential",
	"random",
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONGuestUserAgentsSelect) UnmarshalJSON(b []byte) error {
	var v string
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	var ok bool
	for _, expected := range enumValues_GenerateJSONGuestUserAgentsSelect {
		if reflect.DeepEqual(v, expected) {
			ok = true
			break
		}
	}
	if !ok {
		return fmt.Errorf("invalid value (expected one of %#v): %#v", enumValues_GenerateJSONGuestUserAgentsSelect, v)
	}
	*j = GenerateJSONGuestUserAgentsSelect(v)
	return nil
}

type GenerateJSONRadius struct {
	// Attributes corresponds to the JSON schema field "attributes".
	Attributes GenerateJSONRadiusAttributes `json:"attributes" yaml:"attributes" mapstructure:"attributes"`

	// Dictionaries corresponds to the JSON schema field "dictionaries".
	Dictionaries []string `json:"dictionaries" yaml:"dictionaries" mapstructure:"dictionaries"`
}

type GenerateJSONRadiusAttributes struct {
	// AccessRequest corresponds to the JSON schema field "accessRequest".
	AccessRequest []any `json:"accessRequest" yaml:"accessRequest" mapstructure:"accessRequest"`

	// AccountingStart corresponds to the JSON schema field "accountingStart".
	AccountingStart []any `json:"accountingStart" yaml:"accountingStart" mapstructure:"accountingStart"`
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONRadiusAttributes) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["accessRequest"]; raw != nil && !ok {
		return fmt.Errorf("field accessRequest in GenerateJSONRadiusAttributes: required")
	}
	if _, ok := raw["accountingStart"]; raw != nil && !ok {
		return fmt.Errorf("field accountingStart in GenerateJSONRadiusAttributes: required")
	}
	type Plain GenerateJSONRadiusAttributes
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	*j = GenerateJSONRadiusAttributes(plain)
	return nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSONRadius) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["attributes"]; raw != nil && !ok {
		return fmt.Errorf("field attributes in GenerateJSONRadius: required")
	}
	if _, ok := raw["dictionaries"]; raw != nil && !ok {
		return fmt.Errorf("field dictionaries in GenerateJSONRadius: required")
	}
	type Plain GenerateJSONRadius
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	*j = GenerateJSONRadius(plain)
	return nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (j *GenerateJSON) UnmarshalJSON(b []byte) error {
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	if _, ok := raw["general"]; raw != nil && !ok {
		return fmt.Errorf("field general in GenerateJSON: required")
	}
	if _, ok := raw["ipAddresses"]; raw != nil && !ok {
		return fmt.Errorf("field ipAddresses in GenerateJSON: required")
	}
	if _, ok := raw["macAddresses"]; raw != nil && !ok {
		return fmt.Errorf("field macAddresses in GenerateJSON: required")
	}
	if _, ok := raw["radius"]; raw != nil && !ok {
		return fmt.Errorf("field radius in GenerateJSON: required")
	}
	type Plain GenerateJSON
	var plain Plain
	if err := json.Unmarshal(b, &plain); err != nil {
		return err
	}
	*j = GenerateJSON(plain)
	return nil
}
