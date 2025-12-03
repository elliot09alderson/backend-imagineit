import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5005/api/auth';
const LOG_FILE = path.join(process.cwd(), 'server.log');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLogContent() {
    return fs.readFileSync(LOG_FILE, 'utf8');
}

async function findResetTokenInLogs(email) {
    let retries = 10;
    while (retries > 0) {
        const logs = await getLogContent();
        // Look for reset link: /reset-password/TOKEN
        const regex = new RegExp(`reset-password/([a-zA-Z0-9]+)`);
        const match = logs.match(regex);
        if (match) {
            return match[1];
        }
        await sleep(1000);
        retries--;
    }
    throw new Error("Reset token not found in logs");
}

async function testResetFlow() {
    // Use an existing user or create one. 
    // Since we ran verify_flow.js before, we likely have a user.
    // Let's create a new one to be safe and deterministic.
    const email = `reset${Date.now()}@example.com`;
    const password = 'password123';
    const newPassword = 'newpassword456';
    const name = 'Reset User';

    console.log(`Starting reset test for ${email}...`);

    // 1. Signup & Verify (Helper)
    console.log("1. Creating User...");
    await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, confirmPassword: password })
    });
    
    // Extract verification token
    let retries = 10;
    let verifyToken = null;
    while (retries > 0) {
        const logs = await getLogContent();
        const regex = new RegExp(`verify/([a-zA-Z0-9]+)`);
        const match = logs.match(regex);
        if (match) {
            verifyToken = match[1];
            break;
        }
        await sleep(1000);
        retries--;
    }
    if (!verifyToken) throw new Error("Verification token not found");
    
    await fetch(`${BASE_URL}/verify/${verifyToken}`);
    console.log("User created and verified.");

    // Clear logs to avoid confusion with previous tokens
    fs.writeFileSync(LOG_FILE, ''); 

    // 2. Forgot Password
    console.log("2. Requesting Password Reset...");
    const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const forgotData = await forgotRes.json();
    console.log("Forgot Password Response:", forgotData);
    if (!forgotRes.ok) throw new Error("Forgot password failed");

    // 3. Extract Reset Token
    console.log("3. Waiting for reset email...");
    const resetToken = await findResetTokenInLogs(email);
    console.log("Reset Token:", resetToken);

    // 4. Reset Password
    console.log("4. Resetting Password...");
    const resetRes = await fetch(`${BASE_URL}/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
    });
    const resetData = await resetRes.json();
    console.log("Reset Password Response:", resetData);
    if (!resetRes.ok) throw new Error("Reset password failed");

    // 5. Login with New Password
    console.log("5. Login with New Password...");
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
    });
    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);
    if (!loginRes.ok) throw new Error("Login with new password failed");

    console.log("SUCCESS: Password reset flow verified!");
}

testResetFlow().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
