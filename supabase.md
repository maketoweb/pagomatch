# Esquema de Supabase y Seguridad

## Tablas Principales
- `tenants`: `id`, `name`, `status` (active/inactive), `plan`, `api_key`.
- `users`: `id`, `tenant_id`, `email`, `role` (master, admin, cashier).
- `devices`: `id`, `tenant_id`, `device_id` (UUID), `pairing_code`, `is_active`.
- `transactions`: `id`, `tenant_id`, `amount`, `reference`, `bank`, `status` (pending, approved, duplicate), `created_at`.
- `bank_patterns`: `id`, `bank_name`, `regex_pattern`.

## Políticas de Seguridad (RLS)
- **Seguridad Multitenant:** Todas las tablas (`users`, `transactions`, `devices`) tienen una política RLS que fuerza: `tenant_id = auth.uid()` (o el filtro correspondiente del usuario autenticado).
- **Vinculación:** Un dispositivo solo puede insertar en `transactions` si su `device_id` existe en la tabla `devices` y está activo.

## Automatización (pg_cron)
- **Limpieza 24h:** Limpieza automática de registros antiguos.
  `SELECT cron.schedule('cleanup', '0 * * * *', 'DELETE FROM transactions WHERE created_at < NOW() - INTERVAL ''24 hours''');`