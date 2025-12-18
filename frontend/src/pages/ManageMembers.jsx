import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function ManageMembers() {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchMembers();
  }, [user, loading, navigate]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.get('/admin/users');
      // Include the current admin user as well
      setMembers([user, ...res.data.users]);
    } catch (err) {
      console.error('Error fetching members:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      };
      
      await api.post('/admin/users', payload);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      setErrors({});
      
      // Refresh members list
      fetchMembers();
    } catch (err) {
      const message = err.response?.data?.message || 'Error adding member';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${memberId}`);
      fetchMembers();
    } catch (err) {
      const message = err.response?.data?.message || 'Error removing member';
      alert(message);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    // Note: Backend doesn't have a change role endpoint yet
    // This is a placeholder for future implementation
    alert('Role change functionality will be available soon');
  };

  if (loading || loadingMembers) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const otherMembers = members.filter(m => m._id !== user._id);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Family Members</h1>
          <p className="text-slate-400">Add, remove, and manage access for your home</p>
        </div>

        {/* Section 1: Existing Members */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Existing Members</h2>
          <div className="bg-slate-800/70 rounded-2xl p-6">
            {members.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No members found</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member._id || member.email}
                    className="bg-slate-900/50 rounded-xl p-4 flex items-center gap-4"
                  >
                    {/* Avatar */}
                    {member.photo ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${member.photo}`}
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name and Role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{member.name}</p>
                      <p className="text-xs text-slate-400">
                        {member.email}
                      </p>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            member.role === 'admin'
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                          }`}
                        >
                          {member.role === 'admin' ? 'Family Head' : 'Family Member'}
                        </span>
                      </div>
                    </div>

                    {/* Actions (only for non-current-admin members) */}
                    {member._id !== user._id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleChangeRole(member._id, member.role === 'admin' ? 'user' : 'admin')}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member._id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-sm transition"
                        >
                          Remove Member
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Add New Member */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
          <div className="bg-slate-800/70 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Enter member name"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                    errors.email ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                    errors.password ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <p className="text-sm text-red-400">{errors.submit}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  isSubmitting
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isSubmitting ? 'Creating Member...' : 'Create Member'}
              </button>
            </form>
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

