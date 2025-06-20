interface Transaction {
  hash: string;
  type: 'deposit' | 'borrow' | 'repay' | 'swap' | 'withdraw';
  amount: string;
  token: string;
  chain: 'Sepolia' | 'Fuji';
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

export async function getMockTransactionHistory(address: string) {
  // Generate deterministic transaction history based on address
  const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const transactions: Transaction[] = [];
  const now = Date.now();
  
  // Generate 5-15 transactions
  const txCount = (addressHash % 10) + 5;
  
  for (let i = 0; i < txCount; i++) {
    const txHash = addressHash + i;
    const types: Transaction['type'][] = ['deposit', 'borrow', 'repay', 'swap', 'withdraw'];
    const chains: Transaction['chain'][] = ['Sepolia', 'Fuji'];
    const tokens = ['ETH', 'AVAX', 'DSC'];
    const statuses: Transaction['status'][] = ['completed', 'completed', 'completed', 'pending', 'failed'];
    
    transactions.push({
      hash: `0x${(txHash * (i + 1)).toString(16).padStart(64, '0')}`,
      type: types[txHash % types.length],
      amount: ((txHash % 1000) / 10 + 0.1).toFixed(4),
      token: tokens[txHash % tokens.length],
      chain: chains[txHash % chains.length],
      timestamp: now - (i * 3600000) - (txHash % 86400000), // Random times in last few days
      status: statuses[txHash % statuses.length],
      gasUsed: ((txHash % 100000) + 21000).toString(),
      gasPrice: ((txHash % 50) + 10).toString(),
    });
  }
  
  // Sort by timestamp (newest first)
  transactions.sort((a, b) => b.timestamp - a.timestamp);
  
  return {
    address,
    transactions,
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
    pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
    failedTransactions: transactions.filter(tx => tx.status === 'failed').length,
    lastUpdated: new Date().toISOString(),
  };
} 