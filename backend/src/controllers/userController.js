const { getCollection } = require('../config/db');
const { verifyToken } = require('../utils/tokenUtil');
const { ObjectId } = require('mongodb');
const { hashPassword } = require('../utils/passwordUtil');

exports.getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = verifyToken(token);
    const userId = decodedToken.userId;

    const userCollection = await getCollection('users');
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      email: user.email,
      address: user.address,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { email, password, address } = req.body;

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = verifyToken(token);
    const userId = decodedToken.userId;

    const userCollection = await getCollection('users');
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedData = {
      email,
      address,
    };

    if (password) {
      updatedData.password = await hashPassword(password);
    }

    await userCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updatedData });

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};