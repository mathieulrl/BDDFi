# BBDFi - Buy, Borrow, Die 🔥

> The wealth strategy of billionaires, now accessible to everyone through DeFi on Base.

![BBDFi Banner](https://img.shields.io/badge/Built%20on-Base-blue?style=for-the-badge)
![USDC](https://img.shields.io/badge/Powered%20by-USDC-2775CA?style=for-the-badge)
![AAVE](https://img.shields.io/badge/Integrated%20with-AAVE%20V3-B6509E?style=for-the-badge)

## 🎯 What is Buy, Borrow, Die?

**"Buy, Borrow, Die"** is a wealth-building strategy traditionally used by the ultra-wealthy:

1. **Buy** appreciating assets (stocks, real estate, crypto)
2. **Borrow** against those assets instead of selling them
3. **Die** (or live!) while the debt remains fixed and assets keep appreciating

The key insight: **borrowing isn't a taxable event**. By never selling, you defer capital gains indefinitely while maintaining liquidity for your lifestyle.

### The Problem

Until recently, this strategy was only accessible to millionaires with private bankers. JPMorgan just started offering Bitcoin-backed loans, but only to their high-net-worth clients.

### The Solution: BBDFi

BBDFi democratizes this strategy using DeFi protocols on Base:

- 💰 **Deposit** USDC, convert to BTC/ETH/SOL via DCA
- 🏦 **Borrow** USDC against your crypto collateral on AAVE V3
- 🚀 **Live** your life using borrowed funds while your crypto appreciates
- 📈 **Never sell** - no capital gains, maximum upside

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Web3**: 
  - [OnchainKit](https://onchainkit.xyz/) by Coinbase
  - wagmi v2 + viem
  - Smart Wallets (Coinbase Wallet)
- **DeFi Integration**: AAVE V3 on Base
- **State Management**: Zustand
- **Network**: Base (Ethereum L2)

## 🚀 Features

### Core Functionality

- ✅ **Fiat On-Ramp**: Convert USD to USDC via Circle
- ✅ **DCA Strategy**: Automated Dollar-Cost Averaging into BTC, ETH, SOL
- ✅ **Collateral Management**: Deposit crypto to AAVE V3
- ✅ **Borrowing**: Borrow USDC against your collateral
- ✅ **Health Factor Monitoring**: Real-time liquidation risk tracking
- ✅ **Smart Wallet**: Gasless transactions with Coinbase Smart Wallet

### Dashboard

- Portfolio overview with real-time prices
- DCA configuration (amount, frequency, allocation)
- Borrow/Repay interface with LTV slider
- Health Factor gauge visualization
- Transaction history

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/BuyBorrowDie.git
cd BuyBorrowDie

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
# - Get OnchainKit API key from https://portal.cdp.coinbase.com/
# - Get WalletConnect Project ID from https://cloud.walletconnect.com/

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase OnchainKit API key | Yes |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect Project ID | Yes |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base Mainnet RPC URL | No |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC URL | No |
| `CIRCLE_API_KEY` | Circle API key for USDC | Optional |

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   ├── layout/             # Header, Footer
│   ├── sections/           # Hero, HowItWorks, Dashboard
│   ├── ui/                 # Reusable UI components
│   └── providers.tsx       # Web3 providers
├── hooks/
│   ├── useAave.ts          # AAVE V3 integration hooks
│   └── usePrices.ts        # Price feed hooks
└── lib/
    ├── contracts.ts        # Contract addresses & ABIs
    ├── store.ts            # Zustand state management
    └── utils.ts            # Utility functions
```

## 🔗 Smart Contracts (Base)

### Mainnet
| Contract | Address |
|----------|---------|
| AAVE V3 Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` |

### Sepolia (Testnet)
| Contract | Address |
|----------|---------|
| AAVE V3 Pool | `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

## 🎨 UI/UX Features

- **Dark Mode**: Elegant dark theme with glassmorphism effects
- **Responsive**: Mobile-first design
- **Animations**: Smooth Framer Motion transitions
- **Real-time Updates**: Live price feeds and position updates
- **Accessible**: WCAG compliant components

## 🏆 Hackathon Tracks

This project is built for the **MBC Hackathon** and targets:

### Main Track: Base
- ✅ Built on Base (Ethereum L2)
- ✅ Uses OnchainKit / Coinbase Smart Wallets
- ✅ ERC-4337 Account Abstraction ready

### Bounty: USDC and Payments (Circle)
- ✅ Integrates USDC on Base
- ✅ Payment/borrowing application
- ✅ Real-world financial automation use case

## 🔐 Security Considerations

- **Non-Custodial**: Users maintain control of their assets
- **Battle-tested Protocols**: Built on AAVE V3, audited and trusted
- **Health Factor Monitoring**: Clear liquidation risk indicators
- **Conservative Defaults**: 50% LTV recommended for safety

## 📚 Learn More

- [AAVE V3 Documentation](https://docs.aave.com/developers/getting-started/readme)
- [Base Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Circle USDC](https://www.circle.com/usdc)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer

This application is for educational and hackathon purposes. DeFi involves significant risks including:
- **Smart Contract Risk**: Bugs in protocols
- **Liquidation Risk**: Collateral can be liquidated if health factor drops
- **Market Risk**: Crypto prices are volatile

**Not financial advice. Do your own research.**

---

Built with ❤️ for the MBC Hackathon on Base
