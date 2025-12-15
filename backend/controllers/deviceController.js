const Device = require('../models/Device');
const Log = require('../models/Log');
const User = require('../models/User');

exports.addDevice = async (req, res) => {
  const { name, type, location } = req.body;
  try {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Only admin can add devices
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can add devices' });
    }
    
    // Validate required fields
    if (!name || !type || !location) {
      return res.status(400).json({ message: 'Name, type, and location are required' });
    }
    
    // Check if user has houseName
    if (!req.user.houseName) {
      return res.status(400).json({ message: 'User must have a house name assigned' });
    }
    
    // Debug: Check all devices in the house first
    const allDevicesInHouse = await Device.find({ houseName: req.user.houseName });
    const trimmedName = name.trim();
    
    console.log('=== DEVICE ADD DEBUG ===');
    console.log('User houseName:', req.user.houseName);
    console.log('User ID:', req.user._id);
    console.log('Trying to add device name:', `"${trimmedName}"`);
    console.log('Total devices in house:', allDevicesInHouse.length);
    console.log('Existing device names:', allDevicesInHouse.map(d => `"${d.name}"`));
    
    // Check if device with same name already exists in this house (exact match, case-sensitive)
    const existingDevice = await Device.findOne({ 
      houseName: req.user.houseName,
      name: trimmedName
    });
    
    console.log('Query result - Found existing device?', !!existingDevice);
    if (existingDevice) {
      console.log('Existing device details:', {
        _id: existingDevice._id,
        name: existingDevice.name,
        type: existingDevice.type,
        location: existingDevice.location,
        houseName: existingDevice.houseName
      });
    } else {
      console.log('No duplicate found - proceeding with device creation');
    }
    console.log('=== END DEBUG ===');
    
    if (existingDevice) {
      return res.status(400).json({ 
        message: `Device "${name}" already exists in your house`,
        existingDevice: {
          name: existingDevice.name,
          type: existingDevice.type,
          location: existingDevice.location,
          status: existingDevice.status,
          _id: existingDevice._id
        },
        debug: {
          totalDevicesInHouse: allDevicesInHouse.length,
          allDeviceNames: allDevicesInHouse.map(d => d.name),
          searchedName: trimmedName,
          userHouseName: req.user.houseName
        }
      });
    }
    
    // Generate a unique deviceId by finding the max deviceId and incrementing
    const maxDevice = await Device.findOne({ houseName: req.user.houseName })
      .sort({ deviceId: -1 })
      .select('deviceId');
    const nextDeviceId = maxDevice && maxDevice.deviceId !== null && maxDevice.deviceId !== undefined 
      ? maxDevice.deviceId + 1 
      : 1;
    
    console.log('Creating device with:', { name, type, location, houseName: req.user.houseName, owner: req.user._id, deviceId: nextDeviceId });
    
    const device = await Device.create({ 
      deviceId: nextDeviceId,
      name, 
      type, 
      location, 
      houseName: req.user.houseName,
      owner: req.user._id, 
      approved: true 
    });
    
    console.log('Device created successfully:', device._id);
    
    // Create log (don't fail if this fails)
    try {
      await Log.create({ deviceId: device._id, userId: req.user._id, action: 'Device added by admin' });
    } catch (logErr) {
      console.error('Error creating log (non-critical):', logErr);
    }
    
    // Populate owner before sending
    await device.populate('owner', 'name');
    
    const io = req.app.get('io');
    if (io) io.emit('deviceAdded', device);
    
    res.status(201).json({ device });
  } catch (err) { 
    console.error('Error adding device:', err);
    console.error('Error stack:', err.stack);
    // Return more specific error messages
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${errors}` });
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
      console.error('MongoDB duplicate key error detected');
      console.error('Error details:', err.keyPattern, err.keyValue);
      
      // If it's a deviceId duplicate, try again with a different deviceId
      if (err.keyPattern && err.keyPattern.deviceId) {
        console.log('deviceId duplicate detected, retrying with new deviceId...');
        // Retry with a new deviceId (find max and increment)
        const maxDevice = await Device.findOne({ houseName: req.user.houseName })
          .sort({ deviceId: -1 })
          .select('deviceId');
        const retryDeviceId = maxDevice && maxDevice.deviceId !== null && maxDevice.deviceId !== undefined 
          ? maxDevice.deviceId + 1 
          : Date.now(); // Use timestamp as fallback
        
        try {
          const device = await Device.create({ 
            deviceId: retryDeviceId,
            name, 
            type, 
            location, 
            houseName: req.user.houseName,
            owner: req.user._id, 
            approved: true 
          });
          
          await device.populate('owner', 'name');
          const io = req.app.get('io');
          if (io) io.emit('deviceAdded', device);
          
          return res.status(201).json({ device });
        } catch (retryErr) {
          console.error('Retry also failed:', retryErr);
        }
      }
      
      // Try to find the existing device by name
      const existing = await Device.findOne({ name: name.trim(), houseName: req.user.houseName });
      const allDevices = await Device.find({ houseName: req.user.houseName });
      console.error('All devices in house:', allDevices.map(d => ({ name: d.name, deviceId: d.deviceId, _id: d._id })));
      
      if (existing) {
        return res.status(400).json({ 
          message: `Device "${name}" already exists in your house`,
          existingDevice: {
            name: existing.name,
            type: existing.type,
            location: existing.location,
            status: existing.status,
            _id: existing._id
          },
          debug: {
            duplicateKeyError: true,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
          }
        });
      }
      return res.status(400).json({ 
        message: 'Duplicate key error - this may be due to a deviceId conflict. Please try again.',
        error: err.message,
        debug: {
          duplicateKeyError: true,
          keyPattern: err.keyPattern,
          keyValue: err.keyValue,
          totalDevicesInHouse: allDevices.length
        }
      });
    }
    res.status(500).json({ message: 'Server error', error: err.message }); 
  }
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
