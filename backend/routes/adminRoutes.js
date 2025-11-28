const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const { 
  getPendingDevices, 
  approveDevice, 
  removeDevice,
  getAllUsers,
  getUserDevices,
  changeUserPassword,
  deleteUser,
  addUser,
  authorizeUser,
  updatePhoto,
  getAdminProfile,
  getDeviceActivity
} = require('../controllers/adminController');

// Admin profile
router.get('/profile', auth, admin, getAdminProfile);

// Device management
router.get('/pending', auth, admin, getPendingDevices);
router.put('/approve/:id', auth, admin, approveDevice);
router.delete('/device/:id', auth, admin, removeDevice);
router.get('/device/:deviceId/activity', auth, admin, getDeviceActivity);

// User management
router.get('/users', auth, admin, getAllUsers);
router.post('/users', auth, admin, upload.single('photo'), addUser);
router.get('/users/:userId/devices', auth, admin, getUserDevices);
router.put('/users/:userId/password', auth, admin, changeUserPassword);
router.put('/users/:userId/authorize', auth, admin, authorizeUser);
router.put('/users/:userId/photo', auth, upload.single('photo'), updatePhoto);
router.delete('/users/:userId', auth, admin, deleteUser);

module.exports = router;

