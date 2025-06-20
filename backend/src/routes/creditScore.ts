import { Router, Request, Response } from 'express';
import { getMockCreditScore } from '../utils/creditScore';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const address = (req.query.address as string)?.toLowerCase();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid or missing address' });
  }

  // In production, replace with real logic
  const score = await getMockCreditScore(address);
  res.json(score);
});

export default router; 