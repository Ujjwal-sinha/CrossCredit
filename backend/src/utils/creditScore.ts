import { getRealCreditScore, getRealUserProfile, getRealTransactionHistory } from './onChain';

export async function getRealCreditScoreData(address: string) {
  try {
    // First try to get credit score from MainRouter contract
    const contractCreditScore = await getRealCreditScore(address);
    
    if (contractCreditScore > 0) {
      // If contract has a credit score, use it
      const userProfile = await getRealUserProfile(address);
      
      return {
        address,
        creditScore: contractCreditScore,
        lastUpdated: userProfile.lastUpdated,
        factors: {
          onChainActivity: Math.min(100, contractCreditScore / 10), // Scale down for factor
          defiParticipation: Math.min(100, parseFloat(userProfile.totalDeposited) * 10),
          transactionHistory: Math.min(100, parseFloat(userProfile.totalBorrowed) * 5),
          socialScore: Math.min(100, contractCreditScore / 15),
        },
        source: 'contract',
      };
    }

    // If no contract credit score, calculate based on on-chain activity
    const calculatedScore = await calculateCreditScoreFromActivity(address);
    return calculatedScore;
    
  } catch (error) {
    console.error('Error fetching real credit score:', error);
    
    // Fallback to calculated score
    const calculatedScore = await calculateCreditScoreFromActivity(address);
    return calculatedScore;
  }
}

async function calculateCreditScoreFromActivity(address: string) {
  try {
    const [userProfile, txHistory] = await Promise.all([
      getRealUserProfile(address),
      getRealTransactionHistory(address),
    ]);

    // Calculate credit score based on on-chain activity
    let score = 300; // Base score
    
    // Factor 1: Total deposits (up to 200 points)
    const totalDeposited = parseFloat(userProfile.totalDeposited);
    const depositScore = Math.min(200, totalDeposited * 10); // 10 points per $1 deposited, max 200
    
    // Factor 2: Health factor (up to 150 points)
    const healthFactor = parseFloat(userProfile.healthFactor);
    const healthScore = healthFactor > 1.5 ? 150 : Math.max(0, healthFactor * 100);
    
    // Factor 3: Transaction history (up to 150 points)
    const txCount = txHistory.length;
    const txScore = Math.min(150, txCount * 5); // 5 points per transaction, max 150
    
    // Factor 4: Borrowing behavior (up to 100 points)
    const totalBorrowed = parseFloat(userProfile.totalBorrowed);
    const borrowScore = totalBorrowed > 0 && healthFactor > 1.2 ? 100 : 50;
    
    // Factor 5: Account age based on transaction history (up to 100 points)
    const oldestTx = txHistory.length > 0 ? Math.min(...txHistory.map(tx => tx.timestamp)) : Date.now();
    const accountAge = (Date.now() - oldestTx) / (1000 * 60 * 60 * 24); // Days
    const ageScore = Math.min(100, accountAge * 2); // 2 points per day, max 100
    
    score += depositScore + healthScore + txScore + borrowScore + ageScore;
    
    // Cap at 1000
    score = Math.min(1000, Math.floor(score));
    
    return {
      address,
      creditScore: score,
      lastUpdated: new Date().toISOString(),
      factors: {
        onChainActivity: Math.floor(ageScore + txScore / 3),
        defiParticipation: Math.floor(depositScore / 2),
        transactionHistory: Math.floor(txScore),
        socialScore: Math.floor(borrowScore / 2),
      },
      source: 'calculated',
      breakdown: {
        baseScore: 300,
        depositScore: Math.floor(depositScore),
        healthScore: Math.floor(healthScore),
        txScore: Math.floor(txScore),
        borrowScore: Math.floor(borrowScore),
        ageScore: Math.floor(ageScore),
      },
    };
    
  } catch (error) {
    console.error('Error calculating credit score from activity:', error);
    
    // Final fallback to deterministic mock
    return getMockCreditScore(address);
  }
}

// Keep the mock function as final fallback
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
    },
    source: 'mock',
  };
} 