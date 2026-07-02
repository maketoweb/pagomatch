-- 1. EXTENSIONES Y TABLAS BASE
create extension if not exists pg_cron;
create extension if not exists "uuid-ossp";

-- Tablas
create table if not exists tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text default 'active',
  plan text default 'inicia',
  api_key text default encode(gen_random_bytes(32), 'hex')
);

create table if not exists devices (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  device_id text unique, 
  pairing_code text unique not null,
  is_active boolean default true
);

create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  role text not null check (role in ('master', 'admin', 'cashier')),
  email text not null
);

create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  bank text not null,
  amount decimal not null,
  reference text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- 2. HABILITAR RLS
alter table tenants enable row level security;
alter table devices enable row level security;
alter table users enable row level security;
alter table transactions enable row level security;

-- 3. POLÍTICAS RLS (Seguridad)

-- Usuarios solo ven su propio tenant
create policy "Users can view their own tenant" on tenants for select 
using (id in (select tenant_id from users where id = auth.uid()));

-- Usuarios solo ven sus propias transacciones
create policy "Users can view transactions for their tenant" on transactions for select 
using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- El sistema de vinculación: Los dispositivos se vinculan vía RPC (se maneja abajo)
create policy "Allow devices to be managed by tenant admins" on devices for all
using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- 4. LOGICA DE VINCULACIÓN (Security Definer)
-- Esta función se ejecuta con privilegios elevados, ignorando RLS momentáneamente
create or replace function link_device(p_pairing_code text, p_device_id text)
returns json as $$
declare
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id from devices where pairing_code = p_pairing_code;
  if v_tenant_id is null then return json_build_object('error', 'Código inválido'); end if;
  
  update devices set device_id = p_device_id where pairing_code = p_pairing_code;
  return json_build_object('success', true, 'tenant_id', v_tenant_id);
end;
$$ language plpgsql security definer;

-- 5. AUDITORÍA (Opcional pero recomendado)
create table if not exists audit_logs (
  id serial primary key,
  tenant_id uuid references tenants(id),
  action text,
  created_at timestamp default now()
);

-- 6. MANTENIMIENTO AUTOMÁTICO
select cron.schedule('cleanup-transactions', '0 * * * *', 'DELETE FROM transactions WHERE created_at < NOW() - INTERVAL ''24 hours''');

-- 7. REALTIME
alter publication supabase_realtime add table transactions;