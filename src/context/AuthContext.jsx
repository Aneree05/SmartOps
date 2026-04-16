import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as api from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?._id) {
      if (!socket) {
         const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
         const newSocket = io(URL, { query: { userId: user._id } });
         setSocket(newSocket);
      }
    } else {
      if (socket) {
         socket.disconnect();
         setSocket(null);
      }
    }
    
    return () => {
      // Don't disconnect on cleanup if we want it to persist during navigation, 
      // it only disconnects when user._id becomes null.
    };
  }, [user?._id]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    const u = { _id: data.userId, name: data.name, role: data.role, teamId: data.teamId };
    setUser(u);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(u));
    return data;
  };

  const register = async (name, email, password, role) => {
    const data = await api.register(name, email, password, role);
    setToken(data.token);
    const u = { _id: data.userId, name: data.name, role: data.role, teamId: data.teamId };
    setUser(u);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(u));
    return data;
  };

  const logout = () => {
    if (socket) {
        socket.disconnect();
        setSocket(null);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return <div>Loading session...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
