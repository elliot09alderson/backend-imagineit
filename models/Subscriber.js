import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
    contact: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Subscriber', SubscriberSchema);
