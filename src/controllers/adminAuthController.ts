<<<<<<< HEAD
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

// Generate JWT token for admin
const generateAdminToken = (adminId: string): string => {
  return jwt.sign({ adminId, type: 'admin' }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register admin (requires approval)
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin (not approved by default)
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isApproved: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin registration submitted. Awaiting approval.',
      data: { admin },
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Login admin
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if admin is approved
    if (!admin.isApproved) {
      res.status(401).json({
        success: false,
        message: 'Admin account pending approval',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateAdminToken(admin.id);

    // Return admin data without password
    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get pending admin approvals (super admin only)
export const getPendingAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingAdmins = await prisma.admin.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { admins: pendingAdmins },
    });
  } catch (error) {
    console.error('Get pending admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Approve admin (super admin only)
export const approveAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    if (admin.isApproved) {
      res.status(400).json({
        success: false,
        message: 'Admin is already approved',
      });
      return;
    }

    const approvedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: { isApproved: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      message: 'Admin approved successfully',
      data: { admin: approvedAdmin },
    });
  } catch (error) {
    console.error('Approve admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Reject admin (super admin only)
export const rejectAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    await prisma.admin.delete({
      where: { id: adminId }
    });

    res.json({
      success: true,
      message: 'Admin registration rejected and removed',
    });
  } catch (error) {
    console.error('Reject admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
=======
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
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
