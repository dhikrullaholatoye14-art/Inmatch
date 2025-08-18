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
    console.log("📝 Incoming PATCH request:", req.body);
    const { matchId } = req.params;
    const updates = req.body;

    try {
        if (!mongoose.isValidObjectId(matchId)) {
            return res.status(400).json({ message: "Invalid match ID format" });
        }

        const updatedDetails = await MatchDetails.findOneAndUpdate(
            { matchId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedDetails) {
            return res.status(404).json({ message: 'Match details not found' });
        }

        res.status(200).json({ message: 'Match details updated successfully', details: updatedDetails });
    } catch (error) {
        console.error("Error updating match details:", error.message, error.stack);
        res.status(500).json({ message: 'Error updating match details', error: error.message || error });
    }
};
