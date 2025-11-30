import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Asset from '../models/Asset.js';
import { upload } from '../config/cloudinary.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from 'node-fetch';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to convert URL to base64 for Gemini
async function urlToGenerativePart(url, mimeType) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return {
      inlineData: {
        data: Buffer.from(buffer).toString("base64"),
        mimeType
      },
    };
}

const router = express.Router();

// Protect all admin routes
router.use(auth, adminAuth);

// POST /api/admin/assets - Upload new asset
router.post('/assets', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const { pose_category, preedited_prompt, admin_notes } = req.body;
        
        // Get Cloudinary URL from multer upload
        const cloudinary_url = req.file.path;
        
        const newAsset = new Asset({
            pose_category,
            cloudinary_url,
            preedited_prompt,
            admin_notes
        });

        await newAsset.save();
        res.status(201).json(newAsset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/assets - List all assets
router.get('/assets', async (req, res) => {
    try {
        const assets = await Asset.find().sort({ createdAt: -1 });
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/extract-prompt
router.post('/extract-prompt', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const cloudinary_url = req.file.path;
        
        // Prepare image for Gemini
        const imagePart = await urlToGenerativePart(cloudinary_url, req.file.mimetype);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Describe the artistic style, lighting, composition, and subject of this image in a detailed prompt suitable for image generation. Focus on visual elements. Keep it under 50 words.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ prompt: text });

    } catch (err) {
        console.error("Prompt Extraction Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/assets/:id - Delete asset
router.delete('/assets/:id', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        // Optional: Delete from Cloudinary as well if you want to clean up storage
        // const publicId = asset.cloudinary_url.split('/').pop().split('.')[0];
        // await cloudinary.uploader.destroy(publicId);

        await Asset.findByIdAndDelete(req.params.id);
        res.json({ message: "Asset deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
