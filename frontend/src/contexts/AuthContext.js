import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);
const TOKEN_KEY = 'eunoia_token';

/**
 * NOTE on token storage:
 * For the prototype we persist the JWT in localStorage for cross-reload
 * convenience. For a production hardening pass, move to httpOnly secure
 * cookies set by the backend — that requires CORS credentials wiring and
 * a matching server change, so it's deliberately out of scope here.
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // axiosConfig rebuilds whenever token changes; localStorage is read as a
  // fallback only for first-render recovery (no need in deps — it's a side store).
  const axiosConfig = useCallback(() => {
    const config = { headers: {} };
    const t = token || localStorage.getItem(TOKEN_KEY);
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  }, [token]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, axiosConfig());
      setUser(data.user);
    } catch {
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const signup = useCallback(async (email, locale, role) => {
    const { data } = await axios.post(`${API}/auth/signup`, { email, locale, role });
    if (data.token) { localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); }
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async (email) => {
    const { data } = await axios.post(`${API}/auth/login`, { email });
    if (data.token) { localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); }
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, axiosConfig());
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [axiosConfig]);

  const completeOnboarding = useCallback(async () => {
    await axios.post(`${API}/auth/complete-onboarding`, {}, axiosConfig());
    setUser(prev => ({ ...prev, onboarded: true }));
  }, [axiosConfig]);

  const api = useCallback((method, url, data) => {
    const config = axiosConfig();
    if (method === 'get') return axios.get(`${API}${url}`, config);
    if (method === 'post') return axios.post(`${API}${url}`, data, config);
    if (method === 'put') return axios.put(`${API}${url}`, data, config);
    if (method === 'delete') return axios.delete(`${API}${url}`, config);
    return Promise.reject(new Error(`Unsupported HTTP method: ${method}`));
  }, [axiosConfig]);

  // Memoize context value so consumers don't re-render on every provider render.
  const value = useMemo(
    () => ({ user, loading, signup, login, logout, completeOnboarding, api }),
    [user, loading, signup, login, logout, completeOnboarding, api]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
