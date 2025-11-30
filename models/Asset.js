import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
    pose_category: {
        type: String,
        required: true,
        enum: ['FRONT_FULL_BODY', 'SIDE_PROFILE', 'BACK_VIEW', 'SITTING', 'CLOSE_UP_PORTRAIT', 'ACTION_SHOT']
    },
    cloudinary_url: {
        type: String,
        required: true
    },
    preedited_prompt: {
        type: String,
        required: true
    },
    admin_notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Asset', AssetSchema);
