const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'League name is required'], // Field is required
    trim: true, // Remove leading/trailing spaces
    unique: true, // Ensure unique league names
    minlength: [1, 'League name cannot be empty'], // Prevent empty strings
  },

  logo: {
    type: String, // URL for the league logo
    required: [true, 'Logo URL is required'],
},

});

const League = mongoose.model('League', leagueSchema);
module.exports = League;

