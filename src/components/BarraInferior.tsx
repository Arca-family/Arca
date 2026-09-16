'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  onApuntar: () => void;
}

/**
 * Los tres destinos fijos de Arca más el botón de apuntar (DEC-0006). No
 * cambia al añadir fases: cada área nueva enciende su bloque en /inicio, no
 * añade una pestaña aquí.
 */
export function BarraInferior({ onApuntar }: Props) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center px-2 py-2">
        <EnlaceNav href="/inicio" etiqueta="Inicio" activo={pathname === '/inicio'} />
        <EnlaceNav
          href="/movimientos"
          etiqueta="Movimientos"
          activo={pathname === '/movimientos'}
        />
        {/* Flotante a propósito (DEC-0006): no cuelga de ninguna de las tres
            pantallas, así que no es un enlace, es la acción que las tres
            comparten. */}
        <button
          type="button"
          onClick={onApuntar}
          aria-label="Apuntar un movimiento"
          className="min-h-toque min-w-toque -translate-y-3 justify-self-center rounded-full bg-acento px-3 py-2 text-acento-texto shadow-lg"
        >
          <span className="block text-2xl leading-none" aria-hidden="true">
            +
          </span>
          <span className="block text-[11px] font-medium leading-none">Apuntar</span>
        </button>
        <EnlaceNav href="/estructura" etiqueta="Estructura" activo={pathname === '/estructura'} />
      </div>
    </nav>
  );
}

function EnlaceNav({
  href,
  etiqueta,
  activo,
}: {
  href: string;
  etiqueta: string;
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={`flex min-h-toque flex-col items-center justify-center justify-self-center rounded-lg px-2 py-2 text-center text-xs ${
        activo ? 'font-semibold text-acento' : 'font-normal text-texto-tenue'
      }`}
    >
      {etiqueta}
    </Link>
  );
}
