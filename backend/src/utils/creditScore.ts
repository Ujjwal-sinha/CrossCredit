export async function getMockCreditScore(address: string) {
  // Deterministic mock for demo/dev
  const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = (addressHash % 400) + 300;
  const bonus = Math.floor(Math.random() * 200);
  const creditScore = Math.min(1000, baseScore + bonus);

  return {
    address,
    creditScore,
    lastUpdated: new Date().toISOString(),
    factors: {
      onChainActivity: Math.floor(Math.random() * 100),
      defiParticipation: Math.floor(Math.random() * 100),
      transactionHistory: Math.floor(Math.random() * 100),
      socialScore: Math.floor(Math.random() * 100),
    }
  };
} 