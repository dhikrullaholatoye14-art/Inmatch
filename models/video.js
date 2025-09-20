// models/video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true }, // Cloudinary secure_url or external URL
  publicId: { type: String },    // Cloudinary public_id when uploaded there
  isURL: { type: Boolean, default: true }, // true => external URL, false => uploaded to cloudinary
  mimeType: { type: String },
  matchId: { type: String }, // optional relation to match
}, { timestamps: true });

module.exports = mongoose.model('video', videoSchema); // lowercase name as your project expects
