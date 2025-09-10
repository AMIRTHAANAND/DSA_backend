import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";
import { sendLoginEmail, sendAdminNotification } from "../utils/emailService";  // ✅ updated import

// ✅ Generate JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "30d",
  });
};

// ✅ Register Admin
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role: "admin",
    isApproved: false,
  });

  if (admin) {
    // 🔔 Notify Super Admin
    await sendAdminNotification(admin);

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isApproved: admin.isApproved,
    });
  } else {
    res.status(400);
    throw new Error("Invalid admin data");
  }
});

// ✅ Approve Admin (only Super Admin can do this)
export const approveAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.adminId);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  admin.isApproved = true;
  await admin.save();

  res.json({ message: "Admin approved successfully" });
});

// ✅ Login Admin
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    if (!admin.isApproved) {
      res.status(401);
      throw new Error("Admin not approved by Super Admin");
    }

    // 🔔 Send login email
    await sendLoginEmail(admin.email);

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id.toString()),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});
