// utils/cleanupVideo.js
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Video = require('../models/video');
const cloudinary = require('../config/cloudinary');

// run every hour (adjust as needed)
cron.schedule('0 * * * *', async () => {
  console.log('Running video cleanup job...');
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    const oldVideos = await Video.find({ createdAt: { $lt: cutoff } });

    for (const vid of oldVideos) {
      try {
        // If Cloudinary-managed
        if (vid.isURL === false && vid.publicId) {
          try {
            await cloudinary.uploader.destroy(vid.publicId, { resource_type: 'video' });
            console.log('Deleted from Cloudinary:', vid.publicId);
          } catch (e) {
            console.warn('Cloudinary delete failed for', vid.publicId, e.message || e);
          }
        }

        // If stored locally under uploads/ (unlikely if using Cloudinary exclusively)
        if (vid.isURL === false && vid.videoUrl && vid.videoUrl.startsWith('uploads/')) {
          try {
            const fileOnDisk = path.join(__dirname, '..', 'src', 'uploads', path.basename(vid.videoUrl));
            if (fs.existsSync(fileOnDisk)) {
              fs.unlinkSync(fileOnDisk);
              console.log('Deleted local file:', fileOnDisk);
            }
          } catch (e) {
            console.warn('Local file delete error:', e.message || e);
          }
        }

        // Finally remove DB record
        await vid.deleteOne();
        console.log('Deleted DB doc for video id:', vid._id);
      } catch (errVid) {
        console.error('Error deleting video doc:', vid._id, errVid);
      }
    }
  } catch (err) {
    console.error('Error in cleanup job:', err);
  }
});
