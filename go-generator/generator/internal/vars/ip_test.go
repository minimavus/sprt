package vars

import (
	"net"
	"os"
	"strings"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewIPGenerator(t *testing.T) {
	tests := []struct {
		name       string
		params     map[string]any
		shouldFail bool
		nextVal    any
	}{
		{"Range CIDR OK", map[string]any{"how": "range", "range": "192.168.1.0/30"}, false, "192.168.1.0"},
		{"Range IP-IP OK", map[string]any{"how": "range", "range": "10.0.0.1-10.0.0.3"}, false, "10.0.0.1"},
		{"Range Single IP OK", map[string]any{"how": "range", "range": "172.16.0.1"}, false, "172.16.0.1"},
		{"Range Missing Parameter", map[string]any{"how": "range"}, true, nil},
		{"Range Invalid CIDR", map[string]any{"how": "range", "range": "192.168.1.0/33"}, true, nil},
		{"Range Invalid IP Range", map[string]any{"how": "range", "range": "invalid-range"}, true, nil},
		{"Range Invalid Format", map[string]any{"how": "range", "range": "192.168.1.1-192.168.1.2-192.168.1.3"}, true, nil},
		{"Range Random IPv4 OK", map[string]any{"how": "range", "range": "10.0.0.0/24", "random": true}, false, nil},
		{"Range Random IPv6 OK", map[string]any{"how": "range", "range": "2001:db8::/32", "random": true}, false, nil},
		{"Range Random Missing Parameter", map[string]any{"how": "range", "random": true}, true, nil},
		{"Random OK", map[string]any{"how": "random"}, false, nil},
		{"List Array OK", map[string]any{"how": "list", "list": []string{"192.168.1.1", "192.168.1.2"}, "select": "sequential"}, false, "192.168.1.1"},
		{"List String OK", map[string]any{"how": "list", "list": "192.168.1.1\n192.168.1.2\n192.168.1.3", "select": "sequential"}, false, "192.168.1.1"},
		{"List Empty", map[string]any{"how": "list", "list": []string{}}, true, nil},
		{"List Missing Parameter", map[string]any{"how": "list"}, true, nil},
		{"List Invalid IP", map[string]any{"how": "list", "list": []string{"invalid-ip"}}, true, nil},
		{"List Invalid Element Type", map[string]any{"how": "list", "list": []any{"192.168.1.1", 123}}, true, nil},
		{"Unsupported Variant", map[string]any{"how": "invalid"}, true, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zerolog.New(os.Stdout)
			gen, err := NewIPGenerator(tt.params, &logger, &Vars{})

			if tt.shouldFail {
				assert.Error(t, err)
				assert.Nil(t, gen)
			} else {
				require.NoError(t, err)
				require.NotNil(t, gen)

				if tt.nextVal != nil {
					val, err := gen.Next()
					require.NoError(t, err)
					assert.Equal(t, tt.nextVal, val)
				}
			}
		})
	}
}

func TestIPGenerator_Range(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"range": "192.168.1.1-192.168.1.3",
		"step":  int64(1),
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test sequential generation
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.1", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.2", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.3", val)

	// Expect error on next call
	_, err = gen.Next()
	require.Error(t, err)
	assert.Equal(t, "no more IPs available in range", err.Error())
}

func TestIPGenerator_RangeCIDR(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"range": "10.0.0.0/30", // 4 IPs: .0, .1, .2, .3
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate all IPs in the range
	expectedIPs := []string{"10.0.0.0", "10.0.0.1", "10.0.0.2", "10.0.0.3"}
	for i, expectedIP := range expectedIPs {
		val, err := gen.Next()
		require.NoError(t, err, "Failed at IP %d", i)
		assert.Equal(t, expectedIP, val, "Mismatch at IP %d", i)
	}

	// Test wrap-around (with allowRepeats enabled)
	ipGen := gen.(*IPGenerator)
	ipGen.allowRepeats = true
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.1", val)
}

func TestIPGenerator_RangeRandom(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "range",
		"range":  "192.168.1.0/24",
		"random": true,
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate multiple IPs and verify they're in range
	values := make(map[string]bool)
	for range 10 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		ipStr := val.(string)
		values[ipStr] = true

		// Verify the IP is valid and in range
		ip := net.ParseIP(ipStr)
		require.NotNil(t, ip, "Generated IP should be valid: %s", ipStr)

		// Check if IP is in 192.168.1.0/24 range
		_, ipNet, err := net.ParseCIDR("192.168.1.0/24")
		require.NoError(t, err)
		assert.True(t, ipNet.Contains(ip), "Generated IP should be in range: %s", ipStr)
	}

	// Should generate some variety
	assert.Greater(t, len(values), 1, "Random generation should produce varied results")
}

