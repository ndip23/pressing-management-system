// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import publicRoutes from './routes/publicRoutes.js'; 

// Import routes
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js'; 
import reportRoutes from './routes/reportRoutes.js'; 
import priceRoutes from './routes/priceRoutes.js';
import tenantProfileRoutes from './routes/tenantProfileRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import inboundMessageRoutes from './routes/inboundMessageRoutes.js';
import directoryAdminRoutes from './routes/directoryAdminRoutes.js'; // <-- IMPORT
import uploadRoutes from './routes/uploadRoutes.js'; 

// Import scheduler
import { startOrderChecks } from './schedulers/orderChecker.js'; 

dotenv.config();

const app = express();


connectDB().then(() => {
    // Start scheduler only if not disabled and not in a test environment
    // that might not want schedulers running.
    if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_SCHEDULER !== 'true') {
        startOrderChecks();
    }
}).catch(err => {
    console.error("CRITICAL: Failed to connect to DB. Application will not start properly.", err);
    process.exit(1); 
});

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(url => url)
        : ['http://localhost:3000', 'http://localhost:3001'], // Allow local client and Vercel CLI dev
    credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/public', publicRoutes); 
app.use('/api/directory-admin', directoryAdminRoutes); // <-- MOUNT
app.use('/api/auth', authRoutes)
app.use('/api/prices', priceRoutes);
app.get('/api/test', (req, res) => res.json({ message: "API test route working!" }));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin-notifications', adminNotificationRoutes); // MOUNTED
app.use('/api/reports', reportRoutes);
app.use('/api/tenant-profile', tenantProfileRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/inbound-messages', inboundMessageRoutes);
app.use('/api/uploads', uploadRoutes);

// Error handling middleware (should be last for API routes)
app.use(notFound);
app.use(errorHandler);

// For Render Web Service or local development, app.listen is needed.
// If you were deploying this backend specifically as a Vercel Serverless Function
// (which you are not, as your backend is on Render), you would export 'app'.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));