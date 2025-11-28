import React, { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage(){
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [houseName, setHouseName] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!houseName.trim()) {
      setError('House name is required');
      return;
    }
    
    try {
      const res = await api.post('/auth/login', { email, password, houseName: houseName.trim(), role });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={submit} className="p-6 max-w-md w-full bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)} 
            className="block w-full p-2 border rounded"
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <input 
          value={houseName} 
          onChange={e => setHouseName(e.target.value)} 
          placeholder="House Name" 
          className="block w-full p-2 border rounded my-2" 
          required
        />
        <input 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email" 
          type="email"
          className="block w-full p-2 border rounded my-2" 
          required
        />
        <input 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Password" 
          type="password" 
          className="block w-full p-2 border rounded my-2" 
          required
        />
        <button type="submit" className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</button>
        <p className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
        </p>
      </form>
    </div>
  );
}

