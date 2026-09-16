import { redirect } from 'next/navigation';
import { obtenerPertenenciaActual } from '@/lib/datos';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { FormularioEntrar } from './FormularioEntrar';

// Pantalla de peaje: con sesión ya no hay nada que hacer aquí, así que se
// manda a donde toque según tenga hogar o no — el mismo criterio que
// src/lib/sesion.ts, pero en sentido contrario (esta pantalla es para quien
// todavía no ha entrado).
export default async function Entrar() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const pertenencia = await obtenerPertenenciaActual(supabase, data.user.id);
    redirect(pertenencia ? '/inicio' : '/crear-hogar');
  }

  return <FormularioEntrar />;
}
