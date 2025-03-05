const User = require('../models/userModel');
const { hashPassword, comparePassword, isPasswordStrong } = require('../utils/passwordUtil');
const { connectDB, getCollection } = require('../config/db');
const { generateToken } = require('../utils/tokenUtil');
const { sendEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { firstName, lastName, country, city, postalCode, street, number, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!isPasswordStrong(password)) {
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

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const userCollection = await getCollection('users');
        const user = await userCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with that email' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = Date.now() + 3600000;

        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetTokenExpires
                }
            }
        );

        const resetLink = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`
        });

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword || password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match or are invalid' });
    }

    try {
        const userCollection = await getCollection('users');
        const user = await userCollection.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await hashPassword(password);
        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordExpires: null
                }
            }
        );

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};
