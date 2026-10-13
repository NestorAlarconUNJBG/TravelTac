import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { LoginPage } from './src/features/auth/LoginPage';
import { ProfilePage } from './src/features/auth/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Privadas / Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/perfil" element={<ProfilePage />} />
            {/* Aquí conectaremos el módulo de POIs en el siguiente paso */}
            <Route path="/admin/pois" element={<div>Aquí irá el CRUD de POIs</div>} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/admin/pois" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}