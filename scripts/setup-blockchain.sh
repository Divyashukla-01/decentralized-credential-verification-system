#!/bin/bash
# ============================================================
# DCVS — Blockchain Setup Script
# Sets up Hyperledger Fabric test-network with CouchDB and
# deploys the credential chaincode to mychannel.
# ============================================================
set -e

FABRIC_SAMPLES="${HOME}/fabric-samples"
NETWORK_DIR="${FABRIC_SAMPLES}/test-network"
CHAINCODE_SRC_DIR="$(pwd)/chaincode/credential"
CHAINCODE_DEST_DIR="${FABRIC_SAMPLES}/chaincode/credential"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[DCVS]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Prerequisites check ─────────────────────────────────
log "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || err "Docker not installed"
command -v go     >/dev/null 2>&1 || err "Go not installed (need 1.21+)"
command -v peer   >/dev/null 2>&1 || warn "peer CLI not in PATH — ensure \$FABRIC_SAMPLES/bin is in PATH"

[ -d "$NETWORK_DIR" ] || err "fabric-samples not found at $FABRIC_SAMPLES. Run: curl -sSL https://bit.ly/2ysbOFE | bash -s"

# ── 1. Copy chaincode into fabric-samples ──────────────────
log "Copying chaincode to fabric-samples..."
mkdir -p "${CHAINCODE_DEST_DIR}"
cp -r "${CHAINCODE_SRC_DIR}/." "${CHAINCODE_DEST_DIR}/"
ok "Chaincode copied to ${CHAINCODE_DEST_DIR}"

# Download Go dependencies
log "Downloading chaincode Go dependencies..."
cd "${CHAINCODE_DEST_DIR}"
go mod tidy
go mod vendor
cd - > /dev/null
ok "Go deps ready"

# ── 2. Tear down any existing network ──────────────────────
log "Tearing down any existing test-network..."
cd "${NETWORK_DIR}"
./network.sh down 2>/dev/null || true
ok "Previous network cleaned up"

# ── 3. Start test-network with CouchDB ────────────────────
log "Starting Fabric test-network with CouchDB (2 orgs, TLS enabled)..."
./network.sh up createChannel -c mychannel -ca -s couchdb
ok "Network up. Channel 'mychannel' created."

# ── 4. Deploy chaincode ────────────────────────────────────
log "Deploying credential chaincode to mychannel..."
./network.sh deployCC \
  -c mychannel \
  -ccn credential \
  -ccp "${CHAINCODE_DEST_DIR}" \
  -ccl go \
  -ccv 1.0 \
  -ccs 1 \
  -cci InitLedger 2>/dev/null || true

# Note: InitLedger is optional — credential chaincode doesn't require it
# Re-run without -cci if above fails:
./network.sh deployCC \
  -c mychannel \
  -ccn credential \
  -ccp "${CHAINCODE_DEST_DIR}" \
  -ccl go \
  -ccv 1.0 \
  -ccs 1 || err "Chaincode deployment failed"

ok "Chaincode 'credential' deployed on mychannel"

# ── 5. Smoke test ──────────────────────────────────────────
log "Running smoke test..."
export PATH="${FABRIC_SAMPLES}/bin:$PATH"
export FABRIC_CFG_PATH="${FABRIC_SAMPLES}/config/"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n credential \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateCredential","Args":["SMOKE-001","STU-000","Smoke Test","A","'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"]}'

sleep 3

RESULT=$(peer chaincode query -C mychannel -n credential -c '{"function":"ReadCredential","Args":["SMOKE-001"]}')
echo -e "${GREEN}Smoke test result:${NC} $RESULT"

ok "Blockchain setup complete!"
echo ""
echo -e "${CYAN}Network summary:${NC}"
echo "  Channel:    mychannel"
echo "  Chaincode:  credential (Go)"
echo "  State DB:   CouchDB"
echo "  Orgs:       Org1MSP (port 7051) · Org2MSP (port 9051)"
echo "  Orderer:    localhost:7050"
echo ""
echo -e "${YELLOW}Next:${NC} Start the Spring Boot backend: ./scripts/start-backend.sh"
