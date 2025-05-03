import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      // Extract specific error message from backend response
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/register', { username, email, password });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      // Extract specific error message or validation errors
      let message = 'Registration failed. Please try again.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Combine multiple validation errors into one string
        message = error.response.data.errors.map(err => err.msg).join(' ');
      }
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await axios.get('/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};