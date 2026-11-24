import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { db } from './db/index.js';
import authRouter from './routes/auth.js';
import recordsRouter from './routes/records.js';
import zkpRouter from './routes/zkp.js';
import claimsRouter from './routes/claims.js';
import dashboardRouter from './routes/dashboard.js';
import auditRouter from './routes/audit.js';

const app = express();

// Initialize database on boot
db.init().then((connected) => {
  if (connected) {
    console.log('📦 [Server] PostgreSQL database connected and operational.');
  } else {
    console.log('📦 [Server] PostgreSQL not connected. Running in-memory database fallback.');
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (serves both /health and /api/health)
const handleHealthCheck = (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    service: 'ZKP Health Claims Platform Backend',
    port: CONFIG.PORT,
    timestamp: new Date().toISOString(),
    database: db.isConnected ? 'PostgreSQL (Cloud Connected)' : 'In-Memory (Fallback)',
    modules: {
      database: db.isConnected ? 'ONLINE (PostgreSQL)' : 'ONLINE (In-Memory)',
      auth: 'ONLINE',
      records: 'ONLINE',
      zkp: 'ONLINE',
      blockchain: 'ONLINE',
      dashboard: 'ONLINE',
      audit: 'ONLINE'
    }
  });
};

app.get('/', handleHealthCheck);
app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/records', recordsRouter);
app.use('/api/zkp', zkpRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

const server = app.listen(CONFIG.PORT, () => {
  console.log(`
  ==============================================================
   🛡️   ZKP HEALTH CLAIMS PLATFORM - BACKEND SERVICE ONLINE
  ==============================================================
   - Server Port:      http://localhost:${CONFIG.PORT}
   - Health Check:     http://localhost:${CONFIG.PORT}/api/health
   - Module 1 (Auth):  http://localhost:${CONFIG.PORT}/api/auth
   - Module 2 (IPFS):  http://localhost:${CONFIG.PORT}/api/records
   - Module 3 (ZKP):   http://localhost:${CONFIG.PORT}/api/zkp
   - Module 4 (Claim): http://localhost:${CONFIG.PORT}/api/claims
   - Module 5 (Audit): http://localhost:${CONFIG.PORT}/api/audit
  ==============================================================
  `);
});

export default app;
