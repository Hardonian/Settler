# Model Pipeline Overview

## Introduction

Settler Edge AI uses machine learning models for reconciliation matching, anomaly detection, and schema inference. Models are optimized via AIAS Edge AI Accelerator Studio for deployment on edge devices.

## Model Types

### 1. Matching Models

**Purpose**: Identify potential matches between source and target transactions

**Input**: Transaction features (amount, date, description, metadata)
**Output**: Match confidence score (0.0 - 1.0), match probability

**Architecture**:

- Base: Transformer-based sequence matching
- Optimized: Quantized (int8/int4) for edge deployment

**Training Data**: Historical reconciliation matches and manual corrections

### 2. Anomaly Detection Models

**Purpose**: Detect unusual patterns or potential errors in transaction data

**Input**: Transaction features, historical patterns
**Output**: Anomaly score (0.0 - 1.0), anomaly type, severity

**Architecture**:

- Base: Isolation Forest + Autoencoder
- Optimized: Lightweight neural network for edge

**Anomaly Types**:

- Amount mismatches
- Duplicate transactions
- Missing transactions
- Pattern deviations
- Temporal anomalies

### 3. Schema Inference Models

**Purpose**: Automatically identify field types and structure in raw data

**Input**: Raw data samples
**Output**: Inferred schema with field types, PII detection

**Architecture**: Rule-based + ML classifier

**Detected Types**:

- String, Number, Date, Boolean
- Email, SSN, Credit Card, Phone, Name (PII)

### 4. PII Detection Models

**Purpose**: Identify and classify personally identifiable information

**Input**: Field names, values, context
**Output**: PII type, confidence score

**Methods**:

- Pattern matching (regex)
- ML classification
- Contextual analysis

## Model Optimization Pipeline

### Step 1: Model Upload

Upload base model to AIAS Edge Studio:

```bash
curl -X POST https://api.settler.dev/api/v1/aias/models/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "modelName=matching-v1" \
  -F "modelType=matching" \
  -F "format=onnx" \
  -F "modelFile=@model.onnx"
```

### Step 2: Device Profiling

Profile target device capabilities:

```bash
curl -X POST https://api.settler.dev/api/v1/aias/models/{modelId}/benchmark \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "deviceProfile": {
      "deviceType": "server",
      "os": "linux",
      "arch": "x86_64",
      "capabilities": {
        "cpu": true,
        "gpu": false,
        "onnx_runtime": true
      }
    }
  }'
```

### Step 3: Optimization Request

Request model optimization:

```bash
curl -X POST https://api.settler.dev/api/v1/aias/models/{modelId}/optimize \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "targetDevices": ["x86_64", "arm64"],
    "quantization": "int8",
    "optimizationLevel": "balanced"
  }'
```

### Step 4: Benchmark Results

Monitor optimization job:

```bash
curl https://api.settler.dev/api/v1/aias/jobs/{jobId}/status \
  -H "Authorization: Bearer $API_KEY"
```

### Step 5: Export & Deploy

Export optimized model:

```bash
curl -X POST https://api.settler.dev/api/v1/aias/models/{modelId}/export \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "format": "docker",
    "targetDevice": "x86_64"
  }'
```

Deploy to edge nodes via auto-update mechanism.

## Model Versioning

### Version Format

`{major}.{minor}.{patch}`

- **Major**: Breaking changes, incompatible with previous versions
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Version Management

- Models stored in `model_versions` table
- Active model version tracked per tenant
- Rollback support for failed deployments
- A/B testing support for model comparison

## Model Execution

### Edge Node Execution

1. **Model Loading**: Load optimized model on startup
2. **Inference**: Run inference for each request
3. **Caching**: Cache inference results for identical inputs
4. **Batching**: Batch multiple requests for efficiency

### Performance Targets

- **Latency**: < 10ms per inference
- **Throughput**: > 100 inferences/second
- **Accuracy**: > 95% match accuracy
- **Memory**: < 100MB per model

## Model Updates

### Auto-Update Mechanism

1. Edge node checks for model updates on heartbeat
2. Cloud pushes new model version if available
3. Edge node downloads and validates model
4. Model deployed with zero-downtime switchover
5. Old model kept for rollback

### Rollback

If new model performs poorly:

1. Automatic rollback to previous version
2. Alert sent to administrators
3. Model performance analyzed
4. Fixes applied before re-deployment

## Monitoring

### Model Metrics

- **Inference Latency**: P50, P95, P99
- **Throughput**: Requests per second
- **Accuracy**: Match accuracy, false positive rate
- **Resource Usage**: CPU, memory, GPU utilization

### Model Health

- **Drift Detection**: Monitor for model performance degradation
- **Data Quality**: Track input data quality metrics
- **Error Rates**: Monitor inference errors and failures

## Best Practices

1. **Start with Base Models**: Use pre-trained base models before custom training
2. **Profile Devices**: Always profile target devices before optimization
3. **Benchmark Thoroughly**: Run comprehensive benchmarks before deployment
4. **Monitor Continuously**: Track model performance in production
5. **Version Carefully**: Use semantic versioning and test thoroughly
6. **Rollback Plan**: Always have a rollback plan for model updates
7. **A/B Testing**: Test new models alongside existing ones
8. **Documentation**: Document model architecture, training data, and performance

## Future Enhancements

- **Federated Learning**: Train models across edge nodes without centralizing data
- **Online Learning**: Continuously improve models from production data
- **Multi-Model Ensembles**: Combine multiple models for better accuracy
- **Custom Model Training**: Allow customers to train custom models
- **Model Marketplace**: Share and reuse models across customers
