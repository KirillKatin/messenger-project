import express from 'express';
import authRoutes from './routes/auth.js';
import { initDb } from './config/database.js';

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint' });
});

const startServer = async () => {
  try {
    await initDb();
    app.listen(3000, '0.0.0.0', () => {
      console.log('Server running on 3000');
    });
  } catch (err) {
    console.error(err);
  }
};

startServer();
