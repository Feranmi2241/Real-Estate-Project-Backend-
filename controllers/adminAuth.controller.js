import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Store admin OTPs in memory (in production, use Redis or database)
let adminOTPs = new Map();

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required'));
    }
    
    // Validate against hardcoded admin credentials
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return next(errorHandler(401, 'Invalid admin credentials'));
    }
    
    // Generate JWT token for admin
    const adminToken = jwt.sign(
      { 
        id: 'admin', 
        email: process.env.ADMIN_EMAIL, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set admin token in cookie
    res.cookie('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin: {
        id: 'admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogout = async (req, res, next) => {
  try {
    res.clearCookie('admin_token');
    res.status(200).json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      avatar: process.env.ADMIN_AVATAR || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email matches admin email
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Invalid admin email' });
    }
    
    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ success: false, message: 'Email service not configured' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    adminOTPs.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      used: false
    });
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Password Reset - Verification Code',
      html: `
        <h2>Admin Password Reset</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Verification code sent to admin email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
};

export const adminVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const storedOTP = adminOTPs.get(email);
    
    if (!storedOTP) {
      return res.status(400).json({ success: false, message: 'No verification code found' });
    }
    
    if (storedOTP.used) {
      return res.status(400).json({ success: false, message: 'Verification code already used' });
    }
    
    if (Date.now() > storedOTP.expires) {
      adminOTPs.delete(email);
      return res.status(400).json({ success: false, message: 'Verification code expired' });
    }
    
    if (storedOTP.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    
    // Mark OTP as used and delete
    adminOTPs.delete(email);
    
    // Generate admin token
    const adminToken = jwt.sign(
      { id: 'admin', email: process.env.ADMIN_EMAIL, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.cookie('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true, message: 'Admin verification successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const uploadAdminAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    
    res.json({ success: true, avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    
    console.log('Received update request:', { username, email, password: password ? '[HIDDEN]' : undefined, avatar });
    
    // Read current .env file
    const envPath = path.resolve('.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update admin credentials in .env
    if (email) {
      envContent = envContent.replace(/ADMIN_EMAIL=.*/, `ADMIN_EMAIL=${email}`);
    }
    if (password) {
      envContent = envContent.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${password}`);
    }
    
    // Add avatar if not exists, update if exists
    if (avatar) {
      console.log('Updating avatar to:', avatar);
      if (envContent.includes('ADMIN_AVATAR=')) {
        envContent = envContent.replace(/ADMIN_AVATAR=.*/, `ADMIN_AVATAR=${avatar}`);
      } else {
        envContent += `\nADMIN_AVATAR=${avatar}`;
      }
    }
    
    // Write back to .env file
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env file successfully');
    
    // Update process.env
    if (email) process.env.ADMIN_EMAIL = email;
    if (password) process.env.ADMIN_PASSWORD = password;
    if (avatar) process.env.ADMIN_AVATAR = avatar;
    
    res.json({ success: true, message: 'Admin profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};