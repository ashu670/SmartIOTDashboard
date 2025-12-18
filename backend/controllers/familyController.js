const User = require('../models/User');

/**
 * Get all family members (users in the same house)
 * Accessible to all authenticated users (admin and members)
 * Returns all users where houseName matches the authenticated user's houseName
 */
exports.getFamilyMembers = async (req, res) => {
  try {
    if (!req.user || !req.user.houseName) {
      return res.status(400).json({ message: 'User must have a house name' });
    }

    // Find all users in the same house (family)
    // This includes both admin and regular members
    const members = await User.find({ houseName: req.user.houseName })
      .select('-password')
      .sort({ role: -1, name: 1 }); // Sort by role (admin first), then by name

    res.json({
      members: members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        houseName: member.houseName,
        authorized: member.authorized,
        photo: member.photo
      }))
    });
  } catch (err) {
    console.error('Error fetching family members:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

