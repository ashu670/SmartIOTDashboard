import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel(){
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('devices');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [selectedDeviceActivity, setSelectedDeviceActivity] = useState(null);
  const [passwordModal, setPasswordModal] = useState({ open: false, userId: null, userName: '' });
  const [newPassword, setNewPassword] = useState('');
  const [addUserModal, setAddUserModal] = useState({ open: false });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [newUserPhoto, setNewUserPhoto] = useState(null);
  const [photoModal, setPhotoModal] = useState({ open: false, userId: null, userName: '', isAdmin: false });
  const [updatePhoto, setUpdatePhoto] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPending();
    fetchUsers();
    fetchAllDevices();
  }, [user, navigate]);
  
  const fetchAllDevices = async () => {
    try {
      const res = await api.get('/devices');
      setAllDevices(res.data.devices);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    }
  };
  
  const fetchDeviceActivity = async (deviceId) => {
    try {
      const res = await api.get(`/admin/device/${deviceId}/activity`);
      setSelectedDeviceActivity(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching device activity');
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/pending');
      setPending(res.data.devices);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    }
  };

  const fetchUserDevices = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/devices`);
      setUserDevices(res.data.devices);
      setSelectedUser(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching user devices');
    }
  };

  const approve = async (id) => {
    try {
      await api.put(`/admin/approve/${id}`);
      setPending(prev => prev.filter(p => p._id !== id));
      alert('Device approved!');
      fetchUsers(); // Refresh users list
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving device');
    }
  };

  const removeDevice = async (id) => {
    if (!confirm('Are you sure you want to remove this device?')) return;
    try {
      await api.delete(`/admin/device/${id}`);
      setPending(prev => prev.filter(p => p._id !== id));
      if (selectedUser) {
        setUserDevices(prev => prev.filter(d => d._id !== id));
      }
      fetchAllDevices(); // Refresh devices list
      fetchUsers(); // Refresh users list
      alert('Device removed!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing device');
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/admin/users/${passwordModal.userId}/password`, { newPassword });
      alert('Password changed successfully!');
      setPasswordModal({ open: false, userId: null, userName: '' });
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error changing password');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their devices.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
        setUserDevices([]);
      }
      alert('User deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newUser.name);
      formData.append('email', newUser.email);
      formData.append('password', newUser.password);
      if (newUserPhoto) {
        formData.append('photo', newUserPhoto);
      }
      
      await api.post('/admin/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('User added successfully!');
      setAddUserModal({ open: false });
      setNewUser({ name: '', email: '', password: '' });
      setNewUserPhoto(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding user');
    }
  };

  const authorizeUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/authorize`);
      alert('User authorized successfully!');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error authorizing user');
    }
  };

  const updateUserPhoto = async () => {
    if (!updatePhoto) {
      alert('Please select a photo');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('photo', updatePhoto);
      
      const endpoint = photoModal.isAdmin 
        ? `/admin/users/${user.id || user._id}/photo`
        : `/admin/users/${photoModal.userId}/photo`;
      
      const res = await api.put(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update user context if updating own photo
      if (photoModal.isAdmin) {
        const updatedUser = { ...user, photo: res.data.user.photo };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload(); // Refresh to show new photo
      }
      
      alert('Photo updated successfully!');
      setPhotoModal({ open: false, userId: null, userName: '', isAdmin: false });
      setUpdatePhoto(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating photo');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {user?.photo && (
            <img 
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.photo}`} 
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-600"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">👑 Admin Panel</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.name} (Family Head) | House: {user?.houseName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPhotoModal({ open: true, userId: user.id, userName: user.name, isAdmin: true })}
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            📷 Update Photo
          </button>
          <button onClick={() => navigate('/')} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Back to Dashboard</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 ${activeTab === 'devices' ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Devices
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 ${activeTab === 'users' ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Family Members
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 ${activeTab === 'activity' ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Device Activity
          </button>
        </div>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">All House Devices</h2>
          {allDevices.length === 0 ? (
            <p className="text-gray-500">No devices found. Add devices from the dashboard.</p>
          ) : (
            <div className="space-y-3">
              {allDevices.map(d => {
                const isOn = d.status === 'on';
                return (
                  <div key={d._id} className={`p-3 border rounded ${isOn ? 'bg-green-50 border-green-300' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-sm text-gray-600">Type: {d.type} | Location: {d.location}</div>
                        <div className="text-sm text-gray-600">Status: <span className={isOn ? 'text-green-600 font-semibold' : 'text-gray-600'}>{d.status}</span></div>
                        {d.type === 'AC/Heater' && d.value && (
                          <div className="text-sm text-gray-600">Temperature: {d.value}°C</div>
                        )}
                        {isOn && d.lastToggledBy && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            🔵 Turned ON by: <span className="font-bold">{d.lastToggledBy.name || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => fetchDeviceActivity(d._id)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">View Activity</button>
                        <button onClick={() => removeDevice(d._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users & Devices Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Family Members</h2>
              <button
                onClick={() => setAddUserModal({ open: true })}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add Family Member
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">All Family Members</h2>
              {users.length === 0 ? (
                <p className="text-gray-500">No family members found. Add one to get started!</p>
              ) : (
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u._id} className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedUser?.id === u._id ? 'bg-blue-50 border-blue-500' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div onClick={() => fetchUserDevices(u._id)} className="flex-1 flex items-center gap-3">
                          {u.photo ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${u.photo}`} 
                              alt={u.name}
                              className="w-12 h-12 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{u.name}</div>
                            <div className="text-sm text-gray-600">{u.email}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Devices: {u.devices?.length || 0} | 
                              {u.authorized ? ' ✅ Authorized' : ' ⏳ Pending'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-col">
                          {!u.authorized && (
                            <button
                              onClick={() => authorizeUser(u._id)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Authorize User"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => setPhotoModal({ open: true, userId: u._id, userName: u.name, isAdmin: false })}
                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            title="Update Photo"
                          >
                            📷
                          </button>
                          <button
                            onClick={() => setPasswordModal({ open: true, userId: u._id, userName: u.name })}
                            className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            title="Change Password"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => deleteUser(u._id, u.name)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">
              {selectedUser ? `${selectedUser.name}'s Devices` : 'Select a user to view devices'}
            </h2>
            {selectedUser && (
              <div className="mb-3 text-sm text-gray-600">
                Email: {selectedUser.email}
              </div>
            )}
            {userDevices.length === 0 && selectedUser ? (
              <p className="text-gray-500">No devices found for this user</p>
            ) : (
              <div className="space-y-2">
                {userDevices.map(d => {
                  const isOn = d.status === 'on' || d.status === 'armed';
                  return (
                    <div key={d._id} className={`p-3 border rounded ${isOn ? 'bg-green-50 border-green-300' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-sm text-gray-600">Type: {d.type} | Location: {d.location}</div>
                          <div className={`text-xs font-semibold ${isOn ? 'text-green-700' : 'text-gray-500'}`}>
                            Status: {d.status.toUpperCase()} | Approved: {d.approved ? '✅' : '❌'}
                          </div>
                          {isOn && d.lastToggledBy && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              🔵 Turned ON by: <span className="font-bold">{d.lastToggledBy.name || d.lastToggledBy.email}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeDevice(d._id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          title="Remove Device"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Password Change Modal */}
      {passwordModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Change Password for {passwordModal.userName}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPasswordModal({ open: false, userId: null, userName: '' });
                  setNewPassword('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={changePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Add Family Member</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter email"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewUserPhoto(e.target.files[0])}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setAddUserModal({ open: false });
                  setNewUser({ name: '', email: '', password: '' });
                  setNewUserPhoto(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Update Modal */}
      {photoModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Update Photo for {photoModal.userName}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUpdatePhoto(e.target.files[0])}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPhotoModal({ open: false, userId: null, userName: '', isAdmin: false });
                  setUpdatePhoto(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={updateUserPhoto}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Update Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

