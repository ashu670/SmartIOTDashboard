const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createRoom, getRooms, applyMood, deleteRoom } = require('../controllers/roomController');

router.post('/', auth, createRoom);
router.get('/', auth, getRooms);
router.post('/:roomId/apply-mood', auth, applyMood);
router.delete('/:roomId', auth, deleteRoom);

module.exports = router;
