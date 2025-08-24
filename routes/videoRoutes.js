const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Video = require('../models/Video');
const MatchDetails = require('../models/MatchDetails'); // make sure this is imported
const cloudinary = require('../config/cloudinary');

// ------------------ Upload video file ------------------
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const filename = `video-${Date.now()}`;

    // wrap upload_stream in a promise
    const streamUpload = (reqFile) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', public_id: filename },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(reqFile.buffer);
      });
    };

    const result = await streamUpload(req.file);

    const video = await Video.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      videoUrl: result.secure_url,
      publicId: result.public_id,
      matchId: req.body.matchId,
      mimeType: req.file.mimetype
    });

    res.status(201).json({ video });

  } catch (err) {
    console.error('Video upload failed:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ------------------ Update match details (including URL videos) ------------------
router.patch('/:id', async (req, res) => {
  try {
    const { stats, goalsDetails, videos } = req.body;

    // Save URL videos that don't have _id yet
    for (let v of videos) {
      if (!v._id) {
        const newVideo = await Video.create({
          title: v.title,
          videoUrl: v.videoUrl,
          matchId: req.params.id
        });
        v._id = newVideo._id; // assign generated ID back
      }
    }

    const details = await MatchDetails.findOneAndUpdate(
      { matchId: req.params.id },
      { stats, goalsDetails, videos },
      { upsert: true, new: true }
    );

    res.status(200).json({ details });
  } catch (err) {
    console.error('Failed to update match details:', err);
    res.status(500).json({ message: 'Failed to update match details', error: err.message });
  }
});

// ------------------ Delete video ------------------
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // delete from Cloudinary if publicId exists
    if (video.publicId) {
      await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
    }

    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });

  } catch (err) {
    console.error('Failed to delete video:', err);
    res.status(500).json({ message: 'Failed to delete video', error: err.message });
  }
});

module.exports = router;
