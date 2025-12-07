# Settler.dev + AIAS Integration Guide

## Overview

Settler.dev integrates with AIAS (Edge AI Accelerator Studio) via **HTTP API**, not direct code dependencies. This ensures product independence while enabling model optimization capabilities.

## Integration Pattern

### API-Based Integration

Settler.dev uses AIAS as an **external service** via REST API:

```typescript
// Settler.dev code
import { getAIASClient } from "../services/aias/client";

const aiasClient = getAIASClient();
const result = await aiasClient.optimizeModel({
  modelId: "settler-model-123",
  targetDevices: ["x86_64"],
  quantization: "int8",
  optimizationLevel: "balanced",
});
```

### Why API-Based?

1. **Product Independence**: Settler.dev doesn't depend on AIAS code
2. **Independent Versioning**: Each product can version independently
3. **Deployment Flexibility**: Can deploy separately
4. **Future Exit Strategy**: Can replace AIAS with alternative provider
5. **Clear Boundaries**: API contract defines integration boundary

## Shared Components

### Edge AI Core Module

Both products use shared technical components from `@settler/edge-ai-core`:

```typescript
// Both Settler.dev and AIAS can use
import {
  generateDeviceProfile,
  selectOptimalRuntime,
  estimateQuantizedSize,
} from "@settler/edge-ai-core";
```

**What's Shared:**

- Device profiling utilities
- Model optimization helpers
- Runtime selection logic
- Quantization utilities
- Deployment templates
- Security utilities

**What's NOT Shared:**

- UI components
- Branding
- Pricing
- Business logic
- Customer data

## Integration Flow

### 1. Model Upload

```typescript
// Settler.dev uploads model to AIAS via API
const uploadResult = await aiasClient.uploadModel({
  modelName: "settler-matching-v1",
  modelType: "matching",
  modelFile: modelBuffer,
  format: "onnx",
});

// Store AIAS job ID in Settler.dev database
await query(`UPDATE model_versions SET aias_job_id = $1 WHERE id = $2`, [
  uploadResult.jobId,
  settlerModelId,
]);
```

### 2. Model Optimization

```typescript
// Request optimization via AIAS API
const optimizeResult = await aiasClient.optimizeModel({
  modelId: aiasModelId,
  targetDevices: ["x86_64", "arm64"],
  quantization: "int8",
  optimizationLevel: "balanced",
});

// Poll for completion
const status = await aiasClient.getOptimizationStatus(optimizeResult.jobId);
```

### 3. Model Deployment

```typescript
// Export optimized model from AIAS
const exportResult = await aiasClient.exportModel({
  modelId: aiasModelId,
  format: "docker",
  targetDevice: "x86_64",
});

// Deploy to Settler.dev edge nodes
await deployToEdgeNodes(exportResult.downloadUrl);
```

## Configuration

### Environment Variables

```bash
# AIAS API Configuration (for Settler.dev)
AIAS_API_KEY=your-aias-api-key
AIAS_BASE_URL=https://api.aias.studio  # Optional, defaults to production
```

### API Client Initialization

```typescript
// Settler.dev initializes AIAS client
const aiasClient = getAIASClient(); // Uses AIAS_API_KEY from env
```

## Error Handling

### API Failures

```typescript
try {
  const result = await aiasClient.optimizeModel({...});
} catch (error) {
  // Handle API errors
  if (error.status === 429) {
    // Rate limited - retry with backoff
  } else if (error.status === 401) {
    // Invalid API key
  } else {
    // Other errors
  }
}
```

### Fallback Behavior

If AIAS is unavailable, Settler.dev can:

- Use unoptimized models
- Queue optimization requests for later
- Use alternative optimization provider

## Security

### API Key Management

- Store AIAS API keys in environment variables
- Never commit keys to repository
- Rotate keys regularly
- Use different keys per environment

### Data Privacy

- Models sent to AIAS for optimization
- No customer data sent to AIAS
- Only model artifacts, not transaction data
- PII never leaves Settler.dev infrastructure

## Monitoring

### Integration Metrics

Track:

- API call success/failure rates
- Optimization job completion times
- Model download success rates
- API latency

### Alerts

Alert on:

- AIAS API downtime
- High failure rates
- Slow optimization jobs
- Authentication failures

## Testing

### Mock AIAS Client

```typescript
// In tests, mock AIAS client
jest.mock("../services/aias/client", () => ({
  getAIASClient: () => ({
    optimizeModel: jest.fn().mockResolvedValue({ jobId: "test-job" }),
    getOptimizationStatus: jest.fn().mockResolvedValue({ status: "completed" }),
  }),
}));
```

### Integration Tests

Test with:

- Real AIAS API (staging environment)
- Mock responses
- Error scenarios

## Best Practices

1. **Always use API client**: Never make direct HTTP calls
2. **Handle errors gracefully**: Don't fail Settler.dev if AIAS is down
3. **Cache results**: Cache optimization results to reduce API calls
4. **Monitor usage**: Track API usage and costs
5. **Version APIs**: Use versioned AIAS API endpoints
6. **Document integration**: Keep integration docs up to date

## Future Considerations

### Alternative Providers

Settler.dev can integrate with other model optimization providers:

- Implement same interface
- Swap providers without code changes
- Multi-provider support

### Direct Integration (Not Recommended)

Direct code integration would:

- ❌ Create tight coupling
- ❌ Require shared versioning
- ❌ Limit deployment flexibility
- ❌ Complicate exit strategy

API integration maintains independence while enabling functionality.
