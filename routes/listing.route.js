import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import { createListing, deleteListing, updateListing, getListing, getListings } from "../controllers/listing.controller.js";


const router = express.Router();

router.post("/create", verifyToken, createListing);
router.delete("/delete/:id", verifyToken, deleteListing);
router.post("/update/:id", verifyToken, updateListing);
router.get("/get/:id", getListing);
router.get("/get", getListings);

// Admin routes
router.post('/admin/create', createListing);
router.get('/admin/all', getListings);
router.post('/admin/update/:id', updateListing);
router.delete('/admin/delete/:id', deleteListing);

// Bank configuration routes
let bankConfigs = { local: null, intl: null }; // In-memory storage for demo

// Paystack account verification
const verifyPaystackAccount = async (accountNumber, bankCode) => {
  try {
    const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.status && data.data;
  } catch (error) {
    console.error('Paystack verification error:', error);
    return false;
  }
};

// Flutterwave account verification
const verifyFlutterwaveAccount = async (accountNumber, bankCode) => {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_number: accountNumber,
        account_bank: bankCode
      })
    });
    const data = await response.json();
    return data.status === 'success' && data.data;
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    return false;
  }
};

router.post('/admin/bank-config/:type', async (req, res) => {
  const { type } = req.params;
  const config = req.body;
  
  try {
    // Validate required fields
    if (type === 'local') {
      if (!config.bankName || !config.accountNumber || !config.accountName || !config.bankCode) {
        return res.status(400).json({ success: false, message: 'Missing required fields for local bank config' });
      }
      
      // Verify with Paystack
      const verification = await verifyPaystackAccount(config.accountNumber, config.bankCode);
      if (!verification) {
        return res.status(400).json({ success: false, message: 'Invalid bank account details. Please verify account number and bank.' });
      }
      
      // Check if account name matches
      if (verification.account_name.toLowerCase() !== config.accountName.toLowerCase()) {
        return res.status(400).json({ success: false, message: `Account name mismatch. Expected: ${verification.account_name}` });
      }
    }
    
    if (type === 'intl') {
      if (!config.bankName || !config.accountNumber || !config.accountName || !config.swiftCode) {
        return res.status(400).json({ success: false, message: 'Missing required fields for international bank config' });
      }
      
      // For international, we can use Flutterwave if bank code is available
      if (config.bankCode) {
        const verification = await verifyFlutterwaveAccount(config.accountNumber, config.bankCode);
        if (!verification) {
          return res.status(400).json({ success: false, message: 'Invalid international bank account details.' });
        }
      }
    }
    
    // Save configuration if validation passes
    bankConfigs[type] = config;
    console.log(`Saving ${type} bank config:`, config);
    res.json({ success: true, message: `${type} bank configuration saved and verified successfully` });
    
  } catch (error) {
    console.error('Bank config validation error:', error);
    res.status(500).json({ success: false, message: 'Server error during bank account verification' });
  }
});

router.get('/admin/bank-config', (req, res) => {
  res.json(bankConfigs);
});


export default router;