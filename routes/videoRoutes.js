const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/video');

// ---- Normalize uploads dir to projectRoot/src/uploads
const UPLOADS_DIR = path.resolve(__dirname, '../src/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---- Multer storage (writes to UPLOADS_DIR)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // sanitize filename a bit (remove spaces)
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

// ---- POST /api/videos/upload  (multipart/form-data)
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title = '', matchId = null } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

    const relativePath = `uploads/${req.file.filename}`; // how the client will access it

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

// ---- DELETE /api/videos/:id  (deletes DB doc and local file if any)
router.delete('/:id', async (req, res) => {
  try {
    const v = await Video.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Not found' });

    // If it's a locally uploaded file, remove the actual file
    if (v.isURL === false && v.videoUrl) {
      const fileOnDisk = path.join(UPLOADS_DIR, path.basename(v.videoUrl));
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (e) {
        console.warn('Failed to delete file on disk:', fileOnDisk, e.message);
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
