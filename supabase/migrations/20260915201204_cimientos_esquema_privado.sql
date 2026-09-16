-- Cimientos del esquema de Arca.
--
-- No crea ninguna tabla todavía: prepara el terreno para que, cuando llegue el
-- modelo de datos, las reglas duras del proyecto se puedan cumplir sin
-- excepciones. Todo lo que hace está aquí por lecciones caras de las versiones
-- anteriores del producto (BOVEDA/03_LECCIONES.md, lecciones L1, L2, L4 y L5).
--
-- 1. El esquema `private` es donde vivirán las implementaciones de las funciones
--    que escriben dinero. La API pública solo expondrá envoltorios estrechos, y
--    los roles de la API no pueden ejecutar nada de aquí directamente. En la
--    versión anterior, una función privilegiada siguió confiando en RLS después
--    de pasar a SECURITY DEFINER y eso dejaba escribir sin comprobar nada.
--
-- 2. Los privilegios por omisión quedan cerrados: una función nueva no es
--    ejecutable por nadie hasta que su migración lo conceda a mano. La lección
--    L4 dice que un privilegio olvidado falla en silencio; se prefiere que
--    falle pronto y a la cara.
--
-- 3. Si Supabase ha instalado su ayudante de RLS automática en `public`, se le
--    retira el permiso a los roles de la API: apareció solo, con permisos
--    elevados y ejecutable desde la API.

create schema if not exists private;

comment on schema private is
  'Implementaciones privilegiadas. La API pública solo expone envoltorios estrechos en public; ningún rol de la API ejecuta nada de aquí directamente.';

-- En `private` no entra nadie salvo el dueño y el servidor.
revoke all on schema private from public;
revoke usage on schema private from anon, authenticated;
grant usage on schema private to service_role;

-- Que lo que se cree después nazca igual de cerrado, sin depender de que alguien
-- se acuerde de revocarlo en cada migración.
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke all on function public.rls_auto_enable() from anon, authenticated';
    raise notice 'Revocado public.rls_auto_enable() a los roles de la API.';
  end if;
end
$$;
