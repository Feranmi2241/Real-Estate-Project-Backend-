import express from 'express';
import { requestResetCode, verifyResetCode } from '../controllers/forgotPassword.controller.js';

const router = express.Router();

router.post('/request-code', requestResetCode);
router.post('/verify-code', verifyResetCode);

export default router;