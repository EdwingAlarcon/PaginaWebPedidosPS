type IdentityLike = {
  email?: string | null;
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
};

/**
 * El acceso se decide por el email del usuario contra `allowed_users`, asi que
 * ese email tiene que venir de un proveedor que lo haya verificado. La app solo
 * ofrece Microsoft; una cuenta creada por email+contrasena directamente contra
 * Supabase Auth (con la anon key publica) podria declarar el email de alguien
 * de la lista. `app_metadata` lo escribe el servidor de Auth, no el usuario.
 *
 * Espejo de `public.is_allowed_user()` en la base de datos.
 */
export function hasTrustedIdentity(user: IdentityLike | null | undefined): user is IdentityLike & { email: string } {
  if (!user?.email) return false;
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("azure");
}
