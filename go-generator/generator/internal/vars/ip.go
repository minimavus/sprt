package vars

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net"
	"reflect"
	"strings"

	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
	"github.com/go-viper/mapstructure/v2"
	"github.com/rs/zerolog"
)

// IPGenerator generates IP addresses based on different variants.
type (
	IPGenerator struct {
		baseGenerator
		nextFunc func() (string, error)
		state    any
	}

	ipGeneratorStateRange struct {
		Range    string           `mapstructure:"range"`
		Random   bool             `mapstructure:"random"`
		Step     int64            `mapstructure:"step"`
		IPFamily iputils.IPFamily `mapstructure:"ipFamily"`

		currentIP   net.IP
		startIP     net.IP
		endIP       net.IP
		reinitCount int64
		rangeSize   *big.Int
	}

	ipGeneratorStateRandom struct {
		IPFamily iputils.IPFamily `mapstructure:"ipFamily"`
	}

	ipGeneratorStateList struct {
		List     any              `mapstructure:"list"`
		Select   SelectType       `mapstructure:"select"`
		IPFamily iputils.IPFamily `mapstructure:"ipFamily"`

		ipList    []string
		nextIndex int64
	}
)

// NewIPGenerator creates a new IPGenerator.
func NewIPGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	g := &IPGenerator{}
	g.baseGenerator.Init(params, logger, allVars)

	var initErr error
	switch how, _ := g.params["how"].(string); how {
	case "random":
		g.nextFunc = g.nextRandom
		initErr = g.initRandomState()
	case "list", "dictionary":
		g.nextFunc = g.nextList
		initErr = g.initListState(how)
	case "range":
		g.nextFunc = g.nextRange
		initErr = g.initRangeState()
	default:
		initErr = fmt.Errorf("unsupported variant '%s' for IP generator", how)
	}

	if initErr != nil {
		return nil, initErr
	}

	return g, nil
}

// Next calls the appropriate next function based on the variant.
func (g *IPGenerator) Next() (any, error) {
	counter := 0
	for counter < g.maxTries {
		val, err := g.nextFunc()
		if err != nil {
			return nil, err
		}
		if g.isUsable(val) {
			g.pushToUsed(val)
			g.setLatest(val)
			return val, nil
		}
		counter++
	}
	return nil, fmt.Errorf("max tries exceeded for IP generation")
}

func (g *IPGenerator) initRangeState() error {
	st := &ipGeneratorStateRange{}
	if err := g.decodeParams(st); err != nil {
		return err
	}

	if st.Range == "" {
		return fmt.Errorf("'range' parameter is required for range variant")
	}

	if st.Step == 0 && !st.Random {
		st.Step = 1 // Default to 1 if not specified and not random
	}

	if st.IPFamily == 0 {
		st.IPFamily = iputils.IPv4
	}

	// Parse the IP range
	if err := g.parseIPRange(st.Range, &st.startIP, &st.endIP, &st.IPFamily, &st.rangeSize); err != nil {
		return fmt.Errorf("invalid IP range '%s': %w", st.Range, err)
	}

	st.currentIP = make(net.IP, len(st.startIP))
	copy(st.currentIP, st.startIP)

	g.state = st
	return nil
}

func (g *IPGenerator) initRandomState() error {
	st := &ipGeneratorStateRandom{}
	if err := g.decodeParams(st); err != nil {
		return err
	}

	if st.IPFamily == 0 {
		st.IPFamily = iputils.IPv4
	}

	g.state = st
	return nil
}

