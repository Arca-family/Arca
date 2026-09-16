'use client';

import { useEffect, useRef, useState } from 'react';
import { type Categoria, type TipoMovimiento, obtenerCategorias } from '@/lib/datos-falsos';
import { type Centimos, ImporteInvalido, aCentimos, formatear } from '@/lib/dinero';
import { hoyIso } from '@/lib/fecha';
import { TecladoImporte } from './TecladoImporte';

type Paso = 'importe' | 'categoria' | 'hecho';

interface Props {
  onCerrar: () => void;
}

// null mientras el texto no sea un importe completo y mayor que cero: el
// teclado ya impide comas de más o decimales de más, así que lo único que
// queda por rechazar aquí es «vacío» o «recién acabado en coma».
function centimosDe(texto: string): Centimos | null {
  if (texto === '' || texto.endsWith(',')) return null;
  try {
    const centimos = aCentimos(texto);
    return centimos > 0 ? centimos : null;
  } catch (error) {
    if (error instanceof ImporteInvalido) return null;
    throw error;
  }
}

const HOY = hoyIso();

// Lo que se considera «dentro del diálogo» a efectos de atrapar el tabulador.
const FOCOABLES =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * La entrada rápida: el corazón del producto. Tres toques — abrir, confirmar
 * el importe, elegir la categoría — y listo. Fecha de hoy y tipo «gasto» por
 * omisión; cambiar el tipo, la fecha o añadir una nota vive detrás de «Más
 * opciones», a un gesto de distancia pero fuera del camino principal.
 *
 * No persiste en `datos-falsos.ts`: esta es la fase del esqueleto navegable, y
 * escribir de verdad es lo que llega al conectar Supabase (AGENTS.md, regla
 * dura 3 — una sola frontera de escritura). Lo que sí hace es enseñar el flujo
 * completo, incluida la confirmación final.
 */
