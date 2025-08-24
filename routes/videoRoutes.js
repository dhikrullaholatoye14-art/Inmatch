const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Video = require('../models/video');
const { uploadVideoToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// POST /api/videos/upload
router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

    const { title = 'Untitled Video', description = '', matchId } = req.body;

    const result = await uploadVideoToCloudinary(req.file.path);

    const video = await Video.create({
      title,
      description,
      matchId: matchId || undefined,
      videoUrl: result.secure_url,
      publicId: result.public_id,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({ message: 'Video uploaded successfully', video });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos
router.get('/', async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// POST /api/videos/delete  <-- ✅ matches your frontend
router.delete('/:id', async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    await deleteFromCloudinary(video.publicId);
    await video.deleteOne();

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
