# Guía Completa de Producción - PagoMatch

## Tabla de Contenidos
1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Configuración de Supabase](#2-configuración-de-supabase)
3. [Subir a GitHub](#3-subir-a-github)
4. [Desplegar en Cloudflare Pages](#4-desplegar-en-cloudflare-pages)
5. [Instalación de la APK (Descarga Directa)](#5-instalación-de-la-apk-descarga-directa)
6. [Integración con E-commerce (API)](#6-integración-con-ecommerce-api)
7. [Verificación Final](#7-verificación-final)

---

## 1. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAGOMATCH SaaS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  LANDING     │    │   MASTER     │    │   ADMIN      │      │
│  │  (Cloudflare)│    │   (PWA)      │    │   (PWA)      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │    SUPABASE     │                          │
│                    │  (Backend+DB)   │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐                │
│         │                   │                   │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐        │
│  │  CAJERO     │    │   PUENTE    │    │  E-COMMERCE │        │
│  │  (PWA)      │    │   (APK)     │    │  (API)      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes del Sistema

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Landing Page | React + Vite | Página de ventas y conversión |
| Panel Master | React + Vite + PWA | Gestión global del SaaS |
| Panel Admin | React + Vite + PWA | Gestión de tienda |
| Panel Cajero | React + Vite + PWA | Registro de pagos |
| Puente (APK) | Kotlin + Jetpack Compose | Captura de SMS/Notificaciones |
| Backend | Supabase Edge Functions | API y lógica de negocio |
| Base de Datos | PostgreSQL (Supabase) | Almacenamiento y RLS |

---

## 2. Configuración de Supabase

### 2.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Haz clic en **"New Project"**
3. Configura:
   - **Organization**: Selecciona o crea una
   - **Project Name**: `pagomatch`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la más cercana (US East recomendado)
4. Haz clic en **"Create new project"**
5. Espera ~2 minutos a que se active

### 2.2 Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://TU-PROYECTO.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.3 Crear Tablas de la Base de Datos

1. Ve a **SQL Editor** en el panel de Supabase
2. Haz clic en **"New query"**
3. Pega y ejecuta este SQL:

```sql
-- 1. EXTENSIONES Y TABLAS BASE
create extension if not exists pg_cron;
create extension if not exists "uuid-ossp";

-- Tabla de tenants (tiendas/comercios)
create table tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text default 'active',
  plan text default 'inicia',
  api_key text default encode(gen_random_bytes(32), 'hex')
);

-- Tabla de dispositivos (APKs vinculadas)
create table devices (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  device_id text unique, 
  pairing_code text unique not null,
  is_active boolean default true
);

-- Tabla de usuarios
create table users (
  id uuid references auth.users on delete cascade primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  role text not null check (role in ('master', 'admin', 'cashier')),
  email text not null
);

-- Tabla de transacciones
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  bank text not null,
  amount decimal not null,
  reference text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Tabla de patrones RegEx para bancos
create table bank_patterns (
  id serial primary key,
  bank_name text not null,
  regex_pattern text not null,
  is_active boolean default true
);

-- Tabla de logs de auditoría
create table audit_logs (
  id serial primary key,
  tenant_id uuid references tenants(id),
  action text,
  created_at timestamp default now()
);

-- 2. HABILITAR RLS
alter table tenants enable row level security;
alter table devices enable row level security;
alter table users enable row level security;
alter table transactions enable row level security;

-- 3. POLÍTICAS RLS

-- Usuarios solo ven su propio tenant
create policy "Users can view their own tenant" on tenants for select 
using (id in (select tenant_id from users where id = auth.uid()));

-- Usuarios solo ven sus propias transacciones
create policy "Users can view transactions for their tenant" on transactions for select 
using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- Dispositivos gestionados por tenant admin
create policy "Allow devices to be managed by tenant admins" on devices for all
using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- 4. FUNCIÓN DE VINCULACIÓN (Security Definer)
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

-- 5. LIMPIEZA AUTOMÁTICA (cada hora elimina transacciones >24h)
select cron.schedule('cleanup-transactions', '0 * * * *', 
  'DELETE FROM transactions WHERE created_at < NOW() - INTERVAL ''24 hours''');

-- 6. HABILITAR REALTIME
alter publication supabase_realtime add table transactions;

-- 7. INSERTAR PATRONES REGEX INICIALES
insert into bank_patterns (bank_name, regex_pattern) values
('Banesco', '(?i)pago\s+movil(?:\s+recibido)?.*?(?:bs\.?|bss\.?)\s*([\d.,]+)\s+de.*?ref(?:\.|erencia)?\s*(\d+)'),
('Mercantil', '(?i)pago\s+movil.*?de.*?por\s+(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\.\s*(\d+)'),
('Banco de Venezuela', '(?i)recibiste.*?(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\s*(\d+)'),
('Provincial', '(?i)pago\s+movil.*?por.*?val.*?por\s+(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\s*(\d+)'),
('Genérico', '(?i)(?:pago|transferencia|movil|recibido|abono).*?(?:bs\.?|bss\.?)\s*([\d.,]+).*?(?:ref|referencia|operacion).*?(\d+)');
```

### 2.4 Crear Usuario Master (Dueño del SaaS)

1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"**
3. Ingresa:
   - **Email**: `master@pagomatch.com` (o tu email)
   - **Password**: Genera una contraseña segura
4. Ve a **SQL Editor** y ejecuta:

```sql
-- Insertar usuario master en la tabla users
INSERT INTO users (id, tenant_id, role, email)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'master@pagomatch.com'),
  NULL,
  'master',
  'master@pagomatch.com'
);
```

### 2.5 Crear Edge Functions (API Backend)

1. Instala el CLI de Supabase:
```bash
npm install -g supabase
```

2. Inicia sesión:
```bash
supabase login
```

3. Vincula tu proyecto:
```bash
supabase link --project-ref TU-PROYECTO-ID
```

4. Crea la función de ingestión:
```bash
supabase functions new ingest
```

5. Edita `supabase/functions/ingest/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { device_id, bank, amount, reference, type } = await req.json()

    // Validar dispositivo
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('tenant_id')
      .eq('device_id', device_id)
      .eq('is_active', true)
      .single()

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: 'Dispositivo no válido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insertar transacción
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        tenant_id: device.tenant_id,
        bank,
        amount,
        reference,
        status: 'pending'
      })
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, transaction: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

6. Despliega la función:
```bash
supabase functions deploy ingest
```

### 2.6 Habilitar Realtime

1. Ve a **Database** → **Replication**
2. Activa la replicación para la tabla `transactions`

---

## 3. Subir a GitHub

### 3.1 Preparar el Repositorio

1. Inicializa Git en la carpeta del proyecto:
```bash
cd E:\pago-m
git init
```

2. Crea el archivo `.gitignore` en la raíz:

```gitignore
# Dependencias
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Variables de entorno
.env
.env.local
.env.*.local

# Supabase
supabase/.temp/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### 3.2 Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Haz clic en **"+"** → **"New repository"**
3. Configura:
   - **Repository name**: `pagomatch`
   - **Description**: `Sistema de Conciliación Bancaria SaaS`
   - **Visibility**: Private (recomendado)
4. Haz clic en **"Create repository"**

### 3.3 Subir el Código

```bash
# Desde la carpeta del proyecto
git add .
git commit -m "feat: initial commit - PagoMatch SaaS"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/pagomatch.git
git push -u origin main
```

---

## 4. Desplegar en Cloudflare Pages

### 4.1 Crear Cuenta en Cloudflare

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en **"Workers & Pages"** en el menú lateral
4. Haz clic en **"Create application"**
5. Selecciona **"Pages"**
6. Haz clic en **"Connect to Git"**
7. Conecta tu cuenta de GitHub
8. Selecciona el repositorio `pagomatch`

### 4.2 Desplegar Landing Page

1. Crea un proyecto llamado `pagomatch-landing`
2. Configura:
   - **Production branch**: `main`
   - **Build command**: `cd src && npm install && npm run build`
   - **Build output directory**: `src/dist`
   - **Environment variables**:
     - `NODE_VERSION`: `18`

### 4.3 Desplegar Panel Master

1. Crea otro proyecto llamado `pagomatch-master`
2. Configura:
   - **Build command**: `cd master && npm install && npm run build`
   - **Build output directory**: `master/dist`
   - **Environment variables**:
     - `VITE_SUPABASE_URL`: `https://TU-PROYECTO.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - `NODE_VERSION`: `18`

### 4.4 Desplegar Panel Admin

1. Crea proyecto `pagomatch-admin`
2. Misma configuración que master pero con rutas `/admin`

### 4.5 Desplegar Panel Cajero

1. Crea proyecto `pagomatch-cajero`
2. Misma configuración pero con rutas `/cajero`

### 4.6 Configurar Dominios (Opcional)

1. Compra un dominio (ej: `pagomatch.com`)
2. En Cloudflare Pages, ve a **Custom domains**
3. Agrega subdominios:
   - `pagomatch.com` → Landing
   - `app.pagomatch.com` → Panel Master
   - `admin.pagomatch.com` → Panel Admin
   - `cajero.pagomatch.com` → Panel Cajero

---

## 5. Instalación de la APK (Descarga Directa)

### 5.1 Distribuir la APK

La APK está disponible para descarga directa desde la Landing Page:

1. **Ubicación del archivo**: `src/public/puente.apk`
2. **Tamaño**: ~5MB
3. **Compatibilidad**: Android 8.0 (Oreo) o superior

### 5.2 Descargar la APK

Los usuarios pueden descargar la APK directamente desde:
- **Landing Page**: Botón "Descargar APK v2.0"
- **Panel Master**: Sección de descargas

### 5.3 Instalar en Android (Paso a Paso)

#### Paso 1: Descargar
1. Haz clic en "Descargar APK" en la Landing Page
2. Espera a que se descargue el archivo
3. Notificación de descarga completada

#### Paso 2: Permitir Fuentes Desconocidas
1. Abre el archivo APK descargado
2. Android mostrará un popup de seguridad
3. Toca "Configuración"
4. Activa " Permitir desde esta fuente "
5. Regresa y toca "Instalar"

#### Paso 3: Instalar
1. Toca "Instalar" en el popup
2. Espera a que termine la instalación
3. Toca "Abrir" para iniciar la app

### 5.4 Configurar Permisos (CRÍTICO)

#### Permiso de SMS
1. Al abrir la app, aparecerá un popup de permisos
2. Selecciona **"Permitir siempre"** (NO solo "Durante el uso")
3. **Este permiso es OBLIGATORIO** para detectar pagos bancarios

#### Permiso de Notificaciones
1. La app mostrará un banner naranja si el permiso está pendiente
2. Toca **"Dar Acceso en Ajustes"**
3. Android te redirigirá a "Acceso a notificaciones"
4. Busca **"Puente"** en la lista
5. Activa el interruptor
6. Acepta la advertencia de seguridad

#### Optimización de Batería
1. Ve a **Ajustes** → **Batería** → **Optimización de batería**
2. Busca **"Puente"**
3. Selecciona **"No optimizar"**

### 5.5 Vincular con el Panel Admin

1. Abre el **Panel Admin** en el navegador
2. Ve a **Dispositivos** o **Vinculación**
3. Haz clic en **"Generar Código"**
4. Copia el código de 6 dígitos (dura 10 minutos)
5. Abre la app **Puente** en el celular
6. Ingresa el código
7. Toca **"Vincular Ahora"**
8. El dispositivo quedará vinculado permanentemente

---

## 6. Integración con E-commerce (API)

### 6.1 Obtener API Key

1. Ve al **Panel Master**
2. Selecciona el tenant/tienda
3. Copia la **API Key** generada

### 6.2 Endpoint de Validación

**URL**: `https://TU-PROYECTO.supabase.co/functions/v1/validate-payment`

**Método**: `POST`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer TU-API-KEY
```

**Body**:
```json
{
  "amount": 150.00,
  "reference": "123456789",
  "bank": "Mercantil"
}
```

**Respuesta Exitosa**:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-de-la-transaccion",
    "status": "pending",
    "message": "Transacción registrada, esperando confirmación del Puente"
  }
}
```

### 6.3 Webhook de Confirmación

Cuando el pago sea validado por el sistema, se enviará un POST a tu URL configurada:

**URL**: Tu endpoint webhook (configurar en Panel Admin)

**Body**:
```json
{
  "event": "payment.confirmed",
  "transaction_id": "uuid",
  "amount": 150.00,
  "reference": "123456789",
  "status": "approved",
  "timestamp": "2026-07-02T10:30:00Z"
}
```

### 6.4 Ejemplo de Integración (JavaScript)

```javascript
// Función para validar un pago desde tu e-commerce
async function validatePayment(amount, reference, bank) {
  const response = await fetch(
    'https://TU-PROYECTO.supabase.co/functions/v1/validate-payment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU-API-KEY'
      },
      body: JSON.stringify({ amount, reference, bank })
    }
  );
  
  return await response.json();
}

// Ejemplo de uso
const result = await validatePayment(150.00, '123456789', 'Mercantil');
console.log(result);
```

### 6.5 Configurar Webhook en Panel Admin

1. Ve al **Panel Admin**
2. Navega a **Configuración** → **API**
3. Ingresa la URL de tu webhook
4. Guarda los cambios

---

## 7. Verificación Final

### 7.1 Checklist de Producción

- [ ] Supabase configurado con todas las tablas
- [ ] RLS habilitado y funcionando
- [ ] Edge Functions desplegadas
- [ ] Realtime habilitado para `transactions`
- [ ] Landing Page desplegada en Cloudflare
- [ ] Panel Master desplegado y accesible
- [ ] Panel Admin desplegado y accesible
- [ ] Panel Cajero desplegado y accesible
- [ ] APK disponible para descarga en Landing Page
- [ ] Dispositivo vinculado con Panel Admin
- [ ] Permisos de SMS y Notificaciones otorgados
- [ ] API Key generada para e-commerce
- [ ] Webhook configurado (si aplica)

### 7.2 Prueba de Flujo Completo

1. **Landing Page**: Verificar que el botón de descarga APK funciona
2. **Panel Master**: Inicia sesión y verifica que ves el dashboard
3. **Panel Admin**: 
   - Crea un tenant (tienda)
   - Crea un usuario admin
   - Genera código de vinculación
4. **APK Puente**: 
   - Descarga la APK desde la Landing Page
   - Instala en el celular
   - Configura permisos de SMS y Notificaciones
   - Ingresa el código de vinculación
   - Verifica que muestra "Vinculado"
5. **Panel Cajero**: 
   - Inicia sesión con el usuario cajero
   - Registra un pago manual
6. **Verificación**: 
   - Envía un SMS de prueba o simula una notificación
   - Verifica que aparece en el Panel Cajero
   - Marca como aprobado
   - Verifica que el estado cambia en tiempo real

### 7.3 Solución de Problemas

| Problema | Solución |
|----------|----------|
| APK no se descarga | Verificar que el archivo `puente.apk` está en `src/public/` |
| APK no se instala | Activa "Fuentes desconocidas" en ajustes de Android |
| No lee SMS | Verifica que diste permiso "Permitir siempre" |
| No recibe notificaciones | Activa acceso a notificaciones en ajustes del sistema |
| No aparecen transacciones | Verificar que el dispositivo está vinculado |
| Panel no carga | Verificar variables de entorno en Cloudflare |
| Webhook no recibe | Verificar URL y que el endpoint está activo |
| Error de RLS | Verificar que el usuario tiene el rol correcto |

---

## Comandos Útiles

```bash
# Desarrollo local - Landing Page
cd src && npm install && npm run dev

# Desarrollo local - Paneles
cd admin && npm run dev    # Puerto 3001
cd cajero && npm run dev   # Puerto 3002
cd master && npm run dev   # Puerto 3000

# Build para producción
cd src && npm run build    # Landing
cd admin && npm run build  # Admin
cd cajero && npm run build # Cajero
cd master && npm run build # Master

# Supabase CLI
supabase login
supabase link --project-ref TU-PROYECTO-ID
supabase functions deploy ingest
supabase functions serve ingest  # Para pruebas locales
```

---

## URLs de Producción (Ejemplo)

| Servicio | URL |
|----------|-----|
| Landing Page | https://pagomatch.com |
| Panel Master | https://app.pagomatch.com |
| Panel Admin | https://admin.pagomatch.com |
| Panel Cajero | https://cajero.pagomatch.com |
| Descarga APK | https://pagomatch.com/puente.apk |
| API Backend | https://TU-PROYECTO.supabase.co/functions/v1/ |

---

**Estado**: ✅ Producción Lista  
**Última actualización**: 2026-07-02  
**Versión**: 2.0.0
