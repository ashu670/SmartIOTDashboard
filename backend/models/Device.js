const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: Number },
  name: { type: String, required: true },
  type: { type: String, enum: ['AC/Heater', 'Lights', 'Fan'], required: true },
  location: { type: String, default: 'Unknown' },
  status: { type: String, enum: ['on', 'off'], default: 'off' },

  // Device Specific Fields
  temperature: { type: Number, min: 16, max: 32, default: null },
  brightness: { type: Number, min: 0, max: 100, default: null }, // Fixed max to 100
  color: { type: String, default: null },
  speed: { type: Number, min: 1, max: 5, default: null },

  // Legacy field (deprecated)
  value: { type: Number, default: 0 },

  houseName: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  lastToggledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activityLog: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    action: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);

