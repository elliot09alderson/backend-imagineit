import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newContact = new Contact({
            name,
            email,
            message
        });

        await newContact.save();

        res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        console.error("Contact Form Error:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
