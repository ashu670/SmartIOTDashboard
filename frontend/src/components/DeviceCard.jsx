import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function DeviceCard({ device, onUpdate }) {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/devices/${device._id}`);
      // Socket in Dashboard will handle removal
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete device');
      setShowDeleteConfirm(false);
    }
  };

  // --- HELPERS ---
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const isOn = device.status === 'on';

  // --- LOCAL STATE (PREVIEW) ---
  // Initialize from props, but keep local for smooth sliding
  const [localBrightness, setLocalBrightness] = useState(device.brightness ?? 5);
  const [localColor, setLocalColor] = useState(device.color ?? '#ffffff');

  // Sync local state when device prop updates from backend
  useEffect(() => {
    if (device.brightness !== undefined) setLocalBrightness(device.brightness);
    if (device.color !== undefined) setLocalColor(device.color || '#ffffff');
  }, [device.brightness, device.color]);

  // --- ACTIONS ---

  const toggle = async () => {
    try {
      const res = await api.put(`/devices/${device._id}/toggle`);
      onUpdate(res.data.device);
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling device');
    }
  };

  const setTemperature = async (newTemp) => {
    const val = clamp(newTemp, 16, 30);
    if (val === (device.temperature ?? device.value)) return;

    try {
      const res = await api.put(`/devices/${device._id}/temperature`, { temperature: val });
      onUpdate(res.data.device);
    } catch (err) {
      console.error(err);
    }
  };

  // Light: Brightness (Commit on release)
  const commitBrightness = async () => { // Called onMouseUp/onTouchEnd
    if (localBrightness === device.brightness) return;
    try {
      const res = await api.put(`/devices/${device._id}/brightness`, { brightness: localBrightness });
      onUpdate(res.data.device);
    } catch (err) {
      console.error(err);
      // Revert on error
      setLocalBrightness(device.brightness ?? 5);
    }
  };

  // Light: Color (Debounced or OnBlur/Close)
  const commitColor = async () => {
    if (localColor === device.color) return;
    try {
      const res = await api.put(`/devices/${device._id}/color`, { color: localColor });
      onUpdate(res.data.device);
    } catch (err) {
      console.error(err);
      setLocalColor(device.color ?? '#ffffff');
    }
  };

  // Fan: Speed (Direct update for buttons, safe enough)
  const setSpeed = async (newSpeed) => {
    const val = clamp(newSpeed, 1, 5);
    if (val === device.speed) return;

    try {
      const res = await api.put(`/devices/${device._id}/speed`, { speed: val });
      onUpdate(res.data.device);
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDER HELPERS ---

  const renderACControls = () => {
    const temp = device.temperature ?? device.value ?? 24;
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-3xl font-light text-amber-400 leading-none">
          {temp}°<span className="text-sm text-slate-500 ml-1">C</span>
        </span>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setTemperature(temp - 1)}
            disabled={!isOn || temp <= 16}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            -
          </button>
          <button
            onClick={() => setTemperature(temp + 1)}
            disabled={!isOn || temp >= 30}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderLightControls = () => {
    // Use LOCAL state for rendering to ensure smoothness
    const brightness = localBrightness;
    const color = localColor;

    return (
      <div className="flex flex-col gap-3 w-full max-w-[140px]">
        {/* Top: Color Picker + % Value */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full border border-slate-600 overflow-hidden shadow-sm hover:scale-105 transition-transform">
            <input
              type="color"
              value={color}
              onChange={(e) => setLocalColor(e.target.value)} // Update local only
              onBlur={commitColor} // Commit on exit
              disabled={!isOn}
              className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <span className="text-xs font-medium text-slate-400">
            {Math.round((brightness / 10) * 100)}%
          </span>
        </div>

        {/* Bottom: Brightness Slider */}
        <div className="w-full">
          <input
            type="range"
            min="1"
            max="10"
            value={brightness}
            onChange={(e) => setLocalBrightness(Number(e.target.value))} // Update local only
            onMouseUp={commitBrightness} // Commit on release (Mouse)
            onTouchEnd={commitBrightness} // Commit on release (Touch)
            disabled={!isOn}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    );
  };

  const renderFanControls = () => {
    const speed = device.speed ?? 1;
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-xl font-medium text-slate-300">
          Speed {speed}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setSpeed(speed - 1)}
            disabled={!isOn || speed <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            -
          </button>
          <button
            onClick={() => setSpeed(speed + 1)}
            disabled={!isOn || speed >= 5}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // Main Card Render
  return (
    <div className="relative group p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden">

      {/* DELETE CONFIRMATION OVERLAY */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-200">
          <p className="text-amber-500 font-bold mb-1">⚠️ Removing Device</p>
          <p className="text-slate-300 text-sm mb-4">This action cannot be undone.</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between min-h-[150px]">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-4 relative">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 leading-tight pr-4">
              {device.name}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>{device.type}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{device.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dot */}
            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${isOn ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-700'}`} />

            {/* Admin Menu (3 dots) */}
            {user?.role === 'admin' && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-700/50 text-slate-400 transition"
                >
                  <span>⋮</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-50 min-w-max bg-[#1e232d]/90 backdrop-blur-sm border border-white/10 rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-[10px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
                      className="w-full text-left px-3 py-1.5 text-sm font-medium text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded flex items-center gap-2 transition-colors duration-150 whitespace-nowrap tracking-wide"
                    >
                      {/* Optional accent dot */}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]" />
                      Remove device
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS ROW */}
        <div className="flex items-end justify-between gap-4">

          {/* Left: Device Specific Controls */}
          <div className="flex-1">
            {device.type === 'AC/Heater' && renderACControls()}
            {device.type === 'Lights' && renderLightControls()}
            {device.type === 'Fan' && renderFanControls()}
          </div>

          {/* Right: Power Button / Approval */}
          <div>
            {device.approved ? (
              <button
                onClick={toggle}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${isOn
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
                  }`}
                title={isOn ? 'Turn Off' : 'Turn On'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-500">
                Pending
              </div>
            )}
          </div>
        </div>

        {/* FOOTER: Last Toggled */}
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600">
            Last toggled by <span className="font-medium text-slate-500">{device.lastToggledBy?.name || '—'}</span>
          </p>
        </div>

      </div>
    </div>
  );
}
