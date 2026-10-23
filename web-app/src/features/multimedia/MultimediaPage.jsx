import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AudioLines,
  FileAudio,
  FileImage,
  ImagePlus,
  LoaderCircle,
  Music2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const STORAGE_BUCKET = 'traveltac-multimedia';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const AUDIO_EXTENSIONS = ['mp3', 'aac'];

const getExtension = (filename) => filename.split('.').pop()?.toLowerCase() || '';

const getFileType = (file) => {
  const extension = getExtension(file.name);
  if (IMAGE_EXTENSIONS.includes(extension)) return 'imagen';
  if (AUDIO_EXTENSIONS.includes(extension)) return 'audio';
  return null;
};

const getContentType = (file) => {
  const acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/aac',
    'audio/x-aac',
    'audio/mp4',
  ];
  if (acceptedTypes.includes(file.type)) return file.type;

  const extension = getExtension(file.name);
  if (['jpg', 'jpeg'].includes(extension)) return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'mp3') return 'audio/mpeg';
  return 'audio/aac';
};

const getFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const readAudioDuration = (file) => new Promise((resolve) => {
  const audio = document.createElement('audio');
  const objectUrl = URL.createObjectURL(file);

  const cleanUp = () => {
    URL.revokeObjectURL(objectUrl);
    audio.removeAttribute('src');
    audio.load();
  };

  audio.preload = 'metadata';
  audio.onloadedmetadata = () => {
    const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
    cleanUp();
    resolve(duration);
  };
  audio.onerror = () => {
    cleanUp();
    resolve(null);
  };
  audio.src = objectUrl;
});

const getStoragePath = (publicUrl) => {
  const url = new URL(publicUrl);
  const bucketPrefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const prefixIndex = url.pathname.indexOf(bucketPrefix);

  if (prefixIndex === -1) {
    throw new Error('No se pudo identificar el archivo en Storage.');
  }

  return decodeURIComponent(url.pathname.slice(prefixIndex + bucketPrefix.length));
};

