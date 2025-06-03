// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js'; // IMPORTED

// Import scheduler
import { startOrderChecks } from './schedulers/orderChecker.js'; // IMPORTED

dotenv.config();

const app = express();

// Connect to Database and then start scheduler
connectDB().then(() => {
    // Start scheduler only if not disabled and not in a test environment
    // that might not want schedulers running.
    if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_SCHEDULER !== 'true') {
        startOrderChecks();
    }
}).catch(err => {
    console.error("CRITICAL: Failed to connect to DB. Application will not start properly.", err);
    process.exit(1); // Exit if DB connection fails at startup
});

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(url => url)
        : ['http://localhost:3000', 'http://localhost:3001'], // Allow local client and Vercel CLI dev
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => res.json({ message: "API test route working!" }));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin-notifications', adminNotificationRoutes); // MOUNTED

// Error handling middleware (should be last for API routes)
app.use(notFound);
app.use(errorHandler);

// For Render Web Service or local development, app.listen is needed.
// If you were deploying this backend specifically as a Vercel Serverless Function
// (which you are not, as your backend is on Render), you would export 'app'.
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

 export default app;