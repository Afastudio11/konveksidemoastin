import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './routes/auth';
import { ordersRoutes } from './routes/orders';
import { customersRoutes } from './routes/customers';
import { trackingRoutes } from './routes/tracking';
import { paymentsRoutes } from './routes/payments';
import { dashboardRoutes } from './routes/dashboard';
import { testimonialsRoutes } from './routes/testimonials';
import { expensesRoutes } from './routes/expenses';
import { auditLogsRoutes } from './routes/auditLogs';
import invoiceRoutes from './routes/invoice';
import { authMiddleware } from './middleware/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? parseInt(process.env.PORT || '5000', 10) : 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoice', invoiceRoutes);

app.use('/api/orders', authMiddleware, ordersRoutes);
app.use('/api/customers', authMiddleware, customersRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/audit-logs', authMiddleware, auditLogsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (isProduction) {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sekala Industry Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
