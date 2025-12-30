const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadVideo } = require("../controllers/videoController");

// ✅ Multer setup (temporary storage before Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "..", "src", "uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ✅ POST /api/videos/upload
router.post("/upload", upload.single("video"), uploadVideo);

module.exports = router;
