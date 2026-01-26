import express from 'express';
import { createAdminListing, getAllListings, updateAdminListing, deleteAdminListing } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/create', createAdminListing);
router.get('/all', getAllListings);
router.post('/update/:id', updateAdminListing);
router.delete('/delete/:id', deleteAdminListing);

export default router;