const mongoose = require('mongoose');
const MatchDetails = require('../models/matchDetails');
const Match = require('../models/Match');
const cloudinary = require("../config/cloudinary"); // ✅ Cloudinary config
const fs = require("fs");

// ✅ Helper function for Cloudinary upload
async function uploadToCloudinary(filePath, title) {
    console.log("🚀 Attempting Cloudinary upload with config:", {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY ? "✅ Exists" : "❌ Missing",
        apiSecret: process.env.CLOUDINARY_API_SECRET ? "✅ Exists" : "❌ Missing"
    });
    console.log("📂 Uploading file:", filePath);

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: "inmatch/videos",
        });

        console.log("✅ Cloudinary upload success:", result.secure_url);

        try { fs.unlinkSync(filePath); } catch {}
        return {
            title,
            videoUrl: result.secure_url,
            public_id: result.public_id,
            isURL: false,
        };
    } catch (err) {
        console.error("❌ Cloudinary upload failed:", err.message, err);
        throw err;
    }
}

// ✅ Get Match Details by Match ID
exports.getMatchDetails = async (req, res) => {
    const { matchId } = req.params;
    console.log(`Fetching details for matchId: ${matchId}`);

    try {
        if (!mongoose.isValidObjectId(matchId)) {
            return res.status(400).json({ message: "Invalid match ID format" });
        }

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        const details = await MatchDetails.findOne({ matchId });

        if (!details) {
            return res.status(404).json({ message: 'Match details not found' });
        }

        console.log("Match Details Found:", details);

        res.status(200).json({ match, details });
    } catch (error) {
        console.error("Error fetching match details:", error.message, error.stack);
        res.status(500).json({ message: 'Error fetching match details', error: error.message || error });
    }
};

// ✅ Add Match Details
exports.addMatchDetails = async (req, res) => {
    const { matchId } = req.params;
    const { videos, stats, goalsDetails } = req.body;

    try {
        if (!mongoose.isValidObjectId(matchId)) {
            return res.status(400).json({ message: "Invalid match ID format" });
        }

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Check if details already exist
        let existingDetails = await MatchDetails.findOne({ matchId });
        if (existingDetails) {
            return res.status(400).json({ message: 'Details already exist. Use PATCH to update.' });
        }

        const newDetails = new MatchDetails({
            matchId,
            videos: videos || [],
            stats: stats || { possession: "0 - 0", shots: "0 - 0", fouls: "0 - 0", corners: "0 - 0" },
            goalsDetails: goalsDetails || { team1: [], team2: [] }
        });

        await newDetails.save();
        res.status(201).json({ message: 'Match details added successfully', details: newDetails });
    } catch (error) {
        console.error("Error adding match details:", error.message, error.stack);
        res.status(500).json({ message: 'Error adding match details', error: error.message || error });
    }
};

// ✅ Update Match Details (PATCH)
exports.updateMatchDetails = async (req, res) => {
    try {
        const { stats, goalsDetails, videos } = req.body;
        const matchId = req.params.matchId;

        // Fetch existing details
        const existing = await MatchDetails.findOne({ matchId });
        if (!existing) return res.status(404).json({ message: 'MatchDetails not found' });

        const update = {};
        if (stats) update.stats = stats;
        if (goalsDetails) update.goalsDetails = goalsDetails;

        if (Array.isArray(videos)) {
            // ✅ Step 1: Find orphaned videos
            const oldPublicIds = existing.videos.map(v => v.public_id).filter(Boolean);
            const newPublicIds = videos.map(v => v.public_id).filter(Boolean);
            const orphaned = oldPublicIds.filter(id => !newPublicIds.includes(id));

            // ✅ Step 2: Delete orphaned videos from Cloudinary
            for (const publicId of orphaned) {
                try {
                    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
                    console.log(`🗑️ Deleted orphaned video from Cloudinary: ${publicId}`);
                } catch (err) {
                    console.error(`❌ Failed to delete video ${publicId} from Cloudinary:`, err);
                }
            }

            // ✅ Step 3: Normalize videos; handle Cloudinary uploads if any file exists
            update.videos = await Promise.all(
                videos.map(async (v) => {
                    if (v.filePath) {
                        return await uploadToCloudinary(v.filePath, v.title);
                    }

                    // Existing video (keep as is)
                    return {
                        _id: v._id,
                        title: v.title,
                        videoUrl: v.videoUrl,
                        public_id: v.public_id || null,
                        isURL: !!v.isURL,
                    };
                })
            );
        }

        // ✅ Step 4: Save updated details
        const doc = await MatchDetails.findOneAndUpdate(
            { matchId },
            { $set: update },
            { new: true, runValidators: true }
        );

        return res.json({ details: doc });

    } catch (err) {
        console.error('❌ match-details PATCH error:', err.message, err.stack);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};
