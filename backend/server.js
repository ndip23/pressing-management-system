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
import settingsRoutes from './routes/settingsRoutes.js'; // <<--- 1. MAKE SURE THIS IMPORT IS PRESENT AND CORRECT

dotenv.config();
connectDB();

const app = express();

// CORS Middleware
const TEMPORARY_VERCEL_URL = 'https://pressing-management-system.vercel.app'; // Your Vercel URL

const corsOptions = {
    origin: TEMPORARY_VERCEL_URL, // <<<< TEMPORARILY HARDCODE
    credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route for testing
app.get('/api', (req, res) => {
    res.send('API is running...');
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes); // <<--- 2. ENSURE THIS LINE IS PRESENT AND CORRECT. Base path is /api/settings

// Error handling middleware (should be last)
app.use(notFound); // For 404 errors if none of the above routes match
app.use(errorHandler); // For other errors

const PORT = process.env.PORT || 5001;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);