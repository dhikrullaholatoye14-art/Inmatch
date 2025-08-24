const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/video'); // lowercase as you said

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage, 
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid video type'));
    }
});

// --- Upload video ---
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        const { title, matchId } = req.body;
        if (!title || (!req.file && !req.body.videoUrl)) return res.status(400).json({ message: 'Title and video required' });

        const video = new Video({
            title,
            videoUrl: req.file ? `uploads/${req.file.filename}` : req.body.videoUrl,
            isURL: req.file ? false : true
        });

        await video.save();
        res.status(201).json({ video });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- Delete video ---
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        // Delete file if local
        if (!video.isURL) {
            const filePath = path.join(__dirname, '../', video.videoUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await video.remove();
        res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting video' });
    }
});

module.exports = router;
