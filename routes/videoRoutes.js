const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/video'); // lowercase 'video'

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // save in /uploads
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// --- Upload video route ---
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title, matchId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

    const newVideo = new Video({
      title,
      matchId,
      videoUrl: 'uploads/' + req.file.filename, // relative path for express.static
      isURL: false
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
