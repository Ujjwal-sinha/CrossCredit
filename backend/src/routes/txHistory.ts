import { Router, Request, Response } from 'express';
import { getRealTransactionHistoryData } from '../utils/transactions';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  try {
    // Fetch real transaction history from blockchain
    const transactionHistory = await getRealTransactionHistoryData(address);
    res.json(transactionHistory);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 