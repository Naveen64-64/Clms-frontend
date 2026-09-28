import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export const getDashboardRoute = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'LIBRARIAN':
      return '/librarian/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    case 'FACULTY':
      return '/faculty/dashboard';
    case 'LIBRARY_ENTRANCE':
      return '/library-entrance/dashboard';
    default:
      return '/';
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      if (accessToken) {
        try {
          const res = await authApi.getMe();
          if (res?.data) {
            setUser(res.data);
            setLoading(false);
            return;
          }
        } catch (err) {
          // getMe failed (e.g. expired access token). Interceptor or refresh fallback below will handle it.
        }
      }

      if (refreshToken) {
        try {
          const refreshRes = await authApi.refreshToken(refreshToken);
          const newAccessToken = refreshRes?.data?.accessToken;
          const newRefreshToken = refreshRes?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const meRes = await authApi.getMe();
            if (meRes?.data) {
              setUser(meRes.data);
              setLoading(false);
              return;
            }
          }
        } catch (refErr) {
          // Token refresh failed
        }
      }

      localStorage.clear();
      setUser(null);
    } catch (err) {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const handleLogoutEvent = () => {
      localStorage.clear();
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    const data = response.data;
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      return data;
    }
    throw new Error('Invalid authentication response');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network error on logout
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const role = user?.role || 'OPEN_USER';
  const studentProfile = user?.studentProfile || null;
  const facultyProfile = user?.facultyProfile || null;
  const librarianProfile = user?.librarianProfile || null;
  const assignedLibraryId = librarianProfile?.assignedLibrary?._id || librarianProfile?.assignedLibrary || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        studentProfile,
        facultyProfile,
        librarianProfile,
        assignedLibraryId,
        loading,
        login,
        logout,
        refreshUser: initAuth,
        getDashboardRoute: () => getDashboardRoute(role),
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

