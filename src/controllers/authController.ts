import { Request, Response } from "express";
import User from "../models/User"; // adjust path if different
import { sendLoginEmail } from "../services/emailService";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Add password validation (e.g. bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Send login email
    await sendLoginEmail(user.email);

    res.json({ message: "Login successful", user });
  } catch (error) {
    console.error("âŒ Error in loginUser:", error);
    res.status(500).json({ error: "Server error" });
  }
};
