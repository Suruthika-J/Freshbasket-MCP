import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

transporter.verify((error) => {
    if (error) {
        console.error("❌ SMTP connection failed:", error);
    } else {
        console.log("✅ Gmail SMTP server is ready");
    }
});

export const sendOtpEmail = (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP Verification",
        html: `       <div style="font-family: Arial; text-align: center;">         <h2>Your OTP Code</h2>         <h1 style="color: #4CAF50;">${otp}</h1>         <p>This OTP is valid for a few minutes.</p>       </div>
       `
    };

    setImmediate(() => {
        transporter.sendMail(mailOptions)
            .then(() => console.log("✅ OTP email sent"))
            .catch(err => {
                console.error("❌ Email failed:", err);
                // Fallback ONLY in logs (do NOT expose to frontend)
                console.log("⚠️ OTP fallback (for developer only):", otp);
            });
    });
};
