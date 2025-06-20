// Utility functions for on-chain data fetching
// Currently mock implementations, but structured for real on-chain integration

import { ethers } from 'ethers';
import { createContract } from './contracts';
import { DSC_ABI, MAIN_ROUTER_ABI, DEPOSITOR_ABI } from './contracts';

// Chain configuration
export interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  contracts: {
    depositor?: string;
    mainRouter?: string;
    minter?: string;
    dsc?: string;
  };
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    name: 'Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || '',
    chainId: 11155111,
    contracts: {
      depositor: process.env.SEPOLIA_DEPOSITOR_ADDRESS || '',
      dsc: process.env.SEPOLIA_DSC_ADDRESS || '',
    },
  },
  fuji: {
    name: 'Avalanche Fuji',
    rpcUrl: process.env.FUJI_RPC_URL || '',
    chainId: 43113,
    contracts: {
      mainRouter: process.env.FUJI_MAINROUTER_ADDRESS || '',
      minter: process.env.FUJI_MINTER_ADDRESS || '',
      dsc: process.env.FUJI_DSC_ADDRESS || '',
    },
  },
};

// Provider cache
const providers: Record<string, ethers.Provider> = {};

function getProvider(chain: 'sepolia' | 'fuji'): ethers.Provider {
  if (!providers[chain]) {
    const config = CHAIN_CONFIGS[chain];
    if (!config.rpcUrl) {
      throw new Error(`RPC URL not configured for ${chain}`);
    }
    providers[chain] = new ethers.JsonRpcProvider(config.rpcUrl);
  }
  return providers[chain];
}

// Fetch real DSC balance from blockchain
export async function getRealDSCBalance(address: string, chain: 'sepolia' | 'fuji'): Promise<string> {
  try {
    const provider = getProvider(chain);
    const dscAddress = CHAIN_CONFIGS[chain].contracts.dsc;
    
    if (!dscAddress) {
      throw new Error(`DSC contract address not configured for ${chain}`);
    }

    const dscContract = createContract(dscAddress, DSC_ABI, provider);
    const balance = await dscContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Error fetching DSC balance on ${chain}:`, error);
    return '0.0';
  }
}

// Fetch real native token balance
export async function getRealNativeBalance(address: string, chain: 'sepolia' | 'fuji'): Promise<string> {
  try {
    const provider = getProvider(chain);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Error fetching native balance on ${chain}:`, error);
    return '0.0';
  }
}

