const path = require('path');

// Upload video controller
const uploadVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Build the public URL of the video
  const videoUrl = `/uploads/videos/${req.file.filename}`;

  res.json({
    message: 'Upload successful',
    url: videoUrl,
  });
};

module.exports = { uploadVideo };
