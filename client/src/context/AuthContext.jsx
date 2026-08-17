import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on app startup
  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        if (data.success) {
          setUser(data.user);
          setProfile(data.profile);
        } else {
          setAuthToken(null);
        }
      } catch (err) {
        console.error('Failed to load user session:', err.message);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register Patient
  const registerPatient = async (patientData) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/patient/register', {
        method: 'POST',
        body: patientData
      });
      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
      }
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register Doctor
  const registerDoctor = async (doctorData) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/doctor/register', {
        method: 'POST',
        body: doctorData
      });
      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
      }
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login (both Doctor and Patient)
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const endpoint = role === 'doctor' ? '/auth/doctor/login' : '/auth/patient/login';
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: { email, password }
      });
      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
      }
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout server request failed:', err.message);
    } finally {
      setAuthToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  // Profile update (synchronizes user profile in context)
  const updateContextProfile = (newProfile) => {
    setProfile(newProfile);
  };

  const value = {
    user,
    profile,
    loading,
    registerPatient,
    registerDoctor,
    login,
    logout,
    updateContextProfile
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
