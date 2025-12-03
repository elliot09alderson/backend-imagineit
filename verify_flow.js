import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5005/api/auth';
const LOG_FILE = path.join(process.cwd(), 'server.log');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLogContent() {
    return fs.readFileSync(LOG_FILE, 'utf8');
}

async function findTokenInLogs(email) {
    let retries = 10;
    while (retries > 0) {
        const logs = await getLogContent();
        // Look for verification link: /verify/TOKEN
        const regex = new RegExp(`verify/([a-zA-Z0-9]+)`);
        const match = logs.match(regex);
        // We need to make sure it's a recent one, but for this test we assume clean log or unique email
        if (match) {
            return match[1];
        }
        await sleep(1000);
        retries--;
    }
    throw new Error("Token not found in logs");
}

async function findOtpInLogs(email) {
    let retries = 10;
    while (retries > 0) {
        const logs = await getLogContent();
        // Look for OTP: "Your OTP is 123456" or similar in HTML
        // In sendmail.js mock: "HTML: ... 123456 ..."
        // Let's look for 6 digits
        const regex = new RegExp(`>(\\d{6})<`); // Assuming it's in a tag like <b>123456</b>
        // Or just search for the number in the mock output
        // The mock output prints `HTML: ...`
        // Let's try to match the specific structure if possible, or just the last 6 digit number
        const match = logs.match(/(\d{6})/g);
        if (match && match.length > 0) {
            return match[match.length - 1];
        }
        await sleep(1000);
        retries--;
    }
    throw new Error("OTP not found in logs");
}

async function testFlow() {
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    console.log(`Starting test for ${email}...`);

    // 1. Signup
    console.log("1. Signup...");
    const signupRes = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, confirmPassword: password })
    });
    const signupData = await signupRes.json();
    console.log("Signup Response:", signupData);
    if (!signupRes.ok) throw new Error("Signup failed");

    // 2. Extract Verification Token
    console.log("2. Waiting for verification email...");
    const token = await findTokenInLogs(email);
    console.log("Verification Token:", token);

    // 3. Verify Email
    console.log("3. Verifying email...");
    const verifyRes = await fetch(`${BASE_URL}/verify/${token}`);
    const verifyData = await verifyRes.json();
    console.log("Verify Response:", verifyData);
    if (!verifyRes.ok) throw new Error("Verification failed");

    // 4. Login (Step 1)
    console.log("4. Login (Credentials)...");
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);
    if (!loginRes.ok) throw new Error("Login failed");

    // 5. Extract OTP
    console.log("5. Waiting for OTP...");
    const otp = await findOtpInLogs(email);
    console.log("OTP:", otp);

    // 6. Verify OTP (Step 2)
    console.log("6. Verify OTP...");
    const otpRes = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });
    const otpData = await otpRes.json();
    console.log("OTP Verify Response:", otpData);
    if (!otpRes.ok) throw new Error("OTP Verification failed");

    console.log("SUCCESS: Full flow verified!");
}

testFlow().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
