import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
    const { user, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [passwordRequest, setPasswordRequest] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isViewingRequests, setIsViewingRequests] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState('');

    useEffect(() => {
        if (!user) return;

        setDisplayName(user.name);

        const baseUrl =
            import.meta.env.VITE_API_URL?.replace('/api', '') ||
            'http://localhost:5000';

        const photoUrl = user.photo
            ? user.photo.startsWith('http')
                ? user.photo
                : `${baseUrl}${user.photo}`
            : null;

        setPhotoPreview(photoUrl);

        if (user.role === 'admin') fetchPendingRequests();
        else fetchMyPasswordRequestStatus();
    }, [user]);

    const fetchPendingRequests = async () => {
        try {
            const res = await api.get('/users/password-requests');
            setPendingRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyPasswordRequestStatus = async () => {
        try {
            const res = await api.get('/users/password-requests/me');
            setPasswordRequest(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const formData = new FormData();
            formData.append('displayName', displayName);
            const res = await api.patch('/users/me', formData);
            updateUser(res.data);
            setIsEditing(false);
            setPasswordStatus('Profile updated successfully.');
        } catch {
            alert('Failed to update profile');
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('photo', file);
            const res = await api.patch('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(res.data);
            setPhotoPreview(res.data.photo);
        } catch {
            alert('Failed to upload photo');
        }
    };

    const handleRequestPassword = async () => {
        await api.post('/users/password-requests');
        fetchMyPasswordRequestStatus();
        setPasswordStatus('Request sent.');
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordStatus('Passwords do not match');
            return;
        }
        await api.post('/users/change-password', { newPassword });
        setPasswordStatus('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        if (user.role !== 'admin') fetchMyPasswordRequestStatus();
    };

    const handleAdminAction = async (id, status) => {
        await api.patch(`/users/password-requests/${id}/status`, { status });
        fetchPendingRequests();
    };

    if (!user) return null;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-6 font-sans flex justify-center">
            <div className="max-w-6xl w-full flex flex-col gap-6">

                {/* Top Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition text-sm font-medium"
                    >
                        <span>←</span> Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold tracking-wide text-[var(--text-primary)]">My Profile</h1>
                </div>

                {/* Header Card - Identity */}
                <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-blue)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {photoPreview ? (
                            <img src={photoPreview} className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-subtle)] shadow-xl" alt="Profile" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-2xl font-bold text-[var(--text-secondary)] border-2 border-[var(--border-subtle)]">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Identity Details */}
                    <div className="flex flex-col items-center sm:items-start z-10">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{user.name}</h2>
                        <p className="text-[var(--text-secondary)] text-sm mb-2">{user.email}</p>
                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${user.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {user.role === 'admin' ? 'Family Head (Admin)' : 'Family Member'}
                        </span>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Row 1: Profile Information */}
                    <div className="lg:col-span-2 glass-card rounded-2xl p-6 relative">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Profile Information</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm"
                                    />
                                ) : (
                                    <div className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] flex justify-between items-center text-sm">
                                        {displayName}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                                        >
                                            ✎
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">Email</label>
                                <div className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-muted)] text-sm cursor-not-allowed">
                                    {user.email}
                                </div>
                            </div>

                            {/* Role Label below email as requested */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${user.role === 'admin' ? 'bg-[var(--bg-card-hover)] text-[var(--accent-blue)]' : 'bg-[var(--bg-card-hover)] text-emerald-400'
                                    }`}>
                                    {user.role === 'admin' ? 'Family Head (Admin)' : 'Family Member'}
                                </span>
                            </div>
                        </div>

                        {/* Edit Actions */}
                        {isEditing && (
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="px-4 py-2 bg-[var(--accent-blue)] hover:brightness-110 text-white text-sm font-bold rounded-lg shadow-[var(--shadow-btn)] transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Row 1: Profile Photo Update */}
                    <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-4 group">
                            {photoPreview ? (
                                <img src={photoPreview} className="w-24 h-24 rounded-full object-cover border-4 border-[var(--bg-base)] shadow-2xl" alt="Preview" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-3xl font-bold text-[var(--text-secondary)]">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <label className="cursor-pointer px-4 py-2 bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border-btn-photo)] rounded-lg text-xs text-[var(--text-primary)] font-bold uppercase tracking-wide transition shadow-sm">
                            Change Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                    </div>

                    {/* Left Column - Row 2: Change Password */}
                    <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">Change Password</h3>

                        {user.role !== 'admin' ? (
                            // MEMBER VIEW
                            <div className="space-y-4">
                                {!passwordRequest && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-xl">
                                        <p className="text-sm text-[var(--text-secondary)]">Request approval to change your password.</p>
                                        <button
                                            onClick={handleRequestPassword}
                                            className="px-4 py-2 bg-[var(--accent-blue)] hover:brightness-110 text-white text-sm font-bold rounded-lg transition whitespace-nowrap"
                                        >
                                            Request Password Change
                                        </button>
                                    </div>
                                )}

                                {passwordRequest?.status === 'pending' && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        <p className="text-yellow-500 text-sm font-medium">Request pending approval...</p>
                                    </div>
                                )}

                                {passwordRequest?.status === 'rejected' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <p className="text-red-500 text-sm font-medium">Request rejected.</p>
                                        </div>
                                        <button onClick={handleRequestPassword} className="text-xs text-red-400 underline decoration-red-400/50 hover:text-red-300">Retry</button>
                                    </div>
                                )}

                                {passwordRequest?.status === 'approved' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                        <div className="md:col-span-2 mb-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-center">
                                            <p className="text-green-500 text-xs font-bold uppercase tracking-wide">Request Approved</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">New Password</label>
                                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-green-500 transition text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">Confirm Password</label>
                                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-green-500 transition text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button onClick={handleUpdatePassword} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-500/20 transition text-sm">Update Password</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ADMIN VIEW
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-2 block">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <button
                                        onClick={handleUpdatePassword}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-sm font-bold rounded-lg shadow-[var(--shadow-btn)] transition"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {passwordStatus && (
                            <div className={`mt-4 text-center text-sm font-medium ${passwordStatus.includes('success') ? 'text-green-400' : 'text-[var(--text-secondary)]'}`}>
                                {passwordStatus}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Row 2: Security Panel */}
                    <div className="lg:col-span-1 glass-card rounded-2xl p-6 h-full">
                        <h3 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">Security</h3>

                        {user.role === 'admin' ? (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Admin Controls</h4>
                                </div>

                                <ul className="space-y-4 text-sm">
                                    <li
                                        className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition group"
                                        onClick={() => setIsViewingRequests(!isViewingRequests)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] group-hover:bg-[var(--accent-blue)] transition"></span>
                                            <span>Pending password requests</span>
                                        </div>
                                        {pendingRequests.length > 0 && (
                                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-yellow-500/50">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </li>

                                    {/* Inline Pending List */}
                                    {isViewingRequests && pendingRequests.length > 0 && (
                                        <div className="pl-4 border-l border-[var(--border-subtle)] space-y-2">
                                            {pendingRequests.map(req => (
                                                <div key={req._id} className="bg-[var(--bg-card-inner)] p-2 rounded border border-[var(--border-subtle)] flex flex-col gap-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-[var(--text-primary)] font-medium">{req.userName}</span>
                                                        <span className="text-[var(--text-muted)]">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAdminAction(req.userId || req._id, 'approved'); }}
                                                            className="text-[10px] font-bold text-green-400 bg-green-500/10 py-1 rounded hover:bg-green-500/20 transition"
                                                        >
                                                            APPROVE
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAdminAction(req.userId || req._id, 'rejected'); }}
                                                            className="text-[10px] font-bold text-red-400 bg-red-500/10 py-1 rounded hover:bg-red-500/20 transition"
                                                        >
                                                            REJECT
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <li
                                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition group"
                                        onClick={() => navigate('/manage-members')}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] group-hover:bg-[var(--accent-blue)] transition"></span>
                                        <span>Manage family members</span>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Account status</h4>
                                </div>
                                <ul className="space-y-4 text-sm">
                                    <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span>Active & Secure</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span>Connected to {user.houseName}</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
