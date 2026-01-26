import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';

export const updateUserProfile = async (req, res, next) => {
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

export const deleteUserProfile = async (req, res, next) => {
  if (req.user.id !== req.params.userId) {
    return next(errorHandler(401, 'You can only delete your own account!'));
  }

  try {
    await User.findByIdAndDelete(req.params.userId);
    res.clearCookie('access_token', {
      path: '/',
      sameSite: 'lax',
      secure: false
    });
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  if (req.user.id !== req.params.userId) {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }

  try {
    const listings = await Listing.find({ userRef: req.params.userId });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(errorHandler(400, 'No file uploaded'));
    }

    const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { avatar: avatarUrl } },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};