import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyAdmin = (req, res, next) => {
  const adminToken = req.cookies.admin_token;
  
  if (!adminToken) {
    return next(errorHandler(401, 'Admin access denied'));
  }
  
  jwt.verify(adminToken, process.env.JWT_SECRET, (err, admin) => {
    if (err) {
      return next(errorHandler(403, 'Invalid admin token'));
    }
    
    if (admin.role !== 'admin') {
      return next(errorHandler(403, 'Admin access required'));
    }
    
    req.admin = admin;
    next();
  });
};