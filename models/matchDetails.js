const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchDetailsSchema = new Schema({
  matchId: {
    type: Schema.Types.ObjectId,
    ref: 'Match',  // Referencing the Match model
    required: true,
    unique: true  // Ensures one match has one set of details
  },
  videos: [
    {
      title: { type: String, required: true },
      videoUrl: { type: String, required: true }
    }
  ],
  stats: {
    possession: { type: String, required: true },
    shots: { type: String, required: true },
    fouls: { type: String, required: true },
    corners: { type: String, required: true }
  },
  goalsDetails: {
    team1: [
      {
        player: { type: String, required: true },
        time: { type: String, required: true }
      }
    ],
    team2: [
      {
        player: { type: String, required: true },
        time: { type: String, required: true }
      }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('MatchDetails', matchDetailsSchema);
