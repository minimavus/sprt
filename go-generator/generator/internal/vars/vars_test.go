package vars

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"testing"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

type MockGenerator struct {
	latest     any
	nextValues []any
	amount     int
}

func (m *MockGenerator) Next() (any, error) {
	if len(m.nextValues) > 0 {
		val := m.nextValues[0]
		m.nextValues = m.nextValues[1:]
		m.latest = val
		return val, nil
	}
	return nil, fmt.Errorf("no more values")
}

func (m *MockGenerator) Latest() any {
	return m.latest
}

func (m *MockGenerator) Amount() int {
	return m.amount
}

// MockApp is a mock implementation of the app.App interface.
type MockApp struct {
	logger *zerolog.Logger
}

var _ app.App = (*MockApp)(nil)

func (m *MockApp) Logger() *zerolog.Logger {
	return m.logger
}

func (m *MockApp) DB() *sql.DB {
	return nil
}

func (m *MockApp) ID() string {
	return "mock-app-id"
}

func (m *MockApp) Ctx() context.Context {
	return context.Background()
}

func TestNewVars(t *testing.T) {
	var logger zerolog.Logger
	app := &MockApp{logger: &logger}
	vars := New(app)

	assert.NotNil(t, vars)
	assert.Equal(t, app, vars.App)
	assert.NotNil(t, vars.variables)
	assert.NotNil(t, vars.aliases)
	assert.NotNil(t, vars.order)
}

func TestAddGenerator(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	RegisterGenerator("test", func(map[string]any, *zerolog.Logger, *Vars) (Generator, error) {
		return &MockGenerator{}, nil
	})
	defer UnregisterGenerator("test")

	err := vars.Add("testVar", "test", nil)
	assert.NoError(t, err)
	assert.True(t, vars.IsAdded("testVar"))
}

func TestAddAlias(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	vars.AddAlias("alias1", "testVar")
	assert.Equal(t, "testVar", vars.aliases["alias1"])
}

func TestSnapshot(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	RegisterGenerator("test", func(map[string]any, *zerolog.Logger, *Vars) (Generator, error) {
		return &MockGenerator{latest: "value1"}, nil
	})
	defer UnregisterGenerator("test")

	_ = vars.Add("testVar", "test", nil)
	vars.AddAlias("alias1", "testVar")

	snapshot := vars.Snapshot()
	assert.Equal(t, "value1", snapshot["testVar"])
	assert.Equal(t, "value1", snapshot["alias1"])
}

func TestNextAll(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	RegisterGenerator("test", func(map[string]any, *zerolog.Logger, *Vars) (Generator, error) {
		return &MockGenerator{nextValues: []any{"value1", "value2"}}, nil
	})
	defer UnregisterGenerator("test")

	_ = vars.Add("testVar", "test", nil)

	values, err := vars.NextAll()
	assert.NoError(t, err)
	assert.Equal(t, "value1", values["testVar"])

	values, err = vars.NextAll()
	assert.NoError(t, err)
	assert.Equal(t, "value2", values["testVar"])
}

func TestSubstitute(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	RegisterGenerator("test", func(map[string]any, *zerolog.Logger, *Vars) (Generator, error) {
		return &MockGenerator{latest: "value1"}, nil
	})
	defer UnregisterGenerator("test")

	_ = vars.Add("testVar", "test", nil)
	line, err := vars.Substitute("Hello, $testVar$", nil)
	assert.NoError(t, err)
	assert.Equal(t, "Hello, value1", line)
}

func TestClear(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	_ = vars.Add("testVar", "test", nil)
	vars.AddAlias("alias1", "testVar")

	vars.Clear()
	assert.Empty(t, vars.variables)
	assert.Empty(t, vars.aliases)
	assert.Empty(t, vars.order)
}

func TestAmountOf(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	app := &MockApp{logger: &logger}
	vars := New(app)

	RegisterGenerator("test", func(map[string]any, *zerolog.Logger, *Vars) (Generator, error) {
		return &MockGenerator{amount: 5}, nil
	})
	defer UnregisterGenerator("test")

	_ = vars.Add("testVar", "test", nil)
	assert.Equal(t, 5, vars.AmountOf("testVar"))
	assert.Equal(t, -1, vars.AmountOf("nonExistentVar"))
}

func TestSubstituteWithDifferentOptions(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	mockApp := &MockApp{logger: &logger}
	vars := New(mockApp)

	RegisterGenerator("test", func(_ map[string]any, _ *zerolog.Logger, _ *Vars) (Generator, error) {
		return &MockGenerator{latest: "value1"}, nil
	})
	defer UnregisterGenerator("test")

	_ = vars.Add("testVar", "test", nil)

	t.Run("Default Delimiter", func(t *testing.T) {
		line, err := vars.Substitute("Hello, $testVar$", nil)
		assert.NoError(t, err)
		assert.Equal(t, "Hello, value1", line)
	})

	t.Run("Braces Delimiter", func(t *testing.T) {
		opts := &SubstituteOpts{Delimiter: SubstituteDelimiterBraces}
		line, err := vars.Substitute("Hello, {{testVar}}", opts)
		assert.NoError(t, err)
		assert.Equal(t, "Hello, value1", line)
	})

	t.Run("Unknown Variable, keep $unknownVar$", func(t *testing.T) {
		line, err := vars.Substitute("Hello, $unknownVar$", nil)
		assert.NoError(t, err)
		assert.Equal(t, "Hello, $unknownVar$", line)
	})

	t.Run("Run Functions Enabled", func(t *testing.T) {
		opts := &SubstituteOpts{RunFunctions: true, Vars: map[string]any{"testVar": "value1"}}
		line, err := vars.Substitute("Hello, $testVar$", opts)
		assert.NoError(t, err)
		assert.Equal(t, "Hello, value1", line)
	})
}
