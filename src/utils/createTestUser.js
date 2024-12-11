import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

const createTestUser = async () => {
    try {
        const password = 'testpassword';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            ['testuser', 'test@example.com', hashedPassword]
        );
        
        console.log('Test user created with id:', result.rows[0].id);
        await pool.end();
    } catch (error) {
        console.error('Error creating test user:', error);
    }
};

createTestUser();
