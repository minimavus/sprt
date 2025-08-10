package main

import (
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/registry"

	// Import generated plugins so init() runs
	_ "github.com/cisco-open/sprt/go-generator/generator/plugins_gen"
)

func main() {
	for _, p := range registry.Registered() {
		fmt.Printf("Loaded plugin: %s\n", p.Name())
	}
}
