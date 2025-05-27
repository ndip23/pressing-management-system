// server/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (id, username, role) => {
    return jwt.sign({ id, username, role }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

export default generateToken;