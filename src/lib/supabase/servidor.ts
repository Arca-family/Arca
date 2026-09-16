/**
 * Cliente de Supabase para el servidor (DEC-0004): lee y escribe la sesión en
 * la cookie de la petición con `cookies()` de `next/headers`. Se crea uno
 * nuevo por cada uso — nunca se comparte entre peticiones — como exige
 * `@supabase/ssr`.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase.generated';

export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              almacenCookies.set(name, value, options),
            );
          } catch {
            // `cookies().set()` falla si se llama desde un Server Component
            // en renderizado: Next solo deja escribir cookies desde una
            // Server Action, un route handler o el middleware. No pasa nada
            // aquí — el middleware (src/middleware.ts) refresca la sesión y
            // reescribe la cookie en cada petición.
          }
        },
      },
    },
  );
}
