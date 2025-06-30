// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Read JWT from the 'jwt' cookie or Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) { // If using httpOnly cookies
         token = req.cookies.jwt;
     }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); // Exclude password
            req.tenantId = decoded.tenantId;
            if (!req.user || !req.tenantId) {
                res.status(401);
                throw new Error('Not authorized, user or tenant not found');
            }
            const tenant = await Tenant.findById(req.tenantId);
            if (!tenant || !tenant.isActive) {
                 res.status(403); throw new Error('Account access has been disabled.');
            }
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401);
            if (error.name === 'TokenExpiredError') {
                throw new Error('Not authorized, token expired');
            }
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403); // Forbidden
            throw new Error(`User role '${req.user?.role || 'guest'}' is not authorized to access this route`);
        }
        next();
    };
};

export { protect, authorize };