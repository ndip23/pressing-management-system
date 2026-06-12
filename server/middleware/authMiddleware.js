// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Use 'id' (matches our generateToken payload)
        const userId = decoded.id;
        const tenantId = decoded.tenantId;

        if (!userId || !tenantId) {
            console.error('❌ AUTH ERROR: Token structure invalid. Missing ID or TenantID', decoded);
            res.status(401);
            throw new Error('Not authorized, token structure invalid');
        }

        req.user = await User.findById(userId).select('-password');
        req.tenantId = tenantId;

        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized, user not found');
        }

        const tenant = await Tenant.findById(req.tenantId);
        if (!tenant || !tenant.isActive) {
            res.status(403);
            throw new Error('Account access has been disabled.');
        }

        next();
    } catch (error) {
        console.error('❌ AUTH ERROR:', error.message);
        res.status(401);
        throw new Error(error.message || 'Not authorized, token failed');
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`Role '${req.user?.role}' is not authorized`);
        }
        next();
    };
};

export { protect, authorize };