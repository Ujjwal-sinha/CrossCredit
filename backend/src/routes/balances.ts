import { Router, Request, Response } from 'express';
import { getMockBalances } from '../utils/balances';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  try {
    const balances = await getMockBalances(address);
    res.json(balances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 