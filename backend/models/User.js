const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  houseName: { type: String, required: true },
  authorized: { type: Boolean, default: function () { return this.role === 'admin'; } },
  photo: { type: String, default: null },
  passwordResetRequest: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    requestedAt: { type: Date },
    resolvedAt: { type: Date }
  },
  spotify: {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    expiresAt: { type: Number, default: null }
  }
}, { timestamps: true });

// Ensure one admin per house
userSchema.index({ houseName: 1, role: 1 }, { unique: true, partialFilterExpression: { role: 'admin' } });

module.exports = mongoose.model('User', userSchema);

