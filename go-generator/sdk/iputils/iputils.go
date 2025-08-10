package iputils

import (
	"errors"
	"net"

	"github.com/rs/zerolog"
)

type IPFamily uint8

const (
	IPv4 IPFamily = 4
	IPv6 IPFamily = 6
)

type Source struct {
	Address   string   `json:"address"`
	Family    IPFamily `json:"family"`
	Interface string   `json:"interface"`
}

func GetAvailableIPSources(l *zerolog.Logger) ([]Source, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	sources := make([]Source, 0)

	for _, iface := range ifaces {
		addrs, err := iface.Addrs()
		if err != nil {
			l.Error().Err(err).Str("iface", iface.Name).Msg("Failed to get addresses")
			continue
		}

		for _, addr := range addrs {
			ip, err := getIP(addr)
			if err != nil {
				l.Warn().Err(err).Str("iface", iface.Name).Msg("Failed to get IP")
				continue
			}

			if !ip.IsGlobalUnicast() {
				continue
			}

			var family IPFamily
			if ip.To4() != nil {
				family = IPv4
			} else {
				family = IPv6
			}

			sources = append(sources, Source{
				Address:   ip.String(),
				Family:    family,
				Interface: iface.Name,
			})
		}
	}

	return sources, nil
}

func IsIP(v string) bool {
	return net.ParseIP(v) != nil
}

func getIP(addr net.Addr) (net.IP, error) {
	switch addr := addr.(type) {
	case *net.IPNet:
		return addr.IP, nil
	case *net.IPAddr:
		return addr.IP, nil
	default:
		return nil, errors.New("unsupported address type")
	}
}
