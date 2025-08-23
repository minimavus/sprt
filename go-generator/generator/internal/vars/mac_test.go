package vars

import (
	"os"
	"testing"

	"github.com/cisco-open/sprt/go-generator/generator/internal/vars/internal/mac"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewMacGenerator(t *testing.T) {
	tests := []struct {
		name       string
		params     map[string]any
		shouldFail bool
		nextVal    any
	}{
		{"Range OK", map[string]any{"how": "range", "start": "00:00:00:00:00:00", "end": "00:00:00:00:00:ff"}, false, "00:00:00:00:00:00"},
		{"Range Invalid First MAC", map[string]any{"how": "range", "start": "invalid", "end": "00:00:00:00:00:ff"}, true, nil},
		{"Range Invalid Last MAC", map[string]any{"how": "range", "start": "00:00:00:00:00:00", "end": "invalid"}, true, nil},
		{"List OK", map[string]any{"how": "list", "list": []string{"00:00:00:00:00:01"}, "select": "sequential"}, false, "00:00:00:00:00:01"},
		{"List Empty", map[string]any{"how": "list", "list": []string{}}, true, nil},
		{"Random OK", map[string]any{"how": "random"}, false, nil},
		{"Random-Pattern OK", map[string]any{"how": "pattern", "pattern": "[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}"}, false, nil},
		{"Random-Pattern Missing Pattern", map[string]any{"how": "pattern"}, true, nil},
		{"Unsupported Variant", map[string]any{"how": "unsupported"}, true, nil},
	}

	logger := zerolog.New(os.Stdout)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gen, err := NewMacGenerator(tt.params, &logger, &Vars{})
			if tt.shouldFail {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			val, err := gen.Next()
			require.NoError(t, err)
			if tt.nextVal != nil {
				assert.Equal(t, tt.nextVal, val)
			}
		})
	}
}

func TestMacGenerator_Range(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "range",
		"start": "00:00:00:00:00:fe",
		"end":   "00:00:00:00:01:01",
		"step":  int64(1),
	}
	gen, err := NewMacGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "00:00:00:00:00:fe", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "00:00:00:00:00:ff", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "00:00:00:00:01:00", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "00:00:00:00:01:01", val)

	_, err = gen.Next()
	assert.Error(t, err, "last mac reached")
}

func TestMacGenerator_RangeRoundRobin(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":          "range",
		"start":        "00:00:00:00:00:ff",
		"end":          "00:00:00:00:01:00",
		"allowRepeats": true,
	}
	gen, err := NewMacGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	val, _ := gen.Next()
	assert.Equal(t, "00:00:00:00:00:ff", val)

	val, _ = gen.Next()
	assert.Equal(t, "00:00:00:00:01:00", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "00:00:00:00:00:ff", val)
}

func TestMacGenerator_RangeRandom(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "range",
		"start":  "00:00:00:00:00:00",
		"end":    "00:00:00:00:00:ff",
		"random": true,
	}
	gen, err := NewMacGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate multiple values to test randomness
	values := make(map[string]bool)
	for range 10 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		macStr := val.(string)
		values[macStr] = true

		// Verify the generated MAC is within the expected range
		generatedMac, err := mac.New(macStr)
		require.NoError(t, err)

		startMac, err := mac.New("00:00:00:00:00:00")
		require.NoError(t, err)

		endMac, err := mac.New("00:00:00:00:00:ff")
		require.NoError(t, err)

		assert.GreaterOrEqual(t, generatedMac.Compare(startMac), 0, "Generated MAC should be >= start")
		assert.LessOrEqual(t, generatedMac.Compare(endMac), 0, "Generated MAC should be <= end")
	}

	// With random generation, we should get some variety (not all the same value)
	// This is a probabilistic test, but with 10 values in a range of 256,
	// it's extremely unlikely to get all the same value
	assert.Greater(t, len(values), 1, "Random generation should produce varied results")
}

func TestMacGenerator_List(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   []string{"00:00:00:00:00:01", "00:00:00:00:00:02"},
		"select": "sequential",
	}
	gen, err := NewMacGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	val, _ := gen.Next()
	assert.Equal(t, "00:00:00:00:00:01", val)

	val, _ = gen.Next()
	assert.Equal(t, "00:00:00:00:00:02", val)

	_, err = gen.Next()
	assert.Error(t, err, "no more MACs in list")
}

// func TestMacGenerator_Dictionary(t *testing.T) {
// 	logger := zerolog.New(os.Stdout)

// 	tmpDir := t.TempDir()
// 	dictPath := filepath.Join(tmpDir, "macs.txt")
// 	err := os.WriteFile(dictPath, []byte("00:11:22:33:44:55\n66:77:88:99:aa:bb"), 0644)
// 	require.NoError(t, err)

// 	parent := &Parent{
// 		UserDictionariesPath: tmpDir,
// 	}
// 	allVars := &Vars{Parent: parent}

// 	params := map[string]any{
// 		"variant":    "dictionary",
// 		"dictionary": "macs.txt",
// 		"select":     "sequential",
// 	}

// 	gen, err := NewMacGenerator(params, &logger, allVars)
// 	require.NoError(t, err)

// 	val, _ := gen.Next()
// 	assert.Equal(t, "00:11:22:33:44:55", val)

// 	val, _ = gen.Next()
// 	assert.Equal(t, "66:77:88:99:aa:bb", val)
// }
