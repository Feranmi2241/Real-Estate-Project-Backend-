import express from 'express';
import { getAllTransactions, getTransactionById, verifyTransaction, verifyPaystackPayment } from '../controllers/transaction.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/transactions', getAllTransactions);
router.get('/transactions/:id', getTransactionById);
router.patch('/transactions/:id/verify', verifyTransaction);
router.post('/verify-paystack', verifyToken, verifyPaystackPayment);

export default router;