const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/video');

// ---- Normalize uploads dir
const UPLOADS_DIR = path.resolve(__dirname, '../src/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---- Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const base = path.basename(file.originalname).replace(/\s+/g, '-');
    const uniqueName = `${Date.now()}-${base}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only video files are allowed'));
  }
});

// ---- POST /api/videos/upload
router.post('/upload', (req, res, next) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: err.message });
    }

    console.log("UPLOAD HIT:", req.file);

    try {
      const { title = '' } = req.body;
      if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

      // Return path relative to /uploads
      const relativePath = `uploads/${req.file.filename}`;

      const newVideo = new Video({
        title: title || req.file.originalname,
        videoUrl: relativePath,
        isURL: false
      });

      await newVideo.save();

      return res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          _id: newVideo._id,
          title: newVideo.title,
          videoUrl: newVideo.videoUrl,
          isURL: newVideo.isURL
        }
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
});

// ---- DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
  try {
    const v = await Video.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Not found' });

    if (v.isURL === false && v.videoUrl) {
      const fileOnDisk = path.join(UPLOADS_DIR, path.basename(v.videoUrl));
      if (fs.existsSync(fileOnDisk)) {
        fs.unlinkSync(fileOnDisk);
        console.log("Deleted file:", fileOnDisk);
      }
    }

    await v.deleteOne();
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
