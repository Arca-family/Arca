import { BloqueArea } from '@/components/BloqueArea';
import { ETIQUETA_ROL, obtenerHogar, obtenerMiembros } from '@/lib/datos-falsos';

// Dónde se monta y se cambia el esqueleto del hogar (DEC-0006): solo se
// configura, nunca se consulta el mes. La edición real de miembros y de las
// secciones apagadas llega con la frontera de escritura de Supabase; esta
// pantalla, de momento, solo enseña la forma.
export default function Estructura() {
  const hogar = obtenerHogar();
  const miembros = obtenerMiembros();

  return (
    <main className="mx-auto max-w-md px-pagina pt-8">
      <h1 className="text-xl font-semibold text-texto">Estructura</h1>
      <p className="mt-1 text-sm text-texto-tenue">{hogar.name}</p>

      <h2 className="mt-6 text-sm font-medium text-texto-tenue">Miembros</h2>
      <ul className="mt-2 space-y-2">
        {miembros.map((miembro) => (
          <li
            key={miembro.id}
            className="flex items-center justify-between rounded-xl border border-borde bg-superficie px-4 py-3"
          >
            <p className="text-base font-medium text-texto">{miembro.display_name}</p>
            <p className="text-sm text-texto-tenue">{ETIQUETA_ROL[miembro.role]}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-medium text-texto-tenue">Por montar</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <BloqueArea nombre="Cuentas" apagado />
        <BloqueArea nombre="Deudas" apagado />
        <BloqueArea nombre="Objetivos" apagado />
      </div>
    </main>
  );
}
