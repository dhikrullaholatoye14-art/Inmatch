const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Video = require('../models/Video');
const MatchDetails = require('../models/MatchDetails'); // import model
const cloudinary = require('../config/cloudinary'); // configured Cloudinary instance

// ------------------- Upload Video File -------------------
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No video file provided' });

        const filename = `video-${Date.now()}`;

        // Upload buffer to Cloudinary
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'video', public_id: filename },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const result = await streamUpload(req.file.buffer);

        // Save video in DB
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

// ------------------- Patch / Update Match Details -------------------
router.patch('/:id', async (req, res) => {
    try {
        const { stats, goalsDetails, videos } = req.body;

        // Ensure all videos have _id (for URL videos or unsaved ones)
        const savedVideos = [];
        for (let v of videos) {
            if (v._id) {
                savedVideos.push(v);
            } else {
                const newVideo = await Video.create({
                    title: v.title,
                    videoUrl: v.videoUrl,
                    matchId: req.params.id
                });
                savedVideos.push({
                    _id: newVideo._id,
                    title: newVideo.title,
                    videoUrl: newVideo.videoUrl
                });
            }
        }

        // Update or create match details
        const details = await MatchDetails.findOneAndUpdate(
            { matchId: req.params.id },
            { stats, goalsDetails, videos: savedVideos },
            { upsert: true, new: true }
        );

        res.status(200).json({ details });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update match details', error: err.message });
    }
});

// ------------------- Delete Video -------------------
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        // Delete from Cloudinary if it has a publicId
        if (video.publicId) {
            await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
        }

        await video.deleteOne();
        res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete video', error: err.message });
    }
});

module.exports = router;
