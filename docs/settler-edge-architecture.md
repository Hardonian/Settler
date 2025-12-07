# Settler Edge AI Architecture

## Overview

Settler.dev implements a dual-layer Cloud + Edge AI platform architecture that combines centralized cloud intelligence with local edge processing for real-time reconciliation, reduced latency, and enhanced privacy.

## Architecture Components

### 1. Cloud Core

The cloud core provides centralized reconciliation services:

- **Central Reconciliation Engine**: Multi-tenant SaaS architecture with advanced matching algorithms
- **Matching Rules & Fuzzy Logic**: Configurable matching rules with ML-enhanced fuzzy matching
- **Break Detection**: Automated detection and classification of reconciliation breaks
- **Audit Logs & Ledger Parity**: Complete audit trail and ledger verification
- **API + Webhook Orchestration**: RESTful API and webhook system for integrations
- **Dashboard UX**: React/Next.js web interface for monitoring and management

#### Edge-Aware Enhancements

- **Pre-processed Batch Ingestion**: Accepts pre-processed data from edge nodes
- **Candidate Match Score Matrices**: Ingests AI-suggested match scores from edge nodes
- **Configurable Matching Weights**: Per-client matching weight configuration
- **Observability**: Job tracking, throughput metrics, anomaly clustering
- **AIAS Integration**: Model optimization and benchmarking via AIAS Edge Studio

### 2. Edge Node

The edge node is a standalone service that runs locally on customer infrastructure:

#### Core Responsibilities

- **Local Ingestion**: Ingest data from POS, ERP, S3, databases, file drops
- **Schema Inference**: ML-powered field identification, PII detection, value type classification
- **Local Fuzzy Matching**: On-device candidate scoring using optimized models
- **Anomaly Detection**: Real-time anomaly detection using edge-optimized models
- **PII Redaction**: Tokenization and redaction before cloud sync
- **Offline Mode**: Local buffering and processing during network outages
- **Sync Logic**: Secure synchronization with Settler Cloud

#### Model Execution Layer

- **Multi-Runtime Support**: ONNX Runtime, TensorRT, ExecuTorch, WebGPU/WASM
- **Automatic Runtime Selection**: Chooses optimal runtime based on device capabilities
- **Quantized Models**: Supports int4/int8 quantization for efficient inference
- **Device Targeting**: CPU/NPU/GPU execution based on availability

#### Storage & Sync

- **Local Storage**: SQLite database for local job queue and data
- **Sync Protocol**: Secure HTTPS sync with retry logic and exponential backoff
- **Offline Buffering**: Queue operations during network outages
- **Incremental Sync**: Only syncs changes to minimize bandwidth

## Data Flow

### Standard Reconciliation Flow

1. **Data Ingestion** (Edge Node)
   - Local data sources (POS, ERP, etc.) → Edge Node
   - Schema inference and PII detection
   - PII redaction/tokenization

2. **Local Processing** (Edge Node)
   - Fuzzy matching and candidate scoring
   - Anomaly detection
   - Local storage in SQLite

3. **Cloud Sync** (Edge Node → Cloud)
   - Candidate scores sent to cloud
   - Anomaly events reported
   - Batch ingestion data synced

4. **Cloud Processing** (Cloud Core)
   - Merge edge candidates with cloud matches
   - Final reconciliation decision
   - Audit logging and reporting

5. **Results** (Cloud → Edge Node)
   - Reconciliation results synced back
   - Model updates pushed to edge
   - Configuration updates

### Offline Flow

1. Edge node continues processing locally
2. All operations queued in local SQLite
3. When connectivity restored, sync queue processed
4. Cloud reconciles any conflicts

## Security Architecture

### Authentication

- **Node Enrollment**: One-time enrollment key for initial setup
- **Node Key Authentication**: Long-lived API key for node-to-cloud communication
- **OAuth Integration**: Optional OAuth for user authentication

### Data Protection

- **PII Redaction**: Automatic detection and tokenization of PII
- **Encryption in Transit**: TLS 1.3 for all communications
- **Encryption at Rest**: Encrypted local storage
- **Token Mapping**: Secure token-to-value mapping stored separately

### Compliance

- **GDPR**: Data residency controls, right to deletion
- **HIPAA**: PII handling, audit trails
- **SOC 2**: Security controls and monitoring

## Model Pipeline

### Model Optimization (AIAS Integration)

1. **Model Upload**: Upload base model to AIAS Edge Studio
2. **Device Profiling**: Profile target device capabilities
3. **Optimization Request**: Request quantization (int4/int8) and optimization
4. **Benchmarking**: Run benchmarks on target device
5. **Export**: Export optimized model bundle (Docker, WASM, APK)
6. **Deployment**: Deploy to edge nodes via auto-update mechanism

### Model Execution

1. **Model Loading**: Load optimized model on edge node startup
2. **Inference**: Run inference for matching, anomaly detection, etc.
3. **Performance Monitoring**: Track latency, throughput, accuracy
4. **Auto-Updates**: Receive model updates from cloud

## Scalability

### Horizontal Scaling

- **Multiple Edge Nodes**: Deploy nodes across locations
- **Fleet Management**: Centralized management of node fleet
- **Load Distribution**: Distribute reconciliation load across nodes

### Vertical Scaling

- **Cloud Auto-Scaling**: Cloud core scales based on load
- **Edge Node Resources**: Edge nodes can scale resources independently

## Monitoring & Observability

### Metrics

- **Edge Node Metrics**: Heartbeat, job processing rate, sync status
- **Cloud Metrics**: API throughput, reconciliation accuracy, break rates
- **Model Metrics**: Inference latency, accuracy, resource usage

### Logging

- **Structured Logging**: JSON logs with correlation IDs
- **Distributed Tracing**: Trace requests across edge and cloud
- **Audit Logs**: Complete audit trail for compliance

### Alerts

- **Node Health**: Alert on node offline or degraded
- **Anomaly Detection**: Alert on high-severity anomalies
- **Performance**: Alert on latency or accuracy degradation

## Deployment

### Edge Node Deployment

- **Docker**: Containerized deployment
- **Native Binary**: Standalone binary for embedded devices
- **Kubernetes**: Helm charts for K8s deployment
- **Cloud Platforms**: AWS IoT Greengrass, Azure IoT Edge

### Cloud Deployment

- **Serverless**: Vercel, AWS Lambda
- **Container**: Docker, Kubernetes
- **Managed Services**: Supabase, PostgreSQL

## Future Enhancements

- **Federated Learning**: Train models across edge nodes without centralizing data
- **Edge-to-Edge Communication**: Direct peer-to-peer sync between nodes
- **Advanced ML Models**: Transformer-based matching, graph neural networks
- **Real-time Streaming**: Stream processing for high-volume scenarios
