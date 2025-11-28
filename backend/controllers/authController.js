const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const { name, email, password, role, houseName } = req.body;
  try {
    if (!name || !email || !password || !houseName) {
      return res.status(400).json({ message: 'Name, email, password, and house name are required' });
    }
    
    // Only allow admin signup - regular users must be added by admin
    const validRole = role && role === 'admin' ? 'admin' : 'user';
    
    // If trying to register as user, they need to be authorized by admin first
    if (validRole === 'user') {
      return res.status(403).json({ message: 'User registration is not allowed. Please contact your family head (admin) to add you.' });
    }
    
    // Check if admin already exists for this house
    if (validRole === 'admin') {
      const existingAdmin = await User.findOne({ houseName, role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'An admin already exists for this house name. Please choose a different house name or contact the existing admin.' });
      }
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ 
      name, 
      email, 
      password: hash, 
      role: validRole, 
      houseName: houseName.trim(),
      authorized: true 
    });
    res.status(201).json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        houseName: user.houseName,
        authorized: user.authorized,
        photo: user.photo 
      }, 
      token: generateToken(user) 
    });
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An admin already exists for this house name.' });
    }
    res.status(500).json({ message: 'Server error' }); 
  }
};

exports.login = async (req, res) => {
  const { email, password, houseName, role } = req.body;
  try {
    if (!email || !password || !houseName || !role) {
      return res.status(400).json({ message: 'Email, password, house name, and role are required' });
    }
    
    const user = await User.findOne({ email, houseName: houseName.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or house name. Please check your house name and credentials.' });
    }
    
    // Verify role matches
    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role for this account' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Check if user is authorized (admin is always authorized)
    if (!user.authorized && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is pending authorization from the family head (admin). Please contact your admin.' });
    }
    
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        houseName: user.houseName,
        authorized: user.authorized,
        photo: user.photo 
      }, 
      token: generateToken(user) 
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

