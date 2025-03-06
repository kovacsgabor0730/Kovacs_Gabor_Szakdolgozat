const { ObjectId } = require('mongodb');

class IdCard {
    constructor(userId, idNumber, firstName, lastName, sex, dateOfExpiry, placeOfBirth, mothersMaidenName, canNumber, dateOfBirth) {
        this._id = new ObjectId();
        this.user_id = new ObjectId(userId); // Helyes példányosítás
        this.id_number = idNumber;
        this.first_name = firstName;
        this.last_name = lastName;
        this.sex = sex;
        this.date_of_expiry = dateOfExpiry;
        this.place_of_birth = placeOfBirth;
        this.mothers_maiden_name = mothersMaidenName;
        this.can_number = canNumber;
        this.date_of_birth = dateOfBirth;
        this.modified_at = new Date();
    }
}

module.exports = IdCard;