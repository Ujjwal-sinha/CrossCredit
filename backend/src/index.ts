import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import creditScoreRouter from './routes/creditScore';
import userProfileRouter from './routes/userProfile';
import balancesRouter from './routes/balances';
import txHistoryRouter from './routes/txHistory';
import adminRouter from './routes/admin';
import { rateLimiter, requireApiKey, requestLogger } from './middleware/auth';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/credit-score', creditScoreRouter);
app.use('/api/user-profile', userProfileRouter);
app.use('/api/balances', balancesRouter);
app.use('/api/tx-history', txHistoryRouter);
app.use('/api/admin', requireApiKey, adminRouter); // Admin routes require API key

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/credit-score?address=0x...',
      'GET /api/user-profile?address=0x...',
      'GET /api/balances?address=0x...',
      'GET /api/tx-history?address=0x...',
      'GET /api/admin/stats',
      'POST /api/admin/credit-score',
    ],
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 CrossCredit Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/*`);
}); 