func (g *IPGenerator) initListState(variant string) error {
	st := &ipGeneratorStateList{
		nextIndex: 0,
		Select:    SelectTypeRandom, // Default to random
	}

	if variant == "dictionary" {
		// TODO: implement dictionary loading
		return fmt.Errorf("dictionary variant is not yet implemented")
	}

	// Decode IPFamily separately to avoid SelectType conversion issues
	if ipFamily, ok := g.params["ipFamily"]; ok {
		if family, ok := ipFamily.(iputils.IPFamily); ok {
			st.IPFamily = family
		}
	}

	// Default to IPv4 if IPFamily is not set
	if st.IPFamily == 0 {
		st.IPFamily = iputils.IPv4
	}

	selectParam, _ := g.params["select"].(string)
	if selectParam == "sequential" {
		st.Select = SelectTypeSequential
	} else {
		// Default to random if not specified or if "random"
		st.Select = SelectTypeRandom
	}

	listParam, ok := g.params["list"]
	if !ok {
		return fmt.Errorf("'list' parameter is required for list variant")
	}

	switch v := reflect.ValueOf(listParam); v.Kind() {
	case reflect.Slice:
		st.ipList = make([]string, v.Len())
		for i := 0; i < v.Len(); i++ {
			elem := v.Index(i).Interface()
			strElem, ok := elem.(string)
			if !ok {
				return fmt.Errorf("unsupported type for IP list element %d: %T, expected string", i, elem)
			}
			// Validate IP address
			if net.ParseIP(strElem) == nil {
				return fmt.Errorf("invalid IP address at index %d: %s", i, strElem)
			}
			st.ipList[i] = strElem
		}
	case reflect.String:
		// Split string by newlines
		lines := strings.Split(v.String(), "\n")
		st.ipList = make([]string, 0, len(lines))
		for i, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				// Validate IP address
				if net.ParseIP(line) == nil {
					return fmt.Errorf("invalid IP address at line %d: %s", i+1, line)
				}
				st.ipList = append(st.ipList, line)
			}
		}
	default:
		return fmt.Errorf("unsupported type for IP list parameter: %T", listParam)
	}

	if len(st.ipList) == 0 {
		return fmt.Errorf("IP list is empty")
	}

	g.state = st
	return nil
}

func (g *IPGenerator) nextRange() (string, error) {
	st := g.state.(*ipGeneratorStateRange)

	if st.Random {
		// Generate random IP from range
		randomOffset, err := rand.Int(rand.Reader, st.rangeSize)
		if err != nil {
			return "", fmt.Errorf("failed to generate random offset: %w", err)
		}
		randomIP := g.addOffsetToIP(st.startIP, randomOffset)
		return randomIP.String(), nil
	}

	// Sequential selection from range
	// Check if we need to increment from previous call
	// Only increment currentIP if this is not the first call (g.latest != nil)
	if g.latest != nil {
		g.incrementIP(st.currentIP, st.Step)
		// After increment, check if currentIP is still within range
		if !g.isIPInRange(st.currentIP, st.startIP, st.endIP) {
			// Reinitialize
			copy(st.currentIP, st.startIP)
			// Start from reinitCount + 1 address
			g.incrementIP(st.currentIP, st.reinitCount+1)
			if !g.isIPInRange(st.currentIP, st.startIP, st.endIP) {
				return "", fmt.Errorf("no more IPs available in range")
			}
			st.reinitCount++
		}
	}

	return st.currentIP.String(), nil
}

func (g *IPGenerator) nextRandom() (string, error) {
	st := g.state.(*ipGeneratorStateRandom)

	if st.IPFamily == iputils.IPv6 {
		// Generate random IPv6 address
		ip := make(net.IP, 16)
		for i := range 16 {
			octet, err := rand.Int(rand.Reader, big.NewInt(256))
			if err != nil {
				return "", fmt.Errorf("failed to generate random IPv6 octet: %w", err)
			}
			ip[i] = byte(octet.Int64())
		}
		return ip.String(), nil
	}

	// Generate random IPv4 address
	ip := make(net.IP, 4)
	for i := range 4 {
		octet, err := rand.Int(rand.Reader, big.NewInt(256))
		if err != nil {
			return "", fmt.Errorf("failed to generate random IPv4 octet: %w", err)
		}
		ip[i] = byte(octet.Int64())
	}
	return ip.String(), nil
}

func (g *IPGenerator) nextList() (string, error) {
	st := g.state.(*ipGeneratorStateList)
	if len(st.ipList) == 0 {
		return "", fmt.Errorf("IP list is empty")
	}

	var val string
	if st.Select == SelectTypeSequential {
		// For sequential selection, handle duplicate prevention here to maintain order
		counter := 0
		for counter < g.maxTries {
			idx := st.nextIndex
			val = st.ipList[idx]
			st.nextIndex = (st.nextIndex + 1) % int64(len(st.ipList))

			// If allowRepeats is true, always return the value (no duplicate checking)
			if g.allowRepeats || g.isUsable(val) {
				return val, nil
			}
			counter++
		}
		return "", fmt.Errorf("max tries exceeded for sequential list")
	}

	// For random selection, just return a random value
	idxInt, err := rand.Int(rand.Reader, big.NewInt(int64(len(st.ipList))))
	if err != nil {
		return "", fmt.Errorf("failed to get random index: %w", err)
	}
	idx := idxInt.Int64()
	val = st.ipList[idx]
	return val, nil
}

