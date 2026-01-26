import express from 'express';
import { 
  createOrGetChat, 
  sendMessage, 
  getChatMessages, 
  getUserChats, 
  getAdminChats 
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/create', createOrGetChat);
router.post('/message', sendMessage);
router.get('/messages/:chatId', getChatMessages);
router.get('/user/:userId', getUserChats);
router.get('/admin/all', getAdminChats);

export default router;