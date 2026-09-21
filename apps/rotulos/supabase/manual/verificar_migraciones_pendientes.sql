-- ============================================================================
-- VERIFICAR QUE MIGRACIONES FALTAN  (solo lectura; SQL Editor de Supabase)
-- ============================================================================
-- El CLI de Supabase no tiene sesion en la maquina de desarrollo, asi que las
-- migraciones se aplican a mano. Este query dice cuales ya estan aplicadas.

select
  -- 202609210001_create_order_payments.sql (pagos por pedido)
  to_regclass('public.order_payments') is not null                                   as pagos_por_pedido,
  -- 202608190001_add_labels_tracking.sql (guia de rastreo)
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'labels' and column_name = 'tracking_number') as guia_rastreo,
  -- 202608250001_add_product_codes_image.sql (foto de catalogo)
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'product_codes' and column_name = 'image_url') as foto_catalogo,
  -- 202608260001_add_product_codes_supplier_price.sql (precio proveedor)
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'product_codes' and column_name = 'supplier_price') as precio_proveedor,
  -- 202608220002_create_backup_restore_runs.sql (auditoria de restauracion)
  to_regclass('public.backup_restore_runs') is not null                              as restauracion_backup,
  -- 202608150002_reuse_empty_phone_customer_by_name.sql (save_order reutiliza cliente sin telefono)
  pg_get_functiondef('public.save_order(jsonb,jsonb,jsonb)'::regprocedure) ilike '%v_customer_name%' as save_order_reusa_cliente;

-- Todo true = no falta ninguna. Si algo sale false, corre el archivo de
-- apps/rotulos/supabase/migrations/ que aparece en el comentario de esa columna.
--
-- Nota sobre save_order_reusa_cliente: esa migracion, ademas de redefinir
-- save_order, unifica clientes duplicados por nombre (movia pedidos a la ficha
-- con telefono y borra fichas vacias). Revisa la vista previa de duplicados en
-- Clientes antes de aplicarla si ya unificaste a mano.
