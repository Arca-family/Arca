'use client';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'] as const;

interface Props {
  valor: string;
  onCambiar: (siguiente: string) => void;
}

/**
 * Teclado numérico propio para escribir un importe con el pulgar. No es el
 * teclado del sistema a propósito: así la coma decimal española siempre está
 * a mano y los botones se pueden hacer más grandes que una tecla nativa.
 *
 * Construye una cadena en la misma forma española que entiende `aCentimos()`
 * de src/lib/dinero.ts — la conversión a céntimos ocurre fuera, aquí solo se
 * monta el texto.
 */
export function TecladoImporte({ valor, onCambiar }: Props) {
  function presionar(tecla: (typeof TECLAS)[number]) {
    if (tecla === '⌫') {
      onCambiar(valor.slice(0, -1));
      return;
    }
    if (tecla === ',') {
      // Una sola coma, y no como primer carácter: «,5» no es un importe legible.
      if (valor === '' || valor.includes(',')) return;
      onCambiar(valor + ',');
      return;
    }
    // Como mucho dos decimales: así el teclado nunca deja escribir algo que
    // aCentimos() vaya a rechazar por los decimales de más.
    const decimales = valor.split(',')[1];
    if (decimales && decimales.length >= 2) return;
    onCambiar(valor + tecla);
  }

  return (
    <div className="grid grid-cols-3 gap-3" role="group" aria-label="Teclado numérico">
      {TECLAS.map((tecla) => (
        <button
          key={tecla}
          type="button"
          onClick={() => presionar(tecla)}
          aria-label={tecla === '⌫' ? 'Borrar' : tecla === ',' ? 'Coma decimal' : tecla}
          className="h-16 rounded-xl border border-borde bg-superficie text-xl font-medium text-texto active:bg-fondo"
        >
          {tecla}
        </button>
      ))}
    </div>
  );
}
