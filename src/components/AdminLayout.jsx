import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AudioLines,
  ClipboardList,
  LogOut,
  MapPin,
  Menu,
  Tags,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sections = [
  { to: '/admin/pois', label: 'Puntos de interés', icon: MapPin },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/multimedia', label: 'Multimedia y audioguías', icon: AudioLines },
  { to: '/admin/auditoria', label: 'Auditoría y Bitácora', icon: ClipboardList },
  { to: '/admin/perfil', label: 'Perfil', icon: UserRound },
];

export const AdminLayout = () => {
  const { adminProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(error.message || 'No se pudo cerrar la sesión.');
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${menuOpen ? ' admin-sidebar-open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">◇</span>
          <div>
            <strong>TravelTac</strong>
            <span>Panel de gestión</span>
          </div>
          <button
            className="admin-menu-close"
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
          >
            <X size={20} />
          </button>
        </div>

        <p className="admin-nav-label">GESTIÓN</p>
        <nav className="admin-nav" aria-label="Secciones administrativas">
          {sections.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              onClick={closeMenu}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <span className="admin-user-avatar" aria-hidden="true">
              {(adminProfile?.nombre_completo || adminProfile?.correo || 'G').charAt(0).toUpperCase()}
            </span>
            <span className="admin-user-info">
              <strong>{adminProfile?.nombre_completo || 'Gestor'}</strong>
              <span>{adminProfile?.institucion || 'Entidad gestora'}</span>
            </span>
          </div>
          <button className="admin-logout" type="button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="admin-backdrop"
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={21} />
          </button>
          <span>Panel administrativo</span>
          <span className="admin-topbar-ornament" aria-hidden="true">· ◇ ·</span>
        </header>

        <div className="admin-content">
          {logoutError && (
            <div className="feedback-message feedback-error" role="alert">
              {logoutError}
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
};
