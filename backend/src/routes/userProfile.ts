import { Router, Request, Response } from 'express';
import { getRealCreditScoreData } from '../utils/creditScore';
import { getRealBalances } from '../utils/balances';
import { getRealUserProfile } from '../utils/onChain';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  try {
    // Fetch real user data from blockchain
    const [creditScoreData, balances, userProfile] = await Promise.all([
      getRealCreditScoreData(address),
      getRealBalances(address),
      getRealUserProfile(address),
    ]);

    res.json({
      address,
      profile: {
        creditScore: creditScoreData.creditScore,
        totalDeposited: userProfile.totalDeposited,
        totalBorrowed: userProfile.totalBorrowed,
        healthFactor: userProfile.healthFactor,
        hasNFT: userProfile.hasNFT,
        lastUpdated: userProfile.lastUpdated,
      },
      balances,
      creditScore: creditScoreData,
      onChainProfile: userProfile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 