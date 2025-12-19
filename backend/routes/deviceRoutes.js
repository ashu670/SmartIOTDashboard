const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addDevice, getUserDevices, toggleDevice, updateTemperature, updateBrightness, updateColor, updateSpeed, deleteDevice } = require('../controllers/deviceController');

router.post('/', auth, addDevice);
router.get('/', auth, getUserDevices);
router.put('/:id/toggle', auth, toggleDevice);
router.put('/:id/temperature', auth, updateTemperature);
router.put('/:id/brightness', auth, updateBrightness);
router.put('/:id/color', auth, updateColor);
router.put('/:id/speed', auth, updateSpeed);
router.delete('/:id', auth, deleteDevice);

module.exports = router;