export function EntradaRapida({ onCerrar }: Props) {
  const [paso, setPaso] = useState<Paso>('importe');
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<TipoMovimiento>('expense');
  const [fecha, setFecha] = useState(HOY);
  const [nota, setNota] = useState('');
  const [masOpciones, setMasOpciones] = useState(false);
  const [categoriaElegida, setCategoriaElegida] = useState<Categoria | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const centimos = centimosDe(texto);

  useEffect(() => {
    if (paso !== 'hecho') return;
    const temporizador = setTimeout(onCerrar, 1400);
    return () => clearTimeout(temporizador);
  }, [paso, onCerrar]);

  // Un diálogo a pantalla completa se lleva el foco al abrirse y lo devuelve
  // a quien lo abrió (el botón flotante) al cerrarse: si no, el foco se queda
  // perdido en un botón que ya no está.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    return () => anterior?.focus();
  }, []);

  // Y lo mueve dentro del diálogo en cada paso: al abrir, y otra vez al pasar
  // de importe a categoría o a la confirmación.
  useEffect(() => {
    const primero = contenedorRef.current?.querySelector<HTMLElement>(FOCOABLES);
    (primero ?? contenedorRef.current)?.focus();
  }, [paso]);

  // Atrapa el tabulador dentro del diálogo y cierra con Escape. Sin esto, un
  // `overlay` a pantalla completa deja que el foco se escape a la barra
  // inferior que sigue debajo, aunque no se vea.
  useEffect(() => {
    function alTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCerrar();
        return;
      }
      if (evento.key !== 'Tab' || !contenedorRef.current) return;

      const lista = Array.from(contenedorRef.current.querySelectorAll<HTMLElement>(FOCOABLES));
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, [onCerrar]);

  function elegirCategoria(categoria: Categoria) {
    setCategoriaElegida(categoria);
    setPaso('hecho');
  }

  const importeConSigno = centimos === null ? null : tipo === 'expense' ? -centimos : centimos;

  return (
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label="Apuntar un movimiento"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-superficie pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <header className="flex items-center justify-between px-pagina py-3">
        {paso === 'categoria' ? (
          <button
            type="button"
            onClick={() => setPaso('importe')}
            aria-label="Volver al importe"
            className="-ml-2 min-h-toque min-w-toque text-2xl text-texto"
          >
            ‹
          </button>
        ) : (
          <span className="min-h-toque min-w-toque" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-texto-tenue">
          {paso === 'importe' && 'Apuntar'}
          {paso === 'categoria' && 'Elige la categoría'}
          {paso === 'hecho' && 'Apuntado'}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar sin apuntar"
          className="-mr-2 min-h-toque min-w-toque text-2xl text-texto-tenue"
        >
          ×
        </button>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-pagina pb-pagina">
        {paso === 'importe' && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setMasOpciones((v) => !v)}
              aria-expanded={masOpciones}
              aria-controls="mas-opciones"
              className="mx-auto min-h-toque rounded-full px-4 text-sm text-texto-tenue underline decoration-dotted underline-offset-4"
            >
              {tipo === 'expense' ? 'Gasto' : 'Ingreso'} · {fecha === HOY ? 'hoy' : fecha}
              {nota !== '' ? ' · con nota' : ''}
            </button>

            {masOpciones && (
              <div id="mas-opciones" className="mb-2 space-y-3 rounded-xl border border-borde bg-fondo p-pagina">
                <div role="group" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('expense')}
                    aria-pressed={tipo === 'expense'}
                    className={botonTipo(tipo === 'expense')}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('income')}
                    aria-pressed={tipo === 'income'}
                    className={botonTipo(tipo === 'income')}
                  >
                    Ingreso
                  </button>
                </div>
                <label className="block text-sm text-texto-tenue">
                  Fecha
                  <input
                    type="date"
                    value={fecha}
                    max={HOY}
                    onChange={(evento) => setFecha(evento.target.value)}
                    className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
                  />
                </label>
                <label className="block text-sm text-texto-tenue">
                  Nota (opcional)
                  <input
                    type="text"
                    value={nota}
                    onChange={(evento) => setNota(evento.target.value)}
                    maxLength={280}
                    placeholder="Para acordarte de qué fue"
                    className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
                  />
                </label>
              </div>
            )}

            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="sr-only">Importe en euros</span>
              <p
                aria-live="polite"
                className="text-cifra font-semibold tabular-nums text-texto"
              >
                {texto === '' ? '0' : texto}
              </p>
            </div>

            <TecladoImporte valor={texto} onCambiar={setTexto} />

            <button
              type="button"
              onClick={() => setPaso('categoria')}
              disabled={centimos === null}
              className="mt-4 min-h-toque rounded-xl bg-acento text-base font-semibold text-acento-texto disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {paso === 'categoria' && (
          <div>
            {importeConSigno !== null && (
              <p className="mb-4 text-center text-sm text-texto-tenue">
                Vas a apuntar{' '}
                <span className="font-semibold text-texto">{formatear(importeConSigno)}</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {obtenerCategorias(tipo).map((categoria) => (
                <button
                  key={categoria.code}
                  type="button"
                  onClick={() => elegirCategoria(categoria)}
                  className="min-h-toque rounded-xl border border-borde bg-superficie px-3 py-3 text-left text-sm font-medium text-texto active:bg-fondo"
                >
                  {categoria.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {paso === 'hecho' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p aria-hidden="true" className="text-4xl text-ingreso">
              ✓
            </p>
            <p className="text-lg font-semibold text-texto">Apuntado</p>
            {categoriaElegida && importeConSigno !== null && (
              <p className="text-texto-tenue">
                <span
                  className={
                    tipo === 'expense' ? 'font-semibold text-gasto' : 'font-semibold text-ingreso'
                  }
                >
                  {formatear(importeConSigno)}
                </span>{' '}
                · {categoriaElegida.label}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function botonTipo(activo: boolean): string {
  return `min-h-toque rounded-lg border px-3 text-sm font-medium ${
    activo ? 'border-acento bg-acento text-acento-texto' : 'border-borde bg-superficie text-texto-tenue'
  }`;
}
