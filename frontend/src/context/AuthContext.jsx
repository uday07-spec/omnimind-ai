import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('omnimind_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data?.user || response.data?.data?.user || response.data;
        setUser(userData);
      } catch (error) {
        console.error('Session restoration failed:', error);
        localStorage.removeItem('omnimind_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data?.token || response.data?.data?.token;
      if (token) {
        localStorage.setItem('omnimind_token', token);
      }
      const userData = response.data?.user || response.data?.data?.user || response.data;
      setUser(userData);
      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const token = response.data?.token || response.data?.data?.token;
      if (token) {
        localStorage.setItem('omnimind_token', token);
      }
      const userData = response.data?.user || response.data?.data?.user || response.data;
      setUser(userData);
      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout endpoint error (proceeding with local cleanup):', error);
    } finally {
      localStorage.removeItem('omnimind_token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
