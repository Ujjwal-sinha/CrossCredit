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
