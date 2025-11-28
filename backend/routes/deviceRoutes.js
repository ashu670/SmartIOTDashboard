const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addDevice, getUserDevices, toggleDevice, updateTemperature } = require('../controllers/deviceController');

router.post('/', auth, addDevice);
router.get('/', auth, getUserDevices);
router.put('/:id/toggle', auth, toggleDevice);
router.put('/:id/temperature', auth, updateTemperature);

module.exports = router;

