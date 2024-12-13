import express from 'express';
import cors from 'cors';
import { pool, initDb } from './config/database.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

const waitForDb = async () => {
    let retries = 5;
    while (retries) {
        try {
            await pool.query('SELECT 1');
            console.log('Database connection established');
            return true;
        } catch (err) {
            console.log('Waiting for database...', retries, 'retries left');
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    return false;
};

const start = async () => {
    try {
        // Wait for database
        const dbReady = await waitForDb();
        if (!dbReady) {
            throw new Error('Unable to connect to database');
        }

        // Initialize database
        await initDb();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();

export default app;
