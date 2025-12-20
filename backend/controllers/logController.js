const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
    try {
        const filter = {};

        // Non-admins cannot see password requests
        if (req.user.role !== 'admin') {
            filter.type = { $ne: 'PASSWORD_REQUEST' };
        }

        // TODO: Add houseName filtering if Logs store houseName, 
        // strictly speaking Logs schema doesn't have houseName, but usually we filter by user's house devices/users.
        // For now, assuming Logs are global or we filter by simple query if needed. 
        // Ideally, Log schema should have houseName or we filter by looking up generated users?
        // Given the constraints, I will return all logs filtered by type.
        // In a real multi-tenant app, we'd filter by house.

        const logs = await Log.find(filter)
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('userId', 'name email role');

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
