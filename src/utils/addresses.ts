// src/utils/addresses.ts
// Maps supported networks to contract addresses for frontend use

export const CONTRACT_ADDRESSES = {
  fuji: {
    DeFiPassportNFT: '0xFfE1F8Cc3f2bc94570d6EfF200d6CFE9B48Db1AF',
    DSC: '0xa0B9eb9C427533bF330b0AA1F91C7d2Da2C3217a',
    MainRouter: '0xc702D371C39c457cFE8230d035fB3611044Fe01d',
    Minter: '0xBe6986796738D5E901AF145649Df92A9Bba3e2E9',
    Depositor: '0x5170Ef6BfEF4708D8c505a97500b4de4927E1159',
  },
  sepolia: {
    DeFiPassportNFT: '0xf0b3c9c44a3bfB3a2381F1A59E07472dD13Aea38',
    DSC: '0x0c03Caa2227E2d3CCA1a82f4544b79A5527065a1',
    Minter: '0x20E03ae3438f9902d88226E4742a8b5774BE2925',
    Depositor: '0x7842D25216Ec9D0606829F2b0b995b5505e7aFDA',
    MainRouter: '0xc702D371C39c457cFE8230d035fB3611044Fe01d',
  },
  amoy: {
    DeFiPassportNFT: '0xedC7e7A636965B3ac1994b1AE34666a13A3790da',
    DSC: '0x096abaD4386C021E956b1515b7e12F9Fc7826737',
    Minter: '0x94d703B9f93a443D978DC3fA5018A54B95912e2B',
    Depositor: '0x328a3Abc8D777586600862E22Fd1D1bd67cC6a85',
    MainRouter: '0xc702D371C39c457cFE8230d035fB3611044Fe01d',
  },
  blockdag: {
    CrossCreditToken: '0x647E82200f9a2f4F99993BE65Aadfe76892263E3',
    BlockDAGRouter: '0xD74ad2283dc59a30B1e89172CB9cff0B4d0BD3b8',
  },
};

// Map chainId to network key
export const CHAIN_ID_TO_NETWORK = {
  '0xa869': 'fuji', // Avalanche Fuji
  '0xaa36a7': 'sepolia', // Sepolia
  '0x13882': 'amoy', // Polygon Amoy
  '0x413': 'blockdag', // BlockDAG Testnet (1043)
};

export function getContractAddress(network: keyof typeof CONTRACT_ADDRESSES, contract: string) {
  const networkContracts = CONTRACT_ADDRESSES[network];
  return (networkContracts as any)?.[contract] || '';
}

export function getNetworkByChainId(chainId: keyof typeof CHAIN_ID_TO_NETWORK) {
  return CHAIN_ID_TO_NETWORK[chainId] || null;
}
