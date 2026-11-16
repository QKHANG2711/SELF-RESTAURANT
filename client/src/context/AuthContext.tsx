import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import apiClient from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('self_rest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('self_rest_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const profile = await apiClient<User>('/auth/me');
          setUser(profile);
          localStorage.setItem('self_rest_user', JSON.stringify(profile));
        } catch (err) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('self_rest_token');
          localStorage.removeItem('self_rest_user');
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('self_rest_token', res.token);
    localStorage.setItem('self_rest_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string }): Promise<User> => {
    const res = await apiClient<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('self_rest_token', res.token);
    localStorage.setItem('self_rest_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('self_rest_token');
    localStorage.removeItem('self_rest_user');
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('self_rest_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        role: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
