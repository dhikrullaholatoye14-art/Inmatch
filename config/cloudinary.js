// config/cloudinary.js
const cloudinary = require("cloudinary").v2;

// Ensure config is applied from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

console.log("🔍 Cloudinary configured with:", {
  CLOUD_NAME: process.env.CLOUD_NAME,
  API_KEY: process.env.CLOUD_API_KEY ? "✅ Exists" : "❌ Missing",
  API_SECRET: process.env.CLOUD_API_SECRET ? "✅ Exists" : "❌ Missing",
});

module.exports = cloudinary;
