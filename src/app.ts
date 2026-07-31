import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors({
  origin: "*",
  exposedHeaders: [
    'Authorization',
    'x-access-token',
    'x-refresh-token'
  ]
}));

app.use(express.json());

// 🟢 Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

export default app;


