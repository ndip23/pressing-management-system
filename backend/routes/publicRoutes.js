// server/routes/publicRoutes.js
import express from 'express';
import { registerTenantWithSetup } from '../controllers/publicController.js';
const router = express.Router();
router.post('/register-with-setup', registerTenantWithSetup);
export default router;