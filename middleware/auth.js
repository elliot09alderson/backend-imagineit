import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Fetch user from DB to get role and other details
        // decoded.user handles the case where payload is { user: { id: ... } }
        // decoded.id handles the case where payload is { id: ... }
        const userId = decoded.user ? decoded.user.id : decoded.id;
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

export default auth;
