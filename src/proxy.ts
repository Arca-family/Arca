/**
 * Refresca la sesión de Supabase en cada petición (DEC-0004). Sin esto, el
 * `access_token` de la cookie puede caducar a media navegación y un Server
 * Component se quedaría leyendo una cookie vieja sin ninguna señal de que
 * pasó. Quién puede entrar a dónde lo decide cada pantalla con
 * src/lib/sesion.ts; aquí solo se mantiene viva la cookie.
 *
 * Se llama `proxy.ts`, no `middleware.ts`: en Next.js 16 el segundo nombre
 * está obsoleto (mismo contrato, solo cambia el nombre del fichero y de la
 * función exportada).
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase.generated';

export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cabeceras) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
          Object.entries(cabeceras).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
        },
      },
    },
  );

  // No se usa el resultado: la sola llamada ya renueva el `access_token`
  // caducado y reescribe la cookie a través de `setAll`.
  await supabase.auth.getUser();

  return respuesta;
}

export const config = {
  matcher: [
    // Todas las rutas salvo los estáticos de Next y los iconos/imágenes: no
    // tiene sentido gastar una llamada a Supabase para servir un recurso.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
