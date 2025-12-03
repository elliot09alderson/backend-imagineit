import fetch from 'node-fetch';
import { redisClient } from './index.js'; // We might need to connect to redis directly if we want to read the OTP
import IORedis from 'ioredis';

const API_URL = 'http://localhost:5001/api/auth';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';

async function verify() {
    console.log(`Testing with email: ${TEST_EMAIL}`);

    // 1. Send OTP
    console.log('1. Sending OTP...');
    const sendRes = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, name: 'Test User' })
    });
    const sendData = await sendRes.json();
    console.log('Send OTP Response:', sendRes.status, sendData);

    if (!sendRes.ok) {
        console.error('Failed to send OTP');
        process.exit(1);
    }

    // 2. Get OTP from Redis (Simulating user checking email)
    console.log('2. Retrieving OTP from Redis...');
    const redis = new IORedis(process.env.REDIS_URL || { host: 'localhost', port: 6379 });
    const otp = await redis.get(`otp:${TEST_EMAIL}`);
    console.log('Retrieved OTP:', otp);
    
    if (!otp) {
        console.error('OTP not found in Redis');
        process.exit(1);
    }
    await redis.quit();

    // 3. Signup with OTP
    console.log('3. Signing up with OTP...');
    const signupRes = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: TEST_EMAIL, 
            password: TEST_PASSWORD,
            otp: otp 
        })
    });
    const signupData = await signupRes.json();
    console.log('Signup Response:', signupRes.status, signupData);

    if (signupRes.ok && signupData.token) {
        console.log('✅ OTP Authentication Flow Verified Successfully!');
    } else {
        console.error('❌ Signup Failed');
        process.exit(1);
    }
}

verify().catch(console.error);
