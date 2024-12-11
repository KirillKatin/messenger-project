import express from 'express';
import { login } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);

// Тестовый защищенный маршрут
router.get('/profile', authenticateToken, (req, res) => {
    res.json({
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

export default router;
