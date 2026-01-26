import express from 'express';
import { getTotalUsers, getTotalListings, getTotalRevenue } from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/users', getTotalUsers);
router.get('/listings', getTotalListings);
router.get('/revenue', getTotalRevenue);

export default router;