import express from 'express';
import { 
    createChat, 
    sendMessage, 
    getChatMessages,
    getUserChats,
    getChatParticipants,
    addChatParticipant
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Чаты
router.post('/create', authenticateToken, createChat);
router.get('/list', authenticateToken, getUserChats);

// Участники
router.get('/:chatId/participants', authenticateToken, getChatParticipants);
router.post('/:chatId/participants', authenticateToken, addChatParticipant);

// Сообщения
router.post('/message', authenticateToken, sendMessage);
router.get('/:chatId/messages', authenticateToken, getChatMessages);

export default router;
