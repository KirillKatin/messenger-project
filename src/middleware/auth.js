import { verifyToken } from '../controllers/authController.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const verification = await verifyToken(token);
        if (!verification.valid) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = verification.data;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
