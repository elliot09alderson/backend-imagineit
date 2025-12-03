import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  },
  resetTime: {
    type: Date,
    required: true
  }
});

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

export default RateLimit;
