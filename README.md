# Vantic Frontend

The trading interface for Vantic, the fastest binary prediction market terminal on Solana. Built with Next.js, React, and TypeScript.

- **Live:** https://vantic.xyz
- **Backend API:** https://vcs-api.vantic.xyz/docs

---

## What is Vantic

Vantic is a binary prediction market platform. Users take YES or NO positions on crypto price outcomes and real-world events. Every position resolves to either 1.0 or 0 at settlement, with payouts credited instantly to the user's in-app balance. Demo trading is live on Solana devnet, with real trading coming to mainnet.

---

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # fill in your values
pnpm dev
```

Requires Node 20+.

### Environment Variables

```env
NEXT_PUBLIC_API_URL=          # Core service base URL
BACKEND_API_KEY=              # Server-side only, never exposed to the client
GOLDRUSH_API_KEY=             # Covalent GoldRush key for the OVM explorer
```

---

## Navigating the App

After signing up, the dashboard is your home screen.

**Crypto tab** lists all active crypto price prediction markets. Select a market to open the detail view. The order form sits on the right side of the screen on desktop. On mobile, tap the Trade tab inside the market view.

**General tab** lists all non-crypto markets, covering sports, politics, and world events. The trading flow is identical.

**History screen** shows your closed positions with realized PnL, a daily calendar view, and a full trade log.

**Balance widget** in the top-right corner opens your account overview. From there you can fund your account, withdraw, view your asset balances, and toggle between demo and real mode.

**Account page** contains your custodial wallet addresses for Solana and Base, deposit instructions, and session settings.

---

## Demo Mode

Demo mode runs on Solana devnet with real on-chain assets. It is not a simulation. SOL and USDC balances on devnet are real transactions. The refill button credits up to $400 USD in demo funds directly to your Vantic wallet and trading balance.

---

## Private Deposits via Umbra

Users can fund their Vantic wallet privately using any external Solana wallet. The deposit flow is powered by **Umbra**, which breaks the on-chain link between the source wallet and the user's Vantic identity using Arcium's MPC network.

Flow:
1. Connect any external Solana wallet (Phantom, Solflare, Backpack).
2. Shield USDC into Umbra's encrypted balance pool.
3. Unshield to your Vantic wallet address.

The result is that no on-chain observer can connect your external wallet to your Vantic account.

---

## Private Withdrawals via MagicBlock

USD balance withdrawals and SPL token withdrawals are routed through **MagicBlock's private payment network**. The withdrawal is submitted as a private SPL transfer, breaking the visible link between the Vantic vault and the destination wallet on-chain. This is the default behavior for all USD and SPL withdrawals.

SOL and Base asset withdrawals are direct on-chain transfers and are publicly visible.

---

## OVM Explorer via GoldRush

The on-chain explorer at `/explorer` uses the **GoldRush API by Covalent** to surface wallet activity on Base mainnet and other EVM chains. It provides transaction history, token balances, and transfer events for any connected wallet. The GoldRush client runs server-side only through Next.js API routes so the API key is never exposed to the browser.

---

## Architecture Notes

All API calls from the browser are proxied through `/api/vcs/[...path]`. The `BACKEND_API_KEY` is injected server-side at the proxy layer. The client never sees the key.

WebSocket connections go directly from the browser to the core service for live orderbook and balance updates.

---

## License

See [LICENSE](./LICENSE).
