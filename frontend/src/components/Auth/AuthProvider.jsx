import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, logout, setUser } from '../../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token, user, status } = useSelector((state) => state.auth);

  const cachedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const { data } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: async () => {
      if (!token) return null;
      const { data } = await api.get('/auth/me');
      return data?.user || null;
    },
    enabled: Boolean(token),
    initialData: cachedUser,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data && data !== user) {
      dispatch(setUser(data));
    }
  }, [data, user, dispatch]);

  // Show loading state while fetching user data
  if (token && !cachedUser && status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthProvider;
