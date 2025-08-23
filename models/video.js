const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
  videoUrl: { type: String, required: true },   // Cloudinary URL
  publicId: { type: String, required: true },   // Cloudinary public_id
  mimeType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
