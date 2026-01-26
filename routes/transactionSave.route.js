import express from 'express';
import Transaction from '../models/transaction.model.js';

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      amount: req.body.convertedAmount // Keep amount for backward compatibility
    });
    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user transactions without authentication for now
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transactions = await Transaction.find({ userId })
      .populate('listingId', 'name address type')
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate simple receipt
router.get('/receipt/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('listingId', 'name address type');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const receiptData = {
      transactionId: transaction._id,
      date: transaction.createdAt,
      amount: transaction.convertedAmount,
      currency: transaction.currency,
      property: transaction.listingId?.name,
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