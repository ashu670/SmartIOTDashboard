const Room = require('../models/Room');
const Device = require('../models/Device');
const Log = require('../models/Log');

const MOODS = {
    // 💤 Good Night: Lights OFF, Fan ON (2), AC ON (22)
    goodNight: {
        lights: { status: 'off' },
        fan: { status: 'on', speed: 2 },
        ac: { status: 'on', temperature: 22 }
    },
    // 🌊 Calm: Lights ON (40%, warm), Fan (1), AC (24)
    calm: {
        lights: { status: 'on', brightness: 40, color: '#ffcc80' }, // Warm
        fan: { status: 'on', speed: 1 },
        ac: { status: 'on', temperature: 24 }
    },
    // ❄️ Chill: Lights ON (60%, cool), Fan (3), AC (21)
    chill: {
        lights: { status: 'on', brightness: 60, color: '#e0f7fa' }, // Cool
        fan: { status: 'on', speed: 3 },
        ac: { status: 'on', temperature: 21 }
    },
    // 😌 Relax: Lights ON (20%, warm), Fan (1), AC (24)
    relax: {
        lights: { status: 'on', brightness: 20, color: '#ffb74d' }, // Warm
        fan: { status: 'on', speed: 1 },
        ac: { status: 'on', temperature: 24 }
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Room name is required' });

        const trimmed = name.trim();

        // Use findOneAndUpdate with upsert to avoid race conditions or duplicates
        const room = await Room.findOneAndUpdate(
            { houseName: req.user.houseName, name: trimmed },
            {
                $setOnInsert: {
                    houseName: req.user.houseName,
                    name: trimmed,
                    createdBy: req.user._id
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ room });
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const houseName = req.user.houseName;
        let rooms = await Room.find({ houseName }).sort({ createdAt: 1 });

        // --- SELF HEALING: Recover "Legacy" Rooms ---
        // If we have devices with locations that don't exist as Rooms, create them.
        const devices = await Device.find({ houseName });
        const deviceLocations = [...new Set(devices.map(d => d.location).filter(l => l && l !== 'Unknown'))];
        const existingRoomNames = new Set(rooms.map(r => r.name));

        const missingRooms = deviceLocations.filter(loc => !existingRoomNames.has(loc));

        if (missingRooms.length > 0) {
            console.log(`Self-Healing: Creating ${missingRooms.length} missing rooms:`, missingRooms);
            const newRooms = [];
            for (const loc of missingRooms) {
                const newRoom = await Room.create({
                    name: loc,
                    houseName: houseName,
                    createdBy: req.user._id // Attribution is approximate but fine
                });
                newRooms.push(newRoom);
            }
            rooms = [...rooms, ...newRooms].sort((a, b) => a.name.localeCompare(b.name));
        }

        res.json({ rooms });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.applyMood = async (req, res) => {
    const { roomId } = req.params;
    const { mood } = req.body;

    if (!MOODS[mood]) return res.status(400).json({ message: 'Invalid mood' });

    try {
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.houseName !== req.user.houseName) return res.status(403).json({ message: 'Access denied' });

        const moodConfig = MOODS[mood];

        // Find devices by LOCATION STRING matching the room name
        const devices = await Device.find({
            houseName: req.user.houseName,
            location: room.name
        });

        const updates = [];
        for (const device of devices) {
            let updated = false;

            // Lights
            if (device.type === 'Lights' && moodConfig.lights) {
                if (moodConfig.lights.status) device.status = moodConfig.lights.status;
                if (moodConfig.lights.brightness !== undefined) device.brightness = moodConfig.lights.brightness;
                if (moodConfig.lights.color) device.color = moodConfig.lights.color;
                updated = true;
            }

            // Fan
            if (device.type === 'Fan' && moodConfig.fan) {
                if (moodConfig.fan.status) device.status = moodConfig.fan.status;
                if (moodConfig.fan.speed !== undefined) device.speed = moodConfig.fan.speed;
                updated = true;
            }

            // AC
            if (device.type === 'AC/Heater' && moodConfig.ac) {
                if (moodConfig.ac.status) device.status = moodConfig.ac.status;
                if (moodConfig.ac.temperature !== undefined) device.temperature = moodConfig.ac.temperature;
                updated = true;
            }

            if (updated) {
                device.lastUpdated = new Date();
                await device.save();
                updates.push(device);
            }
        }

        // Socket Emit
        const io = req.app.get('io');
        if (io) {
            updates.forEach(d => io.emit('deviceUpdated', d));
            io.emit('roomMoodApplied', { room: roomId, mood, devices: updates });
        }

        // Audit Log
        if (updates.length > 0) {
            await Log.create({
                userId: req.user._id,
                action: `${mood} mode activated in ${room.name}`,
                deviceId: updates[0]._id
            });
        }

        res.json({ message: `Mood ${mood} applied`, updates });

    } catch (err) {
        console.error('Error applying mood:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can delete rooms' });
        }

        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.houseName !== req.user.houseName) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Cascade Delete: Delete all devices in this room
        // We use the room name as the shared identifier for location
        const deleteResult = await Device.deleteMany({
            houseName: req.user.houseName,
            location: room.name
        });

        console.log(`Cascade deleted ${deleteResult.deletedCount} devices in room ${room.name}`);

        await Room.findByIdAndDelete(roomId);

        const io = req.app.get('io');
        if (io) {
            io.emit('roomRemoved', { roomId });
            // Also notify that devices were removed so frontend can clean up if needed
            // But usually fetching devices again or letting the devices get filtered out is enough.
            // Better to emit a generic refresh or specific device removals if we had IDs.
            // Since we don't have IDs easily without querying first, we rely on dashboard "self-healing" or explicit refresh.
            // Actually, we should probably fetch the IDs first if we want to be precise with sockets.
            // But let's stick to the prompt: "Delete room... Delete devices... On success: Remove room from UI".
            // Dashboard.jsx listens to 'roomRemoved'. 
        }

        res.json({ message: 'Room and associated devices deleted' });

    } catch (err) {
        console.error('Error deleting room:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
