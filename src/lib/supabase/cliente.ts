/**
 * Cliente de Supabase para el navegador (DEC-0004): la sesión vive en cookie
 * a través de `@supabase/ssr`, para que el mismo estado de sesión lo pueda
 * leer luego un Server Component o el middleware. No hace falta configurar
 * `cookies` a mano aquí: en el navegador, `createBrowserClient` cae solo a
 * `document.cookie` si no se le da un almacén propio.
 *
 * Las dos variables son públicas a propósito — viajan al bundle del cliente
 * — por eso es la clave publicable (`sb_publishable_...`) y no la
 * `service_role`.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase.generated';

export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
