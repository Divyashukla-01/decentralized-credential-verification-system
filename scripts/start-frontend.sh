#!/bin/bash
# ============================================================
# DCVS — React Frontend Startup Script
# ============================================================
set -e

FRONTEND_DIR="$(pwd)/frontend"
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}[DCVS-FRONTEND]${NC} Installing dependencies..."
cd "$FRONTEND_DIR"
npm install

echo -e "${CYAN}[DCVS-FRONTEND]${NC} Starting Vite dev server on http://localhost:5173"
echo -e "${GREEN}[INFO]${NC} API calls proxied to http://localhost:8080"
npm run dev
