import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "quickcommerceapp@gmail.com",
        pass: "imbbdbvmupmjinhh"
    },
    requireTLS: true
});

transporter.verify((error) => {
    if (error) {
        console.error("❌ SMTP connection failed:", error);
    } else {
        console.log("✅ Gmail SMTP server is ready");
        transporter.sendMail({
            from: "quickcommerceapp@gmail.com",
            to: "quickcommerceapp@gmail.com",
            subject: "Test",
            text: "Hello"
        }).then(() => console.log("Sent")).catch(e => console.error(e));
    }
});
