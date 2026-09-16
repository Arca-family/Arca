import { BloqueArea } from '@/components/BloqueArea';
import { obtenerTotalesDelMes } from '@/lib/datos-falsos';
import { formatear } from '@/lib/dinero';
import { etiquetaMes } from '@/lib/fecha';

// El panel del día a día (DEC-0006): solo consulta, nunca escribe. La cifra
// grande y los dos bloques vivos salen enteros de `household_monthly_totals`;
// esta pantalla no suma un solo movimiento por su cuenta (lección L8).
export default function Inicio() {
  const totales = obtenerTotalesDelMes();
  const negativo = totales.net_total < 0;

  return (
    <main className="mx-auto max-w-md px-pagina pt-8">
      <p className="text-sm text-texto-tenue">{capitaliza(etiquetaMes(totales.month))}</p>

      <p className="mt-1 text-sm text-texto-tenue">Te queda este mes</p>
      <p
        className={`text-cifra font-semibold tabular-nums ${negativo ? 'text-gasto' : 'text-texto'}`}
      >
        {formatear(totales.net_total)}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <BloqueArea nombre="Gastos" valor={formatear(totales.expense_total)} />
        <BloqueArea nombre="Ingresos" valor={formatear(totales.income_total)} />
        {/* Apagados a propósito (DEC-0006): visibles desde el primer día para
            no tener que rediseñar la navegación cuando se construyan. */}
        <BloqueArea nombre="Presupuesto" apagado />
        <BloqueArea nombre="Cuentas" apagado />
        <BloqueArea nombre="Deudas" apagado />
        <BloqueArea nombre="Ahorro" apagado />
        <BloqueArea nombre="Objetivos" apagado />
      </div>
    </main>
  );
}

function capitaliza(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
