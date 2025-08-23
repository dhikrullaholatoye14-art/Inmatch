const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure folder exists
const uploadDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  }
});

const upload = multer({ storage });

// Upload video endpoint
router.post('/upload-video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `/uploads/videos/${req.file.filename}`;
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('Video upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/delete-video', async (req, res) => {
    try {
        const { videoUrl, matchId } = req.body;
        if (!videoUrl || !matchId) return res.status(400).json({ error: 'Missing data' });

        const filePath = path.join(__dirname, '../', videoUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // Remove from match-details DB
        const MatchDetails = require('../models/matchDetails');
        await MatchDetails.updateOne(
            { matchId },
            { $pull: { videos: { videoUrl } } }
        );

        res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});


module.exports = router;
