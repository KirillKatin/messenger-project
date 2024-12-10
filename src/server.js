import express from 'express';
import authRoutes from './routes/auth.js';
import { initDb } from './config/database.js';

const app = express();

// Middleware
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Запуск сервера
const startServer = async () => {
    try {
        await initDb();
        console.log('Database initialized');
        
        app.listen(3000, '0.0.0.0', () => {
            console.log('Server running on port 3000');
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
};

startServer();
