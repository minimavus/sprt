package iputils

import "strings"

func removeStartStopBrackets(address string) string {
	return strings.Trim(address, "[]")
}

// SplitAddress splits the address into interface name and IP address.
// Expected formats:
//
//	[interface]:[ip] - returns interface name and IP address
//	[ip]             - returns IP address and empty interface name
//	ip               - returns IP address and empty interface name
//
// If the input does not match these formats, it returns empty string as interface name and IP address
func SplitAddress(address string) (interfaceName string, ip string) {
	if strings.Contains(address, "]:[") {
		parts := strings.Split(address, "]:[")
		if len(parts) == 2 && strings.HasPrefix(parts[0], "[") && strings.HasSuffix(parts[1], "]") {
			interfaceName = removeStartStopBrackets(parts[0])
			ip = removeStartStopBrackets(parts[1])
			return interfaceName, ip
		}
		// Malformed input
		return "", ip
	} else if strings.HasPrefix(address, "[") && strings.HasSuffix(address, "]") {
		ip = removeStartStopBrackets(address)
		return "", ip
	} else if !strings.Contains(address, "[") && !strings.Contains(address, "]") {
		ip = address
		return "", ip
	}
	// Malformed input
	return "", ip
}
