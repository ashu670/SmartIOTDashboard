const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: Number },
  name: { type: String, required: true },
  type: { type: String, enum: ['AC/Heater', 'Lights', 'Fan'], required: true },
  location: { type: String, default: 'Unknown' },
  status: { type: String, enum: ['on', 'off'], default: 'off' },
  value: { type: Number, default: 0 }, // For AC/Heater temperature
  houseName: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: true }, // Admin adds devices, so auto-approved
  lastUpdated: { type: Date, default: Date.now },
  lastToggledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activityLog: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    action: { type: String }, // 'turned on', 'turned off', 'temperature set to X'
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);

