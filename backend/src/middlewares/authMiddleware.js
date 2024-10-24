const { verifyToken } = require('../utils/tokenUtil');

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = verifyToken(token);
        req.userId = decoded.id;
        console.log(decoded);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = protect;
