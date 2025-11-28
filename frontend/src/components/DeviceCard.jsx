import React from 'react';
import api from '../services/api';

export default function DeviceCard({ device, onUpdate }) {
  const toggle = async () => {
    try {
      const res = await api.put(`/devices/${device._id}/toggle`);
      onUpdate(res.data.device);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const setTemp = async (v) => {
    try {
      const res = await api.put(`/devices/${device._id}/temperature`, { value: v });
      onUpdate(res.data.device);
    } catch (err) { alert('Error updating temperature'); }
  };

  return (
    <div className="p-4 shadow rounded bg-white">
      <h3 className="font-bold">{device.name}</h3>
      <p>Type: {device.type}</p>
      <p>Location: {device.location}</p>
      <p>Status: <span className={device.status === 'on' ? 'text-green-600 font-semibold' : 'text-gray-600'}>{device.status}</span></p>
      {device.type === 'AC/Heater' && device.value && (
        <p>Temperature: {device.value}°C</p>
      )}
      {device.lastToggledBy && (
        <p className="text-xs text-gray-500">Last toggled by: {device.lastToggledBy.name || 'Unknown'}</p>
      )}
      <div className="mt-2">
        {device.approved ? (
          <>
            <button onClick={toggle} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
              Turn {device.status === 'on' ? 'Off' : 'On'}
            </button>
            {device.type === 'AC/Heater' && (
              <>
                <button onClick={() => setTemp((device.value || 20) + 1)} className="ml-2 px-2 py-1 rounded border hover:bg-gray-100">+</button>
                <button onClick={() => setTemp((device.value || 20) - 1)} className="ml-2 px-2 py-1 rounded border hover:bg-gray-100">-</button>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-500">Waiting for admin approval</p>
        )}
      </div>
    </div>
  );
}