// Fetch user profile from MainRouter contract
export async function getRealUserProfile(address: string): Promise<{
  totalDeposited: string;
  totalBorrowed: string;
  creditScore: number;
  healthFactor: string;
  hasNFT: boolean;
  lastUpdated: string;
  currentBorrows: string;
}> {
  try {
    const provider = getProvider('fuji');
    const mainRouterAddress = CHAIN_CONFIGS.fuji.contracts.mainRouter;
    
    if (!mainRouterAddress) {
      throw new Error('MainRouter contract address not configured');
    }

    const mainRouterContract = createContract(mainRouterAddress, MAIN_ROUTER_ABI, provider);
    
    // Fetch user profile data
    const [userProfile, userBorrows, creditScore] = await Promise.all([
      mainRouterContract.userProfiles(address),
      mainRouterContract.userBorrows(address),
      mainRouterContract.getUserCreditScore(address).catch(() => 0n), // Default to 0 if not set
    ]);

    return {
      totalDeposited: ethers.formatEther(userProfile.totalDeposited),
      totalBorrowed: ethers.formatEther(userProfile.totalBorrowed),
      creditScore: Number(creditScore),
      healthFactor: ethers.formatEther(userProfile.healthFactor),
      hasNFT: userProfile.hasNFT,
      lastUpdated: new Date(Number(userProfile.lastUpdated) * 1000).toISOString(),
      currentBorrows: ethers.formatEther(userBorrows),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return default profile if contract call fails
    return {
      totalDeposited: '0.0',
      totalBorrowed: '0.0',
      creditScore: 0,
      healthFactor: '0.0',
      hasNFT: false,
      lastUpdated: new Date().toISOString(),
      currentBorrows: '0.0',
    };
  }
}

// Fetch user deposits from Depositor contract
export async function getRealUserDeposits(address: string, chain: 'sepolia' | 'fuji'): Promise<{
  totalDeposits: string;
  deposits: Record<string, string>;
}> {
  try {
    const provider = getProvider(chain);
    const depositorAddress = CHAIN_CONFIGS[chain].contracts.depositor;
    
    if (!depositorAddress) {
      return { totalDeposits: '0.0', deposits: {} };
    }

    const depositorContract = createContract(depositorAddress, DEPOSITOR_ABI, provider);
    
    // For ETH deposits (address(0))
    const ethDeposits = await depositorContract.userDeposits(address, ethers.ZeroAddress);
    
    return {
      totalDeposits: ethers.formatEther(ethDeposits),
      deposits: {
        ETH: ethers.formatEther(ethDeposits),
      },
    };
  } catch (error) {
    console.error(`Error fetching user deposits on ${chain}:`, error);
    return { totalDeposits: '0.0', deposits: {} };
  }
}

interface TransactionEvent {
  hash: string;
  type: string;
  amount: string;
  token: string;
  chain: string;
  timestamp: number;
  status: string;
  blockNumber: number;
  from?: string;
  to?: string;
  messageId?: string;
}

// Fetch transaction history from blockchain events
export async function getRealTransactionHistory(address: string): Promise<TransactionEvent[]> {
  try {
    const transactions: TransactionEvent[] = [];
    
    // Fetch from both chains
    for (const [chainName, config] of Object.entries(CHAIN_CONFIGS)) {
      if (!config.rpcUrl) continue;
      
      const provider = getProvider(chainName as 'sepolia' | 'fuji');
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
      
      // Fetch DSC transfers
      if (config.contracts.dsc) {
        const dscContract = createContract(config.contracts.dsc, DSC_ABI, provider);
        
        // Get Transfer events where user is sender or receiver
        const [sentEvents, receivedEvents] = await Promise.all([
          dscContract.queryFilter(
            dscContract.filters.Transfer(address, null),
            fromBlock,
            currentBlock
          ),
          dscContract.queryFilter(
            dscContract.filters.Transfer(null, address),
            fromBlock,
            currentBlock
          ),
        ]);

        // Process sent transactions
        for (const event of sentEvents) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            transactions.push({
              hash: event.transactionHash,
              type: 'transfer_out',
              amount: ethers.formatEther(event.args.value),
              token: 'DSC',
              chain: config.name,
              timestamp: block ? block.timestamp * 1000 : Date.now(),
              status: 'completed',
              blockNumber: event.blockNumber,
              from: event.args.from,
              to: event.args.to,
            });
          }
        }

        // Process received transactions
        for (const event of receivedEvents) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            transactions.push({
              hash: event.transactionHash,
              type: 'transfer_in',
              amount: ethers.formatEther(event.args.value),
              token: 'DSC',
              chain: config.name,
              timestamp: block ? block.timestamp * 1000 : Date.now(),
              status: 'completed',
              blockNumber: event.blockNumber,
              from: event.args.from,
              to: event.args.to,
            });
          }
        }
      }

      // Fetch Deposit events from Depositor contract
      if (config.contracts.depositor) {
        const depositorContract = createContract(config.contracts.depositor, DEPOSITOR_ABI, provider);
        
        const depositEvents = await depositorContract.queryFilter(
          depositorContract.filters.TokenDeposited(address),
          fromBlock,
          currentBlock
        );

        for (const event of depositEvents) {
          if ('args' in event && event.args) {
            const block = await provider.getBlock(event.blockNumber);
            transactions.push({
              hash: event.transactionHash,
              type: 'deposit',
              amount: ethers.formatEther(event.args.amount),
              token: event.args.token === ethers.ZeroAddress ? 'ETH' : 'TOKEN',
              chain: config.name,
              timestamp: block ? block.timestamp * 1000 : Date.now(),
              status: 'completed',
              blockNumber: event.blockNumber,
              messageId: event.args.messageId,
            });
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

// Fetch real credit score from MainRouter
export async function getRealCreditScore(address: string): Promise<number> {
  try {
    const provider = getProvider('fuji');
    const mainRouterAddress = CHAIN_CONFIGS.fuji.contracts.mainRouter;
    
    if (!mainRouterAddress) {
      throw new Error('MainRouter contract address not configured');
    }

    const mainRouterContract = createContract(mainRouterAddress, MAIN_ROUTER_ABI, provider);
    const creditScore = await mainRouterContract.getUserCreditScore(address);
    
    return Number(creditScore);
  } catch (error) {
    console.error('Error fetching credit score:', error);
    return 0;
  }
}

// Health check for blockchain connections
export async function checkBlockchainHealth(): Promise<{ [key: string]: boolean }> {
  const health: { [key: string]: boolean } = {};
  
  for (const [chainName, config] of Object.entries(CHAIN_CONFIGS)) {
    try {
      if (!config.rpcUrl) {
        health[chainName] = false;
        continue;
      }
      
      const provider = getProvider(chainName as 'sepolia' | 'fuji');
      await provider.getBlockNumber();
      health[chainName] = true;
    } catch (error) {
      console.error(`Health check failed for ${chainName}:`, error);
      health[chainName] = false;
    }
  }
  
  return health;
} 