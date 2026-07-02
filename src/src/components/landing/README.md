# Componente de Pago - Integración con Supabase

## Descripción

El componente `PaymentModal.jsx` gestiona el proceso de pago y registro de transacciones en Supabase para la auto-validación.

## Flujo de Datos

```
Usuario completa formulario
        ↓
PaymentModal.jsx
        ↓
supabase.from('transactions').insert()
        ↓
Tabla 'transactions' en Supabase
        ↓
Supabase Realtime notifica a Admin/Cajero
        ↓
Conciliación automática
```

## Estructura de la tabla `transactions`

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  reference VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  bank VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  plan_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id)
);
```

## Campos del Formulario

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| amount | number | Sí | Monto pagado en USD |
| reference | string | Sí | Referencia de la transacción bancaria |
| phone | string | No | Teléfono del usuario (usa el del sistema si está vacío) |

## Datos Estáticos de Pago

El modal muestra datos fijos para la transferencia:

- **Teléfono:** 04143420573
- **C.I:** 15190703
- **Banco:** Banco Mercantil

## Auto-Validación

1. El usuario envía el comprobante con monto y referencia
2. Supabase almacena la transacción con estado `pending`
3. El sistema del Admin recibe la notificación en tiempo real
4. El Admin compara con su extracto bancario
5. Si coincide, cambia estado a `approved`
6. El sistema notifica al usuario del cambio

## Configuración Requerida

Asegúrate de que `supabase.js` esté configurado correctamente en:

```
src/lib/supabase.js
```

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## RLS (Row Level Security)

Recomienda estas políticas para la tabla `transactions`:

```sql
-- Usuarios autenticados pueden insertar
CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo admin puede actualizar estado
CREATE POLICY "Admin can update transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```
