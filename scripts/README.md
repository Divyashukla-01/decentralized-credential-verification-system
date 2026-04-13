# DCVS — Decentralized Credential Verification System

A full-stack blockchain application for issuing and verifying student academic credentials on **Hyperledger Fabric 2.5**, with a **Spring Boot** backend and **React + Vite** frontend.

---

## Folder Structure

```
dcvs/
├── chaincode/
│   └── credential/
│       ├── credential.go        # Go smart contract (CreateCredential, ReadCredential, GetAllCredentials)
│       └── go.mod
│
├── backend/
│   ├── pom.xml                  # Maven: Spring Boot 3.2 + Fabric Gateway SDK 1.4
│   └── src/main/
│       ├── java/com/dcvs/
│       │   ├── DcvsApplication.java
│       │   ├── config/
│       │   │   ├── FabricConfig.java    # Gateway bean (TLS gRPC connection)
│       │   │   └── WebConfig.java       # CORS
│       │   ├── controller/
│       │   │   └── CredentialController.java  # POST /api/issue, GET /api/verify/{id}, GET /api/all
│       │   ├── service/
│       │   │   └── FabricService.java   # Chaincode invocations via Gateway SDK
│       │   └── model/
│       │       ├── Credential.java
│       │       ├── IssueCredentialRequest.java
│       │       └── ApiResponse.java
│       └── resources/
│           └── application.properties
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # React Router layout + nav
│       ├── index.css            # Tailwind + custom classes
│       ├── api.js               # Axios API layer
│       └── pages/
│           ├── Dashboard.jsx    # Health + stats + network info
│           ├── IssuePage.jsx    # Issue credential form
│           ├── VerifyPage.jsx   # Verify by ID
│           └── AllCredentials.jsx  # Full credential table
│
└── scripts/
    ├── setup-blockchain.sh      # Start network + deploy chaincode
    ├── start-backend.sh         # Build + run Spring Boot
    └── start-frontend.sh        # npm install + vite dev
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker + Docker Compose | 20.x+ | Fabric nodes run in containers |
| Go | 1.21+ | Chaincode compilation |
| Java JDK | 17+ | Spring Boot backend |
| Maven | 3.8+ | Backend build tool |
| Node.js + npm | 18+ | React frontend |
| fabric-samples | 2.5.x | Fabric test-network |
| Fabric binaries | 2.5.x | peer, orderer CLI tools |

---

## Step 1 — Install Hyperledger Fabric

```bash
# Install fabric-samples, binaries, and Docker images
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.7

