const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Video = require('../models/Video');
const cloudinary = require('../config/cloudinary');
const MatchDetails = require('../models/MatchDetails'); // Ensure you have this

// POST /api/videos/upload
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        let videoUrl = '';
        let publicId = null;

        if (req.body.videoUrl) {
            // URL upload
            videoUrl = req.body.videoUrl;
        } else if (req.file) {
            // File upload to Cloudinary
            const filename = `video-${Date.now()}`;
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
            videoUrl = result.secure_url;
            publicId = result.public_id;
        } else {
            return res.status(400).json({ message: "No video file or URL provided" });
        }

        const video = await Video.create({
            title: req.body.title || 'Untitled',
            videoUrl,
            publicId,
            matchId: req.body.matchId,
            mimeType: req.file?.mimetype || 'url'
        });

        res.status(201).json({ video });
    } catch (err) {
        console.error('Video upload failed:', err);
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

// PATCH /api/videos/:matchId -> update match details (stats/goals/videos)
router.patch('/:matchId', async (req, res) => {
    try {
        const { stats, goalsDetails, videos } = req.body;

        for (let v of videos) {
            if (!v._id) {
                const newVideo = await Video.create({
                    title: v.title,
                    videoUrl: v.videoUrl,
                    matchId: req.params.matchId
                });
                v._id = newVideo._id;
            }
        }

        const details = await MatchDetails.findOneAndUpdate(
            { matchId: req.params.matchId },
            { stats, goalsDetails, videos },
            { upsert: true, new: true }
        );

        res.status(200).json({ details });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update match details', error: err.message });
    }
});

// DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        // Only delete from Cloudinary if publicId exists
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
