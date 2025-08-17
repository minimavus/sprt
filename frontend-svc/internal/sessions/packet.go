package sessions

import (
	"fmt"
	"time"

	"github.com/bingoohuang/gg/pkg/mapstruct"

	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

type Packet models.Flow

const timeFormat = "15:04:05.999999 Jan _2 2006 UTC-07:00"

func toFormattedTime(f any) string {
	var tm time.Time

	switch t := f.(type) {
	case string:
		return t
	case int:
		tm = time.Unix(int64(t), 0)
	case int64:
		tm = time.Unix(t, 0)
	case uint64:
		tm = time.Unix(int64(t), 0)
	case uint:
		tm = time.Unix(int64(t), 0)
	case float64:
		microseconds := int64(t * 1000000)
		tm = time.Unix(microseconds/1000000, (microseconds%1000000)*1000)
	case float32:
		microseconds := int64(t * 1000000)
		tm = time.Unix(microseconds/1000000, (microseconds%1000000)*1000)
	default:
		return fmt.Sprintf("%v", f)
	}

	return tm.Format(timeFormat)
}

func (p Packet) MarshalJSON() ([]byte, error) {
	m := make(map[string]interface{})
	err := mapstruct.Decode(p, &m)
	if err != nil {
		return nil, err
	}

	if p.PacketType.Valid {
		m["packet_type"] = p.PacketType.Int
	} else {
		m["packet_type"] = nil
	}

	if p.Radius.Valid {
		r := make(map[string]interface{})
		err = json.Unmarshal([]byte(p.Radius.String), &r)
		if err != nil {
			return nil, err
		}
		if t, ok := r["time"]; ok {
			r["formattedDateTime"] = toFormattedTime(t)
		}
		m["radius"] = r
	}

	return json.Marshal(m)
}