// Helper functions

func (g *IPGenerator) parseIPRange(rangeStr string, startIP, endIP *net.IP, ipFamily *iputils.IPFamily, rangeSize **big.Int) error {
	// Handle CIDR notation
	if strings.Contains(rangeStr, "/") {
		_, ipNet, err := net.ParseCIDR(rangeStr)
		if err != nil {
			return fmt.Errorf("invalid CIDR: %w", err)
		}

		*startIP = ipNet.IP
		*endIP = g.getLastIPInCIDR(ipNet)
		*ipFamily = getIPFamily((*startIP).To4() != nil)
		*rangeSize = g.calculateRangeSize(*startIP, *endIP)
		return nil
	}

	// Handle range notation (start-end)
	if strings.Contains(rangeStr, "-") {
		parts := strings.Split(rangeStr, "-")
		if len(parts) != 2 {
			return fmt.Errorf("invalid range format, expected 'start-end'")
		}

		start := net.ParseIP(strings.TrimSpace(parts[0]))
		end := net.ParseIP(strings.TrimSpace(parts[1]))
		if start == nil || end == nil {
			return fmt.Errorf("invalid IP addresses in range")
		}

		*startIP = start
		*endIP = end
		*ipFamily = getIPFamily(start.To4() != nil && end.To4() != nil)
		*rangeSize = g.calculateRangeSize(*startIP, *endIP)
		return nil
	}

	// Single IP
	ip := net.ParseIP(rangeStr)
	if ip == nil {
		return fmt.Errorf("invalid IP address")
	}

	*startIP = ip
	*endIP = ip
	*ipFamily = getIPFamily(ip.To4() != nil)
	*rangeSize = big.NewInt(1)
	return nil
}

func (g *IPGenerator) getLastIPInCIDR(ipNet *net.IPNet) net.IP {
	ip := ipNet.IP
	mask := ipNet.Mask

	// Calculate broadcast address
	lastIP := make(net.IP, len(ip))
	for i := 0; i < len(ip); i++ {
		lastIP[i] = ip[i] | ^mask[i]
	}

	return lastIP
}

func (g *IPGenerator) calculateRangeSize(startIP, endIP net.IP) *big.Int {
	start := new(big.Int).SetBytes(startIP)
	end := new(big.Int).SetBytes(endIP)
	size := new(big.Int).Sub(end, start)
	size.Add(size, big.NewInt(1)) // Include both endpoints
	return size
}

func (g *IPGenerator) isIPInRange(ip, startIP, endIP net.IP) bool {
	ipInt := new(big.Int).SetBytes(ip)
	startInt := new(big.Int).SetBytes(startIP)
	endInt := new(big.Int).SetBytes(endIP)

	return ipInt.Cmp(startInt) >= 0 && ipInt.Cmp(endInt) <= 0
}

func (g *IPGenerator) incrementIP(ip net.IP, increment int64) {
	ipInt := new(big.Int).SetBytes(ip)
	ipInt.Add(ipInt, big.NewInt(increment))

	// Convert back to IP
	bytes := ipInt.Bytes()
	if len(bytes) <= len(ip) {
		// Clear the IP and copy the new bytes
		for i := range ip {
			ip[i] = 0
		}
		copy(ip[len(ip)-len(bytes):], bytes)
	}
}

func (g *IPGenerator) addOffsetToIP(startIP net.IP, offset *big.Int) net.IP {
	startInt := new(big.Int).SetBytes(startIP)
	resultInt := new(big.Int).Add(startInt, offset)

	// Convert back to IP
	bytes := resultInt.Bytes()
	result := make(net.IP, len(startIP))
	if len(bytes) <= len(result) {
		copy(result[len(result)-len(bytes):], bytes)
	}

	return result
}

func init() {
	RegisterGenerator("ip", NewIPGenerator)
}

func getIPFamily(isIPv4 bool) iputils.IPFamily {
	if isIPv4 {
		return iputils.IPv4
	}
	return iputils.IPv6
}

func (g *IPGenerator) decodeParams(target any) error {
	if err := mapstructure.Decode(g.params, target); err != nil {
		return fmt.Errorf("failed to decode parameters: %w", err)
	}
	return nil
}
