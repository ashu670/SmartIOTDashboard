import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state on refresh
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const rawUser = localStorage.getItem('user');

        if (!token || !rawUser) {
          setUser(null);
          return;
        }

        // Optional: trust localStorage for now
        // (Later you can replace this with api.get('/auth/me'))
        setUser(JSON.parse(rawUser));
      } catch (err) {
        console.error('Auth restore failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
