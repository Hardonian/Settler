# Settler Go SDK

Production-grade Go SDK for Settler Reconciliation API.

## Installation

```bash
go get github.com/settler/settler-go
```

## Quick Start

```go
package main

import (
	"fmt"
	"log"

	"github.com/settler/settler-go/settler"
)

func main() {
	// Initialize client
	client, err := settler.NewClient("sk_your_api_key")
	if err != nil {
		log.Fatal(err)
	}

	// Create a reconciliation job
	job, err := client.Jobs().Create(settler.CreateJobRequest{
		Name: "Shopify-Stripe Reconciliation",
		Source: settler.AdapterConfig{
			Adapter: "shopify",
			Config: map[string]interface{}{
				"api_key": "your_shopify_api_key",
				"shop":     "your-shop",
			},
		},
		Target: settler.AdapterConfig{
			Adapter: "stripe",
			Config: map[string]interface{}{
				"api_key": "sk_your_stripe_key",
			},
		},
		Rules: settler.MatchingRules{
			Matching: []settler.MatchingRule{
				{Field: "order_id", Type: "exact"},
				{Field: "amount", Type: "exact", Tolerance: 0.01},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// Run the job
	execution, err := client.Jobs().Run(job["id"].(string))
	if err != nil {
		log.Fatal(err)
	}

	// Get report
	report, err := client.Reports().Get(job["id"].(string), "")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Matched: %v\n", report["summary"])
}
```

## Features

- ✅ Automatic retries with exponential backoff
- ✅ Request deduplication
- ✅ Type-safe error handling
- ✅ Full API coverage
- ✅ Production-ready

## Documentation

See [docs.settler.io](https://docs.settler.io) for complete documentation.

## License

MIT
