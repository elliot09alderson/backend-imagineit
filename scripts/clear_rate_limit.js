import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearRateLimit = async () => {
    const redis = new IORedis(process.env.REDIS_URL);
    // Clear all keys that look like rate limits
    const keys = await redis.keys('*rate-limit*'); 
    if (keys.length > 0) {
        await redis.del(keys);
        console.log('Cleared keys:', keys);
    } else {
        console.log('No rate limit keys found');
    }
    // Also clear specific signup/login keys if they don't match the above pattern
    const authKeys = await redis.keys('*:*:*'); // Broad pattern, be careful. Better to be specific.
    // Let's stick to the patterns we saw in code: `login-rate-limit:...`, `signup-rate-limiting:...`
    const specificKeys = await redis.keys('*rate-limit*');
    
    redis.quit();
};

clearRateLimit();
