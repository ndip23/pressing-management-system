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
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';

// Import scheduler
import { startOrderChecks } from './schedulers/orderChecker.js';

dotenv.config(); // Load .env file variables into process.env

const app = express();

// Connect to Database and then start scheduler
connectDB().then(() => {
    if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_SCHEDULER !== 'true') {
        startOrderChecks();
    }
}).catch(err => {
    console.error("CRITICAL: Failed to connect to DB. Application will not start properly.", err);
    process.exit(1);
});

// --- CORS Configuration ---
const F_URL = process.env.FRONTEND_URL;
const N_ENV = process.env.NODE_ENV;
console.log(`[CORS Setup] NODE_ENV: ${N_ENV}, FRONTEND_URL: ${F_URL}`);

const allowedOrigins = N_ENV === 'production' && F_URL
    ? F_URL.split(',').map(url => url.trim()).filter(Boolean) // Production: use FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:3001'];     // Development: allow local CRA and Vite

// If in production and no FRONTEND_URL is set, it's better to not allow any origin by default
// or have a very restricted fallback, rather than an empty array which might behave unexpectedly.
// However, for this setup, an empty array from filter(Boolean) when F_URL is empty/undefined is fine,
// as the cors middleware might then not set the header, which is what we are seeing.
// Let's ensure allowedOrigins is never empty in production if F_URL is expected.
if (N_ENV === 'production' && (!allowedOrigins || allowedOrigins.length === 0)) {
    console.warn("[CORS Setup] WARNING: Running in production but FRONTEND_URL is not set or is empty. CORS might not allow any origin.");
    // You might want to set a default safe origin or throw an error here if FRONTEND_URL is mandatory in prod.
    // For now, the `cors` middleware will likely not set `Access-Control-Allow-Origin` if `origin` array is empty.
}


const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) for dev, or be stricter
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || N_ENV !== 'production') {
            callback(null, true);
        } else {
            console.error(`[CORS Error] Origin not allowed: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,X-Requested-With",
    optionsSuccessStatus: 200 // For `app.options('*', cors())` if used
};

console.log('[CORS Setup] Effective allowed origins for CORS:', allowedOrigins);

// It's good practice to handle OPTIONS requests explicitly for CORS preflight
app.options('*', cors(corsOptions)); // Handle preflight requests on all routes
app.use(cors(corsOptions)); // Then apply CORS for all other requests


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => res.json({ message: "API test route working!" }));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin-notifications', adminNotificationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000; // Render provides the PORT env variable
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// export default app; // REMOVE OR COMMENT OUT for Render Web Service