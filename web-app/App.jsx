import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { AdminLayout } from './src/components/AdminLayout';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { LoginPage } from './src/features/auth/LoginPage';
import { ProfilePage } from './src/features/auth/ProfilePage';
import { useAuth } from './src/context/AuthContext';

const MultimediaPage = lazy(() => import('./src/features/multimedia/MultimediaPage')
  .then(({ MultimediaPage: page }) => ({ default: page })));
const AuditPage = lazy(() => import('./src/features/audit/AuditPage')
  .then(({ AuditPage: page }) => ({ default: page })));
const PoisPage = lazy(() => import('./src/features/pois/PoisPage')
  .then(({ PoisPage: page }) => ({ default: page })));
const CategoriesPage = lazy(() => import('./src/features/categories/CategoriesPage')
  .then(({ CategoriesPage: page }) => ({ default: page })));
const UsersPage = lazy(() => import('./src/features/users/UsersPage')
  .then(({ UsersPage: page }) => ({ default: page })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Privadas / Protegidas */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="pois" replace />} />
              <Route
                path="pois"
                element={(
                  <Suspense fallback={<div className="pois-loading" role="status">Cargando puntos de interés...</div>}>
                    <PoisPage />
                  </Suspense>
                )}
              />
              <Route
                path="categorias"
                element={(
                  <Suspense fallback={<div className="pois-loading" role="status">Cargando categorías...</div>}>
                    <CategoriesPage />
                  </Suspense>
                )}
              />
              <Route
                path="usuarios"
                element={(
                  <SuperAdminRoute>
                    <Suspense fallback={<div className="pois-loading" role="status">Cargando usuarios...</div>}>
                      <UsersPage />
                    </Suspense>
                  </SuperAdminRoute>
                )}
              />
              <Route
                path="multimedia"
                element={(
                  <Suspense fallback={<div className="multimedia-loading" role="status">Cargando módulo multimedia...</div>}>
                    <MultimediaPage />
                  </Suspense>
                )}
              />
              <Route
                path="auditoria"
                element={(
                  <Suspense fallback={<div className="audit-empty" role="status">Cargando auditoría...</div>}>
                    <AuditPage />
                  </Suspense>
                )}
              />
              <Route path="perfil" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/admin/pois" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function SuperAdminRoute({ children }) {
  const { adminProfile, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Verificando permisos...</div>;
  }
  if (adminProfile?.rol !== 'superadmin' || adminProfile.estado !== 'activo') {
    return <Navigate to="/admin/pois" replace />;
  }
  return children;
}
