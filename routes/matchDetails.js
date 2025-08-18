const express = require('express');
const router = express.Router();
const matchDetailsController = require('../controllers/matchDetailsController');

// ✅ Get Match Details for a specific match
router.get('/:matchId', matchDetailsController.getMatchDetails);

// ✅ Add Match Details for an existing match
router.post('/:matchId', matchDetailsController.addMatchDetails);

// ✅ Update Match Details for a specific match
router.patch('/:matchId', matchDetailsController.updateMatchDetails);

module.exports = router;
