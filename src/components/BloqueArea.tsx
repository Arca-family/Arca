/**
 * Una celda del panel de inicio o de estructura: el nombre de un área y su
 * cifra, o «Próximamente» si el área todavía no existe (DEC-0006).
 *
 * Un único componente para los dos estados a propósito: así un área que se
 * enciende en una fase futura solo cambia sus props, no de componente.
 * «Próximamente» es texto visible, no solo un tono apagado, para que la
 * diferencia no dependa únicamente del color.
 */
interface Props {
  nombre: string;
  valor?: string;
  apagado?: boolean;
}

export function BloqueArea({ nombre, valor, apagado = false }: Props) {
  return (
    <div
      className={
        apagado
          ? 'rounded-xl border border-borde bg-apagado-fondo px-4 py-3'
          : 'rounded-xl border border-borde bg-superficie px-4 py-3'
      }
    >
      <p className={`text-sm ${apagado ? 'text-apagado-texto' : 'text-texto-tenue'}`}>{nombre}</p>
      <p
        className={
          apagado
            ? 'mt-1 text-base text-apagado-texto'
            : 'mt-1 text-lg font-semibold tabular-nums text-texto'
        }
      >
        {apagado ? 'Próximamente' : valor}
      </p>
    </div>
  );
}
