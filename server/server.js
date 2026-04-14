// server/server.js

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import path from "path";
console.log("HELLO FROM BACKEND");

// Load environment variables at the very top
dotenv.config();

// Import Database Connection
import connectDB from "./config/db.js";

// Import Middleware
import errorMiddleware from "./middleware/errorMiddleware.js";

// Import All Route Files
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";
import tenantProfileRoutes from "./routes/tenantProfileRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import inboundMessageRoutes from "./routes/inboundMessageRoutes.js";
import directoryAdminRoutes from "./routes/directoryAdminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

// Import Schedulers
import { startOrderChecks } from "./schedulers/orderChecker.js";
import checkSubscriptions from "./schedulers/subscriptionScheduler.js";

// --- Initialize Express App ---
const app = express();

// --- Database Connection ---
connectDB()
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      startOrderChecks();
      checkSubscriptions();
    }
  })
  .catch((err) => {
    console.error("CRITICAL: Failed to connect to DB. Shutting down.", err);
    process.exit(1);
  });

// Simple health check endpoint for uptime and monitoring tools
app.get("/", (_req, res) => res.status(200).json({ status: "OK" }));

// --- Security and CORS Middleware ---
app.use(helmet()); // Sets various security headers

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (process.env.FRONTEND_URL || "").split(",").map((url) => url.trim())
      : ["http://localhost:3000",
        "https://pressmark.site",      
        "https://www.pressmark.site",  
        "https://sys.pressmark.site",
        "https://www.sys.pressmark.site",
        "https://pressing-management-system.vercel.app" ],
  credentials: true,
};
app.use(cors(corsOptions));

// --- Webhook Route (MUST come BEFORE express.json()) ---
// This is because webhook signature verification needs the raw request body.
app.use("/api/webhooks", webhookRoutes);

// --- Body Parser Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes Mounting ---
app.use("/api/public", publicRoutes);
app.use("/api/directory-admins", directoryAdminRoutes); // Corrected from directory-admin
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin-notifications", adminNotificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/tenant-profile", tenantProfileRoutes);
app.use("/api/inbound-messages", inboundMessageRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// --- Root Route for Health Check ---
app.get("/api/test", (req, res) => res.json({ message: "API is running!" }));
// --- TEMPORARY DEBUG ROUTE ---

// --- Error Handling Middleware (must be last) ---
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

export default app;
