import express from 'express';
import { login, refresh, logout, register } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Регистрация
router.post('/register', register);

// Аутентификация
router.post('/login', login);

// Обновление токена
router.post('/refresh', refresh);

// Выход из системы
router.post('/logout', authenticateToken, logout);

// Тестовый защищенный маршрут
router.get('/profile', authenticateToken, (req, res) => {
    res.json({
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

export default router;
