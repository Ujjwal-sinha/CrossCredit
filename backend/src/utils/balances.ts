export async function getMockBalances(address: string) {
  // Generate deterministic but varied balances based on address
  const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const sepoliaDSC = ((addressHash % 1000) / 10).toFixed(2);
  const fujiDSC = ((addressHash % 800) / 8).toFixed(2);
  const sepoliaETH = ((addressHash % 50) / 10).toFixed(4);
  const fujiAVAX = ((addressHash % 100) / 20).toFixed(4);
  
  const totalDepositedUSD = (parseFloat(sepoliaETH) * 2000 + parseFloat(fujiAVAX) * 25).toFixed(2);
  const totalBorrowedUSD = (parseFloat(sepoliaDSC) + parseFloat(fujiDSC)).toFixed(2);
  const healthFactor = (parseFloat(totalDepositedUSD) / Math.max(parseFloat(totalBorrowedUSD), 1) * 0.75).toFixed(2);

  return {
    address,
    sepolia: {
      dsc: sepoliaDSC,
      eth: sepoliaETH,
      deposits: {
        eth: sepoliaETH,
        totalUSD: (parseFloat(sepoliaETH) * 2000).toFixed(2),
      }
    },
    fuji: {
      dsc: fujiDSC,
      avax: fujiAVAX,
      deposits: {
        avax: fujiAVAX,
        totalUSD: (parseFloat(fujiAVAX) * 25).toFixed(2),
      }
    },
    totals: {
      dsc: (parseFloat(sepoliaDSC) + parseFloat(fujiDSC)).toFixed(2),
      totalDepositedUSD,
      totalBorrowedUSD,
      healthFactor,
      availableToBorrow: Math.max(0, parseFloat(totalDepositedUSD) * 0.75 - parseFloat(totalBorrowedUSD)).toFixed(2),
    },
    lastUpdated: new Date().toISOString(),
  };
} 