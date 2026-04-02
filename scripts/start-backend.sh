#!/bin/bash
# ============================================================
# DCVS — Spring Boot Backend Startup Script
# ============================================================
set -e

FABRIC_SAMPLES="${HOME}/fabric-samples"
NETWORK_DIR="${FABRIC_SAMPLES}/test-network"
BACKEND_DIR="$(pwd)/backend"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[DCVS-BACKEND]${NC} $1"; }
ok()  { echo -e "${GREEN}[OK]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Verify crypto material exists
CRYPTO_PATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com"
[ -d "$CRYPTO_PATH" ] || err "Fabric test-network not running. Run ./scripts/setup-blockchain.sh first."

# Check TLS cert exists
TLS_CERT="${CRYPTO_PATH}/peers/peer0.org1.example.com/tls/ca.crt"
[ -f "$TLS_CERT" ] || err "TLS cert not found: $TLS_CERT"

log "Crypto material found at: $CRYPTO_PATH"

# Update application.properties with detected paths (optional override via env)
FABRIC_CRYPTO_PATH="${FABRIC_CRYPTO_PATH:-$CRYPTO_PATH}"

log "Starting Spring Boot on port 8080..."
log "Fabric peer: localhost:7051 (peer0.org1.example.com)"
log "Channel: mychannel | Chaincode: credential"

cd "$BACKEND_DIR"

# Build and run
mvn clean package -DskipTests -q && \
mvn spring-boot:run \
  -Dfabric.crypto-path="${FABRIC_CRYPTO_PATH}" \
  -Dserver.port=8080
