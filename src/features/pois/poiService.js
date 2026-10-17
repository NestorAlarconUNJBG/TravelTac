import { supabase } from '../../config/supabaseClient';

const POI_FIELDS = [
  'id',
  'categoria_id',
  'codigo_identificador',
  'nombre',
  'descripcion_corta',
  'historia_completa',
  'latitud',
  'longitud',
  'radio_geocerca_m',
  'estado_publicacion',
].join(', ');

const toPoiPayload = (poi) => {
  const latitude = Number(poi.latitud);
  const longitude = Number(poi.longitud);
  const radius = Number(poi.radio_geocerca_m);

  if (!poi.codigo_identificador?.trim() || !poi.nombre?.trim()) {
    throw new Error('El código identificador y el nombre son obligatorios.');
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('La latitud debe ser un número entre -90 y 90.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('La longitud debe ser un número entre -180 y 180.');
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 100000) {
    throw new Error('El radio debe ser mayor que 0 y no superar los 100 000 metros.');
  }

  return {
    codigo_identificador: poi.codigo_identificador.trim(),
    categoria_id: poi.categoria_id || null,
    nombre: poi.nombre.trim(),
    descripcion_corta: poi.descripcion_corta.trim(),
    historia_completa: poi.historia_completa.trim(),
    latitud: latitude,
    longitud: longitude,
    radio_geocerca_m: radius,
    estado_publicacion: poi.estado_publicacion,
  };
};

export const listPois = async () => {
  const { data, error } = await supabase
    .from('puntos_interes')
    .select(POI_FIELDS)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createPoi = async (poi) => {
  const { data, error } = await supabase
    .from('puntos_interes')
    .insert(toPoiPayload(poi))
    .select(POI_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

export const updatePoi = async (id, poi) => {
  const { data, error } = await supabase
    .from('puntos_interes')
    .update(toPoiPayload(poi))
    .eq('id', id)
    .select(POI_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

export const deletePoi = async (id) => {
  const { error } = await supabase
    .from('puntos_interes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
