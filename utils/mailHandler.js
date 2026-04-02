const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "5a6d9b0c241b14",
        pass: "4c72351c3d27b0",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
        return info;
    },
    sendUserPasswordMail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "Thong tin tai khoan",
            text: `Tai khoan cua ban da duoc tao.\nUsername: ${username}\nPassword: ${password}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="padding: 24px;">
                        <h2 style="margin: 0 0 16px; color: #111827;">Thong tin tai khoan</h2>
                        <p style="margin: 0 0 12px; color: #374151;">Tai khoan cua ban da duoc tao trong he thong.</p>
                        <p style="margin: 0 0 8px; color: #111827;"><b>Username:</b> ${username}</p>
                        <p style="margin: 0 0 16px; color: #111827;"><b>Password:</b> ${password}</p>
                        <p style="margin: 0; color: #6b7280;">Vui long dang nhap va doi mat khau sau lan su dung dau tien.</p>
                    </div>
                </div>
            `
        });

        console.log("Message sent:", info.messageId);
        return info;
    }
}
