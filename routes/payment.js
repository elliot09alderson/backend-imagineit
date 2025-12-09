import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

let razorpay;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    } else {
        console.warn("WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env. Payment routes will not work.");
    }
} catch (err) {
    console.error("Failed to initialize Razorpay:", err.message);
}

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ error: "Payment service unavailable (Configuration missing)" });
        }
        const { amount, credits, currency = "INR" } = req.body;

        // Validate amount/credits mapping to prevent tampering
        let valid = false;
        
        if (currency === "INR") {
            if (amount === 99 && credits === 10) valid = true;
            if (amount === 149 && credits === 20) valid = true;
        } else {
            // USD or other currencies (assuming USD for now based on frontend)
            // Allow small floating point differences if needed, but exact match is better
            if (amount === 1.2 && credits === 10) valid = true;
            if (amount === 1.8 && credits === 20) valid = true;
        }

        if (!valid) {
            return res.status(400).json({ error: "Invalid package selected" });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise/cents)
            currency: currency,
            receipt: `rcpt_${Date.now().toString().slice(-8)}_${req.user.id.slice(-6)}`,
            notes: {
                userId: req.user.id,
                credits: credits
            }
        };

        const order = await razorpay.orders.create(options);
        res.json(order);

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ error: "Failed to create order", details: error.message });
    }
});

// POST /api/payment/verify-payment
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = req.body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ error: "Payment service unavailable (Configuration missing)" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment is successful
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Update credits
            user.credits += credits;
            await user.save();

            res.json({ 
                success: true, 
                message: "Payment verified and credits added", 
                newCredits: user.credits 
            });
        } else {
            res.status(400).json({ error: "Invalid signature" });
        }

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

export default router;
