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

        const adminEmail = 'itsgeekyyashaswi@gmail.com';
        const adminPassword = 'yashaswi@123';

        let admin = await User.findOne({ email: adminEmail });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (admin) {
            console.log('Admin user already exists. Updating role to admin and resetting password/credits...');
            admin.role = 'admin';
            admin.password = hashedPassword;
            admin.credits = 100;
            await admin.save();
        } else {
            console.log('Creating admin user...');
            admin = new User({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                credits: 100
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
