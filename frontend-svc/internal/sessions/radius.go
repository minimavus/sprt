package sessions

import (
	"strings"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

type PacketType string

const (
	PacketAccessRequest      PacketType = "ACCESS_REQUEST"
	PacketDaclRequest        PacketType = "DACL_REQUEST"
	PacketAccessAccept       PacketType = "ACCESS_ACCEPT"
	PacketAccessReject       PacketType = "ACCESS_REJECT"
	PacketAccountingRequest  PacketType = "ACCOUNTING_REQUEST"
	PacketAccountingResponse PacketType = "ACCOUNTING_RESPONSE"
	PacketAccountingStatus   PacketType = "ACCOUNTING_STATUS"
	PacketAccessChallenge    PacketType = "ACCESS_CHALLENGE"
	PacketStatusServer       PacketType = "STATUS_SERVER"
	PacketDisconnectRequest  PacketType = "DISCONNECT_REQUEST"
	PacketDisconnectAccept   PacketType = "DISCONNECT_ACCEPT"
	PacketDisconnectReject   PacketType = "DISCONNECT_REJECT"
	PacketCoaCOARequest      PacketType = "COA_REQUEST"
	PacketCOAAccept          PacketType = "COA_ACCEPT"
	PacketCOAAck             PacketType = "COA_ACK"
	PacketCOAReject          PacketType = "COA_REJECT"
	PacketCOANak             PacketType = "COA_NAK"
	PacketHTTPRequest        PacketType = "HTTP_REQUEST"

	PacketUnknown PacketType = "UNKNOWN"
)

func (p PacketType) Valid() bool {
	switch p {
	case PacketAccessRequest, PacketAccessAccept, PacketAccessReject,
		PacketAccountingRequest, PacketAccountingResponse, PacketAccountingStatus,
		PacketAccessChallenge, PacketStatusServer, PacketDisconnectRequest,
		PacketDisconnectAccept, PacketDisconnectReject, PacketCoaCOARequest,
		PacketCOAAccept, PacketCOAAck, PacketCOAReject, PacketCOANak,
		PacketHTTPRequest:
		return true
	default:
		return false
	}
}

type FlowType string

const (
	FlowTypeRadiusAuth        FlowType = "radius-auth"
	FlowTypeRadiusAcct        FlowType = "radius-acct"
	FlowTypeRadiusCoa         FlowType = "radius-coa"
	FlowTypeRadiusDisconnect  FlowType = "radius-disconnect"
	FlowTypeRadiusAclDownload FlowType = "radius-acl-download"
	FlowTypeHTTP              FlowType = "http"
	FlowTypePXGrid            FlowType = "pxgrid"
	FlowTypeOutOfOrder        FlowType = "out-of-order"
)

var FlowTypeMarkerByPacket = map[PacketType]FlowType{
	PacketAccessRequest:     FlowTypeRadiusAuth,
	PacketDaclRequest:       FlowTypeRadiusAclDownload,
	PacketAccountingRequest: FlowTypeRadiusAcct,
	PacketCoaCOARequest:     FlowTypeRadiusCoa,
	PacketDisconnectRequest: FlowTypeRadiusDisconnect,
	PacketHTTPRequest:       FlowTypeHTTP,
}

type SessionFlow struct {
	FlowType FlowType  `json:"type"`
	Packets  []*Packet `json:"packets"`
}

const (
	daclAvPairName  = "cisco-avpair"
	daclAvPairValue = "aaa:event=acl-download"
)

func isNewFlow(current *SessionFlow, newPacket PacketType) bool {
	if current == nil || current.FlowType == "" {
		return true
	}

	ft, ok := FlowTypeMarkerByPacket[newPacket]
	if !ok {
		return false
	}

	return current.FlowType != ft
}

func getPacketType(packet *models.Flow) PacketType {
	if !packet.Radius.Valid {
		return PacketUnknown
	}

	t := make(map[string]any)

	err := json.Unmarshal([]byte(packet.Radius.String), &t)
	if err != nil {
		return PacketUnknown
	}

	c, ok := getFromMap[string](t, "code")
	if !ok {
		return PacketUnknown
	}

	cp := PacketType(c)

	if isDaclRequest(cp, t) {
		return PacketDaclRequest
	}

	return cp
}

func isDaclRequest(code PacketType, packet map[string]any) bool {
	if code != PacketAccessRequest || len(packet) == 0 {
		return false
	}

	pb, ok := getFromMap[[]any](packet, "packet")
	if !ok {
		return false
	}

	for _, attr := range pb {
		am, ok := attr.(map[string]any)
		if !ok {
			continue
		}

		n, ok := getFromMap[string](am, "Name", "name")
		if !ok {
			continue
		}
		n = strings.ToLower(strings.TrimSpace(n))

		if n == daclAvPairName {
			v, ok := getFromMap[string](am, "Value", "value")
			if !ok {
				continue
			}
			v = strings.ToLower(strings.TrimSpace(v))

			if v == daclAvPairValue {
				return true
			}
		}
	}

	return false
}

func SplitRadiusToFlowTypes(s *db.SessionWithFlow) []*SessionFlow {
	var (
		result      []*SessionFlow
		currentFlow *SessionFlow
	)

	if s == nil || s.Flow == nil {
		return result
	}

	for _, packet := range s.Flow {
		newPacketType := getPacketType(packet)
		if isNewFlow(currentFlow, newPacketType) {
			ft := FlowTypeMarkerByPacket[newPacketType]
			if ft == "" && currentFlow == nil {
				ft = FlowTypeOutOfOrder
			}

			currentFlow = &SessionFlow{
				FlowType: ft,
				Packets:  []*Packet{(*Packet)(packet)},
			}
			result = append(result, currentFlow)
		} else {
			currentFlow.Packets = append(currentFlow.Packets, (*Packet)(packet))
		}
	}

	return result
}

func getFromMap[T any](m map[string]any, key ...string) (T, bool) {
	var empty T

	if m == nil || len(key) == 0 {
		return empty, false
	}

	for _, k := range key {
		v, ok := m[k]
		if !ok {
			continue
		}

		if vt, ok := v.(T); ok {
			return vt, true
		}
	}

	return empty, true
}
