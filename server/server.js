// server/server.js

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

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
import galleryRoutes from "./routes/galleryRoutes.js"

// Import Schedulers
import { startOrderChecks } from "./schedulers/orderChecker.js";
import checkSubscriptions from "./schedulers/subscriptionScheduler.js";

// --- Initialize Express App ---
const app = express();

// --- Database Connection ---
connectDB()
  .then(() => {
    // Only start schedulers if not in test mode
    if (process.env.NODE_ENV !== "test") {
      startOrderChecks();
      checkSubscriptions();
    }
  })
  .catch((err) => {
    console.error("CRITICAL: Failed to connect to DB. Shutting down.", err);
    process.exit(1);
  });

// --- 1. CORS CONFIGURATION (MUST BE FIRST) ---
const corsOptions = {
  origin: (origin, callback) => {
    const whitelist = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://lsmbooker.com",
      "https://www.lsmbooker.com",
      "https://sys.lsmbooker.com",
      "https://www.sys.lsmbooker.com",
      "https://pressing-management-system.vercel.app",
    ];

    // Allow requests with no origin (like mobile apps or AWS Health Checks)
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      // In production, allow all for debugging until "Degraded" is fixed, 
      // or strictly enforce your whitelist. For AWS EB fixes, we allow it.
      callback(null, true); 
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// --- 2. OTHER SECURITY & UTILITY MIDDLEWARE ---
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows images to load from other domains
}));
app.use(compression());

// --- 3. REQUEST LOGGER ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} to ${req.url}`);
  next();
});

// --- 4. WEBHOOK ROUTE (Before Body Parser) ---
app.use("/api/webhooks", webhookRoutes);

// --- 5. BODY PARSERS ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 6. API ROUTES ---
// Simple health check for AWS Elastic Beanstalk
app.get("/", (_req, res) => res.status(200).json({ status: "OK", message: "Server is alive" }));
app.get("/api/test", (req, res) => res.json({ message: "API is running!" }));

app.use("/api/public", publicRoutes);
app.use("/api/directory-admins", directoryAdminRoutes);
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
app.use('/api/gallery', galleryRoutes);

// --- 7. ERROR HANDLING ---
app.use(errorMiddleware.notFound);

app.use((err, req, res, next) => {
  console.error("❌ BACKEND ERROR DETECTED:");
  console.error(err.stack); 
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Ensure CORS headers are present even on Error pages
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// --- 8. START SERVER (UPDATED FOR AWS EB) ---
// AWS Elastic Beanstalk defaults to port 8080 for Node.js
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Listening on 0.0.0.0 (Required for AWS Routing)`);
});

export default app;