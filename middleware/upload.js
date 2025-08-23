const multer = require("multer");
const path = require("path");

// Store files temporarily before uploading to Cloudinary
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});

// Accept only video files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mkv|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

module.exports = upload;
