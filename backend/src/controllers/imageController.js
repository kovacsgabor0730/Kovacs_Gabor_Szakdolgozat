const multer = require('multer');
const { uploadImageToFlask } = require('../utils/flaskClient');
const path = require('path');

// Konfiguráljuk a tárolást
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, './../../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Létrehozzuk a multer példányt, de még nem alkalmazzuk
const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, and .jpeg format allowed!'), false);
        }
    }
});

// Controller függvény
const uploadImages = async (req, res) => {
    console.log('Received request to upload images');
    
    // A multer upload middleware egyszer fut le
    const upload = uploadMiddleware.array('images', 1);
    
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: err.message });
        }

        // Debug információk
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        // Ellenőrizzük a fájlokat
        if (!req.files || req.files.length < 1) {
            return res.status(400).json({ message: 'At least one image is required!' });
        }

        try {
            // Feldolgozzuk a fájlokat
            const results = await Promise.all(req.files.map(file => {
                console.log('Processing file:', file.path);
                return uploadImageToFlask(file.path);
            }));
            
            console.log('OCR results:', results);
            
            res.status(200).json({
                message: 'Images uploaded and processed successfully!',
                results
            });
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({ message: 'Error processing images', error: error.message });
        }
    });
};

module.exports = {
    uploadImages
};