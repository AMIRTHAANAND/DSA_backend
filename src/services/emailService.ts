import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendLoginEmail = async (to: string) => {
  try {
    const mailOptions = {
      from: `"DSA Project" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Login Notification",
      text: `Hello,

You have successfully logged in to your account.

Time: ${new Date().toLocaleString()}

If this wasn't you, please secure your account immediately.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Login email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending login email:", error);
  }
};

export const sendAdminNotification = async (user: any) => {
  try {
    const mailOptions = {
      from: `"DSA Project" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // Super Admin email
      subject: "New Admin Registration",
      text: `Hello Super Admin,

A new admin has registered on the platform.

Name: ${user.name}
Email: ${user.email}
Role: ${user.role}
Time: ${new Date().toLocaleString()}

Please approve this admin in your dashboard.

Regards,
DSA Project`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Admin notification email sent to Super Admin");
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
  }
};
