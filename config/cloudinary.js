// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

console.log("🔍 Setting Cloudinary config with:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Exists" : "❌ Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Exists" : "❌ Missing");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
