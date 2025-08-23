const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // the multer middleware
const path = require('path');

// POST /api/upload-video
router.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const videoUrl = `/uploads/videos/${req.file.filename}`;
  res.json({ url: videoUrl });
});

module.exports = router;
