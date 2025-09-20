const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true }, // path to local file or URL
    isURL: { type: Boolean, default: true },   // true if URL, false if uploaded
}, { timestamps: true }); // timestamps automatically adds createdAt and updatedAt

module.exports = mongoose.model('video', videoSchema); // lowercase 'video' as per your request
