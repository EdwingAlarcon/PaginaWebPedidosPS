-- Rotulos compartidos entre los usuarios del negocio.
--
-- Antes: cada usuario solo veia/editaba/borraba los rotulos que el mismo creo
-- (created_by = auth.uid()). Con dos cuentas usando la app, cada una veia un
-- historial incompleto, Despacho generaba rotulos duplicados del mismo pedido y
-- la numeracion PS-AAAA-NNNNNN parecia saltarse numeros.
--
-- Ahora: igual que customers/orders/settings, cualquier usuario autenticado
-- (el acceso real ya lo limita la lista allowed_users) ve y edita todos los
-- rotulos. created_by se sigue guardando al insertar, solo como trazabilidad.

drop policy if exists "Users can read own labels." on public.labels;
drop policy if exists "Users can insert own labels." on public.labels;
drop policy if exists "Users can update own labels." on public.labels;
drop policy if exists "Users can delete own labels." on public.labels;

create policy "Authenticated users can read labels."
  on public.labels for select to authenticated
  using (true);

create policy "Authenticated users can insert labels."
  on public.labels for insert to authenticated
  with check (created_by = auth.uid());

create policy "Authenticated users can update labels."
  on public.labels for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete labels."
  on public.labels for delete to authenticated
  using (true);
