# CreditLend Passport - Cross-Chain DeFi Credit Protocol

**CreditLend Passport** is a revolutionary decentralized finance (DeFi) lending protocol that enables users to **deposit collateral on one blockchain and borrow stablecoins on another**, leveraging AI-driven credit scoring, dynamic DeFi Passport NFTs, and secure Web3 Civic authentication.

## 🌟 Features

- **Cross-Chain Lending:** Deposit tokens on one blockchain and borrow stablecoins on another seamlessly.
- **AI Credit Scoring:** Personalized credit scores generated from your DeFi activity using advanced AI models.
- **DeFi Passport NFT:** Dynamic NFTs that represent your creditworthiness and DeFi identity.
- **Multi-Chain Support:** Compatible with Ethereum, Arbitrum, Polygon, Avalanche, and Optimism.
- **Secure Messaging:** Powered by Chainlink CCIP for reliable and secure cross-chain communication.
- **Real-time Data:** Utilizes Chainlink Price Feeds and Functions for accurate and up-to-date information.
- **Web3 Authentication:** Integration with Civic’s `@civic/auth-web3` for secure and seamless user sign-in/sign-out.
- **Protected Routes:** Access control ensures only authenticated users can access sensitive pages.
- **Responsive Design:** Mobile-friendly UI with smooth Framer Motion animations.
- **Dynamic Navigation:** Multi-page navigation with active state highlighting for routes like `/dashboard`, `/deposit`, `/borrow`, `/passport`, and `/swap`.
- **3D Background & Effects:** Futuristic UI enhanced by a `CyberBackground` component and matrix rain visual effects.

## 🏗️ Architecture

### Smart Contracts

- **MainRouter.sol** (Avalanche): Central coordinator managing all cross-chain operations.
- **Depositor.sol** (Source Chains): Handles collateral deposits.
- **Minter.sol** (Destination Chains): Manages minting and burning of DSC stablecoins.
- **DSC.sol:** Cross-chain stablecoin used for borrowing.
- **DeFiPassportNFT.sol:** Dynamic NFT representing user credit profiles.

### Frontend

- Built with **React + TypeScript** for a modern, type-safe web app.
- Styled using **Tailwind CSS** with cyberpunk-themed classes (`cyber-glass`, `neon-text`).
- Wallet integration via **Wagmi + RainbowKit**.
- Navigation handled by **React Router** with protected routes.
- Authentication powered by **Civic Auth** (`@civic/auth-web3`), featuring `SignInButton`, `SignOutButton`, and `UserButton`.
- UI animations with **Framer Motion** for smooth transitions.
- 3D visuals implemented using the `CyberBackground` component with particles, grids, and glowing effects.
- Loading states include 3D loading screens, spinners, and animated text to prevent race conditions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- MetaMask or compatible Web3 wallet
- Civic Auth client ID for authentication

### Installation

1. Clone the repository:
git clone <repository-url>
cd creditlend-passport

text
2. Install dependencies:
npm install

or
yarn add react react-dom react-router-dom framer-motion @civic/auth-web3 react-hot-toast @react-three/fiber @react-three/drei three wagmi @rainbow-me/rainbowkit

text
3. Configure Civic Auth:
- Obtain a clientId from Civic.
- Update `CivicAuthProvider` in `src/App.tsx`:
  ```
  <CivicAuthProvider clientId="your-civic-client-id">
  ```
- Adjust settings in `src/civic.ts` (endpoint, chain).
4. Update contract addresses in `src/config/contracts.ts`:
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

text
5. Start the development server:
npm run dev

text
6. Open your browser at [http://localhost:5173](http://localhost:5173).

## 🛠️ Deployment & Configuration

- Deploy `MainRouter` on Avalanche Fuji.
- Deploy `Depositor` on Arbitrum Goerli and Ethereum Goerli.
- Deploy `Minter` on Polygon Mumbai and Optimism Goerli.
- Configure Chainlink CCIP for cross-chain messaging.
- Set up Chainlink Functions for AI-powered credit scoring.
- Verify all contract addresses and Civic Auth settings for proper function.

## 🎯 Usage

### For Users

- Connect your wallet (MetaMask or compatible).
- Sign in using Civic Web3 authentication.
- Deposit collateral on your chosen source chain.
- Receive an AI-generated credit score based on your DeFi history.
- Borrow DSC stablecoins on your preferred destination chain.
- Mint your DeFi Passport NFT to showcase your credit profile.
- Perform cross-chain swaps of DSC tokens.
- Repay loans to maintain healthy positions and avoid liquidation.
- Sign out securely when done.

### For Developers

- Integrate smart contracts using the provided SDK.
- Access AI credit score APIs for your applications.
- Build on DeFi Passport NFT metadata.
- Customize frontend components (`App.tsx`, `Header.tsx`, `civic.ts`).
- Update navigation routes as needed.

## 🔗 Supported Networks

| Network Type | Networks                      |
|--------------|-------------------------------|
| Mainnet      | Ethereum, Arbitrum, Polygon, Avalanche, Optimism |
| Testnet      | Ethereum Goerli, Arbitrum Goerli, Polygon Mumbai, Avalanche Fuji, Optimism Goerli |

## 🔒 Security

- All smart contracts are **audited** for security.
- Cross-chain messaging secured by **Chainlink CCIP**.
- Real-time **health factor monitoring** to prevent over-borrowing.
- Automated **liquidation protection** safeguards user positions.
- Robust Web3 authentication via **Civic Auth**.

## 📅 Roadmap

- **Q1 2025:** Testnet launch with Civic Auth integration.
- **Q2 2025:** Security audits for contracts and authentication.
- **Q3 2025:** Mainnet deployment with full cross-chain functionality.
- **Q4 2025:** Additional chain integrations (e.g., Solana, Binance Smart Chain).
- **2026:** Advanced features including zk-proofs and decentralized governance.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

- Fork the repository.
- Create a feature branch.
- Make your changes (including updates to `App.tsx`, `Header.tsx`, or `civic.ts`).
- Add tests for new features.
- Submit a pull request.

## 📞 Support & Community

- Documentation: 
- Discord: Join our community for real-time support.
- Twitter: 
- Email: ujjwalsinha418@gmail.com

## ⚖️ License

This project is licensed under the **MIT License**. See the LICENSE file for details.

*Built with ❤️ by the CrossCredit team.*