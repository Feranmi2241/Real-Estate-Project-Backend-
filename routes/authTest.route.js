import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Test endpoint to verify authentication
router.get('/test-auth', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication working',
    user: {
      id: req.user.id,
      type: req.user.type
    }
  });
});

export default router;