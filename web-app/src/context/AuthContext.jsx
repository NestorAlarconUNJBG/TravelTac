import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null); // Usuario de Supabase Auth
  const [adminProfile, setAdminProfile] = useState(null); // Registro de usuarios_admin
  const [loading, setLoading] = useState(true);

  // Obtener perfil desde la tabla usuarios_admin
  const fetchAdminProfile = async (email) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .select('id, nombre_completo, correo, rol, institucion, estado')
        .eq('correo', email)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al cargar perfil de admin:', err.message);
      return null;
    }
  };

  useEffect(() => {
    // 1. Verificar sesión existente al cargar la app
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        const profile = await fetchAdminProfile(session.user.email);
        setAdminProfile(profile);
      }
      setLoading(false);
    };

    getInitialSession();

    // 2. Escuchar cambios de sesión (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          const profile = await fetchAdminProfile(session.user.email);
          setAdminProfile(profile);
        } else {
          setAuthUser(null);
          setAdminProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Función de Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Verificar si el usuario está activo en la tabla usuarios_admin
    const profile = await fetchAdminProfile(data.user.email);
    if (!profile || profile.estado !== 'activo') {
      await supabase.auth.signOut();
      throw new Error('Su cuenta se encuentra inactiva o no tiene permisos de gestor.');
    }

    setAdminProfile(profile);
    return profile;
  };

  // Función de Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setAdminProfile(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, adminProfile, loading, login, logout, setAdminProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);