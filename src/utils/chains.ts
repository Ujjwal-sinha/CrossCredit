export const CHAIN_INFO = {
  '0x1': {
    name: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    currency: 'ETH'
  },
  '0x3': {
    name: 'Ropsten',
    explorer: 'https://ropsten.etherscan.io',
    currency: 'ETH'
  },
  '0x4': {
    name: 'Rinkeby',
    explorer: 'https://rinkeby.etherscan.io',
    currency: 'ETH'
  },
  '0x5': {
    name: 'Goerli',
    explorer: 'https://goerli.etherscan.io',
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
