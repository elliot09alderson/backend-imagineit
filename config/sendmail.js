import { createTransport } from "nodemailer"

const sendMail=async({email,subject,html})=>{
    console.log(process.env.SMTP_PASSWORD,process.env.SMTP_USER)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.log("==================================================");
        console.log("MOCK EMAIL SENDING (Credentials missing)");
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML: ${html}`);
        console.log("==================================================");
        return;
    }

    try {
        const transporter=createTransport({
            host:"smtp.gmail.com",
            port:465,
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASSWORD
            }
        })
        await transporter.sendMail({
            from:process.env.SMTP_USER,
            to:email,
            subject,
            html,
        })
    } catch (error) {
        console.log("==================================================");
        console.log("EMAIL SENDING FAILED (Fallback to Mock)");
        console.log(`Error: ${error.message}`);
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML: ${html}`);
        console.log("==================================================");
    }
}
export default sendMail;