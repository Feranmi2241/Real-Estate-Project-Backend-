import { errorHandler } from './error.js';

export const isAdmin = (req, res, next) => {
  // For demo purposes, check if user email contains 'admin'
  // In production, use proper role-based authentication
  if (req.user && req.user.email && req.user.email.includes('admin')) {
    next();
  } else {
    return next(errorHandler(403, 'Access denied. Admin privileges required.'));
  }
};