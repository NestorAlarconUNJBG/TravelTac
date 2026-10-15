import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, LoaderCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

const PAGE_SIZE = 25;

const ACTION_LABELS = {
  INSERT: 'Creación',
  UPDATE: 'Edición',
  DELETE: 'Eliminación',
};

const AUDITED_TABLES = [
  ['puntos_interes', 'Puntos de interés'],
  ['multimedia', 'Multimedia'],
  ['categorias', 'Categorías'],
  ['rutas_circuitos', 'Rutas y circuitos'],
  ['ruta_poi_detalle', 'Paradas de rutas'],
  ['usuarios_admin', 'Administradores'],
];

const toDateStart = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
};

const toDateEndExclusive = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day + 1).toISOString();
};

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatRecordId = (entry) => (
  entry.registro_id === null || entry.registro_id === undefined
    ? '—'
    : `#${entry.registro_id}`
);

const formatDetails = (details) => {
  if (!details || typeof details !== 'object') return null;
  return JSON.stringify(details, null, 2);
};

export const AuditPage = () => {
  const [entries, setEntries] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [action, setAction] = useState('');
  const [table, setTable] = useState('');
  const [adminId, setAdminId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let query = supabase
        .from('bitacora_auditoria')
        .select('id, usuario_id, accion, tabla_afectada, registro_id, detalles_cambio, fecha_hora', { count: 'exact' })
        .order('fecha_hora', { ascending: false })
        .order('id', { ascending: false })
        .range(page * PAGE_SIZE, ((page + 1) * PAGE_SIZE) - 1);

      if (action) query = query.eq('accion', action);
      if (table) query = query.eq('tabla_afectada', table);
      if (adminId) query = query.eq('usuario_id', adminId);
      if (dateFrom) query = query.gte('fecha_hora', toDateStart(dateFrom));
      if (dateTo) query = query.lt('fecha_hora', toDateEndExclusive(dateTo));

      const { data, count, error } = await query;
      if (error) throw error;

      setEntries(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo cargar la bitácora.');
    } finally {
      setIsLoading(false);
    }
  }, [action, adminId, dateFrom, dateTo, page, table]);

  useEffect(() => {
    let active = true;

    supabase
      .from('usuarios_admin')
      .select('id, nombre_completo, correo')
      .order('nombre_completo', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMessage(error.message || 'No se pudo cargar la lista de administradores.');
          return;
        }
        setAdmins(data || []);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <section className="audit-page" aria-labelledby="audit-title">
      <header className="audit-header">
        <div>
          <p className="audit-eyebrow">CONTROL Y TRAZABILIDAD</p>
          <h1 id="audit-title">Auditoría y bitácora</h1>
          <p>Consulta las acciones realizadas sobre el contenido de TravelTac.</p>
        </div>
        <span className="audit-header-icon" aria-hidden="true">
          <ClipboardList size={25} />
        </span>
      </header>

      {errorMessage && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}

      <section className="audit-filters" aria-label="Filtros de auditoría">
        <label>
          <span>Acción</span>
          <select value={action} onChange={updateFilter(setAction)}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Sección</span>
          <select value={table} onChange={updateFilter(setTable)}>
            <option value="">Todas las secciones</option>
            {AUDITED_TABLES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Administrador</span>
          <select value={adminId} onChange={updateFilter(setAdminId)}>
            <option value="">Todos los administradores</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.nombre_completo || admin.correo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Desde</span>
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={updateFilter(setDateFrom)} />
        </label>

        <label>
          <span>Hasta</span>
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={updateFilter(setDateTo)} />
        </label>
      </section>

      <section className="audit-results" aria-label="Registros de actividad">
        <div className="audit-results-heading">
          <div>
            <h2>Actividad registrada</h2>
            <p>{totalCount} {totalCount === 1 ? 'registro' : 'registros'}</p>
          </div>
          <button
            className="audit-refresh"
            type="button"
            onClick={loadEntries}
            disabled={isLoading}
          >
            {isLoading ? <LoaderCircle size={16} className="audit-spinner" /> : <RefreshCw size={16} />}
            <span>Actualizar</span>
          </button>
        </div>

        {isLoading ? (
          <div className="audit-empty" role="status">
            <LoaderCircle size={22} className="audit-spinner" />
            Cargando bitácora...
          </div>
        ) : entries.length === 0 ? (
          <div className="audit-empty">
            <ClipboardList size={25} />
            <p>No hay registros que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha y hora</th>
                    <th scope="col">Administrador</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Sección</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const details = formatDetails(entry.detalles_cambio);
                    const admin = admins.find((item) => item.id === entry.usuario_id);
                    const actionClass = (entry.accion || '').toLowerCase();

                    return (
                      <tr key={entry.id}>
                        <td data-label="Fecha y hora">{formatDate(entry.fecha_hora)}</td>
                        <td data-label="Administrador">
                          {admin?.nombre_completo || admin?.correo || (entry.usuario_id ? `Usuario #${entry.usuario_id}` : 'Sistema / no identificado')}
                        </td>
                        <td data-label="Acción">
                          <span className={`audit-action audit-action-${actionClass}`}>
                            {ACTION_LABELS[entry.accion] || entry.accion}
                          </span>
                        </td>
                        <td data-label="Sección">
                          {AUDITED_TABLES.find(([value]) => value === entry.tabla_afectada)?.[1] || entry.tabla_afectada}
                        </td>
                        <td data-label="Registro">{formatRecordId(entry)}</td>
                        <td data-label="Detalles">
                          {details ? (
                            <details className="audit-details">
                              <summary>Ver cambio</summary>
                              <pre>{details}</pre>
                            </details>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <nav className="audit-pagination" aria-label="Paginación de auditoría">
              <span>Página {page + 1} de {pageCount}</span>
              <div>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                  disabled={page === 0 || isLoading}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
                  disabled={page >= pageCount - 1 || isLoading}
                  aria-label="Página siguiente"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </section>
  );
};
