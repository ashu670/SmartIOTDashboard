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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

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
    // If not in confirm state, switch to confirm state
    if (deleteConfirmId !== memberId) {
      setDeleteConfirmId(memberId);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    try {
      await api.delete(`/admin/users/${memberId}`);
      setDeleteConfirmId(null);
      fetchMembers();
    } catch (err) {
      const message = err.response?.data?.message || 'Error removing member';
      alert(message); // Fallback for API error only
    }
  };

  const handleStartRoleEdit = (member) => {
    if (member._id === user._id) return;
    setEditingRoleUserId(member._id);
    setSelectedRole(member.role);
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleUserId(null);
    setSelectedRole('');
  };

  const handleSaveRole = async (memberId) => {
    try {
      // If role matches existing, just cancel
      const member = members.find(m => m._id === memberId);
      if (member && member.role === selectedRole) {
        handleCancelRoleEdit();
        return;
      }

      const res = await api.patch(`/admin/users/${memberId}/role`, { role: selectedRole });

      if (res.data.transferred) {
        // Admin rights transferred. We are no longer admin.
        navigate('/');
        return;
      }

      // Otherwise just update local state
      setMembers(prev => prev.map(m => {
        if (m._id === memberId) return { ...m, role: selectedRole };
        return m;
      }));
      handleCancelRoleEdit();

    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update role';
      alert(message);
    }
  };

  if (loading || loadingMembers) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[var(--accent-blue)]/30 border-t-[var(--accent-blue)] rounded-full animate-spin"></div>
          <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">Loading household...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 font-sans flex justify-center">
      <div className="max-w-6xl w-full flex flex-col gap-8">

        {/* Top Navigation */}
        <div className="flex flex-col gap-6">
          <button
            onClick={() => navigate('/')}
            className="self-start text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition text-sm font-medium"
          >
            <span>←</span> Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Manage Family Members</h1>
            <p className="text-[var(--text-secondary)] text-sm">Add, remove, and manage access for your home</p>
          </div>
        </div>

        {/* Household Overview Card (Context) */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-blue)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--accent-blue)]/10 rounded-full flex items-center justify-center text-[var(--accent-blue)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">Household Overview</h2>
                <p className="text-[var(--text-secondary)] text-xs">You are logged in as the Family Head</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-card-inner)] px-4 py-2 rounded-lg border border-[var(--border-subtle)]">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{members.length}</span>
              <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Members</span>
            </div>
          </div>
        </div>

        {/* Existing Members Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Existing Members</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[var(--text-muted)] glass-card rounded-2xl border-dashed">
                No members found
              </div>
            ) : (
              members.map((member) => (
                <div key={member._id || member.email} className="glass-card rounded-2xl p-6 flex flex-col gap-4 group hover:border-[var(--accent-blue)]/30 transition duration-300">
                  {/* Card Top: Avatar & Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="relative">
                        {member.photo ? (
                          <img
                            src={member.photo.startsWith('http') ? member.photo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${member.photo}`}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-subtle)] shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-lg font-bold text-[var(--text-secondary)] border-2 border-[var(--border-subtle)]">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Online Status Indicator (Mock) */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-card)] rounded-full"></div>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight">{member.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-[120px]">{member.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Middle: Role Badge or Editor */}
                  <div>
                    {editingRoleUserId === member._id ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-[var(--text-muted)] italic">Example: Caretaker, Guest (Not yet available)</p>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Additional roles coming soon.</p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={handleCancelRoleEdit}
                            className="w-full bg-[var(--bg-card-inner)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-xs font-bold py-1.5 rounded transition border border-[var(--border-subtle)]"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${member.role === 'admin'
                        ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {member.role === 'admin' ? 'Family Head' : 'Family Member'}
                      </span>
                    )}
                  </div>

                  {/* Card Bottom: Actions */}
                  {editingRoleUserId !== member._id && (
                    <div className="mt-2 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                      {/* Only show actions if NOT checking self */}
                      {member._id !== user._id ? (
                        <>


                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded transition ${deleteConfirmId === member._id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              }`}
                          >
                            {deleteConfirmId === member._id ? 'Confirm Remove' : 'Remove'}
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-medium italic select-none">You (Admin)</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add New Member Section */}
        <section className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Add New Members</h2>
            <p className="text-sm text-[var(--text-secondary)]">Create accounts for family members to give them app access.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-[var(--bg-card-inner)] border rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-subtle)]'
                    }`}
                  placeholder="e.g. John Wick"
                />
                {errors.name && <p className="text-xs text-red-400 font-medium">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-[var(--bg-card-inner)] border rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-subtle)]'
                    }`}
                  placeholder="e.g. John@example.com"
                />
                {errors.email && <p className="text-xs text-red-400 font-medium">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Set Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-[var(--bg-card-inner)] border rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-subtle)]'
                    }`}
                  placeholder="••••••••"
                />
                {errors.password ? (
                  <p className="text-xs text-red-400 font-medium">{errors.password}</p>
                ) : (
                  <p className="text-[10px] text-[var(--text-muted)]">Member can change this after logging in.</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full bg-[var(--bg-card-inner)] border rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-subtle)]'
                    }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-xs text-red-400 font-medium">{errors.confirmPassword}</p>}
              </div>

              {/* Role */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Access Level</label>
                <div className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-muted)] text-sm cursor-not-allowed flex items-center justify-between">
                  <span>Family Member (Limited Control)</span>
                  <span className="text-xs text-[var(--text-muted)]">Default</span>
                </div>
                {/* Hidden input to maintain form logic compatibility */}
                <input type="hidden" name="role" value="user" />
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <span className="text-red-500 text-sm font-medium">{errors.submit}</span>
              </div>
            )}

            {/* Action */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[var(--accent-blue)] hover:brightness-110 text-white font-bold rounded-lg shadow-[var(--shadow-btn)] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? 'Adding Member...' : 'Add Member'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}

