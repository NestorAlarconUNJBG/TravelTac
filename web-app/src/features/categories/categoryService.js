import { supabase } from '../../config/supabaseClient';

const CATEGORY_FIELDS = 'id, nombre, descripcion, icono_url, creado_por';

const toCategoryPayload = (category) => {
  const nombre = category.nombre.trim();
  const descripcion = category.descripcion.trim();
  const simbolo = category.simbolo.trim();

  if (!nombre) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  if (simbolo && Array.from(simbolo).length !== 1) {
    throw new Error('El icono debe ser un único símbolo o una única letra.');
  }

  return {
    nombre,
    descripcion: descripcion || null,
    icono_url: simbolo || null,
  };
};

export const listCategories = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select(CATEGORY_FIELDS)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createCategory = async (category, adminId) => {
  const { data, error } = await supabase
    .from('categorias')
    .insert({
      ...toCategoryPayload(category),
      creado_por: adminId,
    })
    .select(CATEGORY_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id, category) => {
  const { data, error } = await supabase
    .from('categorias')
    .update(toCategoryPayload(category))
    .eq('id', id)
    .select(CATEGORY_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
