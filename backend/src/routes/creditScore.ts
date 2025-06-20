import { Router, Request, Response } from 'express';
import { getRealCreditScoreData } from '../utils/creditScore';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  try {
    // Fetch real credit score data from blockchain
    const creditScoreData = await getRealCreditScoreData(address);
    res.json(creditScoreData);
  } catch (error) {
    console.error('Error fetching credit score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 