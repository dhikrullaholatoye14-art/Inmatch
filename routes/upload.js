const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadVideo } = require('../controllers/uploadController');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter only video files
const fileFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.mov', '.avi', '.mkv'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

// Route: POST /admin/upload-video
router.post('/upload-video', upload.single('video'), uploadVideo);

module.exports = router;
