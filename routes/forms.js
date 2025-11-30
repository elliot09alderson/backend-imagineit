import express from 'express';
import Proposal from '../models/Proposal.js';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// @route   POST api/forms/proposal
// @desc    Submit a business proposal
// @access  Public
router.post('/proposal', async (req, res) => {
    const { name, email, idea } = req.body;

    // Validation
    if (!name || !email || !idea) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Basic Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

    try {
        const newProposal = new Proposal({
            name,
            email,
            idea
        });

        await newProposal.save();
        res.json({ msg: 'Proposal submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/forms/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', async (req, res) => {
    const { contact } = req.body;

    if (!contact) {
        return res.status(400).json({ msg: 'Please enter an email or phone number' });
    }

    try {
        // Check if already subscribed
        const existingSubscriber = await Subscriber.findOne({ contact });
        if (existingSubscriber) {
            return res.status(400).json({ msg: 'You are already subscribed' });
        }

        const newSubscriber = new Subscriber({
            contact
        });

        await newSubscriber.save();
        res.json({ msg: 'Subscribed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
