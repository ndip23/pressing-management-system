// server/routes/inboundMessageRoutes.js
import express from 'express';
import { getMyInboundMessages } from '../controllers/inboundMessageController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file are for logged-in admins to see their own tenant's messages
router.route('/').get(protect, authorize('admin', 'staff'), getMyInboundMessages); // Allow staff to see messages too

export default router;