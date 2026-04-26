#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MemeDAO Royale — Shelbynet (Aptos) Deployment Script
#
# Prerequisites:
#   1. Install the Aptos CLI:  https://aptos.dev/tools/aptos-cli/install-cli/
#   2. Set your private key:   export PRIVATE_KEY=0x<your_private_key>
#   3. Fund your account with APT (testnet faucet) and ShelbyUSD (Shelby faucet)
#      Faucets: see README.md → "Faucets" section
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="custom"
NODE_URL="https://api.shelbynet.shelby.network/v1"
FAUCET_URL="https://faucet.shelbynet.shelby.network"
DEPLOYER_ADDR="${DEPLOYER_ADDR:-}"

if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "❌  PRIVATE_KEY is not set. Run: export PRIVATE_KEY=0x<your_key>"
  exit 1
fi

echo "🚀  Compiling Move modules..."
aptos move compile \
  --named-addresses memedao="${DEPLOYER_ADDR}" \
  --save-metadata

echo "✅  Compilation successful."

echo "📦  Publishing to Shelbynet..."
aptos move publish \
  --private-key "${PRIVATE_KEY}" \
  --url "${NODE_URL}" \
  --named-addresses memedao="${DEPLOYER_ADDR}" \
  --assume-yes

echo "🎉  Package published!"

echo "🔧  Initializing registry..."
aptos move run \
  --private-key "${PRIVATE_KEY}" \
  --url "${NODE_URL}" \
  --function-id "${DEPLOYER_ADDR}::meme_dao_royale::initialize" \
  --assume-yes

echo "✨  MemeDAO Royale is live on Shelbynet!"
echo "    Deployer address : ${DEPLOYER_ADDR}"
echo "    Node URL         : ${NODE_URL}"
echo ""
echo "    Copy this into your frontend .env:"
echo "    VITE_MODULE_ADDR=${DEPLOYER_ADDR}"
echo "    VITE_APTOS_NODE_URL=${NODE_URL}"
