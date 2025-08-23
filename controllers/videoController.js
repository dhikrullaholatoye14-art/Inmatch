const Video = require('../models/Video');

// @desc Upload a new video
// @route POST /api/videos/upload
// @access Private (admin)
exports.uploadVideo = async (req, res) => {
  try {
    // Multer puts the uploaded file info in req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, matchId } = req.body;

    // Save video info in MongoDB
    const video = new Video({
      title,
      matchId,
      filePath: req.file.path, // stored by multer
      mimeType: req.file.mimetype,
    });

    await video.save();

    res.status(201).json({ message: 'Video uploaded successfully', video });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while uploading video' });
  }
};

// @desc Get all videos
// @route GET /api/videos
// @access Public
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching videos' });
  }
};

// @desc Get single video by ID
// @route GET /api/videos/:id
// @access Public
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching video' });
  }
};
