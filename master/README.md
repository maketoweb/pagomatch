# Pago-M Master Dashboard

Panel Maestro para el Sistema de Conciliación Bancaria SaaS.

## Características

- **Autenticación segura** con Supabase Auth
- **RBAC (Role-Based Access Control)** - Solo usuarios con rol `master` acceden
- **Dashboard analítico** con gráficas de transacciones (Recharts)
- **Gestión de Tenants** - Tabla con paginación, búsqueda y filtros
- **Logs de Errores** - Monitoreo de errores RegEx y alertas del sistema
- **Diseño Odoo-like** - Bento Grid, sidebar responsive
- **PWA Ready** - Configuración básica para Progressive Web App
- **Mobile First** - 100% responsivo

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## Instalación

```bash
# Navegar al directorio
cd master

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Scripts Disponibles

```bash
npm run dev        # Iniciar servidor de desarrollo
npm run build      # Construir para producción
npm run preview    # Vista previa de la construcción
npm run test       # Ejecutar tests
npm run test:ui    # Ejecutar tests con interfaz gráfica
```

## Estructura del Proyecto

```
master/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Layout principal tipo Odoo
│   │   └── ProtectedRoute.jsx  # Ruta protegida por autenticación
│   ├── contexts/
│   │   └── AuthContext.jsx     # Contexto de autenticación
│   ├── lib/
│   │   └── supabase.js         # Configuración de Supabase
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard principal con gráficas
│   │   ├── Login.jsx           # Página de login
│   │   ├── LogsView.jsx        # Vista de logs de errores
│   │   └── TenantsTable.jsx    # Tabla de gestión de tenants
│   ├── tests/
│   │   └── test-suite.test.js  # Tests unitarios
│   ├── App.jsx                 # Router principal
│   ├── index.css               # Estilos globales
│   └── main.jsx                # Punto de entrada
├── .env.example                # Ejemplo de variables de entorno
├── index.html                  # HTML principal
├── package.json                # Dependencias
├── postcss.config.js           # Configuración PostCSS
├── tailwind.config.js          # Configuración Tailwind
├── vite.config.js              # Configuración Vite
└── vitest.config.js            # Configuración Vitest
```

## Esquema de Supabase Requerido

### Tabla `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('master', 'admin', 'cashier')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `tenants`
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  plan TEXT,
  api_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference TEXT NOT NULL,
  bank TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'duplicate')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Políticas RLS

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política para master: acceso completo
CREATE POLICY "Master full access" ON users
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

CREATE POLICY "Master full access tenants" ON tenants
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

CREATE POLICY "Master full access transactions" ON transactions
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));
```

## Testing

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests específicos
npx vitest run src/tests/test-suite.test.js
```

## Deployment

1. Construir el proyecto: `npm run build`
2. Subir la carpeta `dist/` a tu hosting (Vercel, Netlify, etc.)
3. Configurar variables de entorno en el hosting
4. Configurar redirecciones para SPA (todas las rutas a index.html)
