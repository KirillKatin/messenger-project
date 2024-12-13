import { pool } from '../config/database.js';

export const createChat = async (req, res) => {
    try {
        const { name, participantIds } = req.body;
        const userId = req.user.userId;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const chatResult = await client.query(
                'INSERT INTO chats (name) VALUES ($1) RETURNING id',
                [name]
            );
            const chatId = chatResult.rows[0].id;
            
            // Добавляем создателя чата
            await client.query(
                'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)',
                [chatId, userId]
            );

            // Добавляем других участников
            if (participantIds && participantIds.length > 0) {
                for (const participantId of participantIds) {
                    await client.query(
                        'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)',
                        [chatId, participantId]
                    );
                }
            }

            await client.query('COMMIT');
            res.status(201).json({ chatId });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await pool.query(
            `SELECT c.id, c.name, c.created_at,
                    (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id) as message_count,
                    (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id) as participant_count
             FROM chats c
             JOIN chat_participants cp ON c.id = cp.chat_id
             WHERE cp.user_id = $1
             ORDER BY c.created_at DESC`,
            [userId]
        );
        res.json(chats.rows);
    } catch (error) {
        console.error('Get user chats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getChatParticipants = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        // Проверяем, является ли пользователь участником чата
        const participantCheck = await pool.query(
            'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
            [chatId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a chat participant' });
        }

        const participants = await pool.query(
            `SELECT u.id, u.username, cp.created_at as joined_at
             FROM chat_participants cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.chat_id = $1
             ORDER BY cp.created_at`,
            [chatId]
        );

        res.json(participants.rows);
    } catch (error) {
        console.error('Get chat participants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addChatParticipant = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId: newParticipantId } = req.body;
        const currentUserId = req.user.userId;

        // Проверяем, является ли текущий пользователь участником чата
        const participantCheck = await pool.query(
            'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
            [chatId, currentUserId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to add participants' });
        }

        // Проверяем, не является ли пользователь уже участником
        const existingCheck = await pool.query(
            'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
            [chatId, newParticipantId]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User is already a participant' });
        }

        // Добавляем нового участника
        await pool.query(
            'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)',
            [chatId, newParticipantId]
        );

        res.status(201).json({ message: 'Participant added successfully' });
    } catch (error) {
        console.error('Add chat participant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const userId = req.user.userId;

        const participantCheck = await pool.query(
            'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
            [chatId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a chat participant' });
        }

        const result = await pool.query(
            'INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
            [chatId, userId, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        const participantCheck = await pool.query(
            'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
            [chatId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a chat participant' });
        }

        const messages = await pool.query(
            `SELECT m.id, m.content, m.created_at, 
                    u.username as sender_name
             FROM messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.chat_id = $1 
             ORDER BY m.created_at DESC 
             LIMIT 50`,
            [chatId]
        );

        res.json(messages.rows);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
