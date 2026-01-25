package engine

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"
)

func parseDate(value string, tz *time.Location) (time.Time, error) {
	value = strings.TrimSpace(value)
	layouts := []string{
		time.RFC3339,
		"2006-01-02",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
	}
	var parsed time.Time
	var err error
	for _, layout := range layouts {
		parsed, err = time.ParseInLocation(layout, value, tz)
		if err == nil {
			return parsed.In(tz), nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported date format")
}

func parseAmountToCents(value string, roundingMode string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, errors.New("empty amount")
	}
	value = strings.ReplaceAll(value, ",", "")

	rat, ok := new(big.Rat).SetString(value)
	if !ok {
		return 0, fmt.Errorf("invalid number %s", value)
	}

	multiplier := big.NewRat(100, 1)
	rat.Mul(rat, multiplier)

	return roundRatToInt64(rat, roundingMode)
}

func roundRatToInt64(rat *big.Rat, roundingMode string) (int64, error) {
	if roundingMode == "" {
		roundingMode = "bankers"
	}
	sign := rat.Sign()
	absRat := new(big.Rat).Set(rat)
	if sign < 0 {
		absRat.Neg(absRat)
	}

	floor := new(big.Int)
	floor.Div(absRat.Num(), absRat.Denom())

	fraction := new(big.Rat).Sub(absRat, new(big.Rat).SetInt(floor))
	if fraction.Sign() == 0 {
		if sign < 0 {
			return -floor.Int64(), nil
		}
		return floor.Int64(), nil
	}

	switch strings.ToLower(roundingMode) {
	case "bankers", "banker", "half-even":
		cmpHalf := fraction.Cmp(big.NewRat(1, 2))
		if cmpHalf < 0 {
			if sign < 0 {
				return -floor.Int64(), nil
			}
			return floor.Int64(), nil
		}
		if cmpHalf > 0 {
			floor.Add(floor, big.NewInt(1))
			if sign < 0 {
				return -floor.Int64(), nil
			}
			return floor.Int64(), nil
		}
		if floor.Bit(0) == 0 {
			if sign < 0 {
				return -floor.Int64(), nil
			}
			return floor.Int64(), nil
		}
		floor.Add(floor, big.NewInt(1))
		if sign < 0 {
			return -floor.Int64(), nil
		}
		return floor.Int64(), nil
	case "half-up", "half_up", "halfup":
		cmpHalf := fraction.Cmp(big.NewRat(1, 2))
		if cmpHalf >= 0 {
			floor.Add(floor, big.NewInt(1))
			if sign < 0 {
				return -floor.Int64(), nil
			}
			return floor.Int64(), nil
		}
		if sign < 0 {
			return -floor.Int64(), nil
		}
		return floor.Int64(), nil
	default:
		return 0, fmt.Errorf("unsupported rounding mode %s", roundingMode)
	}
}

func hashBytes(content []byte) string {
	hasher := sha256.New()
	_, _ = hasher.Write(content)
	return hex.EncodeToString(hasher.Sum(nil))
}
