import { redirect } from 'next/navigation';
import { obtenerPertenenciaActual } from '@/lib/datos';
import { exigirSesion } from '@/lib/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { FormularioCrearHogar } from './FormularioCrearHogar';

// Exige sesión (sin ella, /entrar) pero no exige estar sin hogar todavía: si
// ya tiene uno, aquí no hay nada que montar y se manda a /inicio.
export default async function CrearHogar() {
  const supabase = await crearClienteServidor();
  const usuario = await exigirSesion(supabase);

  const pertenencia = await obtenerPertenenciaActual(supabase, usuario.id);
  if (pertenencia) redirect('/inicio');

  return <FormularioCrearHogar />;
}
