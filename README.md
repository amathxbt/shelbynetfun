# 🎭 MemeDAO Royale — shelbynetfun

> **The first fully on-chain AI Meme Provenance Arena on Shelbynet + Aptos**

Generate dank memes with AI, upload them to Shelby decentralised storage, mint cryptographically-proven Move resources on Shelbynet, vote once-per-wallet, auto-earn legendary badges, and remix anyone's meme — all without touching a database.

[![Live on Shelbynet](https://img.shields.io/badge/Network-Shelbynet-d66868?style=flat-square)](https://shelby.network)
[![Move](https://img.shields.io/badge/Contracts-Move-af85db?style=flat-square)](./contracts)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-6dd6ce?style=flat-square)](./artifacts/memedao-royale)

---

## ✨ Features

| Feature | On-chain? | Description |
|---|---|---|
| 🖼️ AI Meme Generation | — | Replicate/Flux generates from your prompt |
| 📦 Shelby Upload | ✅ | Content stored in Shelby; SHA-256 proof hash captured |
| 🪙 Mint Meme | ✅ | Move resource stores object ID + proof + creator + timestamp |
| 🗳️ Vote (1 per wallet) | ✅ | VoterRecord resource prevents double-voting |
| 🏆 Legendary Badges | ✅ | Auto-minted when vote count hits thresholds |
| 🔱 Remix / Fork | ✅ | New Meme resource references parent ID on-chain |
| 🏛️ Hall of Fame | ✅ | Read from on-chain view functions via Aptos indexer |

---

## 🗂️ Monorepo Structure

```
shelbynetfun/
├── contracts/                  # Aptos Move modules
│   ├── Move.toml
│   ├── sources/
│   │   ├── MemeDAORoyale.move  # Core: mint, vote, remix
│   │   ├── Voting.move         # One-vote-per-wallet sentry
│   │   └── Badge.move          # Auto-minted badge tiers
│   ├── scripts/
│   │   └── mint_and_vote_demo.move
│   └── deploy.sh               # One-command Shelbynet deployment
├── artifacts/
│   └── memedao-royale/         # React 19 + Vite frontend
│       └── src/
│           ├── pages/          # Home, Arena, Mint, Remix, Leaderboard, MyMemes
│           ├── components/     # Navbar, WalletConnect, MemeCard, …
│           ├── lib/            # aptos.ts, shelby.ts, types.ts
│           └── store/          # memeStore.ts (Zustand)
├── .env.example
└── README.md
```

---

## ⚡ Quick Start (Local Dev)

### 1 — Prerequisites

```bash
node >= 20
pnpm >= 9
Aptos CLI  →  https://aptos.dev/tools/aptos-cli/install-cli/
```

### 2 — Clone & Install

```bash
git clone https://github.com/amathxbt/shelbynetfun.git
cd shelbynetfun
pnpm install
```

### 3 — Configure environment

```bash
cp .env.example artifacts/memedao-royale/.env
# Edit the file — fill in VITE_MODULE_ADDR after you deploy contracts
```

### 4 — Run the frontend

```bash
pnpm --filter @workspace/memedao-royale run dev
# Opens at http://localhost:<PORT>
```

---

## 🔑 Environment Variables

Copy `.env.example` → `artifacts/memedao-royale/.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `VITE_MODULE_ADDR` | ✅ | Your deployer address (set after deploy) |
| `VITE_APTOS_NODE_URL` | ✅ | Shelbynet full-node RPC |
| `VITE_APTOS_INDEXER_URL` | optional | Indexer GraphQL for live reads |
| `VITE_SHELBY_API_KEY` | ✅ | From https://app.shelby.network/dashboard |
| `VITE_SHELBY_API_URL` | optional | Defaults to https://api.shelby.network |
| `VITE_REPLICATE_API_KEY` | optional | AI image generation (blank = demo mode) |

---

## 📦 Deploy Move Contracts to Shelbynet

### Step 1 — Get your private key ready

```bash
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
export DEPLOYER_ADDR=0xYOUR_ACCOUNT_ADDRESS
```

> ⚠️ Never commit your private key. Use environment variables only.

### Step 2 — Fund your account

You need APT for gas + ShelbyUSD for storage payments.

| Token | Faucet |
|---|---|
| **APT** (gas) | https://aptos.dev/en/network/faucet (choose Shelbynet) |
| **ShelbyUSD** (storage) | https://faucet.shelby.network |
| **Shelbynet explorer** | https://explorer.shelbynet.shelby.network |

### Step 3 — Run the deploy script

```bash
chmod +x contracts/deploy.sh
DEPLOYER_ADDR=$DEPLOYER_ADDR PRIVATE_KEY=$PRIVATE_KEY bash contracts/deploy.sh
```

This will:
1. Compile the Move modules
2. Publish the package to Shelbynet
3. Call `initialize()` to set up the registry
4. Print your `VITE_MODULE_ADDR` to copy into `.env`

### Step 4 — Update your frontend .env

```bash
# paste the deployer address printed by deploy.sh
VITE_MODULE_ADDR=0x<YOUR_DEPLOYER_ADDR>
```

---

## 🌐 Deploy Frontend to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amathxbt/shelbynetfun)

### CLI

```bash
pnpm --filter @workspace/memedao-royale run build
# Output lands in artifacts/memedao-royale/dist/public

npx vercel deploy artifacts/memedao-royale/dist/public --prod
```

Set all `VITE_*` environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## 🏅 Badge Tiers (Auto-minted On-Chain)

| Badge | Votes needed | Emoji |
|---|---|---|
| **Proof Lord** | 10+ | 👑 |
| **Meme Overlord** | 7+ | 🔥 |
| **Fork Wizard** | 4+ | 🔱 |
| **Shelby Sage** | 1+ | 🌊 |
| **Hash Prophet** | — | ⚡ |
| **Ngmi** | 0 | 😬 |

Badges are Move resources auto-minted into the creator's account whenever their meme crosses a threshold. Existing badges are automatically upgraded to a higher tier.

---

## 🛠️ Contract Architecture

```
MemeRegistry (deployer account)
  └── meme_ids[]   — all minted IDs
  └── next_id      — monotonic counter
  └── events       — MemeMinted, MemeVoted, MemeRemixed

Meme (creator account)
  └── shelby_object_id  — Shelby storage reference
  └── proof_hash        — SHA-256 of content
  └── creator           — address
  └── parent_id         — 0 = original; N = remix of meme N
  └── vote_count
  └── is_legendary

VoterRecord (voter account)    [from Voting.move]
  └── voted_ids[]   — prevents double-voting

Badge (creator account)        [from Badge.move]
  └── name / tier / meme_id / awarded_at
```

---

## 🤝 Contributing

PRs welcome! Join the Shelby Discord: https://discord.gg/shelbyprotocol

```bash
git checkout -b feat/my-feature
# hack hack hack
git push origin feat/my-feature
# open a PR
```

---

## 📜 License

MIT — free to fork, remix, and meme to the moon. 🚀
