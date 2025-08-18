const Match = require('../models/Match');
const moment = require('moment-timezone');
const cron = require('node-cron');

// Create a new match
const createMatch = async (req, res) => {
  const { league, team1, team2, time, scoreTeam1, scoreTeam2, status } = req.body;

  try {
    const matchTime = moment.tz(time, "YYYY-MM-DD HH:mm", "Africa/Lagos").format();

    const newMatch = await Match.create({
      league,
      team1,
      team2,
      time: matchTime,
      scoreTeam1: scoreTeam1 || 0,
      scoreTeam2: scoreTeam2 || 0,
      status: status || "upcoming",
    });

    scheduleMatchStatusUpdate(newMatch._id, newMatch.time);

    // Broadcast new match to all clients
    const io = req.app.get('io');
    io.emit('newMatch', newMatch);

    res.status(201).json({ message: "Match created successfully", match: newMatch });
  } catch (error) {
    res.status(500).json({ message: "Error creating match", error: error.message });
  }
};

// Function to schedule automatic match status updates
const scheduleMatchStatusUpdate = (matchId, matchTime) => {
  cron.schedule('* * * * *', async () => {
    const currentTime = new Date();
    const match = await Match.findById(matchId);

    if (match && match.status === 'upcoming' && currentTime >= new Date(matchTime)) {
      match.status = 'ongoing';
      await match.save();

      const io = global.io; // Broadcast to all connected clients
      io.to(matchId.toString()).emit('statusUpdate', { matchId, status: 'ongoing' });
    }
  });
};

// Delete match after 48 hours if completed
const deleteMatchAfter48Hours = async (matchId) => {
  setTimeout(async () => {
    const match = await Match.findById(matchId);
    if (match && match.status === 'completed') {
      await match.remove();

      const io = global.io;
      io.emit('matchDeleted', { matchId }); // Notify clients about deletion
    }
  }, 48 * 60 * 60 * 1000);
};

// Fetch all matches for a specific league
const getMatchesByLeague = async (req, res) => {
  const { leagueId } = req.params;

  try {
    const matches = await Match.find({ league: leagueId }).populate('league', 'name logo');
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Error fetching matches for the league", error: error.message });
  }
};

// Fetch details of a single match
const getMatchById = async (req, res) => {
  const { id } = req.params;
  console.log("Fetching match by ID:", id); // Debugging

  try {
    const match = await Match.findById(id).populate('league', 'name logo');
    
    if (!match) {
      console.warn("Match not found with ID:", id);
      return res.status(404).json({ message: "Match not found" });
    }

    let elapsedMinutes = null;
    if (match.status === 'ongoing') {
      const matchStartTime = moment(match.time);
      const currentTime = moment();
      elapsedMinutes = Math.min(90, currentTime.diff(matchStartTime, 'minutes'));
    }

    console.log("Returning match data:", match);
    res.status(200).json({ match, elapsedMinutes });
  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({ message: "Error fetching match", error: error.message });
  }
};

// Update match status
const updateMatchStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    match.status = status;
    if (status === 'completed') {
      deleteMatchAfter48Hours(id);
    }

    await match.save();

    const io = req.app.get('io');
    io.to(id.toString()).emit('statusUpdate', { matchId: id, status });

    res.status(200).json({ message: "Match status updated successfully", match });
  } catch (error) {
    res.status(500).json({ message: "Error updating match status", error: error.message });
  }
};

// Update match scores and status (if needed)
const updateMatch = async (req, res) => {
  const { id } = req.params;
  const { scoreTeam1, scoreTeam2, status, team1, team2, time } = req.body;

  console.log("Updating match ID:", id, "with data:", req.body);

  try {
    const match = await Match.findById(id);
    if (!match) {
      console.warn("Match not found:", id);
      return res.status(404).json({ message: "Match not found" });
    }

    if (scoreTeam1 !== undefined) match.scoreTeam1 = scoreTeam1;
    if (scoreTeam2 !== undefined) match.scoreTeam2 = scoreTeam2;
    if (status) match.status = status;
    
    if (team1) {
      if (team1.name) match.team1.name = team1.name;
      if (team1.logo) match.team1.logo = team1.logo;
    }
    if (team2) {
      if (team2.name) match.team2.name = team2.name;
      if (team2.logo) match.team2.logo = team2.logo;
    }

    if (time) {
      match.time = moment.tz(time, "YYYY-MM-DD HH:mm", "Africa/Lagos").format();
    }

    await match.save();

    console.log("Match successfully updated:", match);
    res.status(200).json({ message: "Match updated successfully", match });
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ message: "Error updating match", error: error.message });
  }
};

 const deleteMatch = async (req, res) => {
  const { id } = req.params;
  try {
    const match = await Match.findByIdAndDelete(id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.status(200).json({ message: "Match deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting match", error: error.message });
  }
};

module.exports = {
  createMatch,
  getMatchesByLeague,
  getMatchById,
  updateMatchStatus,
  updateMatch,
  deleteMatch,
};
