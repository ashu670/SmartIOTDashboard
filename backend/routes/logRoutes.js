const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const auth = require('../middleware/auth');

router.get('/', auth, getLogs);

module.exports = router;
