const adminAuth = (req, res, next) => {
    console.log("AdminAuth Check - User:", req.user);
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.', user: req.user });
    }
};

export default adminAuth;
