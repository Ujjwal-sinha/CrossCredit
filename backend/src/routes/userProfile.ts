import { Router, Request, Response } from 'express';
import { getMockCreditScore } from '../utils/creditScore';
import { getMockBalances } from '../utils/balances';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  try {
    // Fetch user data
    const creditScore = await getMockCreditScore(address);
    const balances = await getMockBalances(address);

    res.json({
      address,
      profile: {
        creditScore: creditScore.creditScore,
        totalDeposited: balances.totalDepositedUSD,
        totalBorrowed: balances.totalBorrowedUSD,
        healthFactor: balances.healthFactor,
        hasNFT: false, // Mock value
        lastUpdated: new Date().toISOString(),
      },
      balances,
      creditScore,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 