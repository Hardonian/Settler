package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/settler/settler-engine/internal/engine"
)

func main() {
	inputPath := flag.String("input", "", "Path to engine_input.json")
	simulate := flag.Bool("simulate", false, "Run policy simulation without mutating baseline outputs")
	amountToleranceCents := flag.Int64("override-amount-tolerance-cents", -1, "Candidate policy amount tolerance in cents")
	dateToleranceDays := flag.Int("override-date-tolerance-days", -1, "Candidate policy date tolerance in days")
	currencyMismatchVariance := flag.String("override-currency-mismatch-variance", "", "Candidate policy currency mismatch variance flag (true|false)")
	feeToleranceCents := flag.Int64("override-fee-tolerance-cents", -1, "Candidate policy fee tolerance in cents")
	fxToleranceBps := flag.Int64("override-fx-tolerance-bps", -1, "Candidate policy FX variance tolerance in bps")
	conflictResolution := flag.String("override-conflict-resolution", "", "Candidate conflict resolution (first-match|best-score)")
	groupedMatchEnabled := flag.String("override-grouped-match-enabled", "", "Enable grouped matching (true|false)")
	flag.Parse()

	if *inputPath == "" {
		fmt.Fprintln(os.Stderr, "--input is required")
		os.Exit(1)
	}

	if *simulate {
		override := engine.PolicyOverride{}
		if *amountToleranceCents >= 0 {
			v := *amountToleranceCents
			override.AmountToleranceCents = &v
		}
		if *dateToleranceDays >= 0 {
			v := *dateToleranceDays
			override.DateToleranceDays = &v
		}
		if *feeToleranceCents >= 0 {
			v := *feeToleranceCents
			override.FeeToleranceCents = &v
		}
		if *fxToleranceBps >= 0 {
			v := *fxToleranceBps
			override.FXVarianceToleranceBps = &v
		}
		if *currencyMismatchVariance != "" {
			if *currencyMismatchVariance == "true" {
				v := true
				override.CurrencyMismatchIsVariance = &v
			} else if *currencyMismatchVariance == "false" {
				v := false
				override.CurrencyMismatchIsVariance = &v
			} else {
				fmt.Fprintln(os.Stderr, "--override-currency-mismatch-variance must be true or false")
				os.Exit(1)
			}
		}
		if *conflictResolution != "" {
			v := *conflictResolution
			override.ConflictResolution = &v
		}
		if *groupedMatchEnabled != "" {
			if *groupedMatchEnabled == "true" {
				v := true
				override.GroupedMatchEnabled = &v
			} else if *groupedMatchEnabled == "false" {
				v := false
				override.GroupedMatchEnabled = &v
			} else {
				fmt.Fprintln(os.Stderr, "--override-grouped-match-enabled must be true or false")
				os.Exit(1)
			}
		}

		simOutput, err := engine.SimulatePolicy(*inputPath, override)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		encoded, err := json.MarshalIndent(simOutput, "", "  ")
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		fmt.Println(string(encoded))
		return
	}

	output, err := engine.Run(*inputPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Printf("Settler engine run completed. Variances: %d. Output: %s\n", output.VarianceSummary.Total, output.VarianceItemsPath)
}
