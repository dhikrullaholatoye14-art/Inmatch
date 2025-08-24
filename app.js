const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

// Load env vars first
dotenv.config();

const app = express();

// ✅ Routes
const videoRoutes = require('./routes/videoRoutes'); 
const leagueRoutes = require('./routes/leagueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchDetailsRoutes = require('./routes/matchDetails');
const adminRoutes = require('./routes/adminRoutes');

// ✅ CORS Middleware (production + localhost for dev)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://www.inmatch.com.ng'
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://www.inmatch.com.ng'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serving admin frontend (keep if needed)
app.use(express.static('frontend-admin'));

// ✅ API Routes
app.use('/api/videos', videoRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/match-details', matchDetailsRoutes);
app.use('/api/admins', adminRoutes);

// ✅ Global JSON error handler (must be after routes)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
});

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.log('❌ Error connecting to MongoDB:', err));

// Import Models
require('../models/matchDetails');

// ✅ Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://www.inmatch.com.ng'
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://www.inmatch.com.ng'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
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

// ✅ Extra safety logging
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Routes active: /api/videos, /api/leagues, /api/matches, /api/match-details, /api/admins');
});
