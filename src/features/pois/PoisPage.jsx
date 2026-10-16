import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CirclePlus,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PoiMap } from './PoiMap';
import { createPoi, deletePoi, listPois, updatePoi } from './poiService';

const EMPTY_FORM = {
  codigo_identificador: '',
  nombre: '',
  descripcion_corta: '',
  historia_completa: '',
  latitud: '',
  longitud: '',
  radio_geocerca_m: '50',
  estado_publicacion: 'borrador',
};

const formatCoordinate = (value) => (
  value === null || value === undefined || value === ''
    ? ''
    : String(Number(value))
);

export const PoisPage = () => {
  const [pois, setPois] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPois = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setPois(await listPois());
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar los puntos de interés.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPois();
  }, [loadPois]);

  const visiblePois = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return pois;
    return pois.filter((poi) => [
      poi.codigo_identificador,
      poi.nombre,
      poi.descripcion_corta,
      poi.historia_completa,
    ].some((value) => (value || '').toLocaleLowerCase().includes(normalizedSearch)));
  }, [pois, search]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const startEditing = (poi) => {
    setEditingId(poi.id);
    setForm({
      codigo_identificador: poi.codigo_identificador || '',
      nombre: poi.nombre || '',
      descripcion_corta: poi.descripcion_corta || '',
      historia_completa: poi.historia_completa || '',
      latitud: formatCoordinate(poi.latitud),
      longitud: formatCoordinate(poi.longitud),
      radio_geocerca_m: poi.radio_geocerca_m === null || poi.radio_geocerca_m === undefined
        ? '50'
        : String(Number(poi.radio_geocerca_m)),
      estado_publicacion: poi.estado_publicacion || 'borrador',
    });
    setErrorMessage('');
    setSuccessMessage('');
    document.getElementById('poi-form-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePositionChange = (latitude, longitude) => {
    setForm((currentForm) => ({
      ...currentForm,
      latitud: latitude.toFixed(7),
      longitud: longitude.toFixed(7),
    }));
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
        await createPoi(form);
        setSuccessMessage('Punto de interés creado correctamente.');
      } else {
        await updatePoi(editingId, form);
        setSuccessMessage('Punto de interés actualizado correctamente.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadPois();
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el punto de interés.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (poi) => {
    const confirmed = window.confirm(
      `¿Eliminar "${poi.nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(poi.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deletePoi(poi.id);
      setPois((currentPois) => currentPois.filter((item) => item.id !== poi.id));
      if (editingId === poi.id) {
        setForm(EMPTY_FORM);
        setEditingId(null);
      }
      setSuccessMessage('Punto de interés eliminado correctamente.');
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el punto de interés.');
    } finally {
      setDeletingId(null);
    }
  };

  const parsedLatitude = form.latitud.trim() === '' ? null : Number(form.latitud);
  const parsedLongitude = form.longitud.trim() === '' ? null : Number(form.longitud);
  const parsedRadius = form.radio_geocerca_m.trim() === '' ? 50 : Number(form.radio_geocerca_m);

  return (
    <section className="pois-page" aria-labelledby="pois-title">
      <header className="pois-header">
        <div>
          <p className="pois-eyebrow">GESTIÓN DEL DESTINO</p>
          <h1 id="pois-title">Puntos de interés</h1>
          <p className="pois-intro">
            Administra la información turística, la ubicación y el radio de activación de cada sitio.
          </p>
        </div>
        <div className="pois-header-mark" aria-hidden="true"><MapPin size={25} /></div>
      </header>

      {errorMessage && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="feedback-message feedback-success" role="status">{successMessage}</div>}

      <div className="pois-workspace">
        <section className="pois-list-panel" aria-labelledby="pois-list-title">
          <div className="pois-list-heading">
            <div>
              <h2 id="pois-list-title">Sitios registrados</h2>
              <p>{pois.length} {pois.length === 1 ? 'punto' : 'puntos'} de interés</p>
            </div>
            <button
              className="pois-icon-button"
              type="button"
              onClick={loadPois}
              disabled={isLoading}
              aria-label="Actualizar lista de puntos de interés"
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
              placeholder="Buscar por nombre, código o descripción"
              aria-label="Buscar puntos de interés"
            />
          </label>

          {isLoading ? (
            <div className="pois-empty" role="status">
              <LoaderCircle size={24} className="pois-spinner" />
              Cargando puntos de interés...
            </div>
          ) : visiblePois.length === 0 ? (
            <div className="pois-empty" role="status">
              <MapPin size={25} />
              <p>{pois.length
                ? 'No hay puntos que coincidan con la búsqueda.'
                : 'Aún no hay puntos de interés. Registra el primer sitio.'}</p>
            </div>
          ) : (
            <div className="pois-list">
              {visiblePois.map((poi) => (
                <article className={`pois-card${editingId === poi.id ? ' pois-card-active' : ''}`} key={poi.id}>
                  <div className="pois-card-heading">
                    <div className="pois-card-title">
                      <span className="pois-card-mark" aria-hidden="true"><MapPin size={17} /></span>
                      <div>
                        <h3>{poi.nombre}</h3>
                        <span>{poi.codigo_identificador}</span>
                      </div>
                    </div>
                    <span className={`pois-status pois-status-${poi.estado_publicacion || 'borrador'}`}>
                      {poi.estado_publicacion || 'borrador'}
                    </span>
                  </div>
                  <p className="pois-card-description">
                    {poi.descripcion_corta || 'Sin descripción breve.'}
                  </p>
                  <div className="pois-card-meta">
                    <span>
                      {poi.latitud !== null && poi.longitud !== null
                        ? `${Number(poi.latitud).toFixed(5)}, ${Number(poi.longitud).toFixed(5)}`
                        : 'Sin coordenadas'}
                    </span>
                    <span>Radio: {Number(poi.radio_geocerca_m || 0)} m</span>
                  </div>
                  <div className="pois-card-actions">
                    <button type="button" onClick={() => startEditing(poi)}>
                      <Pencil size={15} /> Editar
                    </button>
                    <button
                      className="pois-delete-button"
                      type="button"
                      onClick={() => handleDelete(poi)}
                      disabled={deletingId === poi.id}
                    >
                      {deletingId === poi.id
                        ? <LoaderCircle size={15} className="pois-spinner" />
                        : <Trash2 size={15} />}
                      {deletingId === poi.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="pois-form-panel" aria-labelledby="poi-form-title">
          <div className="pois-form-heading">
            <span className="pois-form-icon" aria-hidden="true">
              {editingId === null ? <CirclePlus size={20} /> : <Pencil size={19} />}
            </span>
            <div>
              <h2 id="poi-form-title">{editingId === null ? 'Registrar punto' : 'Editar punto'}</h2>
              <p>Completa los datos y ajusta su geolocalización.</p>
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
            <div className="pois-form-grid">
              <label className="pois-field">
                <span>Código identificador <b>*</b></span>
                <input
                  name="codigo_identificador"
                  value={form.codigo_identificador}
                  onChange={handleFieldChange}
                  maxLength={100}
                  placeholder="Ej. TAC-001"
                  required
                />
              </label>
              <label className="pois-field">
                <span>Nombre del sitio <b>*</b></span>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleFieldChange}
                  maxLength={200}
                  placeholder="Nombre del atractivo"
                  required
                />
              </label>
            </div>

            <label className="pois-field">
              <span>Descripción breve</span>
              <textarea
                name="descripcion_corta"
                value={form.descripcion_corta}
                onChange={handleFieldChange}
                maxLength={1000}
                rows={3}
                placeholder="Resumen para presentar el sitio al visitante"
              />
            </label>

            <label className="pois-field">
              <span>Historia y descripción completa</span>
              <textarea
                name="historia_completa"
                value={form.historia_completa}
                onChange={handleFieldChange}
                rows={5}
                placeholder="Contexto histórico y cultural del punto de interés"
              />
            </label>

            <div className="pois-form-grid pois-location-fields">
              <label className="pois-field">
                <span>Latitud <b>*</b></span>
                <input
                  name="latitud"
                  type="number"
                  value={form.latitud}
                  onChange={handleFieldChange}
                  min="-90"
                  max="90"
                  step="any"
                  placeholder="-18.0066000"
                  required
                />
              </label>
              <label className="pois-field">
                <span>Longitud <b>*</b></span>
                <input
                  name="longitud"
                  type="number"
                  value={form.longitud}
                  onChange={handleFieldChange}
                  min="-180"
                  max="180"
                  step="any"
                  placeholder="-70.2463000"
                  required
                />
              </label>
              <label className="pois-field">
                <span>Radio de activación (m) <b>*</b></span>
                <input
                  name="radio_geocerca_m"
                  type="number"
                  value={form.radio_geocerca_m}
                  onChange={handleFieldChange}
                  min="1"
                  max="100000"
                  step="any"
                  required
                />
              </label>
              <label className="pois-field">
                <span>Estado de publicación</span>
                <select
                  name="estado_publicacion"
                  value={form.estado_publicacion}
                  onChange={handleFieldChange}
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                </select>
              </label>
            </div>

            <PoiMap
              latitude={parsedLatitude}
              longitude={parsedLongitude}
              radius={parsedRadius}
              onPositionChange={handlePositionChange}
            />

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
                {isSaving ? 'Guardando...' : editingId === null ? 'Crear punto' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
};
