const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const superAdmin = new Admin({
      name: 'Dicco',
      email: 'graphwellintellect@gmail.com',
      password: 'dickobaba2002',
      role: 'superadmin',
    });

    await superAdmin.save();
    console.log('Super Admin created successfully.');
    process.exit();
  } catch (error) {
    console.error('Error creating Super Admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
