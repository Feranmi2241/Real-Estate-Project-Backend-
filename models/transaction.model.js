import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  convertedAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['NGN', 'USD', 'EUR', 'GBP', 'CAD'],
    required: true
  },
  paymentProvider: {
    type: String,
    enum: ['Paystack', 'Flutterwave'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending'
  },
  verified: {
    type: Boolean,
    default: false
  },
  transactionReference: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;