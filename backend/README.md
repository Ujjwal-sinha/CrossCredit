# CrossCredit Backend

A Node.js/Express backend API for the CrossCredit DeFi platform that provides real-time blockchain data and analytics.

## Features

- **Real Blockchain Integration**: Fetches live data from Sepolia and Fuji testnets using ethers.js
- **Credit Score API**: Calculates credit scores from on-chain activity and contract data
- **Cross-Chain Balance Tracking**: Real-time DSC and native token balances across chains
- **Transaction History**: Fetches and processes blockchain events and transactions
- **User Profiles**: Complete user data aggregation from multiple contracts
- **Admin Interface**: Platform statistics and credit score management
- **Rate Limiting**: Built-in protection against API abuse
- **CORS Support**: Configured for React frontend integration

## API Endpoints

### Public Endpoints

- `GET /api/credit-score?address=0x...` - Get user's credit score
- `GET /api/user-profile?address=0x...` - Get complete user profile
- `GET /api/balances?address=0x...` - Get cross-chain balances
- `GET /api/tx-history?address=0x...` - Get transaction history

### Admin Endpoints (Require API Key)

- `GET /api/admin/stats` - Platform statistics and health checks
- `POST /api/admin/credit-score` - Update user credit scores

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `sample.env` to `.env` and configure:
   ```bash
   cp sample.env .env
   ```

   Required configuration:
   - `SEPOLIA_RPC_URL`: Ethereum Sepolia RPC endpoint
   - `FUJI_RPC_URL`: Avalanche Fuji RPC endpoint
   - Contract addresses for all deployed contracts
   - `ADMIN_API_KEY`: Secret key for admin endpoints

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production**
   ```bash
   npm run build
   npm start
   ```

## Blockchain Integration

### Supported Networks

- **Sepolia (Ethereum Testnet)**
  - Chain ID: 11155111
  - Contracts: Depositor, DSC
  - CCIP Selector: 16015286601757825753

- **Fuji (Avalanche Testnet)**
  - Chain ID: 43113
  - Contracts: MainRouter, Minter, DSC, DeFiPassportNFT
  - CCIP Selector: 12532609583862916517

### Real Data Sources

1. **Contract Calls**: Direct interaction with deployed smart contracts
2. **Event Logs**: Transaction history from blockchain events
3. **Balance Queries**: Real-time token and native balances
4. **Credit Scores**: Both contract-stored and calculated from activity

### Credit Score Calculation

The system uses a multi-factor approach:

1. **Contract Score** (Primary): If available from MainRouter contract
2. **Calculated Score** (Fallback): Based on:
   - Total deposits (up to 200 points)
   - Health factor (up to 150 points)
   - Transaction history (up to 150 points)
   - Borrowing behavior (up to 100 points)
   - Account age (up to 100 points)
   - Base score: 300 points

## Error Handling

- Graceful fallbacks when blockchain calls fail
- Comprehensive error logging
- Default values for unavailable data
- Health checks for RPC connections

## Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable via environment variables
- Separate limits can be set for different endpoints

## Admin Features

Admin endpoints require the `x-api-key` header with a valid API key.

### Platform Statistics
- Blockchain connection health
- Contract deployment status
- RPC endpoint availability

### Credit Score Management
- View current scores
- Request score updates (requires on-chain transaction)

## Development Notes

- All contract ABIs are included and maintained
- Provider caching for efficient RPC usage
- Parallel data fetching for performance
- TypeScript throughout for type safety
- Structured logging for debugging

## Environment Variables

See `sample.env` for complete configuration options.

Key variables:
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode
- `*_RPC_URL`: Blockchain RPC endpoints
- `*_ADDRESS`: Smart contract addresses
- `ADMIN_API_KEY`: Admin authentication
- `FRONTEND_URL`: CORS configuration 