package errors

import (
	"slices"
	"strings"

	"github.com/kaptinlin/jsonschema"
)

// FailedPath holds the path and the reason for a validation failure.
type FailedPath struct {
	Path    string
	Message string
}

// FindFailedPath traverses a jsonschema.EvaluationResult to find the path that failed validation.
func FindFailedPath(result *jsonschema.EvaluationResult) []FailedPath {
	if result == nil || result.IsValid() {
		return nil
	}
	var failedPaths []FailedPath
	traverse(result, "", &failedPaths)
	return removeDuplicatePaths(failedPaths)
}

// traverse is the main recursive function to find leaf-level validation failures.
func traverse(result *jsonschema.EvaluationResult, basePath string, failedPaths *[]FailedPath) (foundError bool) {
	currentPath := buildPath(basePath, result.InstanceLocation)

	// Special handling for 'anyOf' errors
	if isAnyOfError(result) {
		validBranch := findValidVariantBranch(result.Details)
		if validBranch != nil {
			// We found the intended branch, so we only traverse its children
			for _, detail := range validBranch.Details {
				if traverse(detail, currentPath, failedPaths) {
					foundError = true
				}
			}
		}
		return foundError // Return after handling anyOf
	}

	// General traversal for other nodes
	var childErrorsFound bool
	for _, detail := range result.Details {
		if traverse(detail, currentPath, failedPaths) {
			childErrorsFound = true
		}
	}

	// A node is a leaf error if it's invalid, but none of its children are
	if !result.IsValid() && !childErrorsFound {
		*failedPaths = append(*failedPaths, FailedPath{
			Path:    currentPath,
			Message: getLeafErrorMessage(result),
		})
		return true
	}

	return childErrorsFound
}

// isAnyOfError checks if the evaluation result represents an 'anyOf' failure.
func getLeafErrorMessage(result *jsonschema.EvaluationResult) string {
	for _, err := range result.Errors {
		return err.Error()
	}
	return result.Error()
}

// isAnyOfError checks if the evaluation result represents an 'anyOf' failure.
func isAnyOfError(result *jsonschema.EvaluationResult) bool {
	for _, err := range result.Errors {
		if err.Keyword == "anyOf" {
			return true
		}
	}
	return false
}

// findValidVariantBranch finds the branch within an 'anyOf' that has a valid 'variant' property.
func findValidVariantBranch(details []*jsonschema.EvaluationResult) *jsonschema.EvaluationResult {
	for _, detail := range details {
		if hasValidVariant(detail) {
			return detail
		}
	}
	return nil
}

// hasValidVariant checks if any nested detail corresponds to a valid 'variant' property.
func hasValidVariant(result *jsonschema.EvaluationResult) bool {
	// Check if this detail itself is the valid variant property
	if strings.Contains(result.InstanceLocation, "variant") && result.IsValid() {
		return true
	}

	// Recursively check children
	return slices.ContainsFunc(result.Details, hasValidVariant)
}

// buildPath constructs a path from base and instance location
func buildPath(base, instanceLocation string) string {
	if base == "" {
		return cleanPath(instanceLocation)
	}
	if instanceLocation == "" || instanceLocation == "/" {
		return base
	}

	cleanInstance := cleanPath(instanceLocation)
	if cleanInstance == "" {
		return base
	}

	return base + "." + cleanInstance
}

// cleanPath removes leading slash and converts slashes to dots
func cleanPath(path string) string {
	if path == "" || path == "/" {
		return ""
	}

	// Remove leading slash
	cleaned := strings.TrimPrefix(path, "/")

	// Convert slashes to dots
	cleaned = strings.ReplaceAll(cleaned, "/", ".")

	return cleaned
}

// removeDuplicatePaths removes duplicates from a slice of FailedPath based on the Path field.
func removeDuplicatePaths(paths []FailedPath) []FailedPath {
	keys := make(map[string]bool)
	var result []FailedPath

	for _, entry := range paths {
		if entry.Path != "" && !keys[entry.Path] {
			keys[entry.Path] = true
			result = append(result, entry)
		}
	}

	return result
}
