import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import fieldsRoutes from './routes/fields.routes.js';
import farmersRoutes from './routes/farmers.routes.js';
import panchayatsRoutes from './routes/panchayats.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import collectionsRoutes from './routes/collections.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import satelliteRoutes from './routes/satellite.routes.js';
import biometricsRoutes from './routes/biometrics.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
  next();
});

// Root API Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'AGROMAYA REST API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldsRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/panchayats', panchayatsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/biometrics', biometricsRoutes);
app.use('/api/suppliers', suppliersRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🌿 AGROMAYA Backend API running on http://localhost:${PORT}`);
  console.log(`🚀 Prisma SQLite Database connected and verified`);
});
