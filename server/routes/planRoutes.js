// server/routes/planRoutes.js

import express from 'express';
import {
  getPlans,
  getAllPlansAdmin,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanBySlug,
  getPlanPrice
} from '../controllers/planController.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (No Authentication Needed)
// ==========================================
// These MUST be defined first.

// Get all active plans for the public pricing page
router.get('/', getPlans);

// Get a specific plan by its name/slug (e.g., /api/plans/basic)
router.get('/:slug', getPlanBySlug);

// Get the specific price for a country (e.g., /api/plans/basic/price/CM)
router.get('/:slug/price/:countryCode', getPlanPrice);


// ==========================================
// 2. PROTECTED ADMIN ROUTES
// ==========================================
// Apply the protection middleware ONLY to the admin routes

// We define a specific path for the "all" admin list
router.get('/admin/all', protectDirectoryAdmin, getAllPlansAdmin);

// Create a new plan
router.post('/', protectDirectoryAdmin, createPlan);

// Manage a specific plan by its MongoDB _id
router.get('/admin/:id', protectDirectoryAdmin, getPlanById);
router.put('/admin/:id', protectDirectoryAdmin, updatePlan);
router.delete('/admin/:id', protectDirectoryAdmin, deletePlan);

export default router;