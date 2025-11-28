const Device = require('../models/Device');
const Log = require('../models/Log');
const User = require('../models/User');

exports.addDevice = async (req, res) => {
  const { name, type, location } = req.body;
  try {
    // Only admin can add devices
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can add devices' });
    }
    
    const device = await Device.create({ 
      name, 
      type, 
      location, 
      houseName: req.user.houseName,
      owner: req.user._id, 
      approved: true 
    });
    await Log.create({ deviceId: device._id, userId: req.user._id, action: 'Device added by admin' });
    const io = req.app.get('io');
    if (io) io.emit('deviceAdded', device);
    res.status(201).json({ device });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getUserDevices = async (req, res) => {
  try {
    // Get devices for the user's house
    const devices = await Device.find({ houseName: req.user.houseName })
      .populate('lastToggledBy', 'name')
      .populate('owner', 'name');
    res.json({ devices });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Check if device belongs to user's house
    if (device.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'Device not found in your house' });
    }
    
    if (!device.approved) return res.status(403).json({ message: 'Device not approved' });
    
    // Toggle device status
    device.status = device.status === 'on' ? 'off' : 'on';
    device.lastToggledBy = req.user._id;
    device.lastUpdated = new Date();
    
    // Add to activity log
    device.activityLog.push({
      userId: req.user._id,
      userName: req.user.name,
      action: `turned ${device.status}`,
      timestamp: new Date()
    });
    
    await device.save();
    await device.populate('lastToggledBy', 'name');
    await Log.create({ deviceId: device._id, userId: req.user._id, action: `Toggled: ${device.status}` });
    
    const io = req.app.get('io');
    if (io) io.emit('deviceUpdated', device);
    res.json({ device });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.updateTemperature = async (req, res) => {
  try {
    const { value } = req.body;
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Check if device belongs to user's house
    if (device.houseName !== req.user.houseName) {
      return res.status(403).json({ message: 'Device not found in your house' });
    }
    
    // Only AC/Heater can have temperature
    if (device.type !== 'AC/Heater') {
      return res.status(400).json({ message: 'Temperature can only be set for AC/Heater devices' });
    }
    
    device.value = value;
    device.lastToggledBy = req.user._id;
    device.lastUpdated = new Date();
    
    // Add to activity log
    device.activityLog.push({
      userId: req.user._id,
      userName: req.user.name,
      action: `temperature set to ${value}°C`,
      timestamp: new Date()
    });
    
    await device.save();
    await device.populate('lastToggledBy', 'name');
    await Log.create({ deviceId: device._id, userId: req.user._id, action: `Temperature set to ${value}` });
    const io = req.app.get('io');
    if (io) io.emit('deviceUpdated', device);
    res.json({ device });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
