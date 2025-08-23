// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Where uploaded videos will be stored
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter to only accept video files
function fileFilter(req, file, cb) {
  const allowed = /mp4|webm|ogg/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Only video files are allowed'));
}

const upload = multer({ storage, fileFilter });

module.exports = upload;
