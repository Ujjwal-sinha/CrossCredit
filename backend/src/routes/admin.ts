import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/admin/credit-score - Update credit score for a user
router.post('/credit-score', async (req: Request, res: Response) => {
  const { address, creditScore } = req.body;
  
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }
  
  if (typeof creditScore !== 'number' || creditScore < 0 || creditScore > 1000) {
    return res.status(400).json({ message: 'Credit score must be a number between 0 and 1000' });
  }

  try {
    // In production, this would update a database
    // For now, just return success
    res.json({
      message: 'Credit score updated successfully',
      address: address.toLowerCase(),
      creditScore,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating credit score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get platform statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Mock platform statistics
    res.json({
      totalUsers: 1250,
      totalDeposits: '2,500,000',
      totalBorrows: '1,800,000',
      averageCreditScore: 680,
      totalTransactions: 15420,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 