# MemeDAO Royale — shelbynetfun

> **The first fully on-chain AI Meme Provenance Arena on Shelbynet + Aptos**

Generate memes with AI, upload them to Shelby decentralised storage, mint cryptographically-proven Move resources on Shelbynet, vote once-per-wallet, auto-earn legendary badges, and remix anyone's meme — all without touching a database.

[![Live on Shelbynet](https://img.shields.io/badge/Network-Shelbynet-d66868?style=flat-square)](https://shelby.xyz)
[![Move](https://img.shields.io/badge/Contracts-Move-af85db?style=flat-square)](./contracts)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-6dd6ce?style=flat-square)](./artifacts/memedao-royale)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Features

| Feature | On-chain? | Description |
|---|---|---|
| AI Meme Generation | — | gpt-image-1 generates from your prompt (runs server-side, no key needed client-side) |
| Shelby Upload | Yes | Blob stored on Shelby decentralised storage; SHA-256 proof hash captured |
| Mint Meme | Yes | Move resource stores object ID + proof hash + creator + timestamp |
| Sponsored Minting | Yes | Deployer pays gas in ShelbyUSD — users need zero APT |
| Vote (1 per wallet) | Yes | VoterRecord resource prevents double-voting |
| Legendary Badges | Yes | Auto-minted when vote count hits thresholds |
| Remix / Fork | Yes | New Meme resource references parent ID on-chain |
| Hall of Fame | Yes | Read from on-chain view functions |

---

## Monorepo Structure

```
shelbynetfun/
├── contracts/                  # Aptos Move modules
│   ├── Move.toml
│   ├── sources/
│   │   ├── MemeDAORoyale.move  # Core: mint, vote, remix, badges
│   │   └── ...
│   └── deploy.sh               # One-command Shelbynet deployment
├── artifacts/
│   ├── memedao-royale/         # React 19 + Vite frontend
│   │   └── src/
│   │       ├── pages/          # Home, Arena, Mint, Remix, Leaderboard, MyMemes
│   │       ├── components/     # Navbar, WalletConnect, MemeCard, NetworkWarning
│   │       ├── lib/            # aptos.ts, shelby.ts, types.ts
│   │       └── store/          # memeStore.ts (Zustand)
│   └── api-server/             # Express API server (port 8080)
│       └── src/
│           └── routes/
│               ├── generate.ts # AI image generation via gpt-image-1
│               ├── shelby.ts   # Shelby blob upload + proof hash
│               └── mint.ts     # Fee-payer (sponsored) transaction builder
└── README.md
```

---

## Quick Start (Local Dev)

### Prerequisites

```bash
node >= 20
pnpm >= 9
```

### Clone and Install

```bash
git clone https://github.com/amathxbt/shelbynetfun.git
cd shelbynetfun
pnpm install
```

### Configure environment

```bash
# API server
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Fill in SHELBY_DEPLOYER_PRIVATE_KEY, SHELBY_ACCOUNT_ADDRESS
# AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY (or set OPENAI_API_KEY)

# Frontend
cp .env.example artifacts/memedao-royale/.env
# Fill in VITE_MODULE_ADDR after you deploy contracts
```

### Run both services

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/memedao-royale run dev
```

---

## Environment Variables

### API Server (`artifacts/api-server/.env`)

| Variable | Required | Description |
|---|---|---|
| `SHELBY_DEPLOYER_PRIVATE_KEY` | Yes | Ed25519 private key of the deployer account |
| `SHELBY_ACCOUNT_ADDRESS` | Yes | Deployer account address (0x...) |
| `SHELBY_API_KEY` | Yes | From https://app.shelby.xyz/dashboard |
| `OPENAI_API_KEY` | Yes | For AI image generation (gpt-image-1) |

### Frontend (`artifacts/memedao-royale/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_MODULE_ADDR` | Yes | Deployer address (same as `SHELBY_ACCOUNT_ADDRESS`) |
| `VITE_APTOS_NODE_URL` | Yes | Shelbynet full-node RPC: `https://api.shelbynet.shelby.xyz/v1` |

---

## Deploy Move Contracts to Shelbynet

### Step 1 — Get your private key ready

```bash
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
export DEPLOYER_ADDR=0xYOUR_ACCOUNT_ADDRESS
```

> Never commit your private key. Use environment variables only.

### Step 2 — Fund your account

| Token | Where to get it |
|---|---|
| APT (gas) | https://aptos.dev/en/network/faucet (choose Shelbynet) |
| ShelbyUSD (storage) | https://faucet.shelby.xyz |
| Explorer | https://explorer.shelby.xyz/shelbynet |

### Step 3 — Deploy

```bash
chmod +x contracts/deploy.sh
DEPLOYER_ADDR=$DEPLOYER_ADDR PRIVATE_KEY=$PRIVATE_KEY bash contracts/deploy.sh
```

This compiles the Move modules, publishes to Shelbynet, calls `initialize()`, and prints your deployer address.

### Step 4 — Update your .env

```bash
VITE_MODULE_ADDR=0x<YOUR_DEPLOYER_ADDR>
```

---

## Badge Tiers (Auto-minted On-Chain)

| Badge | Votes needed | Emoji |
|---|---|---|
| Proof Lord | 10+ | Crown |
| Meme Overlord | 7+ | Fire |
| Fork Wizard | 4+ | Trident |
| Shelby Sage | 1+ | Wave |
| Hash Prophet | — | Lightning |
| Ngmi | 0 | Grimace |

Badges are Move resources auto-minted into the creator's account whenever their meme crosses a threshold. Existing badges automatically upgrade to a higher tier.

---

## Contract Architecture

```
MemeRegistry (deployer account)
  ├── meme_ids[]   — all minted IDs
  ├── next_id      — monotonic counter
  └── events       — MemeMinted, MemeVoted, MemeRemixed

Meme (creator account)
  ├── shelby_object_id  — Shelby storage reference
  ├── proof_hash        — SHA-256 of content
  ├── creator           — address
  ├── parent_id         — 0 = original; N = remix of meme N
  ├── vote_count
  └── is_legendary

VoterRecord (voter account)
  └── voted_ids[]   — prevents double-voting

Badge (creator account)
  └── name / tier / meme_id / awarded_at
```

---

## How Sponsored Minting Works

Users need **zero APT** to mint. The flow:

1. User fills in meme details and connects Petra wallet
2. API server builds a fee-payer transaction (deployer account pays gas in ShelbyUSD)
3. User signs as sender only (no gas cost)
4. API server co-signs as fee-payer and submits
5. Move contract stores the meme resource on-chain
6. Explorer link returned: `https://explorer.shelby.xyz/shelbynet/txn/{hash}`

---

## Contributing

PRs welcome!

```bash
git checkout -b feat/my-feature
# make changes
git push origin feat/my-feature
# open a PR against main
```

---

## License

MIT — free to fork, remix, and meme to the moon.
