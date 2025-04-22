const { verifyToken } = require('../utils/tokenUtil');

/**
 * Védett útvonal middleware.
 * Ellenőrzi a kérés Authorization fejlécében lévő JWT tokent.
 * Sikeres ellenőrzés esetén a dekódolt felhasználói azonosítót a kérés objektumhoz adja.
 * 
 * @param {object} req - Express kérés objektum
 * @param {object} res - Express válasz objektum
 * @param {function} next - Következő middleware függvény
 * @returns {void}
 */
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
