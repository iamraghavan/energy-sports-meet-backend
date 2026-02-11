const multer = require('multer');

// Configure Multer to store files in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
