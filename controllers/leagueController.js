const League = require('../models/League');

// Controller to get all leagues
const getAllLeagues = async (req, res) => {
  try {
    const leagues = await League.find(); // Retrieve all leagues from the database
    res.status(200).json(leagues);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching leagues', details: err.message });
  }
};

// Controller to get a single league
const getSingleLeague =  async (req, res) => {
  try {
      const league = await League.findById(req.params.id);
      if (!league) {
          return res.status(404).json({ message: 'League not found' });
      }
      res.json(league);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching league', error });
  }
};


// Controller to add a league
const addLeague = async (req, res) => {
    const { name, logo } = req.body;
    // Validate required fields
    if (!name || !logo) {
      return res.status(400).json({ message: 'All fields are required: name, country, logo, and link.' });
  }

  try {
      // Check if a league with the same name or country exists
      const existingLeague = await League.findOne({ $or: [{ name }] });
      if (existingLeague) {
          return res.status(400).json({ message: 'A league with the same name already exists.' });
      }

      // Create and save the league
      const newLeague = await League.create({ name, logo });
      res.status(201).json({ message: 'League created successfully', league: newLeague });
  } catch (error) {
      res.status(500).json({ message: 'Error creating league', error });
  }}

  const deleteLeague = async (req, res) => {
    try {
      const league = await League.findByIdAndDelete(req.params.id);
      if (!league) {
        return res.status(404).json({ message: 'League not found' });
      }
      res.status(200).json({ message: 'League deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting league', error });
    }
  };

  const updateLeague = async (req, res) => {
    const { id } = req.params; // Extract league ID from the request parameters
    const { name, logo } = req.body; // Extract updated data from the request body
  
    try {
      // Validate required fields
      if (!name || !logo) {
        return res.status(400).json({ message: 'Both name and logo fields are required.' });
      }
  
      // Find the league by ID and update it
      const updatedLeague = await League.findByIdAndUpdate(
        id,
        { name, logo }, // Fields to update
        { new: true, runValidators: true } // Return the updated document and run schema validations
      );
  
      // If league not found, return 404
      if (!updatedLeague) {
        return res.status(404).json({ message: 'League not found.' });
      }
  
      // Respond with the updated league
      res.status(200).json({ message: 'League updated successfully.', league: updatedLeague });
    } catch (error) {
      res.status(500).json({ message: 'Error updating league.', error: error.message });
    }
  };
  

module.exports = { getAllLeagues, getSingleLeague, addLeague, deleteLeague, updateLeague };

  
