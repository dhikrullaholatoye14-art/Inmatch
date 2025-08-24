const multer = require('multer');
const os = require('os');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
  cb(new Error('Only video files are allowed'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});
