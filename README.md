# CreditLend Passport - Cross-Chain DeFi Credit Protocol

A revolutionary cross-chain DeFi lending protocol that allows users to deposit collateral on one blockchain and borrow stablecoins on another, powered by AI credit scoring and DeFi Passport NFTs.

## 🌟 Features

- **Cross-Chain Lending**: Deposit tokens on one blockchain, borrow on another
- **AI Credit Scoring**: Personalized credit scores based on DeFi activity
- **DeFi Passport NFT**: Dynamic NFTs showcasing credit worthiness
- **Multi-Chain Support**: Ethereum, Arbitrum, Polygon, Avalanche, Optimism
- **Secure Messaging**: Powered by Chainlink CCIP
- **Real-time Data**: Chainlink Price Feeds and Functions

## 🏗️ Architecture

### Smart Contracts

- **MainRouter.sol** (Avalanche): Central coordinator for all operations
- **Depositor.sol** (Source chains): Handles token deposits
- **Minter.sol** (Destination chains): Manages DSC token minting/burning
- **DSC.sol**: Cross-chain stablecoin for borrowing
- **DeFiPassportNFT.sol**: Dynamic NFT representing user credit profile

### Frontend

- **React + TypeScript**: Modern web application
- **Tailwind CSS**: Beautiful, responsive design
- **Wagmi + RainbowKit**: Web3 wallet integration
- **React Router**: Multi-page navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd creditlend-passport
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🔧 Smart Contract Deployment

### Testnet Deployment

1. **Deploy MainRouter** on Avalanche Fuji
2. **Deploy Depositor** on Arbitrum Goerli, Ethereum Goerli
3. **Deploy Minter** on Polygon Mumbai, Optimism Goerli
4. **Configure CCIP** connections between contracts
5. **Set up Chainlink Functions** for credit scoring

### Configuration

Update contract addresses in the frontend configuration:

```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  MAIN_ROUTER: "0x...", // Avalanche Fuji
  DEPOSITORS: {
    arbitrum: "0x...",
    ethereum: "0x..."
  },
  MINTERS: {
    polygon: "0x...",
    optimism: "0x..."
  }
};
```

## 📱 Usage

### For Users

1. **Connect Wallet**: Connect your Web3 wallet
2. **Deposit Collateral**: Choose a chain and deposit supported tokens
3. **Get Credit Score**: AI analyzes your DeFi activity
4. **Borrow DSC**: Borrow stablecoins on your preferred chain
5. **Mint NFT Passport**: Create your DeFi identity NFT
6. **Cross-Chain Swap**: Move DSC between chains
7. **Repay Loans**: Maintain healthy positions

### For Developers

1. **Smart Contract Integration**: Use our SDK to integrate with other protocols
2. **Credit Score API**: Access credit scoring for your applications
3. **NFT Metadata**: Build on top of DeFi Passport data

## 🔗 Supported Networks

### Mainnet
- Ethereum
- Arbitrum
- Polygon
- Avalanche
- Optimism

### Testnet
- Ethereum Goerli
- Arbitrum Goerli
- Polygon Mumbai
- Avalanche Fuji
- Optimism Goerli

## 🛡️ Security

- **Audited Smart Contracts**: All contracts undergo security audits
- **Chainlink CCIP**: Secure cross-chain messaging
- **Health Factor Monitoring**: Prevent over-borrowing
- **Liquidation Protection**: Automated liquidation system

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] **Q1 2025**: Testnet launch
- [ ] **Q2 2025**: Security audits
- [ ] **Q3 2025**: Mainnet deployment
- [ ] **Q4 2025**: Additional chain integrations
- [ ] **2026**: Advanced features (zk-proofs, governance)

## 📞 Support

- **Documentation**: [docs.creditlend.finance](https://docs.creditlend.finance)
- **Discord**: [Join our community](https://discord.gg/creditlend)
- **Twitter**: [@CreditLendFi](https://twitter.com/CreditLendFi)
- **Email**: support@creditlend.finance

## 🏆 Team

Built with ❤️ by the CreditLend team .
