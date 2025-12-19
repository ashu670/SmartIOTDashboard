const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    houseName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure unique room names per house
roomSchema.index({ houseName: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
