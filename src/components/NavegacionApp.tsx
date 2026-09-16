'use client';

import { useState } from 'react';
import { BarraInferior } from './BarraInferior';
import { EntradaRapida } from './entrada-rapida/EntradaRapida';

/**
 * Envuelve las tres pantallas raíz (inicio, movimientos, estructura) con la
 * barra inferior y la entrada rápida. El estado de «abierta» vive aquí, un
 * nivel por encima de las tres pantallas, porque apuntar un movimiento no
 * cuelga de ninguna de ellas (DEC-0006): es una capa aparte que se puede abrir
 * desde cualquiera y, al cerrarse, deja debajo la pantalla en la que estabas.
 */
export function NavegacionApp({ children }: { children: React.ReactNode }) {
  const [entradaAbierta, setEntradaAbierta] = useState(false);

  return (
    <>
      <div className="pb-barra">{children}</div>
      <BarraInferior onApuntar={() => setEntradaAbierta(true)} />
      {entradaAbierta && <EntradaRapida onCerrar={() => setEntradaAbierta(false)} />}
    </>
  );
}
