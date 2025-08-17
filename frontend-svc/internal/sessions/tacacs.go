package sessions

import (
	"github.com/cisco-open/sprt/go-generator/sdk/db"
)

type TacacsFlowType string

const (
	TacacsFlowAny TacacsFlowType = "tacacs-any"
)

type TacacsSessionFlow struct {
	FlowType TacacsFlowType `json:"type"`
	Packets  []*Packet      `json:"packets"`
}

// func isNewFlow(current *SessionFlow, newPacket PacketType) bool {
// 	if current == nil || current.FlowType == "" {
// 		return true
// 	}

// 	ft, ok := FlowTypeMarkerByPacket[newPacket]
// 	if !ok {
// 		return false
// 	}

// 	return current.FlowType != ft
// }

// func getPacketType(packet *models.Flow) PacketType {
// 	if !packet.Radius.Valid {
// 		return PacketUnknown
// 	}

// 	t := new(struct {
// 		Code string `json:"code"`
// 	})

// 	err := json.Unmarshal([]byte(packet.Radius.String), t)
// 	if err != nil {
// 		return PacketUnknown
// 	}

// 	return PacketType(t.Code)
// }

func SplitTacacsToFlowTypes(s *db.TacacsSessionWithFlow) []*TacacsSessionFlow {
	var (
		result      []*TacacsSessionFlow
		currentFlow *TacacsSessionFlow
	)

	if s == nil || s.Flow == nil {
		return result
	}

	currentFlow = &TacacsSessionFlow{
		FlowType: TacacsFlowAny,
		Packets:  []*Packet{},
	}

	for _, packet := range s.Flow {
		currentFlow.Packets = append(currentFlow.Packets, (*Packet)(packet))
		// newPacketType := getPacketType(packet)
		// if isNewFlow(currentFlow, newPacketType) {
		// 	ft := FlowTypeMarkerByPacket[newPacketType]
		// 	if ft == "" && currentFlow == nil {
		// 		ft = FlowTypeOutOfOrder
		// 	}

		// 	currentFlow = &SessionFlow{
		// 		FlowType: ft,
		// 		Packets:  []*Packet{(*Packet)(packet)},
		// 	}
		// 	result = append(result, currentFlow)
		// } else {
		// 	currentFlow.Packets = append(currentFlow.Packets, (*Packet)(packet))
		// }
	}
	result = append(result, currentFlow)

	return result
}
