import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import formsRoutes from './routes/forms.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://imagineit.cloud', 'https://www.imagineit.cloud'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/image-editor-banana')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Artistic AI Image Editor API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
