#!/bin/bash
# NEXUS Setup Script
# Run: chmod +x setup.sh && ./setup.sh

set -e

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     NEXUS — Agentic Venture Studio           ║${NC}"
echo -e "${BOLD}${CYAN}║     Setup Script v1.0                        ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────
echo -e "${CYAN}[1/5] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}  Node.js not found. Install from nodejs.org (v20+)${NC}"
  exit 1
fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 20 ]; then
  echo -e "${RED}  Node.js v20+ required. Found: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"

# ── Install root dependencies ─────────────────────────────────────────
echo -e "${CYAN}[2/5] Installing orchestrator dependencies...${NC}"
npm install --silent
echo -e "${GREEN}  ✓ Root packages installed${NC}"

# ── Install dashboard dependencies ───────────────────────────────────
echo -e "${CYAN}[3/5] Installing dashboard dependencies...${NC}"
cd dashboard && npm install --silent && cd ..
echo -e "${GREEN}  ✓ Dashboard packages installed${NC}"

# ── Create .env files ─────────────────────────────────────────────────
echo -e "${CYAN}[4/5] Setting up environment files...${NC}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}  ✓ Created .env${NC}"
  echo -e "${YELLOW}  ⚠ Add your Anthropic API key: ANTHROPIC_API_KEY=sk-ant-...${NC}"
else
  echo -e "${DIM}  .env already exists — skipping${NC}"
fi

if [ ! -f dashboard/.env ]; then
  cp dashboard/.env.example dashboard/.env
  echo -e "${GREEN}  ✓ Created dashboard/.env${NC}"
  echo -e "${YELLOW}  ⚠ Add your Anthropic API key: VITE_ANTHROPIC_API_KEY=sk-ant-...${NC}"
else
  echo -e "${DIM}  dashboard/.env already exists — skipping${NC}"
fi

# ── Verify memory files ───────────────────────────────────────────────
echo -e "${CYAN}[5/5] Verifying memory files...${NC}"
MEMORY_FILES=("portfolio.json" "agent-status.json" "task-queue.json" "founder-actions.json")
ALL_OK=true
for f in "${MEMORY_FILES[@]}"; do
  if [ -f "memory/$f" ]; then
    echo -e "${GREEN}  ✓ memory/$f${NC}"
  else
    echo -e "${RED}  ✗ memory/$f MISSING${NC}"
    ALL_OK=false
  fi
done
if [ "$ALL_OK" = false ]; then
  echo -e "${RED}  Memory files are missing. Re-download the project.${NC}"
  exit 1
fi

# ── Done ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║           Setup Complete ✓                   ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo ""
echo -e "  ${YELLOW}1. Add your Anthropic API key to both .env files:${NC}"
echo -e "     ${DIM}# Root .env — for the orchestrator and agents${NC}"
echo -e "     ANTHROPIC_API_KEY=sk-ant-..."
echo -e "     ${DIM}# dashboard/.env — for the React dashboard chat${NC}"
echo -e "     VITE_ANTHROPIC_API_KEY=sk-ant-..."
echo ""
echo -e "  ${YELLOW}2. Talk to NEXUS:${NC}"
echo -e "     node scripts/run-agent.js nexus \"What is blocking Sprint 1?\""
echo ""
echo -e "  ${YELLOW}3. Check system status:${NC}"
echo -e "     npm run status"
echo ""
echo -e "  ${YELLOW}4. Start the dashboard:${NC}"
echo -e "     npm run dashboard"
echo -e "     → http://localhost:5173"
echo ""
echo -e "  ${YELLOW}5. Start the orchestrator loop (auto-runs tasks):${NC}"
echo -e "     npm run orchestrator"
echo ""
echo -e "  ${YELLOW}6. Queue your first task:${NC}"
echo -e "     npm run task atlas \"Summarize the ShiftPay Gate 1 requirements\" shiftpay high"
echo ""
echo -e "  ${DIM}Open in VS Code: code .${NC}"
echo -e "  ${DIM}Run with Claude Code: claude${NC}"
echo ""
