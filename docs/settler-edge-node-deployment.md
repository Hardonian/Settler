# Settler Edge Node Deployment Guide

## Quick Start

### Prerequisites

- Node.js 20+ or Docker
- Network access to Settler Cloud API
- Enrollment key from Settler dashboard

### Installation

#### Option 1: NPM Package

```bash
npm install -g @settler/edge-node
```

#### Option 2: Docker

```bash
docker pull settler/edge-node:latest
```

#### Option 3: Source

```bash
git clone https://github.com/settler-dev/settler
cd packages/edge-node
npm install
npm run build
```

## Enrollment

### Step 1: Get Enrollment Key

1. Log in to Settler dashboard
2. Navigate to Edge AI → Edge Nodes
3. Click "Add Edge Node"
4. Copy the enrollment key

### Step 2: Enroll Node

```bash
settler-edge enroll \
  --enrollment-key <your-enrollment-key> \
  --name "My Edge Node" \
  --type server
```

This will:

- Register the node with Settler Cloud
- Generate a node key (save this securely!)
- Configure the node

### Step 3: Start Node

```bash
settler-edge start --node-key <your-node-key>
```

Or set environment variable:

```bash
export SETTLER_NODE_KEY=<your-node-key>
settler-edge start
```

## Configuration

### Environment Variables

```bash
# Required
SETTLER_NODE_KEY=sk_edge_...          # Node authentication key
SETTLER_CLOUD_API_URL=https://api.settler.dev  # Cloud API URL

# Optional
SETTLER_DATA_DIR=./data                # Local data directory
SETTLER_HEARTBEAT_INTERVAL=30000       # Heartbeat interval (ms)
SETTLER_SYNC_INTERVAL=60000            # Sync interval (ms)
SETTLER_BATCH_SIZE=100                 # Batch size for sync
SETTLER_OFFLINE_MODE=false             # Enable offline mode
LOG_LEVEL=info                         # Log level
```

### Configuration File

Create `config.json`:

```json
{
  "nodeKey": "sk_edge_...",
  "cloudApiUrl": "https://api.settler.dev",
  "dataDir": "./data",
  "heartbeatInterval": 30000,
  "syncInterval": 60000,
  "batchSize": 100,
  "enableOfflineMode": false
}
```

## Deployment Options

### Docker Deployment

#### Basic Docker Run

```bash
docker run -d \
  --name settler-edge \
  -e SETTLER_NODE_KEY=<your-node-key> \
  -e SETTLER_CLOUD_API_URL=https://api.settler.dev \
  -v $(pwd)/data:/app/data \
  settler/edge-node:latest
```

#### Docker Compose

```yaml
version: "3.8"
services:
  settler-edge:
    image: settler/edge-node:latest
    environment:
      - SETTLER_NODE_KEY=${SETTLER_NODE_KEY}
      - SETTLER_CLOUD_API_URL=https://api.settler.dev
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Kubernetes Deployment

#### Helm Chart

```bash
helm install settler-edge ./helm/settler-edge \
  --set nodeKey=<your-node-key> \
  --set cloudApiUrl=https://api.settler.dev
```

#### Kubernetes Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: settler-edge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: settler-edge
  template:
    metadata:
      labels:
        app: settler-edge
    spec:
      containers:
        - name: settler-edge
          image: settler/edge-node:latest
          env:
            - name: SETTLER_NODE_KEY
              valueFrom:
                secretKeyRef:
                  name: settler-edge-secrets
                  key: node-key
            - name: SETTLER_CLOUD_API_URL
              value: "https://api.settler.dev"
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: settler-edge-data
```

### Systemd Service

Create `/etc/systemd/system/settler-edge.service`:

```ini
[Unit]
Description=Settler Edge Node
After=network.target

[Service]
Type=simple
User=settler
Environment="SETTLER_NODE_KEY=<your-node-key>"
Environment="SETTLER_CLOUD_API_URL=https://api.settler.dev"
ExecStart=/usr/local/bin/settler-edge start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable settler-edge
sudo systemctl start settler-edge
```

## Data Sources

### File-Based Ingestion

Place files in the ingestion directory:

```bash
mkdir -p ./data/ingestion
cp transactions.json ./data/ingestion/
```

The edge node will automatically process files in the ingestion directory.

### API Ingestion

Send data to the local API endpoint:

```bash
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -d @transactions.json
```

### Database Integration

Configure database connections in `config.json`:

```json
{
  "dataSources": {
    "postgres": {
      "type": "postgres",
      "connectionString": "postgresql://user:pass@localhost/db",
      "query": "SELECT * FROM transactions WHERE date > NOW() - INTERVAL '1 day'"
    }
  }
}
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

### Status

```bash
settler-edge status
```

### Logs

```bash
# Docker
docker logs settler-edge

# Systemd
journalctl -u settler-edge -f
```

## Troubleshooting

### Node Not Connecting

1. Check network connectivity:

   ```bash
   curl https://api.settler.dev/health
   ```

2. Verify node key:

   ```bash
   echo $SETTLER_NODE_KEY
   ```

3. Check logs for authentication errors

### Sync Failures

1. Check sync queue:

   ```bash
   sqlite3 ./data/settler-edge.db "SELECT * FROM sync_queue WHERE retries > 0"
   ```

2. Verify cloud API access
3. Check for rate limiting

### Performance Issues

1. Monitor resource usage:

   ```bash
   docker stats settler-edge
   ```

2. Adjust batch size in configuration
3. Check model inference latency

## Security Best Practices

1. **Secure Node Key Storage**: Use secrets management (Kubernetes secrets, AWS Secrets Manager, etc.)
2. **Network Security**: Use VPN or private networks for edge-to-cloud communication
3. **Data Encryption**: Enable encryption at rest for local data
4. **Access Control**: Limit access to edge node configuration and data
5. **Regular Updates**: Keep edge node software updated

## Production Checklist

- [ ] Node enrolled and authenticated
- [ ] Data directory configured with sufficient storage
- [ ] Network connectivity verified
- [ ] Monitoring and alerting configured
- [ ] Backup strategy for local data
- [ ] Security hardening applied
- [ ] Log rotation configured
- [ ] Resource limits set (CPU, memory)
- [ ] Health checks configured
- [ ] Disaster recovery plan documented