func TestIPGenerator_Random(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how": "random",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate multiple random IPs
	values := make(map[string]bool)
	for range 10 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		ipStr := val.(string)
		values[ipStr] = true

		// Verify the IP is valid IPv4
		ip := net.ParseIP(ipStr)
		require.NotNil(t, ip, "Generated IP should be valid: %s", ipStr)
		assert.NotNil(t, ip.To4(), "Generated IP should be IPv4: %s", ipStr)

		// Verify format (should be x.x.x.x)
		parts := strings.Split(ipStr, ".")
		assert.Len(t, parts, 4, "IPv4 should have 4 octets")
	}

	// Should generate some variety
	assert.Greater(t, len(values), 1, "Random generation should produce varied results")
}

func TestIPGenerator_List(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   []string{"10.0.0.1", "10.0.0.2", "10.0.0.3"},
		"select": "sequential",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test sequential selection
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.1", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.2", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.3", val)

	// Test wrap-around (with allowRepeats enabled)
	ipGen := gen.(*IPGenerator)
	ipGen.allowRepeats = true
	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.1", val)
}

func TestIPGenerator_ListNoMore(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   []string{"10.0.0.1", "10.0.0.2", "10.0.0.3"},
		"select": "sequential",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test sequential selection
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.1", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.2", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.3", val)

	// Test no more values
	val, err = gen.Next()
	require.Error(t, err)
	assert.Equal(t, "max tries exceeded for sequential list", err.Error())
}

func TestIPGenerator_ListRandom(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":          "list",
		"list":         []string{"172.16.0.1", "172.16.0.2", "172.16.0.3", "172.16.0.4", "172.16.0.5"},
		"select":       "random",
		"allowRepeats": true, // Enable repeats for this test
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate multiple values to test randomness
	values := make(map[string]bool)
	validIPs := map[string]bool{
		"172.16.0.1": true, "172.16.0.2": true, "172.16.0.3": true,
		"172.16.0.4": true, "172.16.0.5": true,
	}

	for range 20 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		ipStr := val.(string)
		values[ipStr] = true

		// Verify the generated IP is from the list
		assert.True(t, validIPs[ipStr], "Generated IP should be from the list: %s", ipStr)
	}

	// Should get some variety
	assert.Greater(t, len(values), 1, "Random selection should produce varied results")
}

func TestIPGenerator_ListStringFormat(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   "192.168.1.10\n192.168.1.20\n192.168.1.30\n",
		"select": "sequential",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.10", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.20", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.30", val)
}

func TestIPGenerator_ListEmpty(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":  "list",
		"list": []string{},
	}
	_, err := NewIPGenerator(params, &logger, &Vars{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "IP list is empty")
}

func TestIPGenerator_IPv6Range(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"range": "2001:db8::1-2001:db8::3",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test IPv6 range generation
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "2001:db8::1", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "2001:db8::2", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "2001:db8::3", val)
}

func TestIPGenerator_RangeIncrement(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"range": "10.0.0.0-10.0.0.10",
		"step":  int64(2),
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test increment by 2
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.0", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.2", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.4", val)
}

func TestIPGenerator_LatestValue(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"range": "192.168.1.1",
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Initially, Latest should return nil
	assert.Nil(t, gen.Latest())

	// After generating a value, Latest should return that value
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.1", val)
	assert.Equal(t, "192.168.1.1", gen.Latest())
}

func TestIPGenerator_Amount(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":  "list",
		"list": []string{"192.168.1.1", "192.168.1.2", "192.168.1.3"},
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Amount should return 1 (base implementation)
	assert.Equal(t, 1, gen.Amount())
}

func TestIPGenerator_DuplicateHandling(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":          "list",
		"list":         []string{"192.168.1.1"},
		"allowRepeats": false,
	}
	gen, err := NewIPGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// First call should succeed
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "192.168.1.1", val)

	// Second call should fail due to exhausted list
	_, err = gen.Next()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max tries exceeded")
}
