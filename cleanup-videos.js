const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MatchDetails = require('./models/matchDetails'); // adjust path if needed
const Video = require('./models/video'); // adjust path if needed

async function cleanupVideos() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const allMatches = await MatchDetails.find({});
        console.log(`Found ${allMatches.length} match details`);

        for (let match of allMatches) {
            if (!match.videos || !match.videos.length) continue;

            let updatedVideos = [];

            for (let vid of match.videos) {
                let keep = true;

                // Check if file exists in uploads
                if (!vid.isURL && vid.videoUrl) {
                    const filePath = path.join(__dirname, 'src', vid.videoUrl.replace(/^\/+/, '')); // remove leading /
                    if (!fs.existsSync(filePath)) {
                        keep = false; // file missing, delete
                        console.log(`Deleting ghost video: ${vid.videoUrl} in match ${match._id}`);
                    }
                }

                // Check if video exists in Video collection
                if (vid._id) {
                    const existsInCollection = await Video.exists({ _id: vid._id });
                    if (!existsInCollection) {
                        keep = false;
                        console.log(`Deleting video not in collection: ${vid._id}`);
                    }
                }

                if (keep) updatedVideos.push(vid);
            }

            // Update match details with cleaned videos array
            match.videos = updatedVideos;
            await match.save({ validateBeforeSave: false });

        }

        console.log('Cleanup completed.');
        process.exit(0);
    } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
    }
}

cleanupVideos();
