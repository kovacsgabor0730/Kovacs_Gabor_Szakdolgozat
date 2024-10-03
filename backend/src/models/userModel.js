const { ObjectId } = require('mongodb');

class User {
    constructor(firstName, lastName, country, city, postalCode, street, number, email, password) {
        this._id = new ObjectId();
        this.name = {
            first_name: firstName,
            last_name: lastName
        };
        this.address = {
            country,
            city,
            postal_code: postalCode,
            street,
            number
        };
        this.email = email;
        this.password = password;
    }
}

module.exports = User;
