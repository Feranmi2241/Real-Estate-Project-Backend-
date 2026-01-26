import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import Transaction from '../models/transaction.model.js';

const router = express.Router();

// Get user transactions
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own transactions
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const transactions = await Transaction.find({ userId })
      .populate('listingId', 'name address type')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate receipt
router.get('/receipt/:transactionId', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('listingId', 'name address type')
      .populate('userId', 'username email');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Ensure user can only access their own transaction receipts
    if (transaction.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Generate simple receipt (in production, use PDF library)
    const receiptData = {
      transactionId: transaction._id,
      date: transaction.createdAt,
      amount: transaction.convertedAmount,
      currency: transaction.currency,
      property: transaction.listingId?.name,
      user: transaction.userId?.username,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      reference: transaction.reference
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${transactionId}.json`);
    res.json(receiptData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;