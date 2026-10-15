import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { AdminLayout } from './src/components/AdminLayout';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { LoginPage } from './src/features/auth/LoginPage';
import { ProfilePage } from './src/features/auth/ProfilePage';

const MultimediaPage = lazy(() => import('./src/features/multimedia/MultimediaPage')
  .then(({ MultimediaPage: page }) => ({ default: page })));
const AuditPage = lazy(() => import('./src/features/audit/AuditPage')
  .then(({ AuditPage: page }) => ({ default: page })));

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
              <Route path="pois" element={<AdminSection title="Puntos de interés" />} />
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

const AdminSection = ({ title }) => (
  <section className="admin-empty-state" aria-labelledby="admin-section-title">
    <div className="admin-empty-mark" aria-hidden="true">◇</div>
    <h2 id="admin-section-title">{title}</h2>
    <p>Esta sección estará disponible próximamente.</p>
  </section>
);