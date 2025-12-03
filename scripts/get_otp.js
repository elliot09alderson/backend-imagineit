import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const getOtp = async () => {
    const redis = new IORedis(process.env.REDIS_URL);
    const email = 'pratikverma9691@gmail.com';
    const otp = await redis.get(`otp:${email}`);
    console.log('OTP:', otp);
    redis.quit();
};

getOtp();
