import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_secure_refresh_token_secret';
const TOKEN_EXPIRE = '24h';
const REFRESH_TOKEN_EXPIRE = '7d';

const generateTokens = (userData) => {
    const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
    const refreshToken = jwt.sign(userData, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
    return { accessToken, refreshToken };
};

const saveRefreshToken = async (userId, token) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
    );
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const userData = { userId: user.id, email: user.email };
        const { accessToken, refreshToken } = generateTokens(userData);

        await saveRefreshToken(user.id, refreshToken);

        res.status(201).json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userData = { userId: user.id, email: user.email };
        const { accessToken, refreshToken } = generateTokens(userData);

        await saveRefreshToken(user.id, refreshToken);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const tokenResult = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
            [refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        const userData = { userId: decoded.userId, email: decoded.email };
        const tokens = generateTokens(userData);

        await pool.query(
            'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token = $1',
            [refreshToken]
        );

        await saveRefreshToken(decoded.userId, tokens.refreshToken);

        res.json(tokens);
    } catch (error) {
        console.error('Refresh token error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        await pool.query(
            'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token = $1',
            [refreshToken]
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, data: decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};
