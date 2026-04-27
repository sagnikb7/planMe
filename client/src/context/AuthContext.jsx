import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AuthContext } from '@/context/auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [pendingSessions, setPendingSessions] = useState(null); // set when session limit hit

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.sessionLimited) {
      // Pending session — do not set user; return signal for the login page to redirect
      setPendingSessions(res.data.sessions || []);
      return { sessionLimited: true };
    }
    setPendingSessions(null);
    setUser(res.data.user);
    return { sessionLimited: false };
  };

  const resolveSession = async () => {
    const res = await api.post('/sessions/resolve');
    setPendingSessions(null);
    setUser(res.data.user);
  };

  const clearPending = () => {
    setPendingSessions(null);
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    await api.post('/auth/reset-password', { token, password });
  };

  const updateUser = (patch) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setPendingSessions(null);
  };

  const deleteAccount = async () => {
    await api.delete('/auth/me');
    setUser(null);
    setPendingSessions(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      pendingSessions,
      login,
      register,
      forgotPassword,
      resetPassword,
      logout,
      updateUser,
      deleteAccount,
      resolveSession,
      clearPending,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
