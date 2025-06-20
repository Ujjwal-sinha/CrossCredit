# CrossCredit Backend

Node.js/Express backend for the CrossCredit dApp, providing APIs for credit scores, user profiles, balances, and transaction history.

## Features

- **Credit Score API**: Mock credit score generation based on wallet addresses
- **User Profiles**: Comprehensive user data including balances and borrowing info
- **Cross-Chain Balances**: DSC and native token balances on Sepolia and Fuji
- **Transaction History**: Mock transaction data with realistic patterns
- **Admin Panel**: Admin endpoints for managing credit scores and viewing stats
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **CORS Support**: Configured for frontend integration
- **TypeScript**: Full TypeScript support with proper typing

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Visit health check:**
   ```
   http://localhost:3001/health
   ```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /api/credit-score?address=0x...` - Get credit score for address
- `GET /api/user-profile?address=0x...` - Get complete user profile
- `GET /api/balances?address=0x...` - Get cross-chain balances
- `GET /api/tx-history?address=0x...` - Get transaction history

### Admin Endpoints (require API key)

- `GET /api/admin/stats` - Platform statistics
- `POST /api/admin/credit-score` - Update user credit score

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Admin Configuration
ADMIN_API_KEY=your-secure-admin-api-key-here

# Blockchain RPC URLs (optional for real on-chain data)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contract Addresses (optional for real on-chain data)
SEPOLIA_DEPOSITOR_ADDRESS=0x...
SEPOLIA_DSC_ADDRESS=0x...
FUJI_MAINROUTER_ADDRESS=0x...
FUJI_MINTER_ADDRESS=0x...
FUJI_DSC_ADDRESS=0x...
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

## Admin API Usage

Admin endpoints require an API key. Include it in headers:

```bash
curl -H "x-api-key: your-api-key" http://localhost:3001/api/admin/stats
```

Or as query parameter:

```bash
curl http://localhost:3001/api/admin/stats?apiKey=your-api-key
```

## Example Responses

### Credit Score
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4d9c9bC",
  "creditScore": 750,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "factors": {
    "onChainActivity": 85,
    "defiParticipation": 72,
    "transactionHistory": 90,
    "socialScore": 65
  }
}
```

### User Profile
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4d9c9bC",
  "profile": {
    "creditScore": 750,
    "totalDeposited": "5000.00",
    "totalBorrowed": "2500.00",
    "healthFactor": "1.50",
    "hasNFT": false,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "balances": {
    "sepolia": { "dsc": "100.00", "eth": "1.2345" },
    "fuji": { "dsc": "50.00", "avax": "2.5678" }
  }
}
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the server:
   ```bash
   npm start
   ```

## Future Enhancements

- Replace mock data with real on-chain data fetching
- Add database integration for persistent storage
- Implement user authentication
- Add more sophisticated credit scoring algorithms
- Integration with The Graph for transaction history
- WebSocket support for real-time updates 