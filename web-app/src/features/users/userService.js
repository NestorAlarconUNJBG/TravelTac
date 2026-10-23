import { supabase } from '../../config/supabaseClient';

const invokeUserAdmin = async (body) => {
  const { data, error } = await supabase.functions.invoke('manage-admin-users', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const listUsers = async () => {
  const { users } = await invokeUserAdmin({ action: 'list' });
  return users;
};

export const createUser = async (user) => {
  const { user: createdUser } = await invokeUserAdmin({ action: 'create', ...user });
  return createdUser;
};

export const updateUser = async (id, user) => {
  const { user: updatedUser } = await invokeUserAdmin({ action: 'update', id, ...user });
  return updatedUser;
};

export const deleteUser = async (id) => {
  await invokeUserAdmin({ action: 'delete', id });
};
