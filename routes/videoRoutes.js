const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Multer middleware
const Video = require('../models/Video'); // Video model
const { uploadVideoToCloudinary } = require('../config/cloudinary'); // Cloudinary uploader

// @route   POST /api/videos/upload
// @desc    Upload a video
// @access  Admin only (we’ll secure later with admin auth)
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Upload video file to Cloudinary
    const result = await uploadVideoToCloudinary(req.file.path);

    // Save video details in MongoDB
    const newVideo = new Video({
      title: req.body.title || 'Untitled Video',
      url: result.secure_url,
      publicId: result.public_id,
    });

    await newVideo.save();

    res.json({ message: 'Video uploaded successfully', video: newVideo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

module.exports = router;
