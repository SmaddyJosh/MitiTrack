const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    
    const token = req.header('x-auth-token');

    
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    
    try {
        const jwtSecret = process.env.JWT_SECRET || 'mititrack_secret_jwt_key_12345';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};
