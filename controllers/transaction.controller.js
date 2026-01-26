import Transaction from '../models/transaction.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference, listingId } = req.body;
    
    console.log('Verification request:', { reference, listingId, userId: req.user?.id });
    
    if (!reference || !listingId) {
      return next(errorHandler(400, 'Reference and listing ID are required'));
    }

    // Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paystackData = await response.json();
    console.log('Paystack response:', paystackData);
    
    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.log('Paystack verification failed:', paystackData);
      return next(errorHandler(400, 'Payment verification failed'));
    }

    // Get listing to verify amount
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'));
    }

    const expectedAmount = (listing.offer ? listing.discountPrice : listing.regularPrice) * 100;
    console.log('Amount check:', { expected: expectedAmount, actual: paystackData.data.amount });
    
    if (paystackData.data.amount !== expectedAmount) {
      return next(errorHandler(400, `Payment amount mismatch. Expected: ${expectedAmount}, Got: ${paystackData.data.amount}`));
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ transactionReference: reference });
    if (existingTransaction) {
      return next(errorHandler(400, 'Transaction already processed'));
    }

    // Save verified transaction
    const transaction = new Transaction({
      userId: req.user.id,
      listingId,
      originalAmount: expectedAmount / 100,
      convertedAmount: expectedAmount / 100,
      currency: 'NGN',
      paymentProvider: 'Paystack',
      transactionReference: reference,
      status: 'successful',
      verified: true
    });

    await transaction.save();
    console.log('Transaction saved:', transaction._id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Payment verified successfully',
      data: transaction 
    });
  } catch (error) {
    console.error('Verification error:', error);
    next(error);
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const { status, provider, email } = req.query;
    
    // Build filter object
    let filter = {};
    if (status) filter.status = status;
    if (provider) filter.paymentProvider = provider;
    
    let transactions = await Transaction.find(filter)
      .populate('userId', 'username email')
      .populate('listingId', 'name regularPrice discountPrice offer')
      .sort({ createdAt: -1 });
    
    // Filter by email if provided
    if (email) {
      transactions = transactions.filter(t => 
        t.userId.email.toLowerCase().includes(email.toLowerCase())
      );
    }
    
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('listingId', 'name regularPrice discountPrice offer address');
    
    if (!transaction) {
      return next(errorHandler(404, 'Transaction not found'));
    }
    
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

export const verifyTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    ).populate('userId', 'username email')
     .populate('listingId', 'name regularPrice discountPrice offer type');
    
    if (!transaction) {
      return next(errorHandler(404, 'Transaction not found'));
    }

    // Update listing status to sold/rented when transaction is verified
    if (transaction.listingId) {
      const listingType = transaction.listingId.type;
      const soldOrRentedStatus = listingType === 'sale' ? 'sold' : 'rented';
      
      await Listing.findByIdAndUpdate(
        transaction.listingId._id,
        { 
          soldOrRented: true,
          soldOrRentedStatus: soldOrRentedStatus
        }
      );
    }
    
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};