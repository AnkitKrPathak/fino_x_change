import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fino_token');
    const savedUser = localStorage.getItem('fino_user');
    if (token) {
      authApi.me()
        .then((data) => {
          // /me returns { id, role }; use saved user for name/email if available
          const fullUser = savedUser ? { ...JSON.parse(savedUser), ...data.user } : data.user;
          setUser(fullUser);
        })
        .catch(() => {
          localStorage.removeItem('fino_token');
          localStorage.removeItem('fino_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem('fino_user');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('fino_token', data.token);
    localStorage.setItem('fino_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, role = 'user') => {
    await authApi.register(name, email, password, role);
    // Auto-login after register
    const loginData = await authApi.login(email, password);
    localStorage.setItem('fino_token', loginData.token);
    localStorage.setItem('fino_user', JSON.stringify(loginData.user));
    setUser(loginData.user);
    return loginData;
  };

  const logout = () => {
    localStorage.removeItem('fino_token');
    localStorage.removeItem('fino_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
