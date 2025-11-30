import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/image-editor-banana';
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB at', dbUri);

        const adminEmail = 'pratikverma9691@gmail.com';
        const adminPassword = 'Deadpool@123';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating role to admin...');
            admin.role = 'admin';
            // Optionally update password if needed
            // admin.password = await bcrypt.hash(adminPassword, 10); 
            await admin.save();
        } else {
            console.log('Creating admin user...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin = new User({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                credits: 100 // Give admin 100 credits
            });
            await admin.save();
        }

        console.log('Admin user seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
