import { getRealDSCBalance, getRealNativeBalance, getRealUserDeposits } from './onChain';

export async function getRealBalances(address: string) {
  try {
    // Fetch balances from both chains in parallel
    const [
      sepoliaDSC,
      fujiDSC,
      sepoliaETH,
      fujiAVAX,
      sepoliaDeposits,
      fujiDeposits,
    ] = await Promise.all([
      getRealDSCBalance(address, 'sepolia'),
      getRealDSCBalance(address, 'fuji'),
      getRealNativeBalance(address, 'sepolia'),
      getRealNativeBalance(address, 'fuji'),
      getRealUserDeposits(address, 'sepolia'),
      getRealUserDeposits(address, 'fuji'),
    ]);

    // Calculate USD values (using approximate prices)
    const ETH_PRICE = 2000; // $2000 per ETH
    const AVAX_PRICE = 25;  // $25 per AVAX
    
    const sepoliaETHUSD = (parseFloat(sepoliaETH) * ETH_PRICE).toFixed(2);
    const fujiAVAXUSD = (parseFloat(fujiAVAX) * AVAX_PRICE).toFixed(2);
    const totalDepositedUSD = (parseFloat(sepoliaDeposits.totalDeposits) * ETH_PRICE + 
                              parseFloat(fujiDeposits.totalDeposits) * AVAX_PRICE).toFixed(2);
    const totalBorrowedUSD = (parseFloat(sepoliaDSC) + parseFloat(fujiDSC)).toFixed(2);
    
    // Calculate health factor (simplified)
    const healthFactor = parseFloat(totalDepositedUSD) > 0 
      ? (parseFloat(totalDepositedUSD) * 0.75 / Math.max(parseFloat(totalBorrowedUSD), 1)).toFixed(2)
      : '0.00';

    return {
      address,
      sepolia: {
        dsc: sepoliaDSC,
        eth: sepoliaETH,
        deposits: {
          eth: sepoliaDeposits.totalDeposits,
          totalUSD: sepoliaETHUSD,
        }
      },
      fuji: {
        dsc: fujiDSC,
        avax: fujiAVAX,
        deposits: {
          avax: fujiDeposits.totalDeposits,
          totalUSD: fujiAVAXUSD,
        }
      },
      totals: {
        dsc: (parseFloat(sepoliaDSC) + parseFloat(fujiDSC)).toFixed(4),
        totalDepositedUSD,
        totalBorrowedUSD,
        healthFactor,
        availableToBorrow: Math.max(0, parseFloat(totalDepositedUSD) * 0.75 - parseFloat(totalBorrowedUSD)).toFixed(2),
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching real balances:', error);
    
    // Return zero balances if there's an error
    return {
      address,
      sepolia: {
        dsc: '0.0',
        eth: '0.0',
        deposits: {
          eth: '0.0',
          totalUSD: '0.00',
        }
      },
      fuji: {
        dsc: '0.0',
        avax: '0.0',
        deposits: {
          avax: '0.0',
          totalUSD: '0.00',
        }
      },
      totals: {
        dsc: '0.0',
        totalDepositedUSD: '0.00',
        totalBorrowedUSD: '0.00',
        healthFactor: '0.00',
        availableToBorrow: '0.00',
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Keep the old function name for backwards compatibility
export async function getMockBalances(address: string) {
  return getRealBalances(address);
} 