// server/routes/publicRoutes.js
import express from 'express';
import { registerTenant } from '../controllers/publicController.js';
const router = express.Router();

router.post('/register', registerTenant);

export default router;