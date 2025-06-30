// server/utils/generateToken.js
import jwt from 'jsonwebtoken';
const generateToken = (id, username, role, tenantId) => {
    return jwt.sign({ id, username, role, tenantId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export default generateToken;