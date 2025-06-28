// src/utils/weth.ts
import { ethers } from 'ethers';

// Sepolia WETH address (update if needed)
export const WETH_ADDRESS = '0xb16F35c0Ae2912430DAc15764477E179D9B9EbEa';

// Minimal ERC20 ABI for WETH
export const WETH_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address,uint256) public returns (bool)',
  'function allowance(address,address) public view returns (uint256)',
  'function deposit() public payable',
  'function withdraw(uint256) public',
];

// Utility to get a WETH contract instance
export function getWethContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(WETH_ADDRESS, WETH_ABI, signerOrProvider);
}
