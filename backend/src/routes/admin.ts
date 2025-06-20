import { Router, Request, Response } from 'express';
import { checkBlockchainHealth, CHAIN_CONFIGS } from '../utils/onChain';
import { getRealCreditScoreData } from '../utils/creditScore';

const router = Router();

// Admin middleware to check API key
const adminAuth = (req: Request, res: Response, next: () => void) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Get platform statistics
router.get('/stats', adminAuth, async (req: Request, res: Response) => {
  try {
    // Check blockchain health
    const blockchainHealth = await checkBlockchainHealth();
    
    // Get basic platform stats
    const stats = {
      blockchain: blockchainHealth,
      contracts: {
        sepolia: {
          depositor: CHAIN_CONFIGS.sepolia.contracts.depositor || 'Not configured',
          dsc: CHAIN_CONFIGS.sepolia.contracts.dsc || 'Not configured',
        },
        fuji: {
          mainRouter: CHAIN_CONFIGS.fuji.contracts.mainRouter || 'Not configured',
          minter: CHAIN_CONFIGS.fuji.contracts.minter || 'Not configured',
          dsc: CHAIN_CONFIGS.fuji.contracts.dsc || 'Not configured',
        },
      },
      rpcStatus: {
        sepolia: !!CHAIN_CONFIGS.sepolia.rpcUrl,
        fuji: !!CHAIN_CONFIGS.fuji.rpcUrl,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update credit score (for admin use)
router.post('/credit-score', adminAuth, async (req: Request, res: Response) => {
  const { address, score } = req.body;
  
  if (!address || !score || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid address or score' });
  }

  if (score < 0 || score > 1000) {
    return res.status(400).json({ message: 'Score must be between 0 and 1000' });
  }

  try {
    // In a real implementation, this would call the MainRouter contract
    // to update the credit score on-chain
    console.log(`Admin updating credit score for ${address} to ${score}`);
    
    // For now, just return the current score data
    const creditScoreData = await getRealCreditScoreData(address);
    
    res.json({
      message: 'Credit score update requested',
      address: address.toLowerCase(),
      requestedScore: score,
      currentScore: creditScoreData.creditScore,
      note: 'This is a mock response. In production, this would update the MainRouter contract.',
    });
  } catch (error) {
    console.error('Error updating credit score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 