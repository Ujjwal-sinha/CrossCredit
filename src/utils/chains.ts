export const CHAIN_INFO = {
  '0x1': {
    name: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    currency: 'ETH'
  },
  '0x89': {
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC'
  },
  '0x13881': {
    name: 'Mumbai',
    explorer: 'https://mumbai.polygonscan.com',
    currency: 'MATIC'
  },
  // testnets sepolia
  '0x1115': {
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
    currency: 'ETH'
  },
  // tesnets Arbitrum
  '0xa4b1': {
    name: 'Arbitrum',
    explorer: 'https://arbiscan.io',
    currency: 'ETH'
  },
  // tesnets Avalanche
  '0x82aF': {
    name: 'Avalanche',
    explorer: 'https://snowtrace.io',
    currency: 'AVAX'
  },
  // tesnets Optimism
  '0x4e454147': {
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io',
    currency: 'ETH'
  }
} as const;

export const getChainInfo = (chainId: string) => {
  return CHAIN_INFO[chainId as keyof typeof CHAIN_INFO] || {
    name: 'Unknown Network',
    explorer: '',
    currency: 'ETH'
  };
};

export const getExplorerUrl = (chainId: string, address: string) => {
  const chainInfo = getChainInfo(chainId);
  return chainInfo.explorer ? `${chainInfo.explorer}/address/${address}` : '#';
};

export const SUPPORTED_CHAINS = [
  {
    id: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    rpc: 'https://ethereum-sepolia.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    testnet: true
  },
  {
    id: 43113,
    name: 'Avalanche Fuji',
    symbol: 'AVAX', 
    rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorer: 'https://testnet.snowtrace.io',
    testnet: true
  },
  {
    id: 80001,
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpc: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    testnet: true
  },
  {
    id: 421613,
    name: 'Arbitrum Goerli',
    symbol: 'ETH',
    rpc: 'https://goerli-rollup.arbitrum.io/rpc',
    explorer: 'https://goerli.arbiscan.io',
    testnet: true
  },
  {
    id: 420,
    name: 'Optimism Goerli',
    symbol: 'ETH',
    rpc: 'https://goerli.optimism.io',
    explorer: 'https://goerli-optimism.etherscan.io',
    testnet: true
  },
  {
    id: 1043,
    name: 'BlockDAG Testnet',
    symbol: 'BDAG',
    rpc: 'https://rpc.primordial.bdagscan.com',
    explorer: 'https://primordial.bdagscan.com',
    testnet: true
  }
];