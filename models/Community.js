import mongoose from 'mongoose';

const CommunitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  original_image_url: {
    type: String,
    required: true
  },
  generated_image_url: {
    type: String,
    required: true
  },
  style_prompt: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('Community', CommunitySchema);
