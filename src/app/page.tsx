import { redirect } from 'next/navigation';

// La comprobación de la fase 0 ya pasó (ver BOVEDA/04_ROADMAP.md): ahora la
// raíz es solo la puerta de entrada. Sin sesión real todavía, el punto de
// partida es siempre la pantalla de peaje.
export default function Raiz() {
  redirect('/entrar');
}
