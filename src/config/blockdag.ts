
export const BLOCKDAG_CONFIG = {
  chainId: 1043,
  name: "Primordial BlockDAG Testnet",
  rpcUrl: "https://rpc.primordial.bdagscan.com",
  explorerUrl: "https://primordial.bdagscan.com/",
  nativeCurrency: {
    name: "BDAG",
    symbol: "BDAG",
    decimals: 18
  },
  // These will be populated after deployment
  contracts: {
    CrossCreditToken: "0x", // Will be updated after deployment
    BlockDAGRouter: "0x", // Will be updated after deployment
  },
  // Cross-chain token amounts configuration
  tokenAmounts: {
    // Sending amounts (XCC tokens)
    send: {
      min: "1", // 1 XCC minimum
      max: "1000000", // 1M XCC maximum
      suggested: ["10", "100", "1000", "10000", "100000"], // Suggested amounts
      decimals: 18
    },
    // Receiving amounts (based on other chains)
    receive: {
      ethereum: {
        min: "0.001", // ETH equivalent
        max: "100", // ETH equivalent
        suggested: ["0.01", "0.1", "1", "10"], // ETH amounts
        decimals: 18
      },
      polygon: {
        min: "1", // MATIC equivalent
        max: "10000", // MATIC equivalent
        suggested: ["10", "100", "1000"], // MATIC amounts
        decimals: 18
      },
      arbitrum: {
        min: "0.001", // ETH equivalent
        max: "100", // ETH equivalent
        suggested: ["0.01", "0.1", "1", "10"], // ETH amounts
        decimals: 18
      },
      optimism: {
        min: "0.001", // ETH equivalent
        max: "100", // ETH equivalent
        suggested: ["0.01", "0.1", "1", "10"], // ETH amounts
        decimals: 18
      },
      avalanche: {
        min: "0.1", // AVAX equivalent
        max: "1000", // AVAX equivalent
        suggested: ["1", "10", "100"], // AVAX amounts
        decimals: 18
      },
      bsc: {
        min: "0.01", // BNB equivalent
        max: "100", // BNB equivalent
        suggested: ["0.1", "1", "10"], // BNB amounts
        decimals: 18
      }
    }
  },
  // Fee configuration
  fees: {
    send: 1, // 1% send fee
    receive: 0.5, // 0.5% receive fee
    bridge: 0.1, // 0.1% bridge fee
  },
  // UI configuration
  ui: {
    theme: {
      primary: "#6366f1", // Indigo
      secondary: "#8b5cf6", // Purple
      accent: "#06b6d4", // Cyan
      background: "#0f0f23",
      card: "#1a1a2e"
    },
    animations: {
      duration: 300,
      easing: "ease-in-out"
    }
  }
};

// Cross-chain exchange rates (mock data - in production, fetch from oracle)
export const EXCHANGE_RATES = {
  XCC_TO_ETH: 0.0001, // 1 XCC = 0.0001 ETH
  XCC_TO_MATIC: 0.5, // 1 XCC = 0.5 MATIC
  XCC_TO_AVAX: 0.01, // 1 XCC = 0.01 AVAX
  XCC_TO_BNB: 0.001, // 1 XCC = 0.001 BNB
  // Add more rates as needed
};

// Supported chains for cross-chain operations
export const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: "Ethereum Mainnet",
    symbol: "ETH",
    rpc: "https://mainnet.infura.io/v3/",
    explorer: "https://etherscan.io/",
    testnet: false
  },
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    symbol: "ETH",
    rpc: "https://sepolia.infura.io/v3/",
    explorer: "https://sepolia.etherscan.io/",
    testnet: true
  },
  {
    id: 137,
    name: "Polygon Mainnet",
    symbol: "MATIC",
    rpc: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com/",
    testnet: false
  },
  {
    id: 80001,
    name: "Polygon Mumbai",
    symbol: "MATIC",
    rpc: "https://rpc-mumbai.maticvigil.com",
    explorer: "https://mumbai.polygonscan.com/",
    testnet: true
  },
  {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
    rpc: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io/",
    testnet: false
  },
  {
    id: 421613,
    name: "Arbitrum Goerli",
    symbol: "ETH",
    rpc: "https://goerli-rollup.arbitrum.io/rpc",
    explorer: "https://goerli.arbiscan.io/",
    testnet: true
  },
  {
    id: 10,
    name: "Optimism",
    symbol: "ETH",
    rpc: "https://mainnet.optimism.io",
    explorer: "https://optimistic.etherscan.io/",
    testnet: false
  },
  {
    id: 420,
    name: "Optimism Goerli",
    symbol: "ETH",
    rpc: "https://goerli.optimism.io",
    explorer: "https://goerli-optimism.etherscan.io/",
    testnet: true
  },
  {
    id: 43114,
    name: "Avalanche C-Chain",
    symbol: "AVAX",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    explorer: "https://snowtrace.io/",
    testnet: false
  },
  {
    id: 43113,
    name: "Avalanche Fuji",
    symbol: "AVAX",
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    explorer: "https://testnet.snowtrace.io/",
    testnet: true
  },
  {
    id: 1043,
    name: "BlockDAG Testnet",
    symbol: "BDAG",
    rpc: "https://rpc.primordial.bdagscan.com",
    explorer: "https://primordial.bdagscan.com/",
    testnet: true
  }
];

// Transaction limits per chain
export const TRANSACTION_LIMITS = {
  1043: { // BlockDAG
    daily: "100000", // 100k XCC per day
    single: "10000", // 10k XCC per transaction
    monthly: "1000000" // 1M XCC per month
  },
  1: { // Ethereum
    daily: "10", // 10 ETH equivalent per day
    single: "5", // 5 ETH per transaction
    monthly: "100" // 100 ETH per month
  },
  137: { // Polygon
    daily: "10000", // 10k MATIC equivalent per day
    single: "5000", // 5k MATIC per transaction
    monthly: "100000" // 100k MATIC per month
  }
  // Add more chains as needed
};
