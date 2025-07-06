// server/routes/publicRoutes.js
import express from 'express';
import { registerTenantWithSetup, initiateRegistration, finalizeRegistration } from '../controllers/publicController.js';
const router = express.Router();
router.post('/register-with-setup', registerTenantWithSetup);
router.post('/initiate-registration', initiateRegistration); // Step 1
router.post('/finalize-registration', finalizeRegistration);
export default router;