export const MultimediaPage = () => {
  const { adminProfile } = useAuth();
  const [points, setPoints] = useState([]);
  const [media, setMedia] = useState([]);
  const [selectedPointId, setSelectedPointId] = useState('');
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPointId, setEditPointId] = useState('');
  const [replacementFile, setReplacementFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedPoint = points.find((point) => String(point.id) === selectedPointId);

  const loadMedia = useCallback(async (pointId) => {
    if (!pointId) return [];

    const { data, error } = await supabase
      .from('multimedia')
      .select('id, poi_id, tipo, titulo, url_storage, duracion_segundos, tamano_bytes, subido_por')
      .eq('poi_id', pointId)
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  }, []);

  const loadPointsAndMedia = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('puntos_interes')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) throw error;

      setPoints(data);
      setSelectedPointId((currentPointId) => (
        data.some((point) => String(point.id) === currentPointId)
          ? currentPointId
          : data[0] ? String(data[0].id) : ''
      ));
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron cargar los puntos de interés.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPointsAndMedia();
  }, [loadPointsAndMedia]);

  useEffect(() => {
    if (!isLoading) {
      let active = true;
      loadMedia(selectedPointId)
        .then((data) => {
          if (active) setMedia(data);
        })
        .catch((error) => {
          if (active) setErrorMessage(error.message || 'No se pudieron cargar los archivos multimedia.');
        });

      return () => {
        active = false;
      };
    }
    return undefined;
  }, [isLoading, loadMedia, selectedPointId]);

  const visibleMedia = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return media.filter((item) => {
      const matchesType = filter === 'todos' || item.tipo === filter;
      const matchesSearch = !normalizedSearch
        || (item.titulo || '').toLocaleLowerCase().includes(normalizedSearch);
      return matchesType && matchesSearch;
    });
  }, [filter, media, search]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setSuccessMessage('');
    setErrorMessage('');
    if (file && !getFileType(file)) {
      setErrorMessage('Formato no admitido. Usa imágenes JPG, PNG o WebP, y audios MP3 o AAC.');
      setSelectedFile(null);
      event.target.value = '';
    } else if (file && !title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedPointId || !selectedFile || !adminProfile?.id) {
      setErrorMessage('Selecciona un punto de interés y un archivo antes de continuar.');
      return;
    }

    const type = getFileType(selectedFile);
    if (!type) {
      setErrorMessage('Formato no admitido. Usa imágenes JPG, PNG o WebP, y audios MP3 o AAC.');
      return;
    }

    const extension = getExtension(selectedFile.name);
    const objectPath = `${selectedPointId}/${crypto.randomUUID()}.${extension}`;
    let uploadedPath = '';

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, selectedFile, {
          cacheControl: '3600',
          contentType: getContentType(selectedFile),
          upsert: false,
        });

      if (uploadError) throw uploadError;
      uploadedPath = uploadedFile.path;

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadedPath);

      const duration = type === 'audio' ? await readAudioDuration(selectedFile) : null;
      const { error: insertError } = await supabase.from('multimedia').insert({
        poi_id: selectedPointId,
        tipo: type,
        titulo: title.trim() || selectedFile.name,
        url_storage: publicUrlData.publicUrl,
        duracion_segundos: duration,
        tamano_bytes: selectedFile.size,
        subido_por: adminProfile.id,
      });

      if (insertError) {
        const { error: cleanupError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([uploadedPath]);
        if (cleanupError) {
          throw new Error(`${insertError.message} Además, no se pudo eliminar el archivo subido: ${cleanupError.message}`);
        }
        throw insertError;
      }

      setMedia(await loadMedia(selectedPointId));
      setSelectedFile(null);
      setTitle('');
      setSuccessMessage('Archivo subido y vinculado al punto de interés.');
      event.target.reset();
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setEditTitle(item.titulo || '');
    setEditPointId(String(item.poi_id));
    setReplacementFile(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeEditor = () => {
    if (isSavingEdit) return;
    setEditingItem(null);
    setReplacementFile(null);
  };

  const handleReplacementChange = (event) => {
    const file = event.target.files?.[0] || null;
    setErrorMessage('');
    setSuccessMessage('');

    if (file && getFileType(file) !== editingItem?.tipo) {
      setErrorMessage(
        editingItem?.tipo === 'audio'
          ? 'Reemplaza esta audioguía por un archivo MP3 o AAC.'
          : 'Reemplaza esta imagen por un archivo JPG, PNG o WebP.',
      );
      setReplacementFile(null);
      event.target.value = '';
      return;
    }
    setReplacementFile(file);
  };

  const handleUpdateMedia = async (event) => {
    event.preventDefault();
    if (!editingItem || !editPointId) {
      setErrorMessage('Selecciona un punto de interés para este archivo.');
      return;
    }

    setIsSavingEdit(true);
    setErrorMessage('');
    setSuccessMessage('');
    let replacementPath = '';

    try {
      let urlStorage = editingItem.url_storage;
      let duration = editingItem.duracion_segundos;
      let size = editingItem.tamano_bytes;

      if (replacementFile) {
        const extension = getExtension(replacementFile.name);
        const objectPath = `${editPointId}/${crypto.randomUUID()}.${extension}`;
        const { data: uploadedFile, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(objectPath, replacementFile, {
            cacheControl: '3600',
            contentType: getContentType(replacementFile),
            upsert: false,
          });
        if (uploadError) throw uploadError;
        replacementPath = uploadedFile.path;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(replacementPath);
        urlStorage = publicUrlData.publicUrl;
        duration = editingItem.tipo === 'audio'
          ? await readAudioDuration(replacementFile)
          : null;
        size = replacementFile.size;
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('multimedia')
        .update({
          poi_id: editPointId,
          titulo: editTitle.trim() || null,
          url_storage: urlStorage,
          duracion_segundos: duration,
          tamano_bytes: size,
        })
        .eq('id', editingItem.id)
        .select('id, poi_id, tipo, titulo, url_storage, duracion_segundos, tamano_bytes, subido_por')
        .single();

      if (updateError) {
        if (replacementPath) {
          const { error: cleanupError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([replacementPath]);
          if (cleanupError) {
            throw new Error(`${updateError.message} Además, no se pudo limpiar el archivo reemplazante: ${cleanupError.message}`);
          }
        }
        throw updateError;
      }

      setMedia((currentMedia) => {
        const remainingMedia = currentMedia.filter((item) => item.id !== updatedItem.id);
        return String(updatedItem.poi_id) === String(selectedPointId)
          ? [updatedItem, ...remainingMedia]
          : remainingMedia;
      });
      setEditingItem(null);
      setReplacementFile(null);

      let cleanupWarning = '';
      if (replacementPath) {
        try {
          const previousPath = getStoragePath(editingItem.url_storage);
          const { error: removeError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([previousPath]);
          if (removeError) {
            throw new Error(`El archivo se actualizó, pero no se pudo borrar el anterior: ${removeError.message}`);
          }
        } catch (cleanupError) {
          cleanupWarning = cleanupError.message || 'El archivo se actualizó, pero no se pudo borrar el anterior.';
        }
      }

      setSuccessMessage(replacementPath
        ? 'Archivo multimedia y contenido reemplazados correctamente.'
        : 'Cambios guardados en el archivo multimedia.');
      if (cleanupWarning) setErrorMessage(cleanupWarning);
    } catch (error) {
      setErrorMessage(error.message || 'No se pudieron guardar los cambios del archivo.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`¿Eliminar "${item.titulo || 'este archivo'}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(item.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error: databaseError } = await supabase
        .from('multimedia')
        .delete()
        .eq('id', item.id);
      if (databaseError) throw databaseError;

      setMedia((currentMedia) => currentMedia.filter((mediaItem) => mediaItem.id !== item.id));

      try {
        const storagePath = getStoragePath(item.url_storage);
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        if (storageError) {
          throw new Error(`El registro se eliminó, pero no se pudo borrar el archivo de Storage: ${storageError.message}`);
        }
      } catch (storageError) {
        throw storageError;
      }

      setSuccessMessage('Archivo eliminado.');
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el archivo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="multimedia-page" aria-labelledby="multimedia-title">
      <header className="multimedia-header">
        <div>
          <p className="multimedia-eyebrow">CONTENIDO DEL RECORRIDO</p>
          <h1 id="multimedia-title">Multimedia y audioguías</h1>
          <p className="multimedia-intro">
            Organiza las imágenes descriptivas y los audios de cada punto de interés.
          </p>
        </div>
        <div className="multimedia-header-mark" aria-hidden="true"><AudioLines size={25} /></div>
      </header>

      {errorMessage && !editingItem && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="feedback-message feedback-success" role="status">{successMessage}</div>}

      {isLoading ? (
        <div className="multimedia-loading" role="status">
          <LoaderCircle size={22} className="multimedia-spinner" />
          Cargando puntos de interés y archivos...
        </div>
      ) : points.length === 0 ? (
        <div className="multimedia-empty" role="status">
          <MapPinEmpty />
          <h2>Aún no hay puntos de interés</h2>
          <p>Registra primero un punto de interés para poder asociarle imágenes y audioguías.</p>
        </div>
      ) : (
        <>
          <section className="multimedia-upload-panel" aria-labelledby="upload-title">
            <div className="multimedia-section-heading">
              <span className="multimedia-section-icon"><Upload size={19} /></span>
              <div>
                <h2 id="upload-title">Agregar archivo</h2>
                <p>Los archivos se guardarán asociados al punto seleccionado.</p>
              </div>
            </div>

            <form className="multimedia-upload-form" onSubmit={handleUpload}>
              <label className="multimedia-field">
                <span>Punto de interés</span>
                <select
                  value={selectedPointId}
                  disabled={isUploading || Boolean(editingItem)}
                  onChange={(event) => {
                    setSelectedPointId(event.target.value);
                    setSuccessMessage('');
                  }}
                  required
                >
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>{point.nombre}</option>
                  ))}
                </select>
              </label>

              <label className="multimedia-field">
                <span>Título del archivo</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder="Ej. Vista principal o Historia del sitio"
                />
              </label>

              <label className="multimedia-field multimedia-file-field">
                <span>Imagen o audioguía</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.mp3,.aac,image/jpeg,image/png,image/webp,audio/mpeg,audio/aac,audio/mp4"
                  onChange={handleFileChange}
                  required
                />
                <small>Imágenes: JPG, PNG, WebP · Audio: MP3, AAC</small>
              </label>

              {selectedFile && (
                <div className="multimedia-selected-file">
                  {getFileType(selectedFile) === 'audio' ? <FileAudio size={18} /> : <FileImage size={18} />}
                  <span>{selectedFile.name}</span>
                  <small>{getFileSize(selectedFile.size)}</small>
                </div>
              )}

              <button className="primary-button multimedia-submit" type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? <LoaderCircle size={17} className="multimedia-spinner" /> : <Upload size={17} />}
                {isUploading ? 'Subiendo archivo...' : 'Subir archivo'}
              </button>
            </form>
          </section>

          <section className="multimedia-library" aria-labelledby="library-title">
            <div className="multimedia-library-heading">
              <div className="multimedia-section-heading">
                <span className="multimedia-section-icon"><Music2 size={19} /></span>
                <div>
                  <h2 id="library-title">Archivos registrados</h2>
                  <p>{selectedPoint?.nombre} · {media.length} {media.length === 1 ? 'archivo' : 'archivos'}</p>
                </div>
              </div>
              <div className="multimedia-filters">
                <label className="multimedia-search">
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por título"
                    aria-label="Buscar por título"
                  />
                </label>
                <label className="multimedia-filter-select">
                  <span className="sr-only">Filtrar por tipo</span>
                  <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="imagen">Imágenes</option>
                    <option value="audio">Audioguías</option>
                  </select>
                </label>
              </div>
            </div>

            {visibleMedia.length === 0 ? (
              <div className="multimedia-empty compact">
                <ImagePlus size={25} />
                <p>{media.length ? 'No hay archivos que coincidan con la búsqueda.' : 'Este punto todavía no tiene archivos multimedia.'}</p>
              </div>
            ) : (
              <div className="multimedia-grid">
                {visibleMedia.map((item) => (
                  <article className="multimedia-card" key={item.id}>
                    <div className={`multimedia-preview${item.tipo === 'audio' ? ' audio-preview' : ''}`}>
                      {item.tipo === 'imagen' ? (
                        <img src={item.url_storage} alt={item.titulo || 'Imagen del punto de interés'} loading="lazy" />
                      ) : (
                        <div className="audio-preview-content">
                          <AudioLines size={31} aria-hidden="true" />
                          <span>AUDIOGUÍA</span>
                        </div>
                      )}
                    </div>
                    <div className="multimedia-card-body">
                      <div className="multimedia-card-title">
                        <span className={`multimedia-type-icon ${item.tipo}`}>
                          {item.tipo === 'audio' ? <FileAudio size={17} /> : <FileImage size={17} />}
                        </span>
                        <h3 title={item.titulo}>{item.titulo || 'Archivo sin título'}</h3>
                      </div>
                      {item.tipo === 'audio' && (
                        <audio className="multimedia-audio-player" controls preload="none">
                          <source src={item.url_storage} />
                          Tu navegador no puede reproducir este archivo de audio.
                        </audio>
                      )}
                      <div className="multimedia-metadata">
                        <span>{item.tipo === 'audio' ? 'Audioguía' : 'Imagen'}</span>
                        {item.tamano_bytes && <span>{getFileSize(item.tamano_bytes)}</span>}
                        {item.duracion_segundos && <span>{formatDuration(item.duracion_segundos)}</span>}
                      </div>
                      <button
                        className="multimedia-edit"
                        type="button"
                        onClick={() => startEditing(item)}
                        disabled={isSavingEdit || deletingId === item.id}
                      >
                        <Pencil size={16} />
                        <span>Editar archivo</span>
                      </button>
                      <button
                        className="multimedia-delete"
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={isSavingEdit || deletingId === item.id}
                        aria-label={`Eliminar ${item.titulo || 'archivo'}`}
                      >
                        {deletingId === item.id
                          ? <LoaderCircle size={16} className="multimedia-spinner" />
                          : <Trash2 size={16} />}
                        <span>{deletingId === item.id ? 'Eliminando...' : 'Eliminar'}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {editingItem && (
        <div className="multimedia-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}>
          <section
            className="multimedia-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multimedia-editor-title"
          >
            <header className="multimedia-editor-heading">
              <div>
                <p className="multimedia-eyebrow">EDICIÓN MULTIMEDIA</p>
                <h2 id="multimedia-editor-title">Modificar archivo</h2>
              </div>
              <button
                className="pois-icon-button"
                type="button"
                onClick={closeEditor}
                disabled={isSavingEdit}
                aria-label="Cerrar edición"
              >
                <X size={18} />
              </button>
            </header>

            {errorMessage && <div className="feedback-message feedback-error" role="alert">{errorMessage}</div>}

            <form className="multimedia-editor-form" onSubmit={handleUpdateMedia}>
              <label className="multimedia-field">
                <span>Punto de interés</span>
                <select
                  value={editPointId}
                  onChange={(event) => setEditPointId(event.target.value)}
                  disabled={isSavingEdit}
                  required
                >
                  {points.map((point) => (
                    <option key={point.id} value={String(point.id)}>{point.nombre}</option>
                  ))}
                </select>
              </label>

              <label className="multimedia-field">
                <span>Título del archivo</span>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  maxLength={150}
                  placeholder="Título descriptivo"
                  disabled={isSavingEdit}
                />
              </label>

              <label className="multimedia-field multimedia-file-field">
                <span>Reemplazar contenido (opcional)</span>
                <input
                  type="file"
                  accept={editingItem.tipo === 'audio'
                    ? '.mp3,.aac,audio/mpeg,audio/aac,audio/mp4'
                    : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'}
                  onChange={handleReplacementChange}
                  disabled={isSavingEdit}
                />
                <small>
                  {editingItem.tipo === 'audio'
                    ? 'Selecciona un MP3 o AAC para sustituir la audioguía actual.'
                    : 'Selecciona un JPG, PNG o WebP para sustituir la imagen actual.'}
                </small>
              </label>

              {replacementFile && (
                <div className="multimedia-selected-file">
                  {editingItem.tipo === 'audio' ? <FileAudio size={18} /> : <FileImage size={18} />}
                  <span>{replacementFile.name}</span>
                  <small>{getFileSize(replacementFile.size)}</small>
                </div>
              )}

              <div className="multimedia-editor-actions">
                <button
                  className="pois-secondary-button"
                  type="button"
                  onClick={closeEditor}
                  disabled={isSavingEdit}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit" disabled={isSavingEdit}>
                  {isSavingEdit
                    ? <LoaderCircle size={17} className="multimedia-spinner" />
                    : <Pencil size={16} />}
                  {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

const MapPinEmpty = () => (
  <span className="multimedia-empty-icon" aria-hidden="true">◇</span>
);
