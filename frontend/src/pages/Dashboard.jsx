import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../services/api';
import DeviceCard from '../components/DeviceCard';
import RoomItem from '../components/RoomItem';
import ElectricityConsumption from '../components/ElectricityConsumption';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]); // Managed rooms list (persists even if no devices)
  const [filterType, setFilterType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null); // null = no room selected
  const [energyRange, setEnergyRange] = useState("24h");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'AC/Heater'
  });
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [securityLogs, setSecurityLogs] = useState([]);
  const [logTab, setLogTab] = useState('activity'); // 'activity' | 'security'
  const scrollContainerRef = useRef(null);

  /* -------------------- HORIZONTAL SCROLL UX -------------------- */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if scrolling is possible/needed
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    // 1px buffer for sub-pixel rendering differences
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  // Scroll Helpers
  const scrollLeft = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const cardWidth = el.firstElementChild?.clientWidth || 320;
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const cardWidth = el.firstElementChild?.clientWidth || 320;
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Allow native vertical scroll.
      // Only hijack if Shift is pressed to force horizontal scroll interaction with Wheel
      if (e.shiftKey && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    // Attach listeners
    el.addEventListener('wheel', onWheel);
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // Initial check
    checkScroll();

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [devices, selectedRoom]); // Re-check when devices list changes


  /* -------------------- AUTH + SOCKET -------------------- */
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSecurityLogs();
    }
  }, [user]);

  const fetchSecurityLogs = async () => {
    try {
      const res = await api.get('/admin/logs/security');
      setSecurityLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching security logs:', err);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const baseURL =
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';

    const s = io(baseURL);
    setSocket(s);

    s.on('deviceUpdated', (updated) => {
      // Replace entire device object – socket payload is source of truth
      setDevices((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
      fetchMostUsed();
    });

    s.on('deviceApproved', (approved) => {
      setDevices((prev) =>
        prev.map((d) => (d._id === approved._id ? approved : d))
      );
    });

    s.on('deviceAdded', (newDevice) => {
      setDevices((prev) => [...prev, newDevice]);
    });


    s.on('deviceRemoved', ({ deviceId }) => {
      setDevices((prev) => prev.filter((d) => d._id !== deviceId));
    });

    s.on('roomRemoved', ({ roomId }) => {
      setRooms((prev) => prev.filter(r => r._id !== roomId));
      // If selected room was deleted, reset selection
      setSelectedRoom((prev) => (prev && prev._id === roomId ? null : prev));
    });

    s.on('roomMoodApplied', ({ devices: updatedDevices }) => {
      setDevices((prev) =>
        prev.map((d) => {
          const updated = updatedDevices.find((u) => u._id === d._id);
          return updated || d;
        })
      );
    });

    return () => s.disconnect();
  }, [user, loading, navigate]);

  // Most Used Devices (Fetched from backend)
  const [mostUsedDevices, setMostUsedDevices] = useState([]);

  const fetchMostUsed = async () => {
    try {
      const res = await api.get('/devices/most-used?limit=4');
      setMostUsedDevices(res.data);
    } catch (err) {
      console.error('Error fetching most used devices:', err);
    }
  };

  /* -------------------- FETCH DEVICES -------------------- */
  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchDevices();
      fetchFamilyMembers();
      fetchMostUsed();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const res = await api.get('/family/members');
      // Backend response should already include all members in the house
      setFamilyMembers(res.data.members || []);
    } catch (err) {
      console.error('Error fetching family members:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      const fetchedDevices = res.data.devices;
      setDevices(fetchedDevices);

      setDevices(fetchedDevices);

      // NO LONGER DERIVING ROOMS FROM DEVICES
      // Rooms are fetched separately from /rooms
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  /* -------------------- AUTO-SELECT FIRST ROOM -------------------- */
  useEffect(() => {
    // Auto-select first room if available and none selected
    if (rooms.length > 0 && selectedRoom === null) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  /* -------------------- ROOM HELPERS -------------------- */
  const handleAddRoomClick = () => {
    if (user?.role !== 'admin') return;
    setIsAddingRoom(true);
    setNewRoomName('');
  };

  const handleConfirmAddRoom = async () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) {
      setIsAddingRoom(false);
      return;
    }

    try {
      const res = await api.post('/rooms', { name: trimmed });
      setRooms(prev => [...prev, res.data.room]);
      setSelectedRoom(res.data.room);
      setIsAddingRoom(false);
      setNewRoomName('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create room');
      setIsAddingRoom(false);
    }
  };

  const handleCancelAddRoom = () => {
    setIsAddingRoom(false);
    setNewRoomName('');
  };

  const addDevice = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      await api.post('/devices', {
        ...newDevice,
        roomId: selectedRoom._id,
        location: selectedRoom.name
      });
      // Socket will handle the update
      setIsAddingDevice(false);
      setNewDevice({ name: '', type: 'AC/Heater' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add device');
    }
  };

  /* -------------------- DEVICE HELPERS -------------------- */
  const onUpdateDevice = (updated) => {
    setDevices((prev) =>
      prev.map((d) => (d._id === updated._id ? updated : d))
    );
  };

  const handleAddDeviceClick = () => {
    if (user?.role !== 'admin' || !selectedRoom) return;
    setIsAddingDevice(true);
    setNewDevice({ name: '', type: 'AC/Heater' });
  };

  const handleCancelAddDevice = () => {
    setIsAddingDevice(false);
    setNewDevice({ name: '', type: 'AC/Heater' });
  };

  const handleApplyMood = async (moodDisplay) => {
    if (!selectedRoom) return;

    // Map display name to backend key
    const moodMap = {
      'Calm': 'calm',
      'Good Night': 'goodNight',
      'Chill': 'chill',
      'Relax': 'relax'
    };

    const moodKey = moodMap[moodDisplay];
    if (!moodKey) return;

    try {
      await api.post(`/rooms/${selectedRoom._id}/apply-mood`, { mood: moodKey });
      // Socket will handle the update
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to apply mood');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      // Socket will handle the UI update
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  /* -------------------- RENDER GUARDS -------------------- */
  if (loading) return null;
  if (!user) return null;



  /* -------------------- DERIVED DATA -------------------- */
  // Combined filter: room + type + search query
  const filteredDevices = devices.filter((d) => {
    const roomMatch = selectedRoom ? d.location === selectedRoom.name : false;
    const typeMatch = filterType ? d.type === filterType : true;
    const searchMatch = searchQuery ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return roomMatch && typeMatch && searchMatch;
  });

  // Running devices count (respects room filter only, for subtitle)
  const runningDevicesCount = selectedRoom
    ? devices.filter((d) => d.location === selectedRoom.name && d.status === 'on').length
    : 0;

  // Aggregate activity logs from all devices
  const activityLogs = devices
    .flatMap((device) => {
      if (!device.activityLog || device.activityLog.length === 0) return [];
      return device.activityLog.map((log) => ({
        ...log,
        deviceName: device.name,
        deviceLocation: device.location
      }));
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20); // Show latest 20 logs



  // Placeholder date/time
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  /* -------------------- RENDER GUARDS -------------------- */
  if (loading) return null;
  if (!user) return null;

  /* -------------------- UI -------------------- */
  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* ========== LEFT SIDEBAR ========== */}
      <aside className="w-64 shrink-0 flex flex-col gap-4 p-4 border-r border-slate-800 bg-slate-900/60 overflow-y-auto">
        {/* --- Profile Section --- */}
        <div
          onClick={() => navigate('/profile')}
          className="bg-slate-800/50 rounded-2xl p-3 flex items-center gap-3 mb-6 cursor-pointer"
        >
          {user.photo ? (
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.photo}`}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold border-2 border-indigo-500">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-400">
              {user.role === 'admin' ? 'Family Head (Admin)' : 'Family Member'}
            </p>
          </div>
        </div>

        {/* --- Rooms List --- */}
        <div className="bg-slate-800/50 rounded-2xl p-3 flex flex-col" style={{ maxHeight: '300px' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Rooms</p>
          </div>

          {/* Inline Add Room UI */}
          {isAddingRoom && (
            <div className="mb-2 p-2 bg-slate-900/50 rounded-lg flex items-center gap-2">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddRoom();
                  if (e.key === 'Escape') handleCancelAddRoom();
                }}
                autoFocus
                className="flex-1 px-2 py-1 rounded border border-slate-600 bg-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleConfirmAddRoom}
                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                title="Confirm"
              >
                ✔
              </button>
              <button
                onClick={handleCancelAddRoom}
                className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-sm"
                title="Cancel"
              >
                ✖
              </button>
            </div>
          )}

          {/* Room Buttons List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {rooms.length === 0 && !isAddingRoom ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No rooms yet
              </p>
            ) : (
              rooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  isSelected={selectedRoom?._id === room._id}
                  onClick={() => setSelectedRoom(room)}
                  isAdmin={user.role === 'admin'}
                  onDeleteRoom={handleDeleteRoom}
                />
              ))
            )}
          </div>

          {/* Add New Room Card */}
          {user.role === 'admin' && !isAddingRoom && (
            <button
              onClick={handleAddRoomClick}
              className="mt-4 mx-auto w-[100%] p-2 rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-500 bg-slate-900/30 hover:bg-slate-900/50 transition flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-indigo-400"
            >
              <span className="text-base">+</span>
              <span className="text-[12px]">Add New Room</span>
            </button>
          )}
        </div>


        <div className="bg-slate-800/50 rounded-2xl p-3 flex flex-col" style={{ maxHeight: '250px' }}>

          {user.role === 'admin' ? (
            <div className="flex items-center gap-4 mb-3 border-b border-slate-700/50 pb-2">
              <button
                onClick={() => setLogTab('activity')}
                className={`text-xs font-bold uppercase tracking-wide transition ${logTab === 'activity' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Activity Logs
              </button>
              <button
                onClick={() => setLogTab('security')}
                className={`text-xs font-bold uppercase tracking-wide transition ${logTab === 'security' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Security Logs
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Activity Logs</p>
          )}

          <div className="overflow-y-auto space-y-2 flex-1">
            {/* ACTIVITY LOGS */}
            {logTab === 'activity' && (
              activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No activity logs yet</p>
              ) : (
                activityLogs.map((log, idx) => (
                  <div key={idx} className="text-xs text-slate-300 p-2 bg-slate-900/50 rounded-lg">
                    <p className="truncate">
                      <span className="font-semibold">{log.deviceLocation} {log.deviceName}</span> {log.action} by {log.userName || 'Unknown'}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )
            )}

            {/* SECURITY LOGS */}
            {logTab === 'security' && (
              securityLogs.length === 0 ? (
                <p className="text-xs text-slate-600 italic text-center py-4">No security events recorded yet.</p>
              ) : (
                securityLogs.map((log) => (
                  <div key={log._id} className="text-xs text-slate-300 p-2 bg-slate-900/50 rounded-lg border-l-2 border-indigo-500/50">
                    <p className="">
                      <span className="text-slate-200">{log.action}</span>
                    </p>
                    <p className="text-slate-500 text-[10px] mt-1 flex justify-between">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </p>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* --- Logout --- */}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-sm font-medium"
        >
          Logout
        </button>
      </aside>

      {/* ========== CENTER SECTION — MY WORKSTATION ========== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <section className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          {/* Global Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome back, {user.name} 👋
              </h2>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search with device name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          {/* My Workstation Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                My Workstation{selectedRoom && <span className="text-indigo-400"> – {selectedRoom.name}</span>}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {selectedRoom ? (
                  <>
                    {runningDevicesCount} device{runningDevicesCount !== 1 && 's'} running in {selectedRoom.name}
                  </>
                ) : (
                  'Select a room to view devices'
                )}
              </p>
            </div>
          </div>




          {/* Filter Row & Add Device */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Filter by type:</span>
              <select
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All</option>
                <option value="AC/Heater">AC/Heater</option>
                <option value="Lights">Lights</option>
                <option value="Fan">Fan</option>
              </select>
            </div>

            {/* Add Device Button (moved here) */}
            {user.role === 'admin' && (
              <button
                onClick={handleAddDeviceClick}
                disabled={!selectedRoom}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedRoom
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                title={selectedRoom ? 'Add new device' : 'Select a room first'}
              >
                + Add Device
              </button>
            )}
          </div>

          {/* Inline Add Device Form */}
          {isAddingDevice && (
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4">
              <form onSubmit={addDevice} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="Device name"
                    className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={newDevice.name}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, name: e.target.value })
                    }
                    autoFocus
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={newDevice.type}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, type: e.target.value })
                    }
                  >
                    <option>AC/Heater</option>
                    <option>Lights</option>
                    <option>Fan</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelAddDevice}
                    className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
                  >
                    Add Device
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Devices Grid (Horizontal Scroll - Wheel Enhanced - Fixed 3 Col - Vertically Restored - Snapped - With Buttons) */}
          <div className="relative group">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600 text-slate-300 shadow-lg hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll devices left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div ref={scrollContainerRef} className="flex overflow-x-auto overflow-y-hidden py-4 gap-4 no-scrollbar min-h-[280px] snap-x snap-mandatory">
              {!selectedRoom ? (
                <p className="w-full text-center text-slate-500 py-10">
                  Select a room to view devices
                </p>
              ) : filteredDevices.length === 0 ? (
                <p className="w-full text-center text-slate-500 py-10">
                  No devices in this room
                </p>
              ) : (
                filteredDevices.map((d) => (
                  <div key={d._id} className="flex-none w-full md:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)] h-full snap-start">
                    <DeviceCard device={d} onUpdate={onUpdateDevice} />
                  </div>
                ))
              )}
            </div>

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600 text-slate-300 shadow-lg hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll devices right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom Split Section: Most Used + Ambience */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-1">
            {/* Left: Most Used */}
            <div className="bg-slate-800/70 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-3">Most Used</h3>
              <div className="space-y-2">
                {mostUsedDevices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No usage data yet</p>
                ) : (
                  mostUsedDevices.map((device) => {
                    return (
                      <div key={device.deviceId} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                          <span className="text-xl">
                            {device.type === 'AC/Heater' ? '❄️' : device.type === 'Lights' ? '💡' : '🌀'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-slate-400">
                            {device.lastUsed
                              ? `Last used ${new Date(device.lastUsed).toLocaleDateString()}`
                              : 'Never used'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Ambience */}
            <div className="bg-slate-800/70 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-3">Ambience</h3>
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎵</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Song Name</p>
                  <p className="text-xs text-slate-400 truncate">Artist Name</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">▶️</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========== RIGHT PANEL — INFO / AUTOMATION / FAMILY ========== */}
      <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/60 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'info'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'theme'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
          >
            Theme
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'family'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
          >
            Family
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Indoor Temperature */}
              <div className="bg-slate-800/70 rounded-2xl p-6">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Indoor Temperature</p>
                <p className="text-5xl font-bold">24°C</p>
                <p className="text-sm text-slate-400 mt-2">{formattedDate}</p>
              </div>

              {/* Mood Setup */}
              <div className="bg-slate-800/70 rounded-2xl p-4">
                <p className="text-sm font-semibold mb-3">Mood Setup</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Calm', 'Good Night', 'Chill', 'Relax'].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => handleApplyMood(mood)}
                      disabled={!selectedRoom}
                      className={`px-4 py-2 rounded-lg border text-sm transition ${selectedRoom
                        ? 'bg-slate-900/50 hover:bg-indigo-600/20 border-slate-700 hover:border-indigo-500 cursor-pointer'
                        : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      title={selectedRoom ? `Apply ${mood} mood` : 'Select a room first'}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Electricity Consumption */}
              <div className="bg-slate-800/70 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Electricity Consumption</p>
                  <div className="flex gap-1">
                    {['24h', '7d', '30d'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setEnergyRange(period)}
                        className={`px-2 py-1 text-xs rounded transition ${energyRange === period
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-48 mt-2">
                  <ElectricityConsumption range={energyRange} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 rounded-2xl p-6 text-center">
                <p className="text-slate-400">Theme customization coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="space-y-3">
              {familyMembers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No family members found</p>
              ) : (
                <>
                  {familyMembers.map((member) => (
                    <div key={member._id || member.email} className="bg-slate-800/70 rounded-xl p-3 flex items-center gap-3">
                      {member.photo ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${member.photo}`}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{member.name}</p>
                        <p className="text-xs text-slate-400">
                          {member.role === 'admin' ? 'Family Head' : 'Family Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/manage-members')}
                      className="w-full mt-3 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition text-center"
                    >
                      Manage Members
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </div >
  );
}
