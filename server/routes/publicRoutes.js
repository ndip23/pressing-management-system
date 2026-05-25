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
const router = express.Router();
// health check route
router.get("/", (_req, res) => {
  res.json("OK");
});
router.post("/initiate-registration", initiateRegistration); // Step 1
router.post("/finalize-registration", finalizeRegistration);
router.get("/directory", getPublicDirectory);
router.get("/directory/:slug", getBusinessBySlug);
router.post("/directory/:slug/whatsapp-contact", contactBusinessViaWhatsApp);
router.get("/tenants/:tenantId/prices", getTenantPriceList);
router.post("/contact-form", handleContactForm);
export default router;
