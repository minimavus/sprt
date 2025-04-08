package config

import "net"

type (
	Source struct {
		Address   string `json:"address"`
		Interface string `json:"interface"`
	}

	Sources struct {
		IPv4 []Source `json:"ipv4,omitempty"`
		IPv6 []Source `json:"ipv6,omitempty"`
	}
)

func isValidIPAddr(ip net.IP) bool {
	switch {
	case ip.IsLoopback(),
		ip.IsLinkLocalUnicast(),
		ip.IsLinkLocalMulticast(),
		ip.IsInterfaceLocalMulticast(),
		ip.IsMulticast(),
		ip.IsUnspecified():
		return false
	}

	return true
}

func (a *AppConfig) AvailableSources() (Sources, error) {
	ints, err := net.Interfaces()
	if err != nil {
		return Sources{}, err
	}

	var sources Sources
	for _, i := range ints {
		addrs, err := i.Addrs()
		if err != nil {
			a.Logger().Warn().Err(err).Msgf("Failed to get addresses for interface %s", i.Name)
			continue
		}

		for _, addr := range addrs {
			switch v := addr.(type) {
			case *net.IPNet:
				if !isValidIPAddr(v.IP) {
					continue
				}

				if v.IP.To4() != nil {
					sources.IPv4 = append(sources.IPv4, Source{Address: v.IP.String(), Interface: i.Name})
				} else {
					sources.IPv6 = append(sources.IPv6, Source{Address: v.IP.String(), Interface: i.Name})
				}
			}
		}
	}

	return sources, nil
}
