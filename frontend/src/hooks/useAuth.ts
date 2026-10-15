import { useState, useCallback } from 'react';
import { login as apiLogin } from '../api/client';

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('auth_token')
  );
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem('auth_username')
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async (user: string, pass: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiLogin(user, pass);
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('auth_username', res.username);
      setToken(res.access_token);
      setUsername(res.username);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || 'Login failed. Please try again.';
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('chat_messages');
    setToken(null);
    setUsername(null);
  }, []);

  return {
    token,
    username,
    isAuthenticated: !!token,
    isLoggingIn,
    loginError,
    login,
    logout,
  };
}
