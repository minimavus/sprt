package pxgrid

import pxgrider_proto "github.com/vkumov/go-pxgrider/pkg"

type (
	UIMapping struct {
		Wiki        string `json:"wiki"`
		DisplayName string `json:"display_name"`
		Description string `json:"description,omitempty"`
	}

	UIMappingResponse struct {
		ServiceName  string `json:"service_name"`
		FriendlyName string `json:"friendly_name"`
		DisplayName  string `json:"display_name,omitempty"`
		Wiki         string `json:"wiki,omitempty"`
		Description  string `json:"description,omitempty"`
	}

	UIServicesMappingsResponse struct {
		Services []UIMappingResponse `json:"services"`
	}

	UITopicMapping struct {
		Destination string `json:"destination"`
		Description string `json:"description,omitempty"`
	}

	UITopicsMappingsResponse map[string]map[string]UITopicMapping
)

var (
	knownUIMappings = map[string]UIMapping{
		"com.cisco.ise.config.anc": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/ANC-configuration",
			DisplayName: "ANC Configuration",
			Description: "This is Adaptive Network Control configuration service. This is available in ISE 2.4.",
		},
		"com.cisco.endpoint.asset": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/Endpoint-Asset",
			DisplayName: "Endpoint Asset",
			Description: "This is ISE pxGrid Context-In feature This is for providers to publish asset data into ISE where ISE Profiler component acts as a subscriber to collect.",
		},
		"com.cisco.ise.mdm": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/MDM",
			DisplayName: "MDM",
			Description: "This is Mobile Device Management (MDM) service. This is available in ISE 2.4.",
		},
		"com.cisco.ise.config.profiler": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/Profiler-configuration",
			DisplayName: "Profiler Configuration",
			Description: "This is ISE Profiler configuration.",
		},
		"com.cisco.ise.pubsub": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/Pubsub",
			DisplayName: "PubSub",
			Description: "This provides a WebSocket STOMP pubsub service that is used by many of ISE services.",
		},
		"com.cisco.ise.radius": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/Radius-Failure",
			DisplayName: "Radius Failure",
			Description: "This service provides information about Radius protocol.",
		},
		"com.cisco.ise.session": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/Session-Directory",
			DisplayName: "Session Directory",
			Description: "This service provides access to ISE Session Directory.",
		},
		"com.cisco.ise.system": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/System-Health",
			DisplayName: "System Health",
			Description: "This is ISE System Health service.",
		},
		"com.cisco.ise.trustsec": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/TrustSec",
			DisplayName: "TrustSec",
			Description: "This is ISE TrustSec service. Currently, it provides the status of SGACL downloads.",
		},
		"com.cisco.ise.config.trustsec": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/TrustSec-configuration",
			DisplayName: "TrustSec Configuration",
			Description: "This provides the configuration for TrustSec.",
		},
		"com.cisco.ise.sxp": {
			Wiki:        "https://github.com/cisco-pxgrid/pxgrid-rest-ws/wiki/TrustSec-SXP",
			DisplayName: "TrustSec SXP",
			Description: "This is ISE SXP service.",
		},
	}

	knownTopicsMapping = map[string]map[string]UITopicMapping{
		"com.cisco.ise.config.anc": {
			"statusTopic": {Destination: "/topic/com.cisco.ise.config.anc.status"},
		},
		"com.cisco.endpoint.asset": {
			"assetTopic": {Destination: "/topic/com.cisco.endpoint.asset"},
		},
		"com.cisco.ise.mdm": {
			"endpointTopic": {Destination: "/topic/com.cisco.endpoint.asset"},
		},
		"com.cisco.ise.config.profiler": {
			"topic": {Destination: "/topic/com.cisco.ise.config.profiler"},
		},
		"com.cisco.ise.pubsub": {},
		"com.cisco.ise.radius": {
			"failureTopic": {Destination: "/topic/com.cisco.ise.radius.failure"},
		},
		"com.cisco.ise.session": {
			"sessionTopic": {
				Destination: "/topic/com.cisco.ise.session",
				Description: "Topic for session events, from ISE 2.3 onwards",
			},
			"sessionTopicAll": {
				Destination: "/topic/com.cisco.ise.session.all",
				Description: "Topic for session events, from ISE 3.3p2, 3.4 onwards",
			},
			"groupTopic": {
				Destination: "/topic/com.cisco.ise.session.group",
				Description: "Topic for user group events, from ISE 2.3 onwards",
			},
		},
		"com.cisco.ise.system": {},
		"com.cisco.ise.trustsec": {
			"policyDownloadTopic": {Destination: "/topic/com.cisco.ise.trustsec.policy.download"},
		},
		"com.cisco.ise.config.trustsec": {
			"securityGroupTopic": {
				Destination: "/topic/com.cisco.ise.config.trustsec.security.group",
				Description: "from ISE 2.4 onwards",
			},
			"securityGroupAclTopic": {
				Destination: "/topic/com.cisco.ise.config.trustsec.security.group.acl",
				Description: "from ISE 2.4p13, 2.6p9, 2.7 onwards",
			},
			"securityGroupVnVlanTopic": {
				Destination: "/topic/com.cisco.ise.config.trustsec.security.group.vnvlan",
				Description: "from ISE 3.0 onwards",
			},
			"virtualnetworkTopic": {
				Destination: "/topic/com.cisco.ise.config.trustsec.virtualnetwork",
				Description: "from ISE 3.1 onwards",
			},
			"egressPolicyTopic": {
				Destination: "/topic/com.cisco.ise.config.trustsec.egress.policy",
				Description: "from ISE 3.2 onwards",
			},
		},
		"com.cisco.ise.sxp": {
			"bindingTopic": {Destination: "/topic/com.cisco.ise.sxp.binding"},
		},
	}
)

func GetUIMapping(serviceName string) (UIMapping, bool) {
	mapping, ok := knownUIMappings[serviceName]
	return mapping, ok
}

func ToJSONServicesResponse(r *pxgrider_proto.GetConnectionServicesResponse) *UIServicesMappingsResponse {
	services := make([]UIMappingResponse, 0, len(r.Services))
	for _, service := range r.GetServices() {
		resp := UIMappingResponse{
			ServiceName:  service.ServiceName,
			FriendlyName: service.FriendlyName,
		}

		mapping, ok := GetUIMapping(service.FriendlyName)
		if ok {
			resp.Wiki = mapping.Wiki
			resp.DisplayName = mapping.DisplayName
			resp.Description = mapping.Description
		}

		services = append(services, resp)
	}

	return &UIServicesMappingsResponse{
		Services: services,
	}
}

func GetTopicMapping(serviceName, topicName string) (UITopicMapping, bool) {
	if topics, ok := knownTopicsMapping[serviceName]; ok {
		if mapping, ok := topics[topicName]; ok {
			return mapping, true
		}
	}

	return UITopicMapping{}, false
}

// ToJSONTopicResponse converts GetConnectionTopicsResponse to UITopicsMappingsResponse
func ToJSONTopicResponse(r *pxgrider_proto.GetConnectionTopicsResponse) UITopicsMappingsResponse {
	if r.GetTopics() == nil {
		return nil
	}

	topicMappings := make(map[string]map[string]UITopicMapping)
	for serviceName, topics := range r.Topics {
		topicMappings[serviceName] = make(map[string]UITopicMapping)
		for _, topicName := range topics.GetTopics() {
			if mapping, ok := GetTopicMapping(serviceName, topicName); ok {
				topicMappings[serviceName][topicName] = mapping
			}
		}
	}

	return topicMappings
}
