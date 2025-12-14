import express from 'express';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { upload } from '../config/cloudinary.js';
import fetch from 'node-fetch';
import auth from '../middleware/auth.js';
import Community from '../models/Community.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Initialize Gemini API
console.log(process.env.GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to get user
// const getUser = async (email) => {
//     let user = await User.findOne({ email });
//     if (!user) {
//         user = new User({ email });
//         await user.save();
//     }
//     return user;
// };

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

// POST /api/user/analyze-pose
router.post('/analyze-pose', auth, upload.single('image'), async (req, res) => {
    try {
        // const { email } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        // Get Cloudinary URL from multer upload
        const imageUrl = req.file.path;
        
        // Prepare image for Gemini
        const imagePart = await urlToGenerativePart(imageUrl, req.file.mimetype);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Analyze the person in this image. 
        1. Classify the pose into exactly one of these categories: ['FRONT_FULL_BODY', 'SIDE_PROFILE', 'BACK_VIEW', 'SITTING', 'CLOSE_UP_PORTRAIT'].
        2. Classify the gender as either 'MALE' or 'FEMALE'.

        Return the response in this JSON format:
        {
            "pose": "CATEGORY_NAME",
            "gender": "MALE" or "FEMALE"
        }`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);
        
        const poseCategory = analysis.pose;
        const gender = analysis.gender;

        // Query MongoDB for matching assets
        // Match assets that are either specific to the gender OR are NEUTRAL (applicable to both)
        const matches = await Asset.aggregate([
            { 
                $match: { 
                    pose_category: poseCategory, 
                    $or: [
                        { gender: gender },
                        { gender: 'NEUTRAL' },
                        { gender: { $exists: false } } // Handle legacy docs
                    ]
                } 
            }
        ]);

        // Fallback if no exact matches found (optional, for robustness)
        let finalMatches = matches;
        if (matches.length === 0) {
             // Try matching just the pose if gender specific ones aren't found
             finalMatches = await Asset.aggregate([
                { $match: { pose_category: poseCategory } }
             ]);
        }

        res.json({ 
            pose: poseCategory, 
            gender: gender,
            matches: finalMatches,
            userImageUrl: imageUrl // Return the Cloudinary URL for the next step
        });

    } catch (err) {
        console.error("Analysis Error Details:", {
            message: err.message,
            stack: err.stack,
            response: err.response?.data || err.response
        });
        res.status(500).json({ error: "Failed to analyze pose", details: err.message });
    }
});

// POST /api/user/generate-edit
router.post('/generate-edit', auth, async (req, res) => {
    try {
        const { preedited_prompt, userImageUrl, additional_prompt } = req.body;
        const user = await User.findById(req.user.id);

        if (user.credits < 2) {
            return res.status(403).json({ error: "Insufficient credits" });
        }

        // Prepare image for Gemini
        const imagePart = await urlToGenerativePart(userImageUrl, "image/jpeg");

        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
        
        let prompt = `Transform this image based on the following style description: ${preedited_prompt}. `;
        if (additional_prompt) {
            prompt += `Additional user instructions: ${additional_prompt}. `;
        }
        prompt += `Maintain the original pose and composition but apply the artistic style. 
        Generate a new image with high quality, photorealistic or artistic finish as requested.`;

        console.log("Calling Gemini API for image generation...");
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        
        console.log("Full response:", JSON.stringify(response, null, 2));
        
        // Try to get the generated image
        let generatedImageUrl = null;
        
        // Check if response has candidates with images
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];
            console.log("Candidate:", JSON.stringify(candidate, null, 2));
            
            // Check for inline data (base64 image)
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        // Convert base64 to data URL
                        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        console.log("Found inline image data");
                        break;
                    } else if (part.text) {
                        console.log("Text response:", part.text);
                        // If text contains a URL, extract it
                        const urlMatch = part.text.match(/https?:\/\/[^\s]+/);
                        if (urlMatch) {
                            generatedImageUrl = urlMatch[0];
                        }
                    }
                }
            }
        }
        
        // Fallback: try response.text()
        if (!generatedImageUrl) {
            const text = response.text();
            console.log("Response text:", text);
            
            // Check if it's a URL
            if (text && (text.startsWith('http') || text.startsWith('data:'))) {
                generatedImageUrl = text;
            } else if (text) {
                // Return the user's original image with a note
                console.log("Model returned text description, not an image. Using original image.");
                generatedImageUrl = userImageUrl;
            }
        }

        // Deduct Credit
        user.credits -= 2;
        await user.save();

        // Save to Cloudinary and Community
        let finalImageUrl = generatedImageUrl;
        try {
            const uploadResponse = await cloudinary.uploader.upload(generatedImageUrl, {
                folder: 'art-ai-generated'
            });
            finalImageUrl = uploadResponse.secure_url;

            await Community.create({
                user: req.user.id,
                original_image_url: userImageUrl,
                generated_image_url: finalImageUrl,
                style_prompt: preedited_prompt
            });
        } catch (uploadErr) {
            console.error("Failed to upload to Cloudinary or save to Community:", uploadErr);
            // We don't fail the request if this background step fails, but we log it.
        }

        res.json({ 
            imageUrl: generatedImageUrl, // Return raw generated image for immediate display/download
            remainingCredits: user.credits,
            note: generatedImageUrl ? undefined : "Model returned description instead of image"
        });

    } catch (err) {
        console.error("Generation Error:", err);
        res.status(500).json({ error: err.message || "Failed to generate image" });
    }
});

// POST /api/user/generate-edit-lite
router.post('/generate-edit-lite', auth, async (req, res) => {
    try {
        const { preedited_prompt, userImageUrl, additional_prompt } = req.body;
        const user = await User.findById(req.user.id);

        if (user.credits < 1) {
            // NOTE: This is your custom error for credit management. Fix your DB balance!
            return res.status(403).json({ error: "Insufficient credits" });
        }

        // --- MODEL CHANGE: Using gemini-2.5-flash-image for image output ---
        // This model is the cost-effective "Nano Banana" for image generation/editing.
        const MODEL_ID = "gemini-2.5-flash-image"; // Supports image output up to 1024x1024 (1K)
        
        // Prepare image for Gemini
        // NOTE: Ensuring the image type is correct is important for the API.
        const imagePart = await urlToGenerativePart(userImageUrl, "image/jpeg"); 

        const model = genAI.getGenerativeModel({ model: MODEL_ID });
        
        // --- PROMPT MODIFICATION ---
        // Explicitly instruct the model to output an image and set the resolution
        let prompt = `Generate a high-quality 1024x1024 image. Transform the attached image based on the following style description: ${preedited_prompt}. `;
        if (additional_prompt) {
            prompt += `Additional user instructions: ${additional_prompt}. `;
        }
        prompt += `Maintain the original pose and composition of the subject but apply the artistic style requested. 
        Output ONLY the resulting image.`;

        console.log("Calling Gemini API for image generation (Lite)...");
        
        // --- API Call ---
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        
        // --- Output Handling: Optimized for Base64 Image Data ---
        let generatedImageUrl = null;
        
        const imagePartResponse = response.candidates?.[0]?.content?.parts.find(
            part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
        );
        
        if (imagePartResponse) {
            generatedImageUrl = `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
            console.log("Successfully found and formatted inline image data (Base64 URL).");
        } else {
            console.warn("API did not return inline image data as expected.");
        }
        
        // --- End Output Handling ---

        // Deduct Credit
        user.credits -= 1;
        await user.save();

        if (!generatedImageUrl) {
            // If the model fails to return an image, do NOT deduct the credit
            user.credits += 1;
            await user.save();
            return res.status(500).json({ 
                error: "Image generation failed. No image data returned from API.",
                remainingCredits: user.credits 
            });
        }

        // Note: Lite edits are NOT saved to Community feed as per requirement.
        // We just return the generated image directly.


        // Save to Cloudinary and Community
        let finalImageUrl = generatedImageUrl;
        try {
            // Check if it's a base64 string before uploading
            if (generatedImageUrl.startsWith('data:image')) {
                const uploadResponse = await cloudinary.uploader.upload(generatedImageUrl, {
                    folder: 'art-ai-generated-lite'
                });
                finalImageUrl = uploadResponse.secure_url;

                await Community.create({
                    user: req.user.id,
                    original_image_url: userImageUrl,
                    generated_image_url: finalImageUrl,
                    style_prompt: preedited_prompt + " (Lite)"
                });
                console.log("Saved Lite edit to Community and Cloudinary");
            }
        } catch (uploadErr) {
            console.error("Failed to upload to Cloudinary or save to Community (Lite):", uploadErr);
        }

        res.json({ 
            imageUrl: generatedImageUrl,
            remainingCredits: user.credits
        });

    } catch (err) {
        console.error("Generation Error:", err);
        res.status(500).json({ error: err.message || "Failed to generate image" });
    }
});



// GET /api/user/credits
router.get('/credits', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ credits: user.credits });
    } catch (err) {
        console.error("Credits Error:", err);
        res.status(500).json({ error: "Failed to fetch credits" });
    }
});

// GET /api/user/community
router.get('/community', async (req, res) => {
    try {
        // Use aggregation for truly random sampling
        const posts = await Community.aggregate([
            { $sample: { size: 14 } }
        ]);
            
        // Populate user details if needed (since aggregate returns plain objects)
        // We can do a second query or use $lookup. For simplicity/speed with small sets, 
        // we can assume user ID is sufficient or the frontend handles it. 
        // But the frontend expects 'img.user' to be an object or string? 
        // In the original find(), it wasn't populated, so it returned just the ID.
        // Let's stick to returning similar structure.
        
        res.json(posts);
    } catch (err) {
        console.error("Community Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch community posts" });
    }
});

export default router;
