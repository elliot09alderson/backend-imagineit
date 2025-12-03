import sanitize from "mongo-sanitize";
import { redisClient } from "../index.js";
import TryCatch from "../middleware/TryCatch.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendmail from "../config/sendmail.js";
import { generateHtmlOTP, getVerifyEmailHtml, getResetPasswordHtml } from "../config/html.js";
import { loginUSer, signupSchema } from "../config/zodValidation.js";
import { genearateToken, generateAccessToken, verifyRefreshToken } from "../config/generateToken.js";
import cloudinary from "../config/cloudinary.js";

export const signUpUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = signupSchema.safeParse(sanitizedBody);
  let firstErrormessage = "validation error";
  if (!validation.success) {
    const zodError = validation.error;
    let allError = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "Unknown",
        message: issue.message || "validation error",
        code: issue.code,
      }));
    }
    firstErrormessage = allError[0]?.message || "validation Error";

    return res.json({
      message: firstErrormessage,
      error: allError,
    });
  }
  const { name, email, password, contact, role } = validation.data;

  const rateLimiting = `signup-rate-limiting:${req.ip}:${email}`;

  if (await redisClient.get(rateLimiting)) {
    return res.status(400).json({
      message: "To many request please try again later",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "user already exists",
    });
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyKey = `verify:${verifyToken}`;
  const verifyEmailKey = `verify:email:${email}`;
  const oldToken = await redisClient.get(verifyEmailKey);
  if (oldToken) {
    await redisClient.del(`verify:${oldToken}`);
  }
  const data = JSON.stringify({
    name,
    email,
    password: hashPassword,
    contact,
    role: role || "user"
  });

  await redisClient.set(verifyKey, data, "EX", 900);
  await redisClient.set(verifyEmailKey, verifyToken, "EX", 900);
  const subject = "verification link for your account creation";
  const html = getVerifyEmailHtml({ name, email, verifyToken });

  await sendmail({ email, subject, html });
  await redisClient.set(rateLimiting, "true", "EX", 60);
  res.status(200).json({
    message:
      "if your email is valid then verification link is send to your email and valid for 1 minutes",
  });
  console.log(name, email, password, contact);
});


export const verifyUser = TryCatch(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      message: "token is missing"
    });
  }
  const verifyKey = `verify:${token}`;
  const storeDataJson = await redisClient.get(verifyKey);
  if (!storeDataJson) {
    return res.status(400).json({
      message: "verification link is expired"
    });
  }
  const storeData = JSON.parse(storeDataJson);

  const existingUser = await User.findOne({ email: storeData.email });
  if (existingUser) {
    return res.status(400).json({
      message: "user already exist"
    });
  }
  const newUser = await User.create({
    name: storeData.name,
    email: storeData.email,
    password: storeData.password,
    contact: storeData.contact,
    role: storeData.role || "user",
  });
  await redisClient.del(verifyKey);
  res.status(200).json({
    message: "Email is verified sucessfully !user created sucessfylly",
    user: {
      _id: newUser._id, name: newUser.name,
      email: newUser.email,
      contact: newUser.contact,
      role: newUser.role,
    }
  });
});


export const loginUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = loginUSer.safeParse(sanitizedBody);
  let firstErrormessage = "validation error";
  if (!validation.success) {
    const zodError = validation.error;
    let allError = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "Unknown",
        message: issue.message || "validation error",
        code: issue.code,
      }));
    }
    firstErrormessage = allError[0]?.message || "validation Error";

    return res.json({
      message: firstErrormessage,
      errors: allError,
    });
  }
  const { email, password } = validation.data;


  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "To many request please try again later"
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({

      message: "invalid cradentials"
    });
  }
  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    return res.status(400).json({
      message: "invalid credentials"
    });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, "EX", 300);
  const subject = "otp for verification  ";
  const html = generateHtmlOTP({ name: user.name, email, otp });
  await sendmail({ email, subject, html });
  await redisClient.set(rateLimitKey, "true", "EX", 60);
  res.status(200).json({
    message: "if your email and password is correct then otp is sent to yur email "
  });
});

export const veryfyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and otp is required"

    });
  }
  const otpKey = `otp:${email}`;
  const storeOtp = await redisClient.get(otpKey);
  if (!storeOtp) {
    return res.status(400).json({
      message: "otp expired or invalid"

    });
  }


  if (storeOtp !== otp) {
    return res.status(400).json({
      message: "Invalid otp"

    });
  }
  await redisClient.del(otpKey);
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({
      message: "User not found"
    });
  }
  const { accessToken, refreshToken } = await genearateToken(user._id, res);
  res.status(200).json({
    message: "Login sucessfully",
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      role: user.role,
    }
  });
});


export const getUserProfile = TryCatch(async (req, res) => {
  const user = req.user.id;
  const userData = await User.findById(user).select("-password");
  if (!userData) {
    return res.status(404).json({
      message: "user not found",
      userData,
    });
  }
  res.json({
    message: "User profile fetched sucessfully",
    userData,

  });
});

export const refreshAccessToken = TryCatch(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({
      message: "please login there is no refresh token",
    });
  }
  const decode = await verifyRefreshToken(refreshToken);
  if (!decode) {
    return res.status(403).json({
      message: "Invalid or expired refresh token"
    });
  }
  const accessToken = await generateAccessToken(decode.id, res);
  return res.status(200).json({
    message: "Access token refreshed sucessfullly",
    accessToken
  });


});

export const updatProfile = TryCatch(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({
      message: "please login you are not authenticated"
    });
  }
  const { name, address, city, country, contact } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(400).json({
      message: "no user found with this id"
    });
  }

  if (req.file) {
    if (user.profileImage?.publicId) {
      await cloudinary.uploader.destroy(user.profileImage.publicId);
    }
    user.profileImage = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }


  //update user fields

  user.name = name || user.name;
  user.address = address || user.address;
  user.city = city || user.city;
  user.country = country || user.country;
  user.contact = contact || user.contact;
  await user.save();


  res.status(200).json({
    message: "Profile updated successfully",
    user,
  });

});

export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({
      message: "you are not authenticated",
    });
  }
  const refreshTokenKey = `refresh_token:${userId}`;
  await redisClient.del(refreshTokenKey);
  // Cookies are no longer used, so no need to clear them


  return res.status(200).json({
    message: "Logged out sucessfully",
  });
});
export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetKey = `reset_password:${resetToken}`;

  // Store token in Redis with 15 minutes expiration
  await redisClient.set(resetKey, user._id.toString(), "EX", 15 * 60);

  const subject = "Reset your password";
  const html = getResetPasswordHtml({ name: user.name, email, token: resetToken });

  await sendmail({ email, subject, html });

  res.status(200).json({
    message: "Password reset link sent to your email",
  });
});

export const resetPassword = TryCatch(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  const resetKey = `reset_password:${token}`;
  const userId = await redisClient.get(resetKey);

  if (!userId) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashPassword = await bcrypt.hash(password, 10);
  user.password = hashPassword;
  await user.save();

  await redisClient.del(resetKey);

  res.status(200).json({
    message: "Password reset successfully",
  });
});

export const resendOtp = TryCatch(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many requests, please try again later"
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, "EX", 300);

  const subject = "Resend OTP for verification";
  const html = generateHtmlOTP({ name: user.name, email, otp });
  
  await sendmail({ email, subject, html });
  await redisClient.set(rateLimitKey, "true", "EX", 60);

  res.status(200).json({
    message: "OTP resent successfully"
  });
});
