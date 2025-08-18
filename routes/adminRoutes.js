const express = require('express');
const { registerAdmin, loginAdmin, getAllAdmins, removeAdmin, getMe, getStats } = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authenticate, registerAdmin); // Only Super Admin can add new admins
router.post('/login', loginAdmin); // Open for all admins
router.get('/me', authenticate, getMe);
router.get('/stats', authenticate, getStats);
router.get('/', authenticate, getAllAdmins); // Only Super Admin can view admins
router.delete('/:id', authenticate, removeAdmin); // Only Super Admin can remove an admin

module.exports = router;
