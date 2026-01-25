package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/settler/settler-engine/internal/engine"
)

func main() {
	inputPath := flag.String("input", "", "Path to engine_input.json")
	flag.Parse()

	if *inputPath == "" {
		fmt.Fprintln(os.Stderr, "--input is required")
		os.Exit(1)
	}

	output, err := engine.Run(*inputPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Printf("Settler engine run completed. Variances: %d. Output: %s\n", output.VarianceSummary.Total, output.VarianceItemsPath)
}
