import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const PROFILE_FIELDS = 'id, nombre_completo, correo, rol, institucion, estado';
const LONG_BAN = '876000h';

class RequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const jsonResponse = (body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  },
);

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : 'Error inesperado al administrar usuarios.'
);

const normalizeProfile = (body: Record<string, unknown>) => {
  const nombreCompleto = typeof body.nombre_completo === 'string'
    ? body.nombre_completo.trim()
    : '';
  const correo = typeof body.correo === 'string'
    ? body.correo.trim().toLowerCase()
    : '';
  const rol = body.rol;
  const estado = body.estado;
  const institucion = typeof body.institucion === 'string'
    ? body.institucion.trim()
    : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!nombreCompleto || nombreCompleto.length > 150) {
    throw new RequestError('El nombre es obligatorio y debe tener como máximo 150 caracteres.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 150) {
    throw new RequestError('Ingresa un correo electrónico válido de hasta 150 caracteres.', 400);
  }
  if (!['admin', 'superadmin'].includes(String(rol))) {
    throw new RequestError('El rol debe ser admin o superadmin.', 400);
  }
  if (!['activo', 'inactivo'].includes(String(estado))) {
    throw new RequestError('El estado debe ser activo o inactivo.', 400);
  }
  if (institucion.length > 150) {
    throw new RequestError('La institución debe tener como máximo 150 caracteres.', 400);
  }

  return {
    nombre_completo: nombreCompleto,
    correo,
    rol,
    institucion: institucion || null,
    estado,
    password,
  };
};

