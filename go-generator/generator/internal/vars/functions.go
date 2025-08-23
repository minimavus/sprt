package vars

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"regexp"
	"strconv"
	"strings"

	"github.com/lucasjones/reggen"
)

// funcHandler defines the signature for a function that can be called from within a string.
type funcHandler func(string) (string, error)

var funcRegistry = make(map[string]funcHandler)

// init registers all the available string processing functions.
func init() {
	funcRegistry["rand"] = handleRand
	funcRegistry["randstr"] = handleRandStr
	funcRegistry["hex"] = handleHex
	funcRegistry["oct"] = handleOct
	funcRegistry["uc"] = handleUc
	funcRegistry["lc"] = handleLc
	funcRegistry["no_delimiters"] = handleNoDelimiters
}

// ProcessFunctions finds and executes all registered functions within a string.
// It iteratively processes the string until no more functions are found.
func ProcessFunctions(input string) (string, error) {
	// Build a regex to find any of the registered functions, e.g., rand(...), uc(...)
	var funcNames []string
	for name := range funcRegistry {
		funcNames = append(funcNames, name)
	}
	reStr := fmt.Sprintf(`((%s)\(([^()]+)\))`, strings.Join(funcNames, "|"))
	re := regexp.MustCompile(reStr)

	processed := input
	for {
		matches := re.FindStringSubmatch(processed)
		// If no more functions are found, we're done.
		if len(matches) == 0 {
			break
		}

		fullMatch := matches[1] // e.g., "rand(10)"
		funcName := matches[2]  // e.g., "rand"
		param := matches[3]     // e.g., "10"

		handler, ok := funcRegistry[funcName]
		if !ok {
			// This should not happen due to the regex construction
			continue
		}

		result, err := handler(param)
		if err != nil {
			return "", fmt.Errorf("error executing function '%s': %w", funcName, err)
		}

		processed = strings.Replace(processed, fullMatch, result, 1)
	}

	return processed, nil
}

// --- Function Handlers ---

func handleUc(param string) (string, error) {
	return strings.ToUpper(param), nil
}

func handleLc(param string) (string, error) {
	return strings.ToLower(param), nil
}

func handleNoDelimiters(param string) (string, error) {
	return strings.NewReplacer("-", "", ":", "", ".", "").Replace(param), nil
}

func handleHex(param string) (string, error) {
	val, err := strconv.Atoi(param)
	if err != nil {
		return param, nil // If not a number, return as is
	}
	return fmt.Sprintf("%x", val), nil
}

func handleOct(param string) (string, error) {
	val, err := strconv.Atoi(param)
	if err != nil {
		return param, nil // If not a number, return as is
	}
	return fmt.Sprintf("%o", val), nil
}

func handleRand(param string) (string, error) {
	parts := strings.Split(param, "..")

	if len(parts) == 2 {
		min, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return "", fmt.Errorf("invalid min value for rand: %s", parts[0])
		}
		max, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			return "", fmt.Errorf("invalid max value for rand: %s", parts[1])
		}

		if min >= max {
			return "", fmt.Errorf("min value must be less than max value in rand")
		}

		diff := big.NewInt(max - min)
		n, err := rand.Int(rand.Reader, diff)
		if err != nil {
			return "", err
		}

		result := n.Add(n, big.NewInt(min))
		return result.String(), nil

	} else if len(parts) == 1 {
		max, err := strconv.ParseInt(param, 10, 64)
		if err != nil {
			return "", fmt.Errorf("invalid number for rand: %s", param)
		}
		if max <= 0 {
			return "", fmt.Errorf("rand max must be positive: %d", max)
		}
		n, err := rand.Int(rand.Reader, big.NewInt(max))
		if err != nil {
			return "", err
		}
		return n.String(), nil
	}

	return "", fmt.Errorf("invalid format for rand parameter: %s", param)
}

func handleRandStr(param string) (string, error) {
	numRangeRe := regexp.MustCompile(`^((?:\d+)?,(?:\d+))$|^(\d+)$`)
	matches := numRangeRe.FindStringSubmatch(param)
	if len(matches) == 0 {
		return reggen.Generate(param, 100)
	} else if len(matches) == 2 {
		return reggen.Generate(`\w{`+matches[1]+`}`, 100)
	}

	// should never get here
	return "", fmt.Errorf("invalid format for randstr parameter: %s", param)
}
