const { connectDB, getCollection } = require('../config/db');
const { ObjectId } = require('mongodb');

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const userCollection = await getCollection('users');
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Az érzékeny adatok (jelszó) kiszűrése
        const { password, resetPasswordToken, resetPasswordExpires, ...userProfile } = user;
        
        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const { name, email, address, password } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (address) updateData.address = address;
        
        if (password) {
            const { hashPassword } = require('../utils/passwordUtil');
            updateData.password = await hashPassword(password);
        }
        
        const userCollection = await getCollection('users');
        const result = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// A meglévő controller-hez adnunk kell egy új metódust:

// Push notification token mentése a felhasználóhoz
exports.savePushToken = async (req, res) => {
    try {
      const userId = req.userId;
      const { pushToken } = req.body;
      
      if (!pushToken) {
        return res.status(400).json({ message: 'Push token is required' });
      }
      
      const userCollection = await getCollection('users');
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { pushToken: pushToken, tokenUpdatedAt: new Date() } }
      );
      
      res.status(200).json({ 
        message: 'Push token saved successfully' 
      });
      
    } catch (error) {
      console.error('Error saving push token:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };