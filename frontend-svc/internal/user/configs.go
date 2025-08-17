package user

import (
	"context"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

const tempDefaults = `{"general": {
	"nas": {
		"nasIp": "",
		"connectionType": "Wireless-802.11",
		"mtu": 1300,
		"sessionIdTemplate": "uc(hex(rand(4096..65535)))/uc($MAC$)/uc(hex(rand(4096..65535)))",
		"timeout": 5,
		"retransmits": 0
	},
	"server": {
		"address": "",
		"authPort": 1812,
		"acctPort": 1813,
		"secret": "",
		"save": true
	},
	"job": {
		"name": "",
		"sessionsAmount": 1,
		"latency": 0,
		"multiThread": true,
		"saveSessions": true,
		"bulkName": "",
		"withAcctStart": true,
		"latencyAcctStart": 0,
		"withDACL": true
	}
},
"macAddresses": {
	"how": "random",
	"allowRepeats": true
},
"ipAddresses": {
	"how": "random",
	"allowRepeats": true
},
"radius": {
	"dictionaries": [
    "dictionary.airespace",
    "dictionary.cisco",
    "dictionary.cisco.asa",
    "dictionary.microsoft",
    "dictionary.rfc2865",
    "dictionary.rfc2866",
    "dictionary.rfc2867",
    "dictionary.rfc2868",
    "dictionary.rfc2869",
    "dictionary.rfc3162",
    "dictionary.rfc3576",
    "dictionary.rfc3580",
    "dictionary.rfc5176"],
	"attributes": {
		"accessRequest": [],
		"accountingStart": []
	}
},
"scheduler": {
	"what": "nothing"
}}`

type RadiusDefaults struct {
	General struct {
		Nas struct {
			NasIP             string `json:"nasIp"`
			ConnectionType    string `json:"connectionType"`
			Mtu               int    `json:"mtu"`
			SessionIdTemplate string `json:"sessionIdTemplate"`
			Timeout           int    `json:"timeout"`
			Retransmits       int    `json:"retransmits"`
		} `json:"nas"`
		Server struct {
			Address  string `json:"address"`
			AuthPort int    `json:"authPort"`
			AcctPort int    `json:"acctPort"`
			Secret   string `json:"secret"`
			Save     bool   `json:"save"`
		} `json:"server"`
		Job struct {
			Name             string `json:"name"`
			SessionsAmount   int    `json:"sessionsAmount"`
			Latency          int    `json:"latency"`
			MultiThread      bool   `json:"multiThread"`
			SaveSessions     bool   `json:"saveSessions"`
			BulkName         string `json:"bulkName"`
			WithAcctStart    bool   `json:"withAcctStart"`
			LatencyAcctStart int    `json:"latencyAcctStart"`
			WithDACL         bool   `json:"withDACL"`
		} `json:"job"`
	} `json:"general"`
	MacAddresses struct {
		How          string `json:"how"`
		AllowRepeats bool   `json:"allowRepeats"`
	} `json:"macAddresses"`
	IPAddresses struct {
		How          string `json:"how"`
		AllowRepeats bool   `json:"allowRepeats"`
	} `json:"ipAddresses"`
	Radius struct {
		Dictionaries []string `json:"dictionaries"`
		Attributes   struct {
			AccessRequest   []any `json:"accessRequest"`
			AccountingStart []any `json:"accountingStart"`
		} `json:"attributes"`
	} `json:"radius"`
	Scheduler struct {
		What string `json:"what"`
	} `json:"scheduler"`
}

func GetUserProtoDefaults(_ context.Context, _ app.App, _ auth.ExtendedUserData, _ string) (any, error) {
	// TODO: Implement this method
	a := RadiusDefaults{}
	err := json.Unmarshal([]byte(tempDefaults), &a)
	if err != nil {
		return nil, err
	}
	return a, nil
}
