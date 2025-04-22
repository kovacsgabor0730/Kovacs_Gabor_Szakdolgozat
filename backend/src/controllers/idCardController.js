const { getCollection } = require('../config/db');
const { verifyToken } = require('../utils/tokenUtil');
const { ObjectId } = require('mongodb');
const IdCard = require('../models/idCardModel');

/**
 * Személyi igazolvány adatok feltöltése és validálása.
 * Ellenőrzi, hogy az adatok megfelelnek-e a formai követelményeknek és 
 * hogy a személyi igazolványon lévő név megegyezik-e a felhasználói fiókban tárolt névvel.
 * 
 * @async
 * @param {object} req - Express kérés objektum
 * @param {object} res - Express válasz objektum
 * @returns {Promise<void>}
 */
exports.uploadIdCardData = async (req, res) => {
    const { id_number, first_name, last_name, sex, date_of_expiry, place_of_birth, mothers_maiden_name, can_number, date_of_birth } = req.body;

    const idNumberPattern = /^[0-9]{6}[A-Z]{2}$/;
    const canNumberPattern = /^[0-9]{6}$/;
    const today = new Date();
    const expiryDate = new Date(date_of_expiry);
    const birthDate = new Date(date_of_birth);
    const minBirthDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());

    if (!id_number || !first_name || !last_name || !sex || !date_of_expiry || !place_of_birth || !mothers_maiden_name || !can_number || !date_of_birth) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!idNumberPattern.test(id_number)) {
        return res.status(400).json({ message: 'ID number must be in the format 000000XY' });
    }

    if (sex !== 'férfi' && sex !== 'nő') {
        return res.status(400).json({ message: 'Sex must be either "férfi" or "nő"' });
    }

    if (expiryDate <= today) {
        return res.status(400).json({ message: 'Date of expiry cannot be lower than or equal to today\'s date' });
    }

    if (!canNumberPattern.test(can_number)) {
        return res.status(400).json({ message: 'CAN number must be in the format 000000' });
    }

    if (birthDate >= minBirthDate) {
        return res.status(400).json({ message: 'Date of birth must be at least 14 years earlier than today\'s date' });
    }

    try {
        const idCardCollection = await getCollection('ids');
        const existingCard = await idCardCollection.findOne({ id_number });
        if (existingCard) {
            return res.status(400).json({ message: 'You already have an account!' });
        }

        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = verifyToken(token);
        const userId = decodedToken.id;

        const userCollection = await getCollection('users');
        console.log(userId);
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const fullName = `${user.name.first_name} ${user.name.last_name}`;
        console.log(fullName);
        if (`${first_name} ${last_name}` !== fullName) {
            return res.status(400).json({ message: 'Name on the ID card does not match the logged-in user' });
        }

        const newIdCard = new IdCard(userId, id_number, first_name, last_name, sex, date_of_expiry, place_of_birth, mothers_maiden_name, can_number, date_of_birth);
        await idCardCollection.insertOne(newIdCard);

        res.status(200).json({ message: 'ID card data stored successfully', data: newIdCard });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading ID card data', error: error.message });
    }
};

/**
 * Személyi igazolvány adatok lekérdezése a bejelentkezett felhasználóhoz.
 * 
 * @async
 * @param {object} req - Express kérés objektum
 * @param {object} res - Express válasz objektum
 * @returns {Promise<void>}
 */
exports.getIdCardDetails = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const idCardCollection = await getCollection('ids');
        const idCard = await idCardCollection.findOne({ user_id: new ObjectId(userId) });
        
        if (!idCard) {
            return res.status(404).json({ message: 'Nincs még feltöltött személyi igazolvány adat' });
        }
        
        // Opcionálisan képet is visszaadhatunk, ha tárolunk olyat
        res.status(200).json(idCard);
        
    } catch (error) {
        console.error('Error fetching id card details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};