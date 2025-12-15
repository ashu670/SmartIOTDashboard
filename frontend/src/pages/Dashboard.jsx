import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import DeviceCard from '../components/DeviceCard';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [socket, setSocket] = useState(null);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'AC/Heater', location: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(s);
    s.on('deviceUpdated', (d) => {
      setDevices(prev => prev.map(p => {
        if (p._id === d._id) {
          // Merge the updated device data, ensuring all fields are included
          return { ...p, ...d, status: d.status, lastToggledBy: d.lastToggledBy };
        }
        return p;
      }));
    });
    s.on('deviceApproved', (d) => {
      setDevices(prev => prev.map(p => {
        if (p._id === d._id) {
          return { ...p, ...d };
        }
        return p;
      }));
    });
    return () => s.disconnect();
  }, [user, navigate]);

  useEffect(() => { 
    if (user) fetchDevices(); 
  }, [user]);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      setDevices(res.data.devices);
    } catch (err) { 
      console.error(err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  const onUpdateDevice = (updated) => {
    setDevices(prev => prev.map(d => d._id === updated._id ? updated : d));
  };

  const addDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/devices', newDevice);
      setDevices([...devices, res.data.device]);
      setNewDevice({ name: '', type: 'AC/Heater', location: '' });
    } catch (err) {
      console.error('Error adding device:', err);
      const errorData = err.response?.data;
      let errorMessage = errorData?.message || errorData?.error || err.message || 'Error adding device';
      
      // If there's an existing device, show its details
      if (errorData?.existingDevice) {
        const existing = errorData.existingDevice;
        errorMessage += `\n\nExisting Device Details:\n` +
          `Name: ${existing.name}\n` +
          `Type: ${existing.type}\n` +
          `Location: ${existing.location}\n` +
          `Status: ${existing.status}\n` +
          `\nThis device already exists in your house. Please use a different name.`;
      }
      
      alert(`Failed to add device:\n${errorMessage}`);
    }
  };

  const filtered = devices.filter(d => (filterType ? d.type === filterType : true));

  if (!user) return null;

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      {/* Welcome Section with Profile Picture */}
      <div className="bg-white p-6 rounded-lg shadow mb-4 flex items-center gap-4">
        {user.photo ? (
          <img 
            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.photo}`} 
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-purple-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 border-4 border-purple-600 text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name}! 👋</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin' ? 'Manage your house devices' : 'Control your house devices'}
            {user.houseName && <span className="ml-2">| House: {user.houseName}</span>}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Role: <span className={`font-semibold ${user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {user.role === 'admin' ? '👑 Family Head (Admin)' : '👤 Family Member'}
            </span>
          </p>
        </div>
        <div>
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="mr-2 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
              👑 Admin Panel
            </button>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">Add New Device</h2>
          <form onSubmit={addDevice} className="flex gap-2">
            <input value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} placeholder="Device Name" className="p-2 border rounded" required />
            <select value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})} className="p-2 border rounded">
              <option value="AC/Heater">AC/Heater</option>
              <option value="Lights">Lights</option>
              <option value="Fan">Fan</option>
            </select>
            <input value={newDevice.location} onChange={e => setNewDevice({...newDevice, location: e.target.value})} placeholder="Location" className="p-2 border rounded" required />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Device</button>
          </form>
        </div>
      )}

      <div className="my-3">
        <label>Filter by Type: </label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="ml-2 p-1 border rounded">
          <option value="">All</option>
          <option value="AC/Heater">AC/Heater</option>
          <option value="Lights">Lights</option>
          <option value="Fan">Fan</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">No devices found. Add a device to get started!</p>
        ) : (
          filtered.map(d => (
            <DeviceCard key={d._id} device={d} onUpdate={onUpdateDevice} />
          ))
        )}
      </div>
    </div>
  );
}

