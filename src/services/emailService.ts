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
      from: `"DSA Learning Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Login Notification - DSA Learning Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🔐 Login Notification</h2>
          <p>Hello,</p>
          <p>You have successfully logged in to your DSA Learning Platform account.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Platform:</strong> DSA Learning Platform</p>
          </div>
          <p>If this wasn't you, please secure your account immediately by changing your password.</p>
          <p>Best regards,<br>DSA Learning Platform Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Login email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending login email:", error);
  }
};

export const sendAdminNotification = async (admin: any) => {
  try {
    const mailOptions = {
      from: `"DSA Learning Platform" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Super Admin email
      subject: "🔔 New Admin Registration - Approval Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🔔 Admin Approval Required</h2>
          <p>Hello Super Admin,</p>
          <p>A new admin has registered on the DSA Learning Platform and requires your approval.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Admin Details:</h3>
            <p><strong>Name:</strong> ${admin.name}</p>
            <p><strong>Email:</strong> ${admin.email}</p>
            <p><strong>Role:</strong> ${admin.role}</p>
            <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>Please review and approve this admin in your dashboard.</p>
          <p>Best regards,<br>DSA Learning Platform System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Admin notification email sent to Super Admin");
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
  }
};

export const sendApprovalEmail = async (to: string, name: string) => {
  try {
    const mailOptions = {
      from: `"DSA Learning Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: "✅ Admin Account Approved - DSA Learning Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">✅ Account Approved!</h2>
          <p>Hello ${name},</p>
          <p>Great news! Your admin account has been approved by the Super Admin.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">🎉 Welcome to DSA Learning Platform!</h3>
            <p>You can now:</p>
            <ul>
              <li>Access the admin dashboard</li>
              <li>Manage users and content</li>
              <li>Approve other admin registrations</li>
              <li>View platform analytics</li>
            </ul>
          </div>
          
          <p>You can now log in to your admin account and start managing the platform.</p>
          <p>Best regards,<br>DSA Learning Platform Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Approval email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending approval email:", error);
  }
};

export const sendRejectionEmail = async (to: string, name: string) => {
  try {
    const mailOptions = {
      from: `"DSA Learning Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: "❌ Admin Registration Not Approved - DSA Learning Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Registration Not Approved</h2>
          <p>Hello ${name},</p>
          <p>We regret to inform you that your admin registration for the DSA Learning Platform has not been approved.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Registration Details:</h3>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Status:</strong> Not Approved</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>If you believe this is an error or would like to reapply, please contact the Super Admin.</p>
          <p>Thank you for your interest in the DSA Learning Platform.</p>
          <p>Best regards,<br>DSA Learning Platform Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Rejection email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending rejection email:", error);
  }
};

export const sendUserApprovalEmail = async (to: string, name: string) => {
  try {
    const mailOptions = {
      from: `"DSA Learning Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: "✅ Account Approved - DSA Learning Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">✅ Welcome to DSA Learning Platform!</h2>
          <p>Hello ${name},</p>
          <p>Your account has been approved and you can now access all features of the DSA Learning Platform.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">🚀 Start Learning!</h3>
            <p>You can now:</p>
            <ul>
              <li>Access all learning materials</li>
              <li>Take quizzes and assignments</li>
              <li>Track your progress</li>
              <li>Join discussions</li>
            </ul>
          </div>
          
          <p>Log in to your account and start your DSA learning journey!</p>
          <p>Best regards,<br>DSA Learning Platform Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ User approval email sent to:", to);
  } catch (error) {
    console.error("❌ Error sending user approval email:", error);
  }
};