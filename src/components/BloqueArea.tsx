import Link from 'next/link';

/**
 * Una celda del panel de inicio o de estructura: el nombre de un área y su
 * cifra, o «Próximamente» si el área todavía no existe (DEC-0006).
 *
 * Un único componente para los tres casos a propósito: apagado, vivo de solo
 * lectura, y vivo con acceso directo (`href`). «Próximamente» es texto
 * visible, no solo un tono apagado, para que la diferencia no dependa
 * únicamente del color — y un bloque apagado nunca es pulsable aunque alguien
 * le pase `href` por error: la regla de DEC-0006 vive aquí, no solo en quien
 * usa el componente.
 */
interface Props {
  nombre: string;
  valor?: string;
  apagado?: boolean;
  href?: string;
}

export function BloqueArea({ nombre, valor, apagado = false, href }: Props) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${apagado ? 'text-apagado-texto' : 'text-texto-tenue'}`}>
          {nombre}
        </p>
        {!apagado && href && (
          <span aria-hidden="true" className="text-texto-tenue">
            ›
          </span>
        )}
      </div>
      <p
        className={
          apagado
            ? 'mt-1 text-base text-apagado-texto'
            : 'mt-1 text-lg font-semibold tabular-nums text-texto'
        }
      >
        {apagado ? 'Próximamente' : valor}
      </p>
    </>
  );

  if (!apagado && href) {
    return (
      <Link
        href={href}
        className="block min-h-toque rounded-xl border border-borde bg-superficie px-4 py-3"
      >
        {contenido}
      </Link>
    );
  }

  return (
    <div
      className={
        apagado
          ? 'rounded-xl border border-borde bg-apagado-fondo px-4 py-3'
          : 'rounded-xl border border-borde bg-superficie px-4 py-3'
      }
    >
      {contenido}
    </div>
  );
}
