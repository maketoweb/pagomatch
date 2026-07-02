-- =============================================
-- PAGO-M SaaS System - Database Schema
-- =============================================

-- =============================================
-- 1. TABLA DE PLANES
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  max_users INTEGER DEFAULT 5,
  max_cashiers INTEGER DEFAULT 10,
  max_transactions INTEGER DEFAULT 1000,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. TABLA DE TENANTS (actualizada)
-- =============================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'paused')) DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 3. TABLA DE SUSCRIPCIONES
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'past_due', 'cancelled', 'paused', 'trialing')) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TABLA DE PAGOS
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. TABLA DE USUARIOS (actualizada)
-- =============================================
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================
-- 6. TABLA DE CAJEROS
-- =============================================
CREATE TABLE IF NOT EXISTS cashiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. TABLA DE DESCARGAS DE APP
-- =============================================
CREATE TABLE IF NOT EXISTS app_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_type TEXT CHECK (device_type IN ('android', 'ios', 'web')) NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. TABLA DE MENSAJES/RECORDATORIOS
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('reminder', 'alert', 'notification', 'system')) DEFAULT 'notification',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. TABLA DE PLANES PREDEFINIDOS
-- =============================================
INSERT INTO plans (name, description, price, billing_cycle, max_users, max_cashiers, max_transactions, features) VALUES
  ('Básico', 'Para pequeñas tiendas', 29.99, 'monthly', 3, 5, 500, '["Conciliación básica", "Reportes mensuales", "Soporte email"]'),
  ('Profesional', 'Para tiendas en crecimiento', 79.99, 'monthly', 10, 25, 2000, '["Conciliación avanzada", "Reportes en tiempo real", "Soporte prioritario", "API access"]'),
  ('Empresarial', 'Para grandes operaciones', 199.99, 'monthly', 50, 100, 10000, '["Conciliación ilimitada", "Reportes personalizados", "Soporte 24/7", "API completa", "Multi-sucursal"]'),
  ('Enterprise', 'Solución personalizada', 499.99, 'monthly', 200, 500, 50000, '["Todo en Empresarial", "Integración custom", "Account manager", "SLA garantizado"]')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 10. RLS POLICIES (actualizadas)
-- =============================================

-- Plans: Master puede ver todos
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access plans" ON plans
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- Subscriptions: Master tiene acceso completo
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- Payments: Master tiene acceso completo
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access payments" ON payments
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- Cashiers: Master tiene acceso completo
ALTER TABLE cashiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access cashiers" ON cashiers
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- App Downloads: Master tiene acceso completo
ALTER TABLE app_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access app_downloads" ON app_downloads
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- Messages: Master tiene acceso completo
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Master full access messages" ON messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'master'));

-- =============================================
-- 11. FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
