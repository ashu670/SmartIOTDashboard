const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFamilyMembers } = require('../controllers/familyController');

// Get all family members (accessible to all authenticated users)
router.get('/members', auth, getFamilyMembers);

module.exports = router;

