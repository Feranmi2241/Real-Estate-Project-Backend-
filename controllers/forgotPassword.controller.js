import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import nodemailer from 'nodemailer';
import { errorHandler } from '../utils/error.js';

export const requestResetCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(errorHandler(400, 'Email is required'));
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    // Check credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return next(errorHandler(500, 'Email service not configured'));
    }
    
    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = bcryptjs.hashSync(resetCode, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update user with reset code
    await User.findByIdAndUpdate(user._id, {
      resetCode: hashedCode,
      resetCodeExpiry: expiry
    });
    
    // Create transporter inside function
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      timeout: 10000
    });
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code - PositiveMindEstate',
      html: `
        <h2>Password Reset Code</h2>
        <p>Your verification code is: <strong>${resetCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 15000)
      )
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    next(errorHandler(500, error.message || 'Failed to send reset code'));
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    if (!user.resetCode || !user.resetCodeExpiry) {
      return next(errorHandler(400, 'No reset code found'));
    }
    
    if (new Date() > user.resetCodeExpiry) {
      return next(errorHandler(400, 'Reset code has expired'));
    }
    
    const isValidCode = bcryptjs.compareSync(code, user.resetCode);
    if (!isValidCode) {
      return next(errorHandler(400, 'Invalid reset code'));
    }
    
    // Clear reset code
    await User.findByIdAndUpdate(user._id, {
      resetCode: null,
      resetCodeExpiry: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Code verified successfully',
      userId: user._id
    });
  } catch (error) {
    next(error);
  }
};