import 'server-only';

/**
 * Cliente de Supabase con la clave `service_role`: salta la RLS por
 * completo. Por eso `import 'server-only'` va en la primera línea del
 * fichero — un import de un componente de cliente tiene que fallar en el
 * build, no en producción.
 *
 * No se usa todavía en ninguna pantalla: `SUPABASE_SERVICE_ROLE_KEY` está
 * vacía a propósito en `.env.local`
 * (BOVEDA/02_ESTADO_Y_ARQUITECTURA.md). Queda escrito para cuando haga falta
 * escribir desde el servidor con privilegios que el cliente autenticado no
 * tiene — que hoy no es el caso: las cuatro funciones de la frontera ya
 * cubren toda escritura de la fase 1.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.generated';

export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !clave) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY: el cliente admin no puede crearse sin las dos.',
    );
  }

  return createClient<Database>(url, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
