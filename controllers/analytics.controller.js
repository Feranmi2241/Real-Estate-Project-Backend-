import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const getTotalUsers = async (req, res, next) => {
  try {
    console.log('Getting total users...');
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    res.status(200).json({ success: true, data: { totalUsers } });
  } catch (error) {
    console.error('Error in getTotalUsers:', error);
    next(error);
  }
};

export const getTotalListings = async (req, res, next) => {
  try {
    console.log('Getting total listings...');
    const totalListings = await Listing.countDocuments();
    console.log('Total listings:', totalListings);
    res.status(200).json({ success: true, data: { totalListings } });
  } catch (error) {
    console.error('Error in getTotalListings:', error);
    next(error);
  }
};

export const getTotalRevenue = async (req, res, next) => {
  try {
    console.log('Getting total revenue...');
    const listings = await Listing.find({});
    const totalRevenue = listings.reduce((sum, listing) => {
      const price = listing.offer ? listing.discountPrice : listing.regularPrice;
      return sum + price;
    }, 0);
    console.log('Total revenue:', totalRevenue);
    res.status(200).json({ success: true, data: { totalRevenue } });
  } catch (error) {
    console.error('Error in getTotalRevenue:', error);
    next(error);
  }
};