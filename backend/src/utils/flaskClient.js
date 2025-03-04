const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FLASK_API_URL = 'http://localhost:5000/upload';
const API_KEY = 'my_secret_api_key';

const uploadImageToFlask = async (imagePath) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    try {
        const response = await axios.post(FLASK_API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'X-API-KEY': API_KEY
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error uploading image to Flask: ${error.message}`);
    }
};

module.exports = { uploadImageToFlask };