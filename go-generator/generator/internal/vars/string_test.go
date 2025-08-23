package vars

import (
	"os"
	"regexp"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewStringGenerator(t *testing.T) {
	tests := []struct {
		name       string
		params     map[string]any
		shouldFail bool
		nextVal    any
	}{
		{"List OK", map[string]any{"how": "list", "list": []string{"test1", "test2"}, "select": "sequential"}, false, "test1"},
		{"List Empty", map[string]any{"how": "list", "list": []string{}}, false, nil},
		{"List String Format", map[string]any{"how": "list", "list": "line1\nline2\nline3", "select": "sequential"}, false, "line1"},
		{"List Missing Parameter", map[string]any{"how": "list"}, true, nil},
		{"List Invalid Type", map[string]any{"how": "list", "list": 123}, true, nil},
		{"List Invalid Element Type", map[string]any{"how": "list", "list": []any{"valid", 123}}, true, nil},
		{"Random Pattern OK", map[string]any{"how": "pattern", "pattern": "[A-Z]{5}"}, false, nil},
		{"Random Length OK", map[string]any{"how": "random", "length": 10}, false, nil},
		{"Random MinMax OK", map[string]any{"how": "random", "minLength": 5, "maxLength": 10}, false, nil},
		{"Random No Parameters", map[string]any{"how": "random"}, true, nil},
		{"Random Invalid Pattern", map[string]any{"how": "pattern", "pattern": "[invalid"}, true, nil},
		{"Static OK", map[string]any{"how": "static", "value": "fixed_value"}, false, "fixed_value"},
		{"Static Missing Value", map[string]any{"how": "static"}, true, nil},
		{"Static Invalid Value Type", map[string]any{"how": "static", "value": 123}, true, nil},
		{"Unsupported Variant", map[string]any{"how": "invalid"}, true, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zerolog.New(os.Stdout)
			gen, err := NewStringGenerator(tt.params, &logger, &Vars{})

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

func TestStringGenerator_List(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   []string{"apple", "banana", "cherry"},
		"select": "sequential",
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test sequential selection
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "apple", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "banana", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "cherry", val)

	// Test wrap-around
	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "apple", val)
}

func TestStringGenerator_ListRandom(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":  "list",
		"list": []string{"item1", "item2", "item3", "item4", "item5"},
		// select defaults to random when not specified or not "sequential"
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Generate multiple values to test randomness
	values := make(map[string]bool)
	validItems := map[string]bool{
		"item1": true, "item2": true, "item3": true, "item4": true, "item5": true,
	}

	for range 20 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		strVal := val.(string)
		values[strVal] = true

		// Verify the generated value is from the list
		assert.True(t, validItems[strVal], "Generated value should be from the list")
	}

	// With random selection, we should get some variety
	assert.Greater(t, len(values), 1, "Random selection should produce varied results")
}

func TestStringGenerator_ListStringFormat(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "list",
		"list":   "first\nsecond\nthird\n",
		"select": "sequential",
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "first", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "second", val)

	val, err = gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "third", val)
}

func TestStringGenerator_ListEmpty(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":  "list",
		"list": []string{},
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	_, err = gen.Next()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "list is empty")
}

func TestStringGenerator_RandomPattern(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":     "pattern",
		"pattern": "[A-Z]{3}[0-9]{2}",
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test multiple generations
	pattern := regexp.MustCompile(`^[A-Z]{3}[0-9]{2}$`)
	for range 5 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		strVal := val.(string)
		assert.True(t, pattern.MatchString(strVal), "Generated string should match pattern: %s", strVal)
	}
}

func TestStringGenerator_RandomLength(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":    "random",
		"length": 8,
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test multiple generations
	for range 5 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		strVal := val.(string)
		assert.Equal(t, 8, len(strVal), "Generated string should have exact length")
		// Should match word characters (letters, digits, underscore)
		assert.Regexp(t, `^\w{8}$`, strVal)
	}
}

func TestStringGenerator_RandomMinMax(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":       "random",
		"minLength": 5,
		"maxLength": 10,
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test multiple generations
	lengths := make(map[int]bool)
	for range 20 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		strVal := val.(string)
		length := len(strVal)
		lengths[length] = true

		assert.GreaterOrEqual(t, length, 5, "Generated string should be at least minLength")
		assert.LessOrEqual(t, length, 10, "Generated string should be at most maxLength")
		assert.Regexp(t, `^\w+$`, strVal)
	}

	// Should generate strings of different lengths
	assert.Greater(t, len(lengths), 1, "Should generate strings of varied lengths")
}

func TestStringGenerator_RandomLengthOverridesMinMax(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":       "random",
		"length":    7,
		"minLength": 5,
		"maxLength": 10,
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// When length is specified, it should override min/max
	for range 5 {
		val, err := gen.Next()
		require.NoError(t, err)
		require.NotNil(t, val)

		strVal := val.(string)
		assert.Equal(t, 7, len(strVal), "Length parameter should override min/max")
	}
}

func TestStringGenerator_Static(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "static",
		"value": "constant_string",
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Test multiple generations - should always return the same value
	for range 5 {
		val, err := gen.Next()
		require.NoError(t, err)
		assert.Equal(t, "constant_string", val)
	}
}

func TestStringGenerator_LatestValue(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	params := map[string]any{
		"how":   "static",
		"value": "test_value",
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Initially, Latest should return nil
	assert.Nil(t, gen.Latest())

	// After generating a value, Latest should return that value
	val, err := gen.Next()
	require.NoError(t, err)
	assert.Equal(t, "test_value", val)
	assert.Equal(t, "test_value", gen.Latest())
}

func TestStringGenerator_Amount(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	// Test with list generator
	params := map[string]any{
		"how":  "list",
		"list": []string{"a", "b", "c"},
	}
	gen, err := NewStringGenerator(params, &logger, &Vars{})
	require.NoError(t, err)

	// Amount should return 1 (base implementation)
	assert.Equal(t, 1, gen.Amount())
}
