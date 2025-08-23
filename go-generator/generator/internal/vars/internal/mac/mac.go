package mac

import (
	"bytes"
	"fmt"
	"math/big"
	"net"
	"strings"
)

// MAC holds a hardware address and provides methods for manipulation.
type MAC struct {
	hwAddr net.HardwareAddr
}

// New creates a new MAC object from a string.
func New(macStr string) (*MAC, error) {
	hwAddr, err := net.ParseMAC(macStr)
	if err != nil {
		return nil, fmt.Errorf("failure to create MAC Object: %w", err)
	}
	return &MAC{hwAddr: hwAddr}, nil
}

// ShowHex returns the MAC address in hexadecimal format.
func (m *MAC) ShowHex() string {
	return m.hwAddr.String()
}

// macMod is the maximum value for a MAC address.
var macMod = new(big.Int).Lsh(big.NewInt(1), 48)

// Increase increases the MAC address by a given value.
func (m *MAC) Increase(val int64) {
	macInt := new(big.Int).SetBytes(m.hwAddr)
	macInt.Add(macInt, big.NewInt(val))
	macInt.Mod(macInt, macMod)

	bytes := macInt.Bytes()
	newHwAddr := make(net.HardwareAddr, 6)
	copy(newHwAddr[6-len(bytes):], bytes)
	m.hwAddr = newHwAddr
}

// Decrease decreases the MAC address by a given value.
func (m *MAC) Decrease(val int64) {
	macInt := new(big.Int).SetBytes(m.hwAddr)
	macInt.Sub(macInt, big.NewInt(val))
	macInt.Mod(macInt, macMod)

	bytes := macInt.Bytes()
	newHwAddr := make(net.HardwareAddr, 6)
	copy(newHwAddr[6-len(bytes):], bytes)
	m.hwAddr = newHwAddr
}

// ShowOct returns the MAC address in octal format.
func (m *MAC) ShowOct() string {
	var octParts []string
	for _, b := range m.hwAddr {
		octParts = append(octParts, fmt.Sprintf("%03o", b))
	}
	return strings.Join(octParts, ":")
}

func (m *MAC) Compare(other *MAC) int {
	return bytes.Compare(m.hwAddr, other.hwAddr)
}

// HwAddr returns the underlying hardware address bytes.
func (m *MAC) HwAddr() net.HardwareAddr {
	return m.hwAddr
}

// NewFromBytes creates a new MAC object from raw bytes.
func NewFromBytes(macBytes []byte) (*MAC, error) {
	if len(macBytes) != 6 {
		return nil, fmt.Errorf("MAC address must be exactly 6 bytes, got %d", len(macBytes))
	}
	hwAddr := make(net.HardwareAddr, 6)
	copy(hwAddr, macBytes)
	return &MAC{hwAddr: hwAddr}, nil
}
