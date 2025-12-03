
export const getVerifyEmailHtml = ({ name, email, verifyToken }) => {
  const appName = "imagineit.cloud";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyUrl = `${baseUrl}/verify/${verifyToken}`;
  const bannerUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop"; // AI/Futuristic Abstract

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} - Verify Email</title>
    <style>
      body { margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2); border: 1px solid #334155; }
      .header { position: relative; height: 200px; background-image: url('${bannerUrl}'); background-size: cover; background-position: center; }
      .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(15, 23, 42, 0.3), #1e293b); }
      .logo-area { position: absolute; bottom: 20px; left: 40px; }
      .logo-text { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
      .content { padding: 40px; }
      h1 { font-size: 24px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 16px; }
      p { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; font-weight: 600; padding: 16px 36px; border-radius: 12px; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3); }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4); }
      .link-text { font-size: 14px; color: #94a3b8; word-break: break-all; }
      .link-text a { color: #8b5cf6; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #334155; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-overlay"></div>
        <div class="logo-area">
          <div class="logo-text">${appName}</div>
        </div>
      </div>
      <div class="content">
        <h1>Welcome to the Future of Editing</h1>
        <p>Hello ${name || "Creator"},</p>
        <p>You're just one step away from unlocking the full potential of AI-powered image editing. Verify your email to start creating stunning visuals with <strong>${appName}</strong>.</p>
        <div class="btn-container">
          <a href="${verifyUrl}" class="btn">Verify My Account</a>
        </div>
        <p>If the button above doesn't work, simply copy and paste this link into your browser:</p>
        <p class="link-text"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 24px;">This link is valid for <strong>15 minutes</strong>.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
        Unleash your creativity.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const generateHtmlOTP = ({ name, email, otp }) => {
  const appName = "imagineit.cloud";
  const bannerUrl = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop"; // AI Neural Network

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} - OTP Verification</title>
    <style>
      body { margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #334155; }
      .header { padding: 30px; text-align: center; background: linear-gradient(135deg, #0f172a, #1e293b); border-bottom: 1px solid #334155; }
      .logo-text { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -1px; }
      .hero-image { width: 100%; height: 160px; object-fit: cover; opacity: 0.8; }
      .content { padding: 40px; text-align: center; }
      h1 { font-size: 24px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; }
      p { font-size: 16px; color: #cbd5e1; margin-bottom: 24px; line-height: 1.6; }
      .otp-box { background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #8b5cf6; margin: 30px 0; display: inline-block; min-width: 200px; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #334155; }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="${bannerUrl}" alt="AI Header" class="hero-image">
      <div class="header">
        <div class="logo-text">${appName}</div>
      </div>
      <div class="content">
        <h1>Secure Your Account</h1>
        <p>Hi ${name || "Creator"},</p>
        <p>Please use the One-Time Password (OTP) below to complete your verification for <strong>${email}</strong>.</p>
        
        <div class="otp-box">${otp}</div>
        
        <p>This code expires in <strong>5 minutes</strong>. Keep it secure.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const getResetPasswordHtml = ({ name, email, token }) => {
  const appName = "imagineit.cloud";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  const bannerUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"; // Abstract Fluid Art

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} - Reset Password</title>
    <style>
      body { margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #334155; }
      .header { position: relative; height: 180px; background-image: url('${bannerUrl}'); background-size: cover; background-position: center; }
      .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(15, 23, 42, 0.2), #1e293b); }
      .logo-area { position: absolute; bottom: 20px; left: 40px; }
      .logo-text { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
      .content { padding: 40px; }
      h1 { font-size: 24px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 16px; }
      p { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; background: linear-gradient(135deg, #ef4444, #f43f5e); color: #ffffff !important; font-weight: 600; padding: 16px 36px; border-radius: 12px; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3); }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4); }
      .link-text { font-size: 14px; color: #94a3b8; word-break: break-all; }
      .link-text a { color: #f43f5e; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #334155; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-overlay"></div>
        <div class="logo-area">
          <div class="logo-text">${appName}</div>
        </div>
      </div>
      <div class="content">
        <h1>Reset Your Password</h1>
        <p>Hello ${name || "Creator"},</p>
        <p>We received a request to reset the password for your <strong>${appName}</strong> account. If this was you, you can set a new password below.</p>
        <div class="btn-container">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p class="link-text"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 24px;">This link expires in <strong>15 minutes</strong>.</p>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">If you didn't ask for this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
