import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userSectionRoutes from './routes/userSection.routes';
import categoryHabitRoutes from './routes/categoryHabit.routes';

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
app.use('/api/sections', userSectionRoutes);
app.use('/api/habitCategories', categoryHabitRoutes);

export default app;


