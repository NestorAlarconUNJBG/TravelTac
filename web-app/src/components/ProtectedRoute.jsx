import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { authUser, adminProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center loading-screen">Cargando TravelTac...</div>;
  }

  if (!authUser || !adminProfile || adminProfile.estado !== 'activo') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};