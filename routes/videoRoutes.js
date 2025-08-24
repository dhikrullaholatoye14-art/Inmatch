const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadVideoToCloudinary = require('../utils/cloudinaryUpload');
const Video = require('../models/Video');

// POST /api/videos/upload
router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const filename = `video-${Date.now()}`;
    const result = await uploadVideoToCloudinary(req.file.buffer, filename);

    const video = await Video.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      videoUrl: result.secure_url,
      publicId: result.public_id,       // store public_id
      matchId: req.body.matchId,
      mimeType: req.file.mimetype
    });

    res.status(201).json({ video });
  } catch (err) {
    console.error('Video upload failed:', err);
    next(err);
  }
});

// DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Use stored publicId for deletion
    await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });

    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete video', error: err.message });
  }
});

module.exports = router;