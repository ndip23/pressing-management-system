// server/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (id, username, role, tenantId) => {
    // Ensure IDs are strings to prevent Mongoose Object ID mismatches
    const payload = { 
        id: id.toString(), 
        username, 
        role, 
        tenantId: tenantId.toString() 
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export default generateToken;