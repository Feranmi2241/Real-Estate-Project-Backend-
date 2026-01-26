import express from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken } from '../utils/verifyUser.js';
import { updateUserProfile, deleteUserProfile, getUserListings, uploadAvatar } from '../controllers/userProfile.controller.js';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'public/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/update/:userId', updateUserProfile);
router.delete('/delete/:userId', verifyToken, deleteUserProfile);
router.get('/listings/:userId', verifyToken, getUserListings);
router.post('/upload-avatar/:userId', upload.single('avatar'), uploadAvatar);

export default router;