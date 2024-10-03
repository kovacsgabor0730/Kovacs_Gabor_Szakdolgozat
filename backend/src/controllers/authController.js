const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/passwordUtil');
const { generateToken } = require('../utils/tokenUtil');
const connectDB = require('../config/db');

// Regisztráció
exports.register = async (req, res) => {
    const { firstName, lastName, country, city, postalCode, street, number, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const validatePasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    if (!validatePasswordRegex.test(password)) {
        return res.status(400).json({ message: 'Password is not strong enough' });
    }

    try {
        const db = await connectDB();
        const collection = db.collection('users');

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User(firstName, lastName, country, city, postalCode, street, number, email, hashedPassword);
        await collection.insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Bejelentkezés
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await connectDB();
        const collection = db.collection('users');

        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
