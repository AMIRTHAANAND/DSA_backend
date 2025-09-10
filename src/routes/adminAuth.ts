import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { protectAdmin } from '../middleware/adminAuth';

const router = Router();

// Register new admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Admin already exists' });

    const admin = new Admin({ name, email, password, role: 'admin', isApproved: false });
    await admin.save();

    res.status(201).json({ success: true, message: 'Admin registered. Waiting for approval.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve admin
router.put('/approve/:id', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    if (!admin.isApproved) return res.status(403).json({ error: 'Admin not approved yet' });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
