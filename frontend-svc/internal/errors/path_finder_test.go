package errors

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/kaptinlin/jsonschema"
)

func TestFindFailedPath(t *testing.T) {
	// Load temp.json file
	data, err := os.ReadFile("temp.json")
	if err != nil {
		t.Fatalf("Failed to read temp.json: %v", err)
	}

	// Unmarshal into EvaluationResult
	var result jsonschema.EvaluationResult
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("Failed to unmarshal JSON: %v", err)
	}

	// Find failed paths
	paths := FindFailedPath(&result)

	// Print results
	fmt.Println("Failed validation paths:")
	for i, p := range paths {
		fmt.Printf("%d: %s -> %s\n", i+1, p.Path, p.Message)
	}

	if len(paths) == 0 {
		t.Fatal("No failed paths found")
	}

	expectedPath := "guestFlow.credentials.credentialsDictionary.dictionaries"
	expectedMsg := "Value should have at least 1 items"

	found := false
	for _, p := range paths {
		if p.Path == expectedPath && p.Message == expectedMsg {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("Expected to find path '%s' with message '%s', but it was not found", expectedPath, expectedMsg)
	}
}

// TestFindFailedPathMain is a main-like function for standalone testing
func TestFindFailedPathMain(t *testing.T) {
	// This can be run as: go test -run TestFindFailedPathMain -v
	TestFindFailedPath(t)
}
