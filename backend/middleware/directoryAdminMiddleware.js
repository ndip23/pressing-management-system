// server/middleware/directoryAdminMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';

const protectDirectoryAdmin = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.DIRECTORY_ADMIN_JWT_SECRET);
            // If verification succeeds, we know it's the admin. No need to look up a user.
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
export { protectDirectoryAdmin };