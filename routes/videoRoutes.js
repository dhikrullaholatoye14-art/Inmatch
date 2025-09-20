const express = require('express');
const router = express.Router();
const multer = require('multer');
const Video = require('../models/video');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier'); // ✅ helps stream buffer to Cloudinary

// ✅ Ensure Cloudinary is configured from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ---- Multer (store file in memory instead of disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only video files are allowed'));
  }
});

// ---- POST /api/videos/upload
router.post('/upload', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

      // ✅ Upload directly to Cloudinary via stream
      const streamUpload = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              folder: "inmatch_videos"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });
      };

      const cloudRes = await streamUpload(req.file.buffer);

      // ✅ Save Cloudinary details in DB
      const newVideo = new Video({
        title: req.body.title || req.file.originalname,
        videoUrl: cloudRes.secure_url,
        public_id: cloudRes.public_id,
        isURL: false
      });

      await newVideo.save();

      return res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          _id: newVideo._id,
          title: newVideo.title,
          videoUrl: newVideo.videoUrl,
          public_id: newVideo.public_id,
          isURL: newVideo.isURL
        }
      });
    } catch (err) {
      console.error("Upload error details:", err); // ✅ log full error
      return res.status(500).json({
        message: 'Upload failed',
        error: err.message || err.toString()
      });
    }
  });
});

// ---- DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
  try {
    const v = await Video.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Not found' });

    // ✅ If video is stored in Cloudinary, delete there first
    if (v.public_id) {
      try {
        await cloudinary.uploader.destroy(v.public_id, { resource_type: "video" });
        console.log("Deleted from Cloudinary:", v.public_id);
      } catch (e) {
        console.warn("Cloudinary delete failed:", e.message);
      }
    }

    // ✅ Remove from DB
    await v.deleteOne();
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
