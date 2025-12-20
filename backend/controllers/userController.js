const User = require('../models/User');
const PasswordRequest = require('../models/PasswordRequest');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // UX sends displayName, map to name
        if (req.body.displayName) user.name = req.body.displayName;
        // Map name to name if sent directly
        if (req.body.name) user.name = req.body.name;

        // Handle File Upload OR URL
        if (req.file) {
            if (user.photo && !user.photo.startsWith('http')) {
                // Cleanup old local file if exists
                try {
                    const oldPath = path.join(__dirname, '../uploads', path.basename(user.photo));
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                } catch (e) { }
            }
            user.photo = `/uploads/${req.file.filename}`;
        } else if (req.body.profileImage) {
            // Logic for URL/Base64 if sent as string
            user.photo = req.body.profileImage;
        }

        await user.save();
        res.json({
            _id: user._id,
            displayName: user.name, // Return as displayName for frontend compatibility
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.photo, // Return as profileImage
            photo: user.photo
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyPasswordRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // If no request exists/embedded default is 'none', return consistent structure or null if 'none'
        // Frontend expects: { status: ... }
        if (!user.passwordResetRequest || user.passwordResetRequest.status === 'none') {
            return res.json(null);
        }
        res.json(user.passwordResetRequest);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requestPasswordChange = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Always override old state
        user.passwordResetRequest = {
            status: 'pending',
            requestedAt: new Date(),
            resolvedAt: null
        };
        await user.save();

        await Log.create({
            userId: req.user._id,
            action: `🔐 Password change requested by ${req.user.name}`,
            type: 'PASSWORD_REQUEST'
        });

        const io = req.app.get('io');
        // Emit minimal info needed for admin list
        io.emit('password_request:new', {
            _id: user.passwordResetRequest._id, // Mongoose might generate subdoc ID, but we rely on userId mostly for actions
            userId: user._id,
            userName: user.name,
            status: 'pending',
            requestedAt: user.passwordResetRequest.requestedAt
        });

        res.status(201).json(user.passwordResetRequest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

        // Find users with status 'pending'
        const users = await User.find({
            houseName: req.user.houseName,
            'passwordResetRequest.status': 'pending'
        }).select('name passwordResetRequest'); // optimize selection

        // Map to flat structure for frontend convenience if needed, OR keep as user objects
        // Frontend Profile.jsx expects: { _id (requestId?), userName, createdAt (requestedAt?) }
        // Let's adapt response to match what frontend likely expects or update frontend.
        // Frontend uses: req.userName, req.createdAt.
        // I will map it.
        const requests = users.map(u => ({
            _id: u._id, // Use UserID as valid ID for toggle actions since embedded request ID might be tricky or unneeded
            userId: u._id,
            userName: u.name,
            status: u.passwordResetRequest.status,
            createdAt: u.passwordResetRequest.requestedAt
        }));

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

        const { status } = req.body; // APPROVED or REJECTED
        // params.id is userId in my new logic (since I mapped it above), previously was request ID
        // Frontend calls: /password-requests/${requestId}/status
        // So I should treat :id as userId.
        const targetUserId = req.params.id;

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.passwordResetRequest.status = status;
        user.passwordResetRequest.resolvedAt = new Date();
        await user.save();

        await Log.create({
            userId: req.user._id, // Admin ID
            action: `Password request for ${user.name} was ${status}`,
            type: 'PASSWORD_REQUEST'
        });

        const io = req.app.get('io');
        io.to(targetUserId.toString()).emit('password_request:update', { status });

        res.json({ status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Check Logic: Admin can always change. Member needs status='approved'.
        if (req.user.role !== 'admin') {
            if (user.passwordResetRequest?.status !== 'approved') {
                return res.status(403).json({ message: 'No approved password change request found.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear request status
        if (user.passwordResetRequest) {
            user.passwordResetRequest.status = 'none';
            user.passwordResetRequest.requestedAt = null;
            user.passwordResetRequest.resolvedAt = null;
        }

        await user.save();

        await Log.create({
            userId: req.user._id,
            action: 'Password changed successfully',
            type: 'info'
        });

        const io = req.app.get('io');
        // Notify user to clear status (sets to none)
        io.to(req.user._id.toString()).emit('password_request:cleared');

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
