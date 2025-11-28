import React, { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage(){
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      const res = await api.post('/auth/register', { name, email, password, role, houseName: houseName.trim() });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={submit} className="p-6 max-w-md w-full bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Name" 
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
          minLength={6}
        />
        <div className="my-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
          <input 
            value={houseName} 
            onChange={e => setHouseName(e.target.value)} 
            placeholder="Enter your house name"
            className="block w-full p-2 border rounded"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be your unique house identifier. Only one admin per house name.
          </p>
        </div>
        <div className="my-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Type:</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)} 
            className="block w-full p-2 border rounded"
            disabled
          >
            <option value="admin">Admin (Family Head)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only family head (admin) can register here. Family members will be added by the admin.
          </p>
        </div>
        <button type="submit" className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Register</button>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </form>
    </div>
  );
}

