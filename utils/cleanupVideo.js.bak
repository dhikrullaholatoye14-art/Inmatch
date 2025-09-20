const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Video = require('../models/video'); // lowercase

const UPLOADS_DIR = path.resolve(__dirname, '../src/uploads');

// Runs every hour
cron.schedule('0 * * * *', async () => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
  const oldVideos = await Video.find({ isURL: false, createdAt: { $lt: cutoff } });

  for (let vid of oldVideos) {
    try {
      const filePath = path.join(UPLOADS_DIR, path.basename(vid.videoUrl || ''));
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await vid.remove();
      console.log('Deleted old video:', vid.videoUrl);
    } catch (err) {
      console.error('Error deleting video:', vid.videoUrl, err);
    }
  }
});
