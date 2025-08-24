const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadVideoToCloudinary = (filePath) => {
  return cloudinary.uploader.upload(filePath, {
    resource_type: 'video',
    folder: 'inmatch/videos',
  });
};

const deleteFromCloudinary = (publicId) => {
  // for videos you must pass resource_type: 'video' here too
  return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
};

module.exports = { uploadVideoToCloudinary, deleteFromCloudinary };
