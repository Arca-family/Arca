import { NavegacionApp } from '@/components/NavegacionApp';

// Las tres pantallas raíz de Arca (DEC-0006) comparten esta barra y el botón
// de apuntar. /entrar y /crear-hogar quedan fuera de este grupo a propósito:
// son de peaje y no llevan navegación.
export default function GrupoApp({ children }: { children: React.ReactNode }) {
  return <NavegacionApp>{children}</NavegacionApp>;
}
