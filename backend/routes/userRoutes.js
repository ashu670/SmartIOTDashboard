const express = require('express');
const router = express.Router();
const {
    getMe,
    updateProfile,
    requestPasswordChange,
    getPendingRequests,
    updateRequestStatus,
    changePassword,
    getMyPasswordRequest
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public/Auth routes (protected by token)
router.get('/me', auth, getMe);
router.patch('/me', auth, upload.single('photo'), updateProfile);
router.post('/change-password', auth, changePassword);

// Password Requests
router.get('/password-requests/me', auth, getMyPasswordRequest);
router.post('/password-requests', auth, requestPasswordChange);
router.get('/password-requests', auth, getPendingRequests); // Controller checks admin
router.patch('/password-requests/:id/status', auth, updateRequestStatus); // Controller checks admin

module.exports = router;
