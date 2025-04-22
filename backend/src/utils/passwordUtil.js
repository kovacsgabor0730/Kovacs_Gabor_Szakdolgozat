const bcrypt = require('bcrypt');
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);

/**
 * Jelszó titkosítása bcrypt algoritmus használatával.
 * A titkosítás erősségét a SALT_ROUNDS környezeti változó határozza meg.
 * 
 * @async
 * @param {string} password - A titkosítandó jelszó
 * @returns {Promise<string>} A titkosított jelszó hash-értéke
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Ellenőrzi, hogy a megadott jelszó megegyezik-e a korábban titkosított jelszóval.
 * 
 * @async
 * @param {string} password - Az ellenőrizendő jelszó
 * @param {string} hashedPassword - A tárolt, titkosított jelszó
 * @returns {Promise<boolean>} Igaz, ha a jelszó megegyezik, hamis ha nem
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Ellenőrzi, hogy egy jelszó megfelel-e a biztonsági követelményeknek.
 * A jelszónak tartalmaznia kell legalább 8 karaktert, kisbetűt, nagybetűt,
 * számot és speciális karaktert.
 * 
 * @param {string} password - Az ellenőrizendő jelszó
 * @returns {boolean} Igaz, ha a jelszó megfelel a követelményeknek
 */
const isPasswordStrong = (password) => {
    const validatePasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    return validatePasswordRegex.test(password);
};

module.exports = {
    hashPassword,
    comparePassword,
    isPasswordStrong
};
