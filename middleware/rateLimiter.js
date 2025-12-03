import RateLimit from '../models/RateLimit.js';

const DAILY_LIMIT = 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export const rateLimiter = async (req, res, next) => {
  try {
    // Get IP address (handle proxy headers if behind Nginx/Load Balancer)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Find or create rate limit record
    let record = await RateLimit.findOne({ ip });
    const now = new Date();

    if (!record) {
      record = new RateLimit({
        ip,
        count: 1,
        resetTime: new Date(now.getTime() + WINDOW_MS)
      });
      await record.save();
      return next();
    }

    // Check if window has expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = new Date(now.getTime() + WINDOW_MS);
      await record.save();
      return next();
    }

    // Check limit
    if (record.count >= DAILY_LIMIT) {
      return res.status(429).json({
        msg: 'Daily API limit exceeded. You have reached 120 requests per day.'
      });
    }

    // Increment count
    record.count += 1;
    await record.save();
    next();

  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open if DB error, or fail closed? Fail open is usually safer for UX.
    next();
  }
};
