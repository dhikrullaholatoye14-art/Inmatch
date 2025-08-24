const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/video');

// --- Multer storage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // save inside src/uploads
    cb(null, path.join(__dirname, '../src/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title, matchId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

    const newVideo = new Video({
      title,
      matchId,
      videoUrl: 'uploads/' + req.file.filename, // relative to /uploads
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
