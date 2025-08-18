
const express = require('express');
const router = express.Router();
const { getAllLeagues, getSingleLeague, addLeague, deleteLeague, updateLeague } = require('../controllers/leagueController');

// Define GET route for retrieving leagues
router.get('/', getAllLeagues);

// Get a specific league by ID
router.get('/:id', getSingleLeague);

// Define POST route for creating a league
router.post('/', addLeague);

router.delete('/:id', deleteLeague);


// PUT: Update an existing league
router.patch('/:id', updateLeague); // Route to handle editing/updating leagues

module.exports = router;

