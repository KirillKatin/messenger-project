// src/config/database.js
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
 user: process.env.DB_USER,
 host: process.env.DB_HOST,
 database: process.env.DB_NAME,
 password: process.env.DB_PASSWORD,
 port: process.env.DB_PORT,
 ssl: false
});

const initDb = async () => {
 const client = await pool.connect();
 try {
   await client.query('BEGIN');

   await client.query(`
     CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       password_hash VARCHAR(100) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE IF NOT EXISTS chats (
       id SERIAL PRIMARY KEY,
       name VARCHAR(100),
       type VARCHAR(20) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE IF NOT EXISTS chat_participants (
       chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (chat_id, user_id)
     );

     CREATE TABLE IF NOT EXISTS messages (
       id SERIAL PRIMARY KEY,
       chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
       sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       content TEXT,
       message_type VARCHAR(20) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE IF NOT EXISTS saved_items (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
       note TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(user_id, message_id)
     );
   `);

   await client.query('COMMIT');
   console.log('Database schema initialized successfully');
 } catch (error) {
   await client.query('ROLLBACK');
   throw error;
 } finally {
   client.release();
 }
};

export { pool, initDb };
