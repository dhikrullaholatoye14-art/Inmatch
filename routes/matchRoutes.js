const express = require('express');
const router = express.Router();
const {
  createMatch,
  updateMatch,
  updateMatchStatus,
  getMatchesByLeague,
  getMatchById,
  deleteMatch,
} = require('../controllers/matchController');

// Route to create a new match
router.post('/', createMatch);

// Route to update a match's scores and/or status
router.patch('/:id', updateMatch);

// Route to update only the status of a match
router.patch('/:id/status', updateMatchStatus);

// Route to get all matches for a specific league
router.get('/league/:leagueId', getMatchesByLeague);

// Route to get details of a single match by ID
router.get('/:id', getMatchById);

router.delete('/:id', deleteMatch);

module.exports = router;