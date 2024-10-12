const { getCollection } = require('../utils/dbUtil');
const { verifyToken } = require('../utils/tokenUtil');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

exports.uploadIdCardData = async (req, res) => {
    const { id_number, name, sex, date_of_expiry, place_of_birth, front_image, rear_image, mothers_maiden_name } = req.body;

    if (!id_number || !name || !sex || !date_of_expiry || !front_image || !rear_image || !place_of_birth || !mothers_maiden_name) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const frontImagePath = path.join(__dirname, '../uploads/', front_image);
        const rearImagePath = path.join(__dirname, '../uploads/', rear_image);

        if (!fs.existsSync(frontImagePath)) {
            return res.status(400).json({ message: `Front image not found: ${front_image}` });
        }

        if (!fs.existsSync(rearImagePath)) {
            return res.status(400).json({ message: `Rear image not found: ${rear_image}` });
        }

        const idCardCollection = await getCollection('id_cards');
        const existingCard = await idCardCollection.findOne({ id_number });
        if (existingCard) {
            return res.status(400).json({ message: 'You already have an account!' });
        }

        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = verifyToken(token);
        const userId = decodedToken.userId;

        const userCollection = await getCollection('users');
        const user = await userCollection.findOne({ _id: ObjectId(userId) });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const fullName = `${user.name.first_name} ${user.name.last_name}`;
        if (name !== fullName) {
            return res.status(400).json({ message: 'Name on the ID card does not match the logged-in user' });
        }

        const newIdCard = {
            user_id: userId,
            id_number,
            name,
            sex,
            date_of_expiry,
            place_of_birth,
            front_image,
            rear_image,
            mothers_maiden_name,
            modified_at: new Date()
        };
        await idCardCollection.insertOne(newIdCard);

        res.status(200).json({ message: 'ID card data stored successfully', data: newIdCard });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading ID card data', error: error.message });
    }
};
