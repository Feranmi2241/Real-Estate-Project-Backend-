import express from 'express';
import { getRevenueReport } from '../controllers/revenue.controller.js';

const router = express.Router();

router.get('/report', getRevenueReport);

export default router;