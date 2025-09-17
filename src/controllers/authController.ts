import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcryptjs";
import { sendLoginEmail } from "../services/emailService";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, username: true, firstName: true, lastName: true, role: true, password: true, isActive: true } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Send login email
    await sendLoginEmail(user.email);

    res.json({ message: "Login successful", user: { id: user.id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({ error: "Server error" });
  }
};
