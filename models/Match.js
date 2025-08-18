const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true,
  },
  team1: {
    name: { type: String, required: true },
    logo: { type: String, required: true },
  },
  team2: {
    name: { type: String, required: true },
    logo: { type: String, required: true },
  },
  time: { type: Date, required: true },  // Match start time as Date
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed"],
    default: "upcoming",
  },
  scoreTeam1: { type: Number, default: 0 },
  scoreTeam2: { type: Number, default: 0 },
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
