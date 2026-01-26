import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { errorHandler } from '../utils/error.js';

export const createOrGetChat = async (req, res, next) => {
  try {
    const { userId, listingId } = req.body;
    
    let chat = await Chat.findOne({ userId, listingId })
      .populate('userId', 'username email')
      .populate('listingId', 'name address imageUrls regularPrice discountPrice offer');
    
    if (!chat) {
      chat = new Chat({ userId, listingId });
      await chat.save();
      await chat.populate('userId', 'username email');
      await chat.populate('listingId', 'name address imageUrls regularPrice discountPrice offer');
    }
    
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, senderId, senderType, text, taggedListing, messageType } = req.body;
    
    const message = new Message({
      chatId,
      senderId,
      senderType,
      text,
      taggedListing,
      messageType: messageType || 'text'
    });
    
    await message.save();
    await message.populate('taggedListing', 'name address imageUrls regularPrice discountPrice offer');
    
    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text,
      lastMessageTime: new Date()
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    const messages = await Message.find({ chatId })
      .populate('senderId', 'username')
      .populate('taggedListing', 'name address imageUrls regularPrice discountPrice offer')
      .sort({ createdAt: 1 });
    
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const getUserChats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const chats = await Chat.find({ userId })
      .populate('listingId', 'name address imageUrls regularPrice discountPrice offer')
      .sort({ lastMessageTime: -1 });
    
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

export const getAdminChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({})
      .populate('userId', 'username email')
      .populate('listingId', 'name address imageUrls regularPrice discountPrice offer')
      .sort({ lastMessageTime: -1 });
    
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};