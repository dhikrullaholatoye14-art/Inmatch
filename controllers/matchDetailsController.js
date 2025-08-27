const mongoose = require('mongoose');
const MatchDetails = require('../models/matchDetails');
const Match = require('../models/Match');

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

    const update = {};
    if (stats) update.stats = stats;
    if (goalsDetails) update.goalsDetails = goalsDetails;

    if (Array.isArray(videos)) {
      // Normalize videos to only fields we allow
      update.videos = videos.map(v => ({
        _id: v._id,           // may be undefined for new URL-only items
        title: v.title,
        videoUrl: v.videoUrl,
        isURL: !!v.isURL
      }));
    }

    const doc = await MatchDetails.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: update },
      { new: true, runValidators: true } // no upsert here; require it to exist first
    );

    if (!doc) return res.status(404).json({ message: 'MatchDetails not found' });
    return res.json({ details: doc });
    
  } catch (err) {
    console.error('match-details PATCH error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
