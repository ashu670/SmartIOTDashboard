const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String },
  type: { type: String, enum: ['info', 'error', 'warning', 'PASSWORD_REQUEST', 'SYSTEM', 'SECURITY'], default: 'info' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);

