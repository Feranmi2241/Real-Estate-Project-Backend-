import express from 'express';
import multer from 'multer';
import path from 'path';
import { adminLogin, adminLogout, updateProfile, getProfile, adminForgotPassword, adminVerifyOTP, uploadAdminAvatar } from '../controllers/adminAuth.controller.js';

const router = express.Router();

// Configure multer for admin avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'public/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-admin-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.get('/profile', getProfile);
router.post('/update-profile', updateProfile);
router.post('/upload-avatar', upload.single('avatar'), uploadAdminAvatar);
router.post('/forgot-password', adminForgotPassword);
router.post('/verify-otp', adminVerifyOTP);

export default router;