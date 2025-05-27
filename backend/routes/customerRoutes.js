// server/routes/customerRoutes.js
import express from 'express';
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createCustomer) // Staff and Admin can create
    .get(protect, getCustomers);   // Staff and Admin can view

router.route('/:id')
    .get(protect, getCustomerById)
    .put(protect, updateCustomer)
    .delete(protect, authorize('admin'), deleteCustomer); // Only Admin can delete

export default router;