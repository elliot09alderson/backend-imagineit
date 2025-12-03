import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
export const genearateToken = async (id, res) => {
  const accessToken = await jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = await jwt.sign(
    { id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  const refreshTokeyKey = `refresh_token:${id}`;
  await redisClient.set(refreshTokeyKey, refreshToken, 'EX', 7 * 24 * 60 * 60);
  
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (token) => {


    try {
        if(!token)throw new Error("No token provided")
        const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
        const storeToken = await redisClient.get(`refresh_token:${decode.id}`);
        
        if (!storeToken  || storeToken!== token) {
         throw new Error("Invalid or revoked refresh token")
        }
        return decode;
        
    } catch (error) {
        console.log("Error verifying refresh Token:",error.message);
        return null
    }
    
    
};

export const generateAccessToken=async(id,res)=>{
    try {
        
        const accessToken= jwt.sign({id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1m"})
        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:1*60*1000,
        })
        return accessToken
    } catch (error) {
     console.error("Eroor on generating accessToken",error.message)
    }
}
