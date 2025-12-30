// config/cloudinary.js
const cloudinary = require("cloudinary").v2;

// Ensure config is applied from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🔍 Cloudinary configured with:", {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "❌ Missing",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "✅ Exists" : "❌ Missing",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "✅ Exists" : "❌ Missing",
});

module.exports = cloudinary;
