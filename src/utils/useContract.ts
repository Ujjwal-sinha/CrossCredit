import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { getNetworkByChainId, getContractAddress } from './addresses';
import { DSC_ABI, DEPOSITOR_ABI, MAIN_ROUTER_ABI, MINTER_ABI } from '../../backend/src/utils/contracts';
import { DeFiPassportNFT_ABI } from '../abi/DeFiPassportNFT';

const ABI_MAP = {
  DSC: DSC_ABI,
  Depositor: DEPOSITOR_ABI,
  MainRouter: MAIN_ROUTER_ABI,
  Minter: MINTER_ABI,
  DeFiPassportNFT: DeFiPassportNFT_ABI,
} as const;

type ContractName = keyof typeof ABI_MAP;

type Network = 'fuji' | 'sepolia' | 'amoy';

export function useContract(contractName: ContractName) {
  const { chainId } = useWallet();
  let network: Network | null = null;
  try {
    network = getNetworkByChainId(chainId as any) as Network | null;
  } catch {
    network = null;
  }
  const address = network ? getContractAddress(network, contractName as any) : '';

  return useMemo(() => {
    if (!address || !window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    // ethers v6: getSigner() is async, so we must return a promise or handle async in the component
    // For now, return contract with provider (read-only), or handle signer in the component for write
    return new ethers.Contract(address, ABI_MAP[contractName], provider);
  }, [address, contractName]);
}
