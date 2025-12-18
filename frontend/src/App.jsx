import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanel from './pages/AdminPanel';
import ManageMembers from './pages/ManageMembers';

function App(){
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/register" element={<RegisterPage/>} />
          <Route path="/admin" element={<AdminPanel/>} />
          <Route path="/manage-members" element={<ManageMembers/>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

