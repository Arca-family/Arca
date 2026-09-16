-- Tipos enumerados de la fase 1 de Arca («apuntar y ver»).
--
-- Esta migración no crea ninguna tabla a propósito: solo los tres tipos que usan
-- las migraciones siguientes. Es la lección L13 de BOVEDA/03_LECCIONES.md: los
-- valores de un `enum` van solos, en su propia migración, porque Postgres exige
-- que estén confirmados antes de poder referenciarlos. En las versiones
-- anteriores del producto, meter el tipo y su primer uso en la misma migración
-- acabó en migración correctiva.
--
-- Los tres tipos son deliberadamente cortos. Cada valor nuevo que haga falta en
-- las fases 2, 3 o 4 llegará también en su propia migración, sin editar esta:
-- una migración aplicada no se toca.

create type public.household_role as enum ('adult', 'helper', 'learner');

comment on type public.household_role is
  'Rol de una persona dentro de un hogar. Son los tres mínimos que cubren los cuatro perfiles de BOVEDA/01_PRODUCTO.md, y no hay más porque no se inventan permisos que nadie ha pedido: `adult` (los dos adultos del caso base y los compañeros de piso: ven todo, apuntan y configuran el hogar), `helper` (hijo mayor que ayuda: ve y apunta todo el hogar pero no reconfigura) y `learner` (menor en aprendizaje: solo ve y apunta lo suyo).';

create type public.transaction_kind as enum ('income', 'expense');

comment on type public.transaction_kind is
  'Qué es un movimiento: `income` entra dinero en el hogar, `expense` sale. El importe se guarda siempre positivo y el signo lo pone este tipo, para que no pueda existir un «ingreso de -20 €». Los traspasos entre cuentas propias (fase 3) y los pagos de deuda (fase 4) no son ni uno ni otro: entrarán como valores nuevos en su propia migración cuando toque.';

create type public.transaction_void_action as enum ('void', 'restore');

comment on type public.transaction_void_action is
  'Qué se hizo con un movimiento en el registro de anulaciones: `void` se anuló, `restore` se deshizo la anulación. La anulación es reversible y cada paso deja rastro, así que hacen falta los dos valores.';
