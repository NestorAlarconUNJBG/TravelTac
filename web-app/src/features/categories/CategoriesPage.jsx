import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CirclePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './categoryService';

const EMPTY_FORM = { nombre: '', descripcion: '', simbolo: '' };

const getCategorySymbol = (category) => {
  const value = category.icono_url?.trim() || '';
  if (value && Array.from(value).length === 1) return value;
  return Array.from(category.nombre?.trim() || '')[0]?.toLocaleUpperCase() || '◇';
};

export const CategoriesPage = () => {
  const { adminProfile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setCategories(await listCategories());
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return categories;
    return categories.filter((category) => (
      [category.nombre, category.descripcion]
        .some((value) => (value || '').toLocaleLowerCase().includes(query))
    ));
  }, [categories, search]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      if (editingId === null) {
        if (!adminProfile?.id) {
          throw new Error('No se pudo identificar al gestor que registra la categoría.');
        }
        await createCategory(form, adminProfile.id);
        setSuccessMessage('Categoría creada correctamente.');
      } else {
        await updateCategory(editingId, form);
        setSuccessMessage('Categoría actualizada correctamente.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadCategories();
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar la categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setForm({
      nombre: category.nombre || '',
      descripcion: category.descripcion || '',
      simbolo: category.icono_url && Array.from(category.icono_url.trim()).length === 1
        ? category.icono_url.trim()
        : '',
    });
    setErrorMessage('');
    setSuccessMessage('');
    document.getElementById('category-form-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.nombre}"? Los puntos vinculados quedarán sin categoría.`,
    );
    if (!confirmed) return;

    setDeletingId(category.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteCategory(category.id);
      setCategories((currentCategories) => (
        currentCategories.filter((item) => item.id !== category.id)
      ));
      if (editingId === category.id) {
        setForm(EMPTY_FORM);
        setEditingId(null);
      }
      setSuccessMessage('Categoría eliminada correctamente.');
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar la categoría.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="pois-page" aria-labelledby="categories-title">
      <header className="pois-header">
        <div>
          <p className="pois-eyebrow">ORGANIZACIÓN DEL CONTENIDO</p>
          <h1 id="categories-title">Categorías</h1>
          <p className="pois-intro">Administra las categorías utilizadas para clasificar los puntos de interés.</p>
        </div>
        <div className="pois-header-mark" aria-hidden="true"><Tags size={25} /></div>
      </header>

      {errorMessage && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="feedback-message feedback-success" role="status">{successMessage}</div>}

      <div className="pois-workspace">
        <section className="pois-list-panel" aria-labelledby="categories-list-title">
          <div className="pois-list-heading">
            <div>
              <h2 id="categories-list-title">Categorías registradas</h2>
              <p>{categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}</p>
            </div>
            <button
              className="pois-icon-button"
              type="button"
              onClick={loadCategories}
              disabled={isLoading}
              aria-label="Actualizar lista de categorías"
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
              placeholder="Buscar categorías"
              aria-label="Buscar categorías"
            />
          </label>

          {isLoading ? (
            <div className="pois-empty" role="status">
              <LoaderCircle size={24} className="pois-spinner" />
              Cargando categorías...
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="pois-empty" role="status">
              <Tags size={25} />
              <p>{categories.length
                ? 'No hay categorías que coincidan con la búsqueda.'
                : 'Aún no hay categorías. Registra la primera.'}</p>
            </div>
          ) : (
            <div className="pois-list">
              {visibleCategories.map((category) => (
                <article
                  className={`pois-card${editingId === category.id ? ' pois-card-active' : ''}`}
                  key={category.id}
                >
                  <div className="pois-card-heading">
                    <div className="pois-card-title">
                      <span className="pois-card-mark" aria-hidden="true">
                        {getCategorySymbol(category)}
                      </span>
                      <div><h3>{category.nombre}</h3></div>
                    </div>
                  </div>
                  <p className="pois-card-description">
                    {category.descripcion || 'Sin descripción.'}
                  </p>
                  <div className="pois-card-actions">
                    <button type="button" onClick={() => startEditing(category)}>
                      <Pencil size={15} /> Editar
                    </button>
                    <button
                      className="pois-delete-button"
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={deletingId === category.id}
                    >
                      {deletingId === category.id
                        ? <LoaderCircle size={15} className="pois-spinner" />
                        : <Trash2 size={15} />}
                      {deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="pois-form-panel" aria-labelledby="category-form-title">
          <div className="pois-form-heading">
            <span className="pois-form-icon" aria-hidden="true">
              {editingId === null ? <CirclePlus size={20} /> : <Pencil size={19} />}
            </span>
            <div>
              <h2 id="category-form-title">
                {editingId === null ? 'Registrar categoría' : 'Editar categoría'}
              </h2>
              <p>Indica el nombre y los detalles opcionales.</p>
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
              <span>Nombre <b>*</b></span>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleFieldChange}
                maxLength={100}
                placeholder="Ej. Patrimonio histórico"
                required
              />
            </label>
            <label className="pois-field">
              <span>Descripción</span>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleFieldChange}
                maxLength={1000}
                rows={4}
                placeholder="Describe brevemente esta categoría"
              />
            </label>
            {/* <label className="pois-field">
              <span>Símbolo o letra (opcional)</span>
              <input
                name="simbolo"
                type="text"
                value={form.simbolo}
                onChange={handleFieldChange}
                maxLength={2}
                placeholder="◇"
                aria-describedby="category-symbol-help"
              />
              <small id="category-symbol-help" className="category-symbol-help">
                Se mostrará una sola letra o símbolo. Si lo dejas vacío, se usará la inicial del nombre.
              </small>
            </label> */}
            <div className="pois-form-actions">
              {editingId !== null && (
                <button
                  className="pois-secondary-button"
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              )}
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving
                  ? <LoaderCircle size={17} className="pois-spinner" />
                  : editingId === null ? <CirclePlus size={17} /> : <Pencil size={16} />}
                {isSaving ? 'Guardando...' : editingId === null ? 'Crear categoría' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
};
