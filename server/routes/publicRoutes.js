// server/routes/publicRoutes.js
import express from "express";
import {
  initiateRegistration,
  finalizeRegistration,
  handleContactForm,
  getPublicDirectory,
  getBusinessBySlug,
  contactBusinessViaWhatsApp,
  getTenantPriceList,
} from "../controllers/publicController.js";
import { publicPostLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
// health check route
router.get("/", (_req, res) => {
  res.json("OK");
});
router.post("/initiate-registration", publicPostLimiter, initiateRegistration);
router.post("/finalize-registration", publicPostLimiter, finalizeRegistration);
router.get("/directory", getPublicDirectory);
router.get("/directory/:slug", getBusinessBySlug);
router.post("/directory/:slug/whatsapp-contact", contactBusinessViaWhatsApp);
router.get("/tenants/:tenantId/prices", getTenantPriceList);
router.post("/contact-form", publicPostLimiter, handleContactForm);
export default router;
