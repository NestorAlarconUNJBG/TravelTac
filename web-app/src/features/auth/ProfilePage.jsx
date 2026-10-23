import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { User, Building, ShieldCheck, Mail, Save } from 'lucide-react';

export const ProfilePage = () => {
  const { adminProfile, setAdminProfile } = useAuth();
  const [nombre, setNombre] = useState(adminProfile?.nombre_completo || '');
  const [institucion, setInstitucion] = useState(adminProfile?.institucion || '');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data, error } = await supabase
        .from('usuarios_admin')
        .update({
          nombre_completo: nombre,
          institucion: institucion
        })
        .eq('id', adminProfile.id)
        .select('id, nombre_completo, correo, rol, institucion, estado')
        .single();

      if (error) throw error;

      setAdminProfile(data);
      setMensaje({ tipo: 'exito', texto: 'Perfil actualizado exitosamente.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al actualizar.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 profile-page">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 profile-title">Mi Perfil de Gestor</h2>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg feedback-message ${mensaje.tipo === 'exito' ? 'feedback-success' : 'feedback-error'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleGuardar} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 profile-card">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400 form-icon" />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 form-input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Institución u Organización</label>
          <div className="relative">
            <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400 form-icon" />
            <input
              type="text"
              value={institucion}
              onChange={(e) => setInstitucion(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 form-input"
              placeholder="Ej. Municipalidad Distrital de Pachía"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 profile-details">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Correo Electrónico (No editable)</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-lg text-slate-600 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              {adminProfile?.correo}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Rol Asignado</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-lg text-slate-600 text-sm capitalize">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              {adminProfile?.rol}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 primary-button"
          >
            <Save className="w-4 h-4" />
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </main>
  );
};