# Add peer/orderer binaries to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="${HOME}/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="${HOME}/fabric-samples/config/"
```

---

## Step 2 — Clone / Place Project

```bash
# Place the dcvs/ folder anywhere, e.g.:
cd ~/projects
# (copy the dcvs directory here)
cd dcvs
```

---

## Step 3 — Start the Blockchain Network

```bash
chmod +x scripts/*.sh
./scripts/setup-blockchain.sh
```

This script:
1. Copies chaincode to `~/fabric-samples/chaincode/credential/`
2. Runs `go mod tidy && go mod vendor` in the chaincode directory
3. Tears down any existing test-network
4. Starts the network: **2 orgs, TLS enabled, CouchDB state DB**
5. Creates `mychannel`
6. Deploys chaincode `credential` (Go) to both orgs
7. Runs a smoke test (`CreateCredential` + `ReadCredential`)

**Manual equivalent commands:**
```bash
cd ~/fabric-samples/test-network

# Bring up network with CouchDB
./network.sh up createChannel -c mychannel -ca -s couchdb

# Deploy chaincode
./network.sh deployCC \
  -c mychannel \
  -ccn credential \
  -ccp ~/fabric-samples/chaincode/credential \
  -ccl go \
  -ccv 1.0 \
  -ccs 1
```

---

## Step 4 — Configure Backend

Edit `backend/src/main/resources/application.properties` if your `fabric-samples` is not in `$HOME`:

```properties
# Change this if fabric-samples is elsewhere
fabric.crypto-path=/path/to/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com
```

All other settings (peer endpoint, MSP, channel, chaincode name) are already correct for the default test-network.

---

## Step 5 — Start Spring Boot Backend

```bash
./scripts/start-backend.sh

# Or manually:
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```

Backend runs on **http://localhost:8080**

**Test the APIs:**
```bash
# Health check
curl http://localhost:8080/api/health

# Issue a credential
curl -X POST http://localhost:8080/api/issue \
  -H "Content-Type: application/json" \
  -d '{"id":"CRED-001","studentId":"STU-2024-001","course":"B.Tech Information Technology","grade":"A+"}'

# Verify
curl http://localhost:8080/api/verify/CRED-001

# Get all
curl http://localhost:8080/api/all
```

---

## Step 6 — Start React Frontend

```bash
./scripts/start-frontend.sh

# Or manually:
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

Vite proxies `/api/*` requests to `http://localhost:8080` automatically.

---

## API Reference

### POST /api/issue
```json
Request:
{
  "id": "CRED-2024-001",
  "studentId": "STU-20BT-0421",
  "course": "B.Tech Information Technology",
  "grade": "A+"
}

Response:
{
  "success": true,
  "message": "Credential issued successfully on blockchain",
  "data": "CRED-2024-001"
}
```

### GET /api/verify/{id}
```json
Response:
{
  "success": true,
  "message": "Credential verified successfully",
  "data": {
    "id": "CRED-2024-001",
    "studentId": "STU-20BT-0421",
    "course": "B.Tech Information Technology",
    "grade": "A+",
    "issuedAt": "2024-01-15T10:30:00Z",
    "issuerOrg": "Org1MSP"
  }
}
```

### GET /api/all
```json
Response:
{
  "success": true,
  "message": "Credentials retrieved successfully",
  "data": [ { ...credential }, { ...credential } ]
}
```

---

## Chaincode Functions

| Function | Type | Args |
|----------|------|------|
| `CreateCredential` | Submit (write) | id, studentId, course, grade, issuedAt |
| `ReadCredential` | Evaluate (read) | id |
| `GetAllCredentials` | Evaluate (read) | — (uses CouchDB rich query) |
| `CredentialExists` | Evaluate (read) | id |
| `DeleteCredential` | Submit (write) | id |

**Manual peer CLI invocation:**
```bash
# Set environment for Org1 peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${HOME}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${HOME}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

# Create
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com --tls \
  --cafile ${HOME}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel -n credential \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${HOME}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${HOME}/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"CreateCredential","Args":["CRED-001","STU-001","Cybersecurity","A","2024-01-15T10:00:00Z"]}'

# Read
peer chaincode query -C mychannel -n credential \
  -c '{"function":"ReadCredential","Args":["CRED-001"]}'

# Get All
peer chaincode query -C mychannel -n credential \
  -c '{"function":"GetAllCredentials","Args":[]}'
```

---

## Network Ports

| Service | Port |
|---------|------|
| Org1 Peer (gRPC) | 7051 |
| Org2 Peer (gRPC) | 9051 |
| Orderer | 7050 |
| CouchDB (Org1) | 5984 |
| CouchDB (Org2) | 7984 |
| Spring Boot API | 8080 |
| React Frontend | 5173 |

**Access CouchDB UI (Org1):** http://localhost:5984/_utils (admin / adminpw)

---

## Fabric Test-Network Changes

The default test-network works **without modification**. The `deployCC` command handles:
- Package, install, approve (both orgs), commit lifecycle
- TLS configuration
- CouchDB selection via `-s couchdb`

The only thing to ensure is that `fabric-samples/chaincode/credential/` exists with vendor directory populated before running `deployCC`. The setup script handles this automatically.

---

## Common Errors & Fixes

### `Error: failed to connect to peer`
→ Fabric network isn't running. Run `./scripts/setup-blockchain.sh`

### `No private key found`
→ Wrong `fabric.key-path` in `application.properties`. The keystore directory path must contain the `_sk` file.

### `Credential with ID X already exists`
→ The chaincode enforces unique IDs. Use a different credential ID.

### `mvn: command not found`
→ Install Maven: `sudo apt install maven` (Linux) or `brew install maven` (Mac)

### `go: command not found` in setup script
→ Install Go 1.21+: https://go.dev/dl/

### CouchDB rich query fails
→ Only applicable when using LevelDB. The chaincode has a `getAllByRange` fallback for this case. With `-s couchdb` flag the rich query works correctly.

---

## Architecture

```
Browser (React)
    │
    │ HTTP (proxied)
    ▼
Spring Boot :8080
    │
    │ gRPC + TLS (Fabric Gateway SDK)
    ▼
peer0.org1.example.com:7051
    │
    │ Endorsement (Org1 + Org2)
    ▼
Orderer :7050
    │
    │ Block commit
    ▼
mychannel ledger (CouchDB world state)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Hyperledger Fabric 2.5, Go Chaincode |
| State DB | CouchDB |
| Backend | Java 17, Spring Boot 3.2 |
| Fabric SDK | fabric-gateway 1.4.0 (not deprecated) |
| Frontend | React 18, Vite, Tailwind CSS |
| Transport | gRPC + TLS |
