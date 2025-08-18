const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (req.user.role !== 'superadmin') {
      console.log('Unauthorized attempt to add admin by:', req.user);
      return res.status(403).json({ message: 'Only Super Admin can add admins.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists.' });

    const newAdmin = new Admin({ name, email, password, role: role || 'admin' });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully.', admin: newAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering admin.', error: error.message });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in.', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // Find admin by ID (extracted from token in `verifyToken` middleware)
    const admin = await Admin.findById(req.user.id).select('-password'); // Exclude password
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin); // Send admin details as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin stats (accessible only to super admins)
 const getStats = async (req, res) => {
  try {
    // Check if the logged-in user is a super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Not authorized' });
    }

    // Fetch all admins and count
    const admins = await Admin.find().select('-password'); // Exclude passwords
    res.json({
      totalAdmins: admins.length,
      admins,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only Super Admin can view admins.' });
    }

    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins.', error: error.message });
  }
};

const removeAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only Super Admin can remove admins.' });
    }

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    res.status(200).json({ message: 'Admin removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing admin.', error: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  removeAdmin,
  getMe,
  getStats,
};
