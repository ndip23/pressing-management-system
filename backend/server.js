// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js'; 
import { startOrderChecks } from './schedulers/orderChecker.js'; 

dotenv.config();

const app = express();

connectDB().then(() => {
    console.log("MongoDB connection successful, starting scheduler...");
    if (process.env.NODE_ENV !== 'test') { 
        startOrderChecks();
    }
}).catch(err => {
    console.error("Failed to connect to MongoDB before starting scheduler:", err);
});


const corsOptions = { /* ... as before ... */ };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin-notifications', adminNotificationRoutes); 

app.get('/api/test', (req, res) => res.json({ message: "API test ok" }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test_no_listen') { 
    app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
}

export default app; 