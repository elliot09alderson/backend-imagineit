import mongoose from 'mongoose';
import User from '../models/User.js';
import 'dotenv/config';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/image-editor-banana')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

async function creditUser() {
    try {
        const email = 'ehtesham.4820@gmail.com';
        const credits = 10;

        console.log(`Finding user ${email}...`);
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (!user) {
            console.error(`User ${email} NOT FOUND in this database.`);
            // List all users to prove it (optional, maybe too noisy for prod)
             const count = await User.countDocuments();
             console.log(`Total users in DB: ${count}`);
             process.exit(1);
        }

        console.log(`User found: ${user.email}. Current credits: ${user.credits}`);
        user.credits = credits; // Or user.credits += credits? Request said "give ... 10 credits", usually means "add" or "set to". 
        // "Give" implies adding, but "10 credits" could be a specific known balance.
        // Let's assume SET TO 10 based on "give user 10 credits" in a support context often means "grant them a total of 10".
        // BUT "give" often means "add".
        // Let's safe bet: Add 10. 
        // Wait, request: "give ehtesham... 10 credits".
        // Use += 10.
        user.credits += 10;
        
        await user.save();
        console.log(`SUCCESS: User ${user.email} now has ${user.credits} credits.`);

    } catch (error) {
        console.error('Error updating credits:', error);
    } finally {
        mongoose.connection.close();
    }
}

creditUser();