const findAuthUserByEmail = async (adminClient: ReturnType<typeof createClient>, email: string) => {
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Falta configurar Supabase URL, anon key o service role key en la función.');
    }
    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Se requiere una sesión autenticada.' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user?.email) {
      return jsonResponse({ error: 'La sesión no es válida.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: actor, error: actorError } = await adminClient
      .from('usuarios_admin')
      .select('id, rol, estado')
      .eq('correo', authData.user.email.toLowerCase())
      .maybeSingle();

    if (actorError) throw actorError;
    if (!actor || actor.estado !== 'activo' || actor.rol !== 'superadmin') {
      return jsonResponse({ error: 'Solo un superadmin activo puede administrar usuarios.' }, 403);
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'El cuerpo de la solicitud no es válido.' }, 400);
    }

    const { action } = body as Record<string, unknown>;

    if (action === 'list') {
      const { data, error } = await adminClient
        .from('usuarios_admin')
        .select(PROFILE_FIELDS)
        .order('nombre_completo', { ascending: true });
      if (error) throw error;
      return jsonResponse({ users: data || [] });
    }

    if (action === 'create') {
      const profile = normalizeProfile(body);
      if (profile.password.length < 8) {
        return jsonResponse({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
      }

      const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: profile.correo,
        password: profile.password,
        email_confirm: true,
        user_metadata: { nombre_completo: profile.nombre_completo },
      });
      if (createAuthError) throw createAuthError;
      if (!createdAuth.user) {
        throw new Error('Supabase Auth no devolvió la cuenta recién creada.');
      }

      const { data: createdProfile, error: createProfileError } = await adminClient
        .from('usuarios_admin')
        .insert({
          nombre_completo: profile.nombre_completo,
          correo: profile.correo,
          contrasena_hash: null,
          rol: profile.rol,
          institucion: profile.institucion,
          estado: profile.estado,
        })
        .select(PROFILE_FIELDS)
        .single();

      if (createProfileError) {
        const { error: rollbackError } = await adminClient.auth.admin.deleteUser(createdAuth.user.id);
        if (rollbackError) {
          throw new Error(`${createProfileError.message} Además, no se pudo revertir la cuenta de acceso: ${rollbackError.message}`);
        }
        throw createProfileError;
      }

      if (profile.estado === 'inactivo') {
        const { error: banError } = await adminClient.auth.admin.updateUserById(
          createdAuth.user.id,
          { ban_duration: LONG_BAN },
        );
        if (banError) {
          const { error: rollbackProfileError } = await adminClient
            .from('usuarios_admin')
            .delete()
            .eq('id', createdProfile.id);
          const { error: rollbackAuthError } = await adminClient.auth.admin.deleteUser(createdAuth.user.id);
          if (rollbackProfileError || rollbackAuthError) {
            const rollbackMessages = [
              rollbackProfileError?.message,
              rollbackAuthError?.message,
            ].filter(Boolean).join(' ');
            throw new Error(`${banError.message} Además, falló la reversión de la cuenta creada: ${rollbackMessages}`);
          }
          throw banError;
        }
      }

      return jsonResponse({ user: createdProfile }, 201);
    }

    const targetId = body.id;
    if (!(typeof targetId === 'string' || typeof targetId === 'number')
      || !/^\d+$/.test(String(targetId))) {
      return jsonResponse({ error: 'El identificador del usuario no es válido.' }, 400);
    }

    const { data: target, error: targetError } = await adminClient
      .from('usuarios_admin')
      .select(PROFILE_FIELDS)
      .eq('id', targetId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return jsonResponse({ error: 'No se encontró el usuario.' }, 404);
    const targetAuthUser = await findAuthUserByEmail(adminClient, target.correo);
    if (!targetAuthUser) {
      throw new Error('No se encontró la cuenta de acceso de este usuario en Supabase Auth.');
    }

    if (String(target.id) === String(actor.id)) {
      throw new RequestError('No puedes modificar ni eliminar tu propia cuenta desde este módulo.', 400);
    }

    if (action === 'update') {
      const profile = normalizeProfile(body);
      if (profile.password && profile.password.length < 8) {
        return jsonResponse({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }, 400);
      }
      const removesLastActiveSuperAdmin = (
        target.rol === 'superadmin'
        && target.estado === 'activo'
        && (profile.rol !== 'superadmin' || profile.estado !== 'activo')
      );

      if (removesLastActiveSuperAdmin) {
        const { count, error } = await adminClient
          .from('usuarios_admin')
          .select('id', { count: 'exact', head: true })
          .eq('rol', 'superadmin')
          .eq('estado', 'activo');
        if (error) throw error;
        if ((count || 0) <= 1) {
          return jsonResponse({ error: 'No se puede desactivar o degradar al último superadmin activo.' }, 409);
        }
      }

      const { data: updatedProfile, error: updateProfileError } = await adminClient
        .from('usuarios_admin')
        .update({
          nombre_completo: profile.nombre_completo,
          correo: profile.correo,
          rol: profile.rol,
          institucion: profile.institucion,
          estado: profile.estado,
        })
        .eq('id', targetId)
        .select(PROFILE_FIELDS)
        .single();
      if (updateProfileError) throw updateProfileError;

      const authAttributes: {
        email?: string;
        email_confirm?: boolean;
        password?: string;
        ban_duration?: string;
      } = {};
      if (profile.correo !== target.correo.toLowerCase()) {
        authAttributes.email = profile.correo;
        authAttributes.email_confirm = true;
      }
      if (profile.password) authAttributes.password = profile.password;
      if (profile.estado !== target.estado) {
        authAttributes.ban_duration = profile.estado === 'activo' ? 'none' : LONG_BAN;
      }
      if (Object.keys(authAttributes).length) {
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
          targetAuthUser.id,
          authAttributes,
        );
        if (updateAuthError) {
          const { error: rollbackError } = await adminClient
            .from('usuarios_admin')
            .update({
              nombre_completo: target.nombre_completo,
              correo: target.correo,
              rol: target.rol,
              institucion: target.institucion,
              estado: target.estado,
            })
            .eq('id', targetId);
          if (rollbackError) {
            throw new Error(`${updateAuthError.message} Además, no se pudo revertir el perfil: ${rollbackError.message}`);
          }
          throw updateAuthError;
        }
      }

      return jsonResponse({ user: updatedProfile });
    }

    if (action === 'delete') {
      if (target.rol === 'superadmin' && target.estado === 'activo') {
        const { count, error } = await adminClient
          .from('usuarios_admin')
          .select('id', { count: 'exact', head: true })
          .eq('rol', 'superadmin')
          .eq('estado', 'activo');
        if (error) throw error;
        if ((count || 0) <= 1) {
          return jsonResponse({ error: 'No se puede eliminar al último superadmin activo.' }, 409);
        }
      }

      const { error: banError } = await adminClient.auth.admin.updateUserById(
        targetAuthUser.id,
        { ban_duration: LONG_BAN },
      );
      if (banError) throw banError;

      const { error: deleteProfileError } = await adminClient
        .from('usuarios_admin')
        .delete()
        .eq('id', targetId);
      if (deleteProfileError) {
        const { error: unbanError } = await adminClient.auth.admin.updateUserById(targetAuthUser.id, {
          ban_duration: target.estado === 'activo' ? 'none' : LONG_BAN,
        });
        if (unbanError) {
          throw new Error(`${deleteProfileError.message} Además, no se pudo restaurar el estado de acceso: ${unbanError.message}`);
        }
        throw deleteProfileError;
      }

      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetAuthUser.id);
      if (deleteAuthError) {
        const { error: restoreError } = await adminClient
          .from('usuarios_admin')
          .insert({
            id: target.id,
            nombre_completo: target.nombre_completo,
            correo: target.correo,
            contrasena_hash: null,
            rol: target.rol,
            institucion: target.institucion,
            estado: target.estado,
          });
        const { error: unbanError } = await adminClient.auth.admin.updateUserById(targetAuthUser.id, {
          ban_duration: target.estado === 'activo' ? 'none' : LONG_BAN,
        });
        if (restoreError) {
          throw new Error(`${deleteAuthError.message} Además, no se pudo restaurar el perfil: ${restoreError.message}`);
        }
        if (unbanError) {
          throw new Error(`${deleteAuthError.message} Además, no se pudo restaurar el estado de acceso: ${unbanError.message}`);
        }
        throw deleteAuthError;
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Acción no reconocida.' }, 400);
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500;
    return jsonResponse({ error: getErrorMessage(error) }, status);
  }
});
