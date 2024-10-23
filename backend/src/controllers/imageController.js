const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './../uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, and .jpeg format allowed!'), false);
        }
    }
}).array('images', 2); 

exports.uploadImages = async (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.files || req.files.length !== 2) {
            return res.status(400).json({ message: 'Two images are required!' });
        }

        res.status(200).json({
            message: 'Images uploaded successfully!',
            files: req.files
        });
        console.log(req.files);
    });
};
