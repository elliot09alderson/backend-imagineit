import express from 'express';
import { 
    signUpUser, 
    verifyUser, 
    loginUser, 
    veryfyOtp, 
    getUserProfile, 
    refreshAccessToken, 
    updatProfile, 
    logoutUser,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/signup', signUpUser);
router.get('/verify/:token', verifyUser);
router.post('/login', loginUser);
router.post('/verify-otp', veryfyOtp);
router.get('/user', auth, getUserProfile);
router.post('/refresh-token', refreshAccessToken);
router.put('/profile', auth, upload.single('file'), updatProfile);
router.post('/logout', auth, logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
