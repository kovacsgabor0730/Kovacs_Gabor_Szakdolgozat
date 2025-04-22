const User = require('../models/userModel');
const { hashPassword, comparePassword, isPasswordStrong } = require('../utils/passwordUtil');
const { connectDB, getCollection } = require('../config/db');
const { generateToken } = require('../utils/tokenUtil');
const { sendEmail } = require('../utils/emailUtils');
const { resetPasswordTemplate, invalidTokenTemplate } = require('../utils/htmlTemplates');
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
            console.log('Invalid login attempt for email:', email);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password attempt for user:', email);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        console.log(token);

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
        console.log(error);
    }
};

exports.showResetPasswordForm = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.send(invalidTokenTemplate());
    }

    try {
        const userCollection = await getCollection('users');
        
        // Keressük a felhasználót a token alapján
        const user = await userCollection.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } 
        });
        
        if (!user) {
            return res.send(invalidTokenTemplate());
        }
        
        // Megjelenítjük a jelszóvisszaállító űrlapot
        res.send(resetPasswordTemplate(token));
    } catch (error) {
        console.error('Hiba a jelszóvisszaállító űrlap betöltésekor:', error);
        res.status(500).send('Hiba történt a szerveren');
    }
};

// POST kérés kezelése a jelszó megváltoztatására
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({ message: 'Mindkét jelszót meg kell adnia' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'A két jelszó nem egyezik' });
    }

    try {
        const userCollection = await getCollection('users');
        
        // Keressük a felhasználót a token alapján
        const user = await userCollection.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } 
        });
        
        if (!user) {
            return res.status(400).json({ 
                message: 'A jelszó-visszaállítási token érvénytelen vagy lejárt' 
            });
        }
        
        // Új jelszó hashelése
        const hashedPassword = await hashPassword(password);
        
        // Felhasználó frissítése
        await userCollection.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    password: hashedPassword 
                },
                $unset: { 
                    resetPasswordToken: "", 
                    resetPasswordExpires: "" 
                }
            }
        );
        
        // Sikeres válasz
        res.status(200).json({ 
            message: 'A jelszó sikeresen megváltozott. Most már bejelentkezhet az új jelszavával.' 
        });
    } catch (error) {
        console.error('Jelszó visszaállítási hiba:', error);
        res.status(500).json({ 
            message: 'Szerver hiba történt a jelszó visszaállítása közben', 
            error: error.message 
        });
    }
};

// Forgotpassword módosítása, hogy webes linkeket küldjön
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email cím megadása kötelező' });
    }

    try {
        const userCollection = await getCollection('users');
        const user = await userCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Nincs felhasználó ezzel az email címmel' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = Date.now() + 24 * 3600000; // 24 óra

        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetTokenExpires
                }
            }
        );

        // Webes URL generálása a jelszó visszaállításhoz
        const resetLink = `${req.protocol}://${req.get('host')}/api/auth/reset-password-form/${resetToken}`;

        try {
            // Éles környezetben email küldés
            await sendEmail({
                to: user.email,
                subject: 'Jelszó visszaállítási kérés - IdCard alkalmazás',
                text: `Tisztelt Felhasználónk!

Ezt az üzenetet azért kapta, mert jelszó visszaállítást kezdeményezett az IdCard alkalmazásban.

Kattintson az alábbi linkre a jelszó visszaállításához:
${resetLink}

Ha nem Ön kérte ezt a műveletet, kérjük, hagyja figyelmen kívül ezt az emailt és változtassa meg jelszavát biztonsági okokból.

Üdvözlettel,
IdCard App Csapat`,
                html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
  <h2 style="color: #333;">Jelszó Visszaállítás</h2>
  <p>Tisztelt Felhasználónk!</p>
  <p>Ezt az üzenetet azért kapta, mert jelszó visszaállítást kezdeményezett az IdCard alkalmazásban.</p>
  <p>Kattintson az alábbi gombra a jelszó visszaállításához:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="background-color: #007aff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Jelszó Visszaállítása
    </a>
  </p>
  <p style="font-size: 12px; color: #666;">Ha a gomb nem működik, másolja be ezt a linket a böngészőbe: ${resetLink}</p>
  <p>Ha nem Ön kérte ezt a műveletet, kérjük, hagyja figyelmen kívül ezt az emailt és változtassa meg jelszavát biztonsági okokból.</p>
  <p>Üdvözlettel,<br>IdCard App Csapat</p>
</div>
                `
            });
            console.log('Jelszó visszaállítási email sikeresen elküldve:', email);
            
            res.status(200).json({ 
                message: 'Jelszó visszaállítási email elküldve. Kérjük, ellenőrizze postaládáját!'
            });
        } catch (emailError) {
            console.error('Hiba a jelszó visszaállítási email küldésekor:', emailError);
            
            // Ha a küldés sikertelen, akkor is visszaadjuk a tokent
            res.status(200).json({
                message: 'Jelszó visszaállítási folyamat elindítva, de az email küldés nem sikerült.',
                token: resetToken,
                resetLink: resetLink
            });
        }
    } catch (error) {
        console.error('Elfelejtett jelszó hiba:', error);
        res.status(500).json({ message: 'Hiba a kérés feldolgozásakor', error: error.message });
    }
};

exports.biometricLogin = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Email ellenőrzése
      if (!email) {
        return res.status(400).json({ message: 'Email cím megadása kötelező' });
      }
  
      // Felhasználó keresése email alapján
      const userCollection = await getCollection('users');
      const user = await userCollection.findOne({ email });
      
      if (!user) {
        console.log('Biometric login failed: user not found for email:', email);
        return res.status(400).json({ message: 'Felhasználó nem található' });
      }
  
      // JWT token generálása a felhasználói azonosító alapján
      const token = generateToken(user._id);
  
      console.log('Biometric login successful for user:', email);
      
      // Sikeres válasz
      res.status(200).json({
        message: 'Biometrikus bejelentkezés sikeres',
        token
      });
    } catch (error) {
      console.error('Biometric login error:', error);
      res.status(500).json({ message: 'Szerver hiba', error: error.message });
    }
  };