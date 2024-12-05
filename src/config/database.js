// src/config/database.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import * as dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создаем пул подключений к базе данных
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Инициализация базы данных
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Создаем основные таблицы
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
        chat_id INTEGER REFERENCES chats(id),
        user_id INTEGER REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (chat_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id),
        sender_id INTEGER REFERENCES users(id),
        content TEXT,
        message_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создаем таблицы для расширенного функционала
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS
        language_settings JSONB DEFAULT '{"translate_incoming": false, "translate_outgoing": false, "target_language": "en"}';

      ALTER TABLE messages ADD COLUMN IF NOT EXISTS
        translations JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS
        voice_transcript TEXT,
      ADD COLUMN IF NOT EXISTS
        voice_duration INTEGER,
      ADD COLUMN IF NOT EXISTS
        voice_waveform JSONB;
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Тестирование подключения к базе данных
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

export { pool, initDb, testConnection };
