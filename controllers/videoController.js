const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

// ✅ Upload video endpoint
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const filePath = req.file.path;
    const title = req.body.title || path.basename(filePath);

    console.log("🚀 Uploading video to Cloudinary:", filePath);

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: "inmatch/videos",
    });

    // Delete temp file after upload
    try { fs.unlinkSync(filePath); } catch {}

    const videoData = {
      title,
      videoUrl: result.secure_url,
      public_id: result.public_id,
      isURL: false,
    };

    console.log("✅ Video uploaded:", videoData);

    return res.status(201).json({ message: "Upload successful", video: videoData });
  } catch (err) {
    console.error("❌ Video upload failed:", err.message);
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
