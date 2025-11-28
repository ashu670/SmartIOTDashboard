const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Device = require('../models/Device');
const User = require('../models/User');
const Log = require('../models/Log');

exports.getPendingDevices = async (req, res) => {
  try {
    // Get pending devices for admin's house (though admin adds devices as approved now)
    const devices = await Device.find({ houseName: req.user.houseName, approved: false })
      .populate('owner', 'name email')
      .populate('lastToggledBy', 'name email');
    res.json({ devices });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.approveDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    device.approved = true;
    await device.save();
    await Log.create({ deviceId: device._id, userId: req.user._id, action: 'Device approved' });
    const io = req.app.get('io');
    if (io) io.emit('deviceApproved', device);
    res.json({ device });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.removeDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Check if device belongs to admin's house
    if (device.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'Device not found in your house' });
    }
    
    await Log.create({ deviceId: device._id, userId: req.user._id, action: 'Device removed by admin' });
    await Device.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    if (io) io.emit('deviceRemoved', { deviceId: device._id });
    res.json({ message: 'Device removed successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Get only users from admin's house
    const users = await User.find({ role: 'user', houseName: req.user.houseName }).select('-password');
    const allDevices = await Device.find({ houseName: req.user.houseName })
      .populate('lastToggledBy', 'name')
      .populate('owner', 'name');
    
    const usersWithDevices = users.map((user) => {
      return {
        ...user.toObject(),
        devices: allDevices.map(d => ({
          _id: d._id,
          deviceId: d.deviceId,
          name: d.name,
          type: d.type,
          location: d.location,
          status: d.status,
          value: d.value,
          approved: d.approved,
          lastUpdated: d.lastUpdated,
          lastToggledBy: d.lastToggledBy,
          activityLog: d.activityLog || []
        }))
      };
    });
    res.json({ users: usersWithDevices });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    res.json({ user: admin });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getUserDevices = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if user belongs to admin's house
    if (user.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'User not found in your house' });
    }
    
    const devices = await Device.find({ houseName: req.user.houseName })
      .populate('lastToggledBy', 'name')
      .populate('owner', 'name');
    res.json({ user: { id: user._id, name: user.name, email: user.email }, devices });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getDeviceActivity = async (req, res) => {
  try {
    const device = await Device.findById(req.params.deviceId)
      .populate('activityLog.userId', 'name email');
    
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Check if device belongs to admin's house
    if (device.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'Device not found in your house' });
    }
    
    res.json({ device, activityLog: device.activityLog || [] });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Prevent admin from changing another admin's password
    if (user.role === 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Cannot change another admin\'s password' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
    await user.save();
    
    await Log.create({ userId: req.user._id, action: `Password changed for user ${user.email}` });
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    // Check if user belongs to admin's house
    if (user.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'User not found in your house' });
    }
    
    // Delete user's photo if exists
    if (user.photo) {
      const photoPath = path.join(__dirname, '../uploads', path.basename(user.photo));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    // Note: We don't delete devices when deleting user - devices belong to the house
    // Just remove the user's association from devices
    await Device.updateMany(
      { lastToggledBy: userId },
      { $unset: { lastToggledBy: 1 } }
    );
    
    // Log the action before deleting
    await Log.create({ userId: req.user._id, action: `User ${user.email} deleted` });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    const io = req.app.get('io');
    if (io) io.emit('userDeleted', { userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Handle photo upload if provided
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.create({
      name,
      email,
      password: hash,
      role: 'user',
      houseName: req.user.houseName, // Add user to admin's house
      authorized: true, // Admin adds users as authorized
      photo: photoPath
    });
    
    await Log.create({ userId: req.user._id, action: `User ${user.email} added by admin` });
    
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        houseName: user.houseName,
        authorized: user.authorized,
        photo: user.photo
      }
    });
  } catch (err) {
    // Delete uploaded file if user creation failed
    if (req.file) {
      const photoPath = path.join(__dirname, '../uploads', req.file.filename);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.authorizeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin users are already authorized' });
    }
    
    user.authorized = true;
    await user.save();
    
    await Log.create({ userId: req.user._id, action: `User ${user.email} authorized by admin` });
    
    res.json({ message: 'User authorized successfully', user: { id: user._id, name: user.name, email: user.email, authorized: user.authorized } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Admin can update their own photo or any user's photo
    // Regular users can only update their own photo
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own photo' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided' });
    }
    
    // Delete old photo if exists
    if (user.photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads', path.basename(user.photo));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    // Update user photo
    user.photo = `/uploads/${req.file.filename}`;
    await user.save();
    
    await Log.create({ userId: req.user._id, action: `Photo updated for user ${user.email}` });
    
    res.json({
      message: 'Photo updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo
      }
    });
  } catch (err) {
    // Delete uploaded file if update failed
    if (req.file) {
      const photoPath = path.join(__dirname, '../uploads', req.file.filename);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
};

