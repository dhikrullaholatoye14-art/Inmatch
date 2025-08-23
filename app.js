const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

// Routes
const videoRoutes = require('./routes/video');
const uploadRoutes = require('./routes/upload');
const leagueRoutes = require('./routes/leagueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchDetailsRoutes = require('./routes/matchDetails');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();

// ✅ CORS Middleware - only once, before routes
app.use(cors({
    origin: 'https://www.inmatch.com.ng', // frontend domain
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));
 // all uploaded files
app.use(express.static('frontend-admin')); // admin frontend

// Routes
app.use('/admin', uploadRoutes);
app.use('/api', videoRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/match-details', matchDetailsRoutes);
app.use('/api/admins', adminRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('Error connecting to MongoDB:', err));

// Import Models
require('./models/matchDetails');

// Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://www.inmatch.com.ng', // frontend domain
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
