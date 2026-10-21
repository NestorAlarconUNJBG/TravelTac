import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CirclePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createUser, deleteUser, listUsers, updateUser } from './userService';

const EMPTY_FORM = {
  nombre_completo: '',
  correo: '',
  password: '',
  rol: 'admin',
  institucion: '',
  estado: 'activo',
};

export const UsersPage = () => {
  const { adminProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setUsers(await listUsers());
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return users;
    return users.filter((user) => [
      user.nombre_completo,
      user.correo,
      user.rol,
      user.institucion,
      user.estado,
    ].some((value) => (value || '').toLocaleLowerCase().includes(query)));
  }, [search, users]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const startEditing = (user) => {
    setEditingId(user.id);
    setForm({
      nombre_completo: user.nombre_completo || '',
      correo: user.correo || '',
      password: '',
      rol: user.rol || 'admin',
      institucion: user.institucion || '',
      estado: user.estado || 'activo',
    });
    setErrorMessage('');
    setSuccessMessage('');
    document.getElementById('user-form-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      if (editingId === null) {
        await createUser(form);
        setSuccessMessage('Usuario y cuenta de acceso creados correctamente.');
      } else {
        const { password, ...profile } = form;
        await updateUser(editingId, { ...profile, password });
        setSuccessMessage('Usuario actualizado correctamente.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de ${user.nombre_completo} (${user.correo})? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id));
      if (editingId === user.id) {
        setForm(EMPTY_FORM);
        setEditingId(null);
      }
      setSuccessMessage('Usuario y cuenta de acceso eliminados correctamente.');
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="users-page pois-page" aria-labelledby="users-title">
      <header className="pois-header">
        <div>
          <p className="pois-eyebrow">ADMINISTRACIÓN DEL SISTEMA</p>
          <h1 id="users-title">Usuarios administradores</h1>
          <p className="pois-intro">Gestiona las cuentas de acceso y sus niveles de permiso.</p>
        </div>
        <div className="pois-header-mark" aria-hidden="true"><UsersRound size={25} /></div>
      </header>

      <div className="users-access-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>Esta sección es exclusiva para superadministradores. Las cuentas se crean en Supabase Auth.</p>
      </div>

      {errorMessage && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="feedback-message feedback-success" role="status">{successMessage}</div>}

      <div className="pois-workspace">
        <section className="pois-list-panel" aria-labelledby="users-list-title">
          <div className="pois-list-heading">
            <div>
              <h2 id="users-list-title">Usuarios registrados</h2>
              <p>{users.length} {users.length === 1 ? 'usuario' : 'usuarios'}</p>
            </div>
            <button
              className="pois-icon-button"
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              aria-label="Actualizar lista de usuarios"
              title="Actualizar lista"
            >
              {isLoading
                ? <LoaderCircle size={18} className="pois-spinner" />
                : <RefreshCw size={18} />}
            </button>
          </div>

          <label className="pois-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuarios"
              aria-label="Buscar usuarios"
            />
          </label>

          {isLoading ? (
            <div className="pois-empty" role="status">
              <LoaderCircle size={24} className="pois-spinner" />
              Cargando usuarios...
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="pois-empty" role="status">
              <UsersRound size={25} />
              <p>{users.length
                ? 'No hay usuarios que coincidan con la búsqueda.'
                : 'Aún no hay usuarios administradores.'}</p>
            </div>
          ) : (
            <div className="pois-list">
              {visibleUsers.map((user) => {
                const isCurrentUser = String(user.id) === String(adminProfile?.id);
                return (
                  <article className={`pois-card${editingId === user.id ? ' pois-card-active' : ''}`} key={user.id}>
                    <div className="pois-card-heading">
                      <div className="pois-card-title">
                        <span className="pois-card-mark" aria-hidden="true">
                          <UserRound size={17} />
                        </span>
                        <div>
                          <h3>{user.nombre_completo}</h3>
                          <span>{user.correo}</span>
                        </div>
                      </div>
                      <span className={`user-status${user.estado === 'activo' ? ' is-active' : ''}`}>
                        {user.estado}
                      </span>
                    </div>
                    <p className="pois-card-description">
                      {user.institucion || 'Sin institución asignada'}
                    </p>
                    <div className="user-role-label">
                      <ShieldCheck size={14} aria-hidden="true" />
                      {user.rol}
                    </div>
                    {isCurrentUser ? (
                      <p className="user-self-note">Tu cuenta se administra desde Perfil.</p>
                    ) : (
                      <div className="pois-card-actions">
                        <button type="button" onClick={() => startEditing(user)}>
                          <Pencil size={15} /> Editar
                        </button>
                        <button
                          className="pois-delete-button"
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id
                            ? <LoaderCircle size={15} className="pois-spinner" />
                            : <Trash2 size={15} />}
                          {deletingId === user.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="pois-form-panel" aria-labelledby="user-form-title">
          <div className="pois-form-heading">
            <span className="pois-form-icon" aria-hidden="true">
              {editingId === null ? <CirclePlus size={20} /> : <Pencil size={19} />}
            </span>
            <div>
              <h2 id="user-form-title">{editingId === null ? 'Crear usuario' : 'Editar usuario'}</h2>
              <p>
                {editingId === null
                  ? 'Se creará también su cuenta de acceso.'
                  : 'Deja la contraseña vacía para conservar la actual.'}
              </p>
            </div>
            {editingId !== null && (
              <button
                className="pois-icon-button"
                type="button"
                onClick={resetForm}
                aria-label="Cancelar edición"
                title="Cancelar edición"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <form className="pois-form" onSubmit={handleSubmit}>
            <label className="pois-field">
              <span>Nombre completo <b>*</b></span>
              <input
                name="nombre_completo"
                value={form.nombre_completo}
                onChange={handleFieldChange}
                maxLength={150}
                required
              />
            </label>
            <label className="pois-field">
              <span>Correo electrónico <b>*</b></span>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleFieldChange}
                maxLength={150}
                autoComplete="off"
                required
              />
            </label>
            <label className="pois-field">
              <span>Institución</span>
              <input
                name="institucion"
                value={form.institucion}
                onChange={handleFieldChange}
                maxLength={150}
              />
            </label>
            <div className="pois-form-grid">
              <label className="pois-field">
                <span>Rol <b>*</b></span>
                <select name="rol" value={form.rol} onChange={handleFieldChange}>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Superadministrador</option>
                </select>
              </label>
              <label className="pois-field">
                <span>Estado <b>*</b></span>
                <select name="estado" value={form.estado} onChange={handleFieldChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
            </div>
            <label className="pois-field">
              <span>Contraseña {editingId === null && <b>*</b>}</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleFieldChange}
                minLength={8}
                autoComplete="new-password"
                required={editingId === null}
                placeholder={editingId === null ? 'Mínimo 8 caracteres' : 'Dejar vacía para no cambiar'}
              />
            </label>
            <div className="pois-form-actions">
              {editingId !== null && (
                <button className="pois-secondary-button" type="button" onClick={resetForm} disabled={isSaving}>
                  Cancelar
                </button>
              )}
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving
                  ? <LoaderCircle size={17} className="pois-spinner" />
                  : editingId === null ? <CirclePlus size={17} /> : <Pencil size={16} />}
                {isSaving ? 'Guardando...' : editingId === null ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
};
