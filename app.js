const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const path = require('path');


const cors = require('cors');

dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const uploadRoutes = require('./routes/upload'); 
app.use('/admin', uploadRoutes);


// Make files in public/uploads available at /uploads/...
app.use('/uploads', require('express').static(path.join(__dirname, 'public', 'uploads')));


// CORS configuration to allow all origins, adjust based on your environment
app.use(cors({
  origin: '*', // Or specify allowed domains like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

app.use(express.static('frontend-admin'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('Error connecting to MongoDB:', err));

// Import Models
require('./models/matchDetails'); // Importing the matchDetails model

// Import Routes
const leagueRoutes = require('./routes/leagueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchDetailsRoutes = require('./routes/matchDetails');
const adminRoutes = require('./routes/adminRoutes');

// Use Routes
app.use('/api/leagues', leagueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/match-details' , matchDetailsRoutes);
app.use('/api/admins', adminRoutes); // Admin routes

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins, adjust based on your setup
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinMatch', (matchId) => {
    console.log(`User joined match room: ${matchId}`);
    socket.join(matchId); 
  });

  socket.on('sendUpdate', (data) => {
    console.log('Broadcasting update to match room:', data.matchId);
    io.to(data.matchId).emit('matchUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
