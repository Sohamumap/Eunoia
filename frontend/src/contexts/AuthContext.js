import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('eunoia_token'));

  // axiosConfig depends only on token to avoid unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const axiosConfig = useCallback(() => {
    const config = { headers: {} };
    const t = token || localStorage.getItem('eunoia_token');
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  }, [token]);

  // checkAuth depends only on axiosConfig, avoiding infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, axiosConfig());
      setUser(data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('eunoia_token');
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const signup = async (email, locale, role) => {
    const { data } = await axios.post(`${API}/auth/signup`, { email, locale, role });
    if (data.token) { localStorage.setItem('eunoia_token', data.token); setToken(data.token); }
    setUser(data.user);
    return data;
  };

  const login = async (email) => {
    const { data } = await axios.post(`${API}/auth/login`, { email });
    if (data.token) { localStorage.setItem('eunoia_token', data.token); setToken(data.token); }
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { 
      await axios.post(`${API}/auth/logout`, {}, axiosConfig()); 
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('eunoia_token');
    setToken(null);
    setUser(null);
  };

  const completeOnboarding = async () => {
    await axios.post(`${API}/auth/complete-onboarding`, {}, axiosConfig());
    setUser(prev => ({ ...prev, onboarded: true }));
  };

  const api = useCallback((method, url, data) => {
    const config = axiosConfig();
    if (method === 'get') return axios.get(`${API}${url}`, config);
    if (method === 'post') return axios.post(`${API}${url}`, data, config);
    if (method === 'put') return axios.put(`${API}${url}`, data, config);
    if (method === 'delete') return axios.delete(`${API}${url}`, config);
  }, [axiosConfig]);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, completeOnboarding, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
