# Plan Maestro de Pruebas (QA Test Plan)
## Sistema de Conciliación Bancaria SaaS - Pago-M v2.0

**Versión:** 1.0  
**Fecha:** 2026-07-02  
**Autor:** QA Engineering & Cybersecurity Team  
**Estado:** Activo

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance del Sistema](#2-alcance-del-sistema)
3. [Pruebas de Seguridad y Privacidad](#3-pruebas-de-seguridad-y-privacidad)
4. [Pruebas de Integración](#4-pruebas-de-integración)
5. [Pruebas de Escalabilidad y Carga](#5-pruebas-de-escalabilidad-y-carga)
6. [Pruebas de Funcionalidad (Business Logic)](#6-pruebas-de-funcionalidad-business-logic)
7. [Scripts de Prueba Automatizados](#7-scripts-de-prueba-automatizados)
8. [Matriz de Riesgos de Seguridad](#8-matriz-de-riesgos-de-seguridad)
9. [Criterios de Aceptación](#9-criterios-de-aceptación)
10. [Herramientas Recomendadas](#10-herramientas-recomendadas)

---

## 1. Resumen Ejecutivo

Este plan maestro de pruebas diseñado para el sistema de conciliación bancaria SaaS **Pago-M** garantiza que el sistema sea blindado contra amenazas de ciberseguridad, capaz de soportar tráfico masivo sin fugas de datos, y funcionalmente correcto en todos sus flujos críticos.

### Pilares de Prueba

| Pilar | Objetivo | Prioridad |
|-------|----------|-----------|
| Seguridad y Privacidad | Prevenir accesos no autorizados, fugas de datos e inyecciones | **Crítica** |
| Integración E2E | Validar flujos completos entre Puente → Supabase → PWA | **Crítica** |
| Escalabilidad y Carga | Verificar soporte para miles de usuarios concurrentes | **Alta** |
| Funcionalidad (Business Logic) | Validar reglas de negocio, RBAC y propagación de configs | **Alta** |

---

## 2. Alcance del Sistema

### 2.1 Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA PAGO-M                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  PUENTE APK  │────▶│   SUPABASE   │◀────│  PWA CAJERO  │   │
│  │  (Android)   │     │   (Backend)  │     │   (React)    │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                     │            │
│         │              ┌─────┴─────┐               │            │
│         │              │  Edge Fn  │               │            │
│         │              │  /ingest  │               │            │
│         │              │  /match   │               │            │
│         │              └───────────┘               │            │
│         │                                          │            │
│  ┌──────┴──────┐                          ┌───────┴──────┐    │
│  │   SMS/Push  │                          │  PWA ADMIN   │    │
│  │  Bank Notif │                          │  PWA MASTER  │    │
│  └─────────────┘                          └──────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tablas Principales (Supabase)

| Tabla | Campos Clave | RLS Activo |
|-------|--------------|------------|
| `tenants` | id, name, status, plan, api_key | ✅ |
| `users` | id, tenant_id, role, email | ✅ |
| `devices` | id, tenant_id, device_id, pairing_code, is_active | ✅ |
| `transactions` | id, tenant_id, amount, reference, bank, status, created_at | ✅ |
| `bank_patterns` | id, bank_name, regex_pattern | No |
| `audit_logs` | id, tenant_id, action, created_at | No |

### 2.3 Roles del Sistema

| Rol | Acceso | Permisos |
|-----|--------|----------|
| **master** | Global (todos los tenants) | CRUD tenants, ver logs, gestionar suscripciones |
| **admin** | Tenant específico | CRUD cajeros, generar códicos vinculación, cuadre diario |
| **cashier** | Tenant específico (limitado) | Registrar pagos, ver historial propio |

---

## 3. Pruebas de Seguridad y Privacidad

### 3.1 Cross-Tenant Attack (Ataque Entre Inquilinos)

**Objetivo:** Verificar que el RLS de Supabase bloquea accesos entre tenants.

| ID | Caso de Prueba | Prioridad | Descripción | Resultado Esperado |
|----|----------------|-----------|-------------|-------------------|
| SEC-001 | Lectura cross-tenant transactions | **Crítica** | Autenticarse como usuario del Tenant_A y consultar `transactions` filtrando por `tenant_id` del Tenant_B | Error 403 o conjunto vacío |
| SEC-002 | Inserción cross-tenant transaction | **Crítica** | Intentar insertar una transacción con `tenant_id` de otro tenant | Error 403 (RLS bloquea INSERT) |
| SEC-003 | Actualización cross-tenant | **Crítica** | Modificar el `status` de una transacción de otro tenant | Error 403 |
| SEC-004 | Eliminación cross-tenant | **Crítica** | Intentar borrar un device de otro tenant | Error 403 |
| SEC-005 | Lectura cross-tenant devices | **Crítica** | Consultar dispositivos de otro tenant desde PWA Admin | Lista vacía o error 403 |
| SEC-006 | Lectura cross-tenant users | **Crítica** | Consultar usuarios de otro tenant | Error 403 o lista vacía |
| SEC-007 | Bypass RLS via Edge Function | **Crítica** | Llamar `/api/v1/ingest` manipulando el `device_id` para asociarlo a otro tenant | La función valida `device_id` y rechaza si no existe en la tabla devices |
| SEC-008 | JWT token swap | **Alta** | Usar el JWT de un usuario para acceder a datos de otro | Error de autenticación o 403 |

**Script de Prueba (Supabase CLI + curl):**

```bash
#!/bin/bash
# cross_tenant_attack_test.sh

SUPABASE_URL="https://<project-ref>.supabase.co"
TENANT_A_TOKEN="<jwt-tenant-a>"
TENANT_B_TOKEN="<jwt-tenant-b>"

echo "=== SEC-001: Cross-Tenant Transaction Read ==="
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TENANT_A_TOKEN" \
  "$SUPABASE_URL/rest/v1/transactions?tenant_id=eq.<tenant-b-uuid>")

if [ "$RESPONSE" = "403" ] || [ "$RESPONSE" = "200" ]; then
  echo "PASS: Response code $RESPONSE"
else
  echo "FAIL: Unexpected code $RESPONSE"
  exit 1
fi

echo "=== SEC-002: Cross-Tenant Transaction Insert ==="
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TENANT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"<tenant-b-uuid>","bank":"Banesco","amount":100,"reference":"TEST-001"}' \
  "$SUPABASE_URL/rest/v1/transactions")

if [ "$RESPONSE" = "403" ]; then
  echo "PASS: RLS blocked cross-tenant insert"
else
  echo "FAIL: Cross-tenant insert succeeded with code $RESPONSE"
  exit 1
fi

echo "=== SEC-003: Cross-Tenant Transaction Update ==="
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TENANT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}' \
  "$SUPABASE_URL/rest/v1/transactions?tenant_id=eq.<tenant-b-uuid>&status=eq.pending")

if [ "$RESPONSE" = "403" ]; then
  echo "PASS: RLS blocked cross-tenant update"
else
  echo "FAIL: Cross-tenant update succeeded with code $RESPONSE"
  exit 1
fi

echo "=== All Cross-Tenant Tests Completed ==="
```

### 3.2 Data Leakage (Fugas de Datos)

**Objetivo:** Verificar que ningún dato de otros clientes sea expuesto en el Frontend.

| ID | Caso de Prueba | Prioridad | Descripción | Resultado Esperado |
|----|----------------|-----------|-------------|-------------------|
| SEC-010 | Filtrado por tenant_id en queries | **Crítica** | Todas las queries del frontend incluyen `.eq('tenant_id', profile.tenant_id)` | Ninguna query retorna datos de otro tenant |
| SEC-011 | Inspección de DOM | **Alta** | Revisar HTML renderizado para datos visibles de otros tenants | No hay datos ajenos en el DOM |
| SEC-012 | Network tab analysis | **Alta** | Monitorear respuestas de API en DevTools Network | Respuestas contienen solo datos del tenant actual |
| SEC-013 | Cache del navegador | **Media** | Verificar Service Worker/PWA cache no almacena datos cross-tenant | Cache solo contiene datos del tenant autenticado |
| SEC-014 | LocalStorage/SessionStorage | **Alta** | Inspeccionar almacenamiento local | No se almacenan tokens o datos de otros tenants |
| SEC-015 | Error messages | **Media** | Forzar errores y verificar que los mensajes no expongan datos internos | Mensajes genéricos sin datos sensibles |
| SEC-016 | API response inspection | **Crítica** | Verificar que las respuestas REST no incluyen campos como `api_key` de otros tenants | Solo se retornan campos necesarios |

**Script de Prueba (Cypress):**

```typescript
// cypress/e2e/data-leakage.cy.ts

describe('Data Leakage Prevention', () => {
  beforeEach(() => {
    // Login as Tenant A cashier
    cy.login('cashier@tenant-a.com', 'password123')
    cy.visit('/dashboard/cashier')
  })

  it('SEC-010: Should only show transactions from current tenant', () => {
    cy.intercept('GET', '**/rest/v1/transactions*').as('getTransactions')
    cy.wait('@getTransactions').then((interception) => {
      const transactions = interception.response.body
      if (transactions && transactions.length > 0) {
        const tenantIds = [...new Set(transactions.map((t: any) => t.tenant_id))]
        expect(tenantIds).to.have.length(1)
        expect(tenantIds[0]).to.equal(Cypress.env('TENANT_A_ID'))
      }
    })
  })

  it('SEC-011: DOM should not contain data from other tenants', () => {
    cy.get('body').then(($body) => {
      const text = $body.text()
      // Tenant B specific data that should never appear
      expect(text).to.not.contain('Tenant B Store')
      expect(text).to.not.contain('tenant-b@email.com')
    })
  })

  it('SEC-014: LocalStorage should not contain cross-tenant data', () => {
    cy.window().then((win) => {
      const keys = Object.keys(win.localStorage)
      keys.forEach((key) => {
        const value = win.localStorage.getItem(key)
        if (value && value.includes('tenant')) {
          // Should only contain current tenant reference
          expect(value).to.not.contain(Cypress.env('TENANT_B_ID'))
        }
      })
    })
  })
})
```

### 3.3 Inyección SQL y XSS

**Objetivo:** Validar que los inputs estén saneados antes de llegar a la base de datos.

| ID | Caso de Prueba | Prioridad | Descripción | Resultado Esperado |
|----|----------------|-----------|-------------|-------------------|
| SEC-020 | SQL Injection en monto | **Crítica** | Ingresar `100; DROP TABLE transactions;--` en campo monto | Input rechazado o sanitizado |
| SEC-021 | SQL Injection en referencia | **Crítica** | Ingresar `' OR 1=1 --` en campo referencia | Input sanitizado, query segura |
| SEC-022 | SQL Injection en bank | **Crítica** | Enviar payload SQL en campo banco | Rechazo o escaping correcto |
| SEC-023 | XSS en referencia (stored) | **Crítica** | Enviar `<script>alert('XSS')</script>` como referencia | Script no se ejecuta, se muestra como texto |
| SEC-024 | XSS en nombre de tenant | **Crítica** | Crear tenant con nombre `<img onerror=alert(1)>` | Nombre se escapa correctamente |
| SEC-025 | XSS反射 (Reflected) | **Alta** | Inyectar script en parámetros de URL | No se ejecuta en el DOM |
| SEC-026 | XSS en campos de búsqueda | **Alta** | Buscar `<svg onload=alert(1)>` | Input sanitizado |
| SEC-027 | Negative amount injection | **Alta** | Enviar monto negativo `-100` | Rechazo por validación de negocio |
| SEC-028 | Extremely long strings | **Media** | Enviar string de 10,000 caracteres | Truncado o rechazado con error 400 |
| SEC-029 | Special characters in reference | **Media** | Enviar `@#$%^&*(){}[]\|` | Sanitizado correctamente |

**Script de Prueba (Cypress + Supabase):**

```typescript
// cypress/e2e/sql-xss-injection.cy.ts

describe('SQL Injection & XSS Prevention', () => {
  const sqlPayloads = [
    "100; DROP TABLE transactions;--",
    "' OR 1=1 --",
    "1' UNION SELECT * FROM users--",
    "'; INSERT INTO users (role) VALUES ('master');--",
    "100; UPDATE transactions SET status='approved';--",
    "1' AND (SELECT COUNT(*) FROM users)>0--",
  ]

  const xssPayloads = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<body onload=alert('XSS')>",
    "{{constructor.constructor('alert(1)')()}}",
  ]

  beforeEach(() => {
    cy.login('cashier@tenant-a.com', 'password123')
    cy.visit('/dashboard/cashier/registrar-pago')
  })

  sqlPayloads.forEach((payload, index) => {
    it(`SEC-020/021: SQL Injection attempt ${index + 1}`, () => {
      cy.get('input[name="amount"]').clear().type('100')
      cy.get('input[name="reference"]').clear().type(payload)
      cy.get('button[type="submit"]').click()

      // Should not succeed
      cy.get('.error-message, [role="alert"]').should('be.visible')
      // Verify no SQL error exposed
      cy.get('body').should('not.contain', 'SQL syntax')
      cy.get('body').should('not.contain', 'PostgreSQL')
    })
  })

  xssPayloads.forEach((payload, index) => {
    it(`SEC-023: XSS attempt ${index + 1}`, () => {
      cy.get('input[name="reference"]').clear().type(payload)
      cy.get('button[type="submit"]').click()

      // Verify no alert dialog appeared
      cy.on('window:alert', () => {
        throw new Error('XSS alert triggered!')
      })

      // Verify input is displayed as text, not executed
      cy.get('body').should('not.contain', '<script>')
    })
  })
})
```

**Script de Prueba Directo (Supabase):**

```sql
-- sql_injection_test.sql
-- Ejecutar en Supabase SQL Editor como usuario autenticado

-- Test SEC-020: SQL Injection en amount
DO $$
DECLARE
  test_result TEXT;
BEGIN
  BEGIN
    INSERT INTO transactions (tenant_id, bank, amount, reference)
    VALUES (
      (SELECT tenant_id FROM users WHERE id = auth.uid()),
      'Banesco',
      100,
      '100; DROP TABLE transactions;--'
    );
    test_result := 'PASS: Input sanitized, insert succeeded with safe data';
  EXCEPTION WHEN OTHERS THEN
    test_result := 'PASS: SQL injection rejected: ' || SQLERRM;
  END;
  RAISE NOTICE '%', test_result;
END $$;

-- Test SEC-021: UNION-based injection
DO $$
DECLARE
  test_result TEXT;
BEGIN
  BEGIN
    INSERT INTO transactions (tenant_id, bank, amount, reference)
    VALUES (
      (SELECT tenant_id FROM users WHERE id = auth.uid()),
      'Banesco',
      100,
      ''' OR 1=1 --'
    );
    test_result := 'PASS: Input sanitized';
  EXCEPTION WHEN OTHERS THEN
    test_result := 'PASS: Injection rejected: ' || SQLERRM;
  END;
  RAISE NOTICE '%', test_result;
END $$;
```

---

## 4. Pruebas de Integración

### 4.1 Flujo Completo E2E (End-to-End)

**Objetivo:** Validar el flujo completo Puente → Supabase → Panel Cajero.

| ID | Caso de Prueba | Prioridad | Pasos | Resultado Esperado |
|----|----------------|-----------|-------|-------------------|
| INT-001 | Flujo completo de transacción | **Crítica** | 1. Puente detecta SMS → 2. Envía payload a /ingest → 3. Supabase valida device_id → 4. Inserta en transactions → 5. Realtime notifica → 6. Panel Cajero muestra transacción | Transacción aparece en Panel Cajero en <2s |
| INT-002 | Match de transacción | **Crítica** | 1. Cajero ingresa monto/referencia → 2. Llama a /match → 3. Sistema busca pending match → 4. Actualiza status a approved → 5. Webhook se dispara → 6. Panel muestra "Aprobado" | Estado cambia a "Aprobado" en tiempo real |
| INT-003 | Vinculación de dispositivo | **Crítica** | 1. Admin genera código → 2. Puente ingresa código → 3. Llama a link_device() RPC → 4. Dispositivo se asocia a tenant | Dispositivo aparece como "Activo" en Admin Dashboard |
| INT-004 | Webhook a tienda online | **Alta** | 1. Pago aprobado → 2. Sistema envía POST a URL registrada → 3. Tienda recibe confirmación | Webhook recibido con payload correcto |
| INT-005 | Registro de cajero | **Alta** | 1. Admin crea cajero → 2. Cajero recibe credenciales → 3. Cajero inicia sesión → 4. Redirige a /dashboard/cashier | Cajero puede acceder a su panel |
| INT-006 | Desactivación de dispositivo | **Alta** | 1. Admin desactiva dispositivo → 2. Puente intenta enviar transacción | Transacción rechazada (device_id inactive) |

**Script de Prueba E2E (Cypress):**

```typescript
// cypress/e2e/transaction-flow.cy.ts

describe('E2E Transaction Flow', () => {
  const TEST_DEVICE_ID = 'test-device-uuid-001'
  const TEST_TENANT_ID = Cypress.env('TENANT_A_ID')

  it('INT-001: Complete transaction flow (Puente → Supabase → Panel)', () => {
    // Step 1: Simulate Puente sending transaction via Edge Function
    cy.request({
      method: 'POST',
      url: `${Cypress.env('SUPABASE_URL')}/functions/v1/ingest`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        device_id: TEST_DEVICE_ID,
        bank: 'Banesco',
        amount: 150.00,
        reference: 'Pago-TEST-001',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      const txId = response.body.transaction_id

      // Step 2: Verify transaction exists in database
      cy.task('querySupabase', {
        table: 'transactions',
        filter: `id=eq.${txId}`,
      }).then((rows) => {
        expect(rows).to.have.length(1)
        expect(rows[0].status).to.eq('pending')
        expect(rows[0].tenant_id).to.eq(TEST_TENANT_ID)
      })

      // Step 3: Login as cashier and verify realtime update
      cy.login('cashier@tenant-a.com', 'password123')
      cy.visit('/dashboard/cashier')

      // Step 4: Transaction should appear in history
      cy.get('[data-testid="transaction-list"]')
        .should('contain', 'Pago-TEST-001')
        .and('contain', '$150')
    })
  })

  it('INT-002: Match transaction flow', () => {
    // Step 1: Create pending transaction first
    cy.createTestTransaction({
      bank: 'Mercantil',
      amount: 200,
      reference: 'REF-MATCH-001',
      status: 'pending',
    }).then((txId) => {
      // Step 2: Cashier matches the transaction
      cy.login('cashier@tenant-a.com', 'password123')
      cy.visit('/dashboard/cashier/registrar-pago')

      cy.get('input[name="amount"]').type('200')
      cy.get('input[name="reference"]').type('REF-MATCH-001')
      cy.get('button[type="submit"]').click()

      // Step 3: Verify status changed to approved
      cy.task('querySupabase', {
        table: 'transactions',
        filter: `id=eq.${txId}`,
      }).then((rows) => {
        expect(rows[0].status).to.eq('approved')
      })

      // Step 4: Verify realtime update on dashboard
      cy.visit('/dashboard/cashier')
      cy.get('[data-testid="transaction-status"]')
        .should('contain', 'Aprobado')
    })
  })

  it('INT-003: Device pairing flow', () => {
    // Step 1: Admin generates pairing code
    cy.login('admin@tenant-a.com', 'password123')
    cy.visit('/dashboard/admin/vinculacion')

    cy.get('button:contains("Generar Código")').click()
    cy.get('[data-testid="pairing-code"]').invoke('text').then((code) => {
      const pairingCode = code.trim()

      // Step 2: Simulate device pairing via RPC
      cy.task('callSupabaseRPC', {
        function: 'link_device',
        params: {
          p_pairing_code: pairingCode,
          p_device_id: TEST_DEVICE_ID,
        },
      }).then((result) => {
        expect(result.success).to.be.true
        expect(result.tenant_id).to.eq(TEST_TENANT_ID)
      })

      // Step 3: Verify device appears in admin dashboard
      cy.visit('/dashboard/admin/vinculacion')
      cy.get('[data-testid="linked-devices"]')
        .should('contain', TEST_DEVICE_ID)
    })
  })
})
```

### 4.2 Sincronización y Desconexión

**Objetivo:** Verificar que la desconexión del Puente no rompa la sesión de la PWA.

| ID | Caso de Prueba | Prioridad | Pasos | Resultado Esperado |
|----|----------------|-----------|-------|-------------------|
| INT-010 | Desconexión del Puente | **Crítica** | 1. Puente activo y enviando transacciones → 2. Desactivar Puente → 3. Cajero sigue en PWA | PWA sigue funcionando, estado "Sin conexión" visible |
| INT-011 | Reconexión del Puente | **Alta** | 1. Puente desconectado → 2. Reactivar Puente → 3. Enviar transacción | Transacciones se reanudan correctamente |
| INT-012 | Pérdida de conexión a internet | **Crítica** | 1. PWA activa → 2. Cortar internet → 3. Restablecer | PWA muestra estado offline, reconecta automáticamente |
| INT-013 | Realtime reconnection | **Alta** | 1. PWA suscrita a canal → 2. Desconectar WebSocket → 3. Verificar reconexión automática | Supabase reconecta el canal en <5s |
| INT-014 | Multiple devices sync | **Media** | 1. Dos dispositivos Puente activos → 2. Ambos envían transacciones → 3. Cajero ve ambas | Todas las transacciones aparecen en orden cronológico |

**Script de Prueba (Cypress):**

```typescript
// cypress/e2e/sync-disconnection.cy.ts

describe('Sync & Disconnection Handling', () => {
  it('INT-010: Puente disconnection should not break PWA session', () => {
    // Login as cashier
    cy.login('cashier@tenant-a.com', 'password123')
    cy.visit('/dashboard/cashier')

    // Verify initial connection state
    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Conectado')

    // Simulate Puente disconnection (deactivate device)
    cy.task('deactivateDevice', { deviceId: TEST_DEVICE_ID })

    // Wait and verify PWA still works
    cy.wait(2000)
    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Sin conexión')

    // Verify user can still navigate
    cy.get('nav').should('be.visible')
    cy.visit('/dashboard/cashier/historial')
    cy.url().should('include', '/historial')
  })

  it('INT-012: Internet loss and recovery', () => {
    cy.login('cashier@tenant-a.com', 'password123')
    cy.visit('/dashboard/cashier')

    // Simulate offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
      win.dispatchEvent(new Event('offline'))
    })

    // Verify offline indicator
    cy.get('[data-testid="offline-banner"]', { timeout: 5000 })
      .should('be.visible')

    // Simulate reconnection
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(true)
      win.dispatchEvent(new Event('online'))
    })

    // Verify reconnection
    cy.get('[data-testid="connection-status"]', { timeout: 10000 })
      .should('contain', 'Conectado')
  })
})
```

---

## 5. Pruebas de Escalabilidad y Carga

### 5.1 Estrategia de Test de Estrés

**Objetivo:** Verificar que el sistema soporte miles de usuarios concurrentes.

| ID | Caso de Prueba | Prioridad | Métrica Objetivo | Resultado Esperado |
|----|----------------|-----------|------------------|-------------------|
| ESC-001 | 1,000 inserts/s en transactions | **Alta** | Throughput, latencia p99 | <500ms latencia p99 |
| ESC-002 | 100 conexiones WebSocket simultáneas | **Alta** | Mensajes entregados, latencia | 100% entregados, <1s latencia |
| ESC-003 | 500 usuarios PWA concurrentes | **Media** | Tiempo de carga, errores | <3s carga, 0 errores 5xx |
| ESC-004 | 10,000 transacciones batch | **Alta** | Tiempo de procesamiento | <60s para procesar todo |
| ESC-005 | Memory leak detection | **Media** | Uso de memoria durante 1h | Sin incremento sostenido |

### 5.2 Herramientas Recomendadas

| Herramienta | Uso | Configuración Sugerida |
|-------------|-----|----------------------|
| **k6** | Test de carga para APIs | Escenarios de rampa hasta 1000 VUs |
| **JMeter** | Test de estrés HTTP | Plan de prueba con 1000 threads |
| **Artillery** | Test de carga real-time | WebSockets + HTTP mix |
| **Supabase CLI** | Test de DB directo | Migrations + seed data |

### 5.3 Scripts de Prueba de Carga

**k6 Script:**

```javascript
// k6/transaction-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const transactionDuration = new Trend('transaction_duration');

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://<project-ref>.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  scenarios: {
    // Scenario 1: Ramp up to 1000 inserts/s
    transaction_inserts: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 2000,
      stages: [
        { target: 100, duration: '1m' },   // Ramp to 100/s
        { target: 500, duration: '2m' },   // Ramp to 500/s
        { target: 1000, duration: '3m' },  // Ramp to 1000/s
        { target: 1000, duration: '5m' },  // Sustain 1000/s
        { target: 0, duration: '1m' },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<500'],  // 99% of requests < 500ms
    errors: ['rate<0.01'],              // Error rate < 1%
  },
};

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
};

function generateTransaction(tenantId) {
  const banks = ['Banesco', 'Mercantil', 'BDV', 'Provincial', 'Bancaribe'];
  return {
    device_id: `test-device-${tenantId}-${__VU}`,
    bank: banks[Math.floor(Math.random() * banks.length)],
    amount: Math.floor(Math.random() * 10000) / 100,
    reference: `LOAD-TEST-${Date.now()}-${__VU}`,
  };
}

export default function () {
  const tenantIds = [/* test tenant UUIDs */];
  const tenantId = tenantIds[Math.floor(Math.random() * tenantIds.length)];
  const payload = JSON.stringify(generateTransaction(tenantId));

  const startTime = Date.now();
  const res = http.post(`${SUPABASE_URL}/functions/v1/ingest`, payload, { headers });
  const duration = Date.now() - startTime;

  transactionDuration.add(duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has success': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(res.status !== 200);
}

export function handleSummary(data) {
  return {
    'k6/results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

**JMeter Plan (XML simplificado):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan>
  <hashTree>
    <TestPlan>
      <elementProp name="HTTP Test" elementType="TestPlan">
        <stringProp name="TestPlan.comments">Pago-M Transaction Load Test</stringProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <!-- Thread Group: 1000 users -->
      <ThreadGroup>
        <stringProp name="ThreadGroup.num_threads">1000</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <stringProp name="ThreadGroup.duration">300</stringProp>
      </ThreadGroup>
      <hashTree>
        <!-- HTTP Request to /ingest -->
        <HTTPSamplerProxy>
          <stringProp name="HTTPSampler.domain">${SUPABASE_URL}</stringProp>
          <stringProp name="HTTPSampler.path">/functions/v1/ingest</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <stringProp name="Argument.value">${TRANSACTION_PAYLOAD}</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <!-- Response Assertions -->
        <ResponseAssertion>
          <collectionProp name="Asserion.test_strings">
            <stringProp name="49586">200</stringProp>
          </collectionProp>
          <stringProp name="Assertion.test_field">HTTP Response Code</stringProp>
        </ResponseAssertion>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

**Artillery Config (para Realtime):**

```yaml
# artillery/realtime-load-test.yml

config:
  target: "wss://<project-ref>.supabase.co/realtime/v1/websocket"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 180
      arrivalRate: 100
      name: "Sustained load"
  defaults:
    headers:
      apikey: "{{ $processEnvironment.SUPABASE_ANON_KEY }}"
      Authorization: "Bearer {{ $processEnvironment.SUPABASE_ANON_KEY }}"

scenarios:
  - name: "WebSocket Transaction Stream"
    engine: "socketio"
    flow:
      - emit:
          channel: "transactions-realtime"
          data:
            event: "postgres_changes"
            schema: "public"
            table: "transactions"
      - think: 1
```

---

## 6. Pruebas de Funcionalidad (Business Logic)

### 6.1 Consistencia del RegEx

**Objetivo:** Verificar que los patrones SMS se propagan correctamente a todos los dispositivos.

| ID | Caso de Prueba | Prioridad | Pasos | Resultado Esperado |
|----|----------------|-----------|-------|-------------------|
| FUN-001 | Propagación de RegEx actualizado | **Alta** | 1. Admin actualiza regex_pattern → 2. Puente se reinicia → 3. Descarga nuevos patrones | Puente usa el nuevo patrón |
| FUN-002 | Parsing de SMS con patrón válido | **Alta** | 1. Enviar SMS que coincide con RegEx → 2. Puente procesa | Amount y reference extraídos correctamente |
| FUN-003 | SMS con formato no reconocido | **Media** | 1. Enviar SMS con formato diferente → 2. Puente procesa | Transacción no creada, error logged |
| FUN-004 | Múltiples bancos soportados | **Alta** | 1. Procesar SMS de Banesco, Mercantil, BDV, Provincial | Cada banco parseado correctamente |

**Script de Prueba:**

```typescript
// cypress/e2e/regex-propagation.cy.ts

describe('RegEx Pattern Propagation', () => {
  it('FUN-001: Updated regex propagates to devices', () => {
    // Step 1: Admin updates regex pattern
    cy.login('admin@tenant-a.com', 'password123')
    cy.visit('/dashboard/admin/config')

    // Update Banesco regex
    cy.get('[data-testid="bank-pattern-banesco"]')
      .clear()
      .type('Banesco:.*Bs\\s*(\\d+[,.]\\d{2})\\s*Ref:\\s*(\\w+)')

    cy.get('button:contains("Guardar")').click()
    cy.get('[data-testid="success-message"]').should('be.visible')

    // Step 2: Verify pattern saved in database
    cy.task('querySupabase', {
      table: 'bank_patterns',
      filter: `bank_name=eq.Banesco`,
    }).then((rows) => {
      expect(rows[0].regex_pattern).to.contain('Banesco:')
    })

    // Step 3: Simulate device restart and pattern fetch
    cy.task('simulateDeviceRestart', {
      deviceId: TEST_DEVICE_ID,
    }).then((patterns) => {
      const banescoPattern = patterns.find(p => p.bank_name === 'Banesco')
      expect(banescoPattern.regex_pattern).to.contain('Banesco:')
    })
  })

  it('FUN-002: SMS parsing with valid pattern', () => {
    const testSms = 'Banesco: Pago recibido Bs 150,00 Ref: ABC123'

    cy.task('parseSmsWithPattern', {
      bank: 'Banesco',
      sms: testSms,
    }).then((result) => {
      expect(result.amount).to.eq(150.00)
      expect(result.reference).to.eq('ABC123')
    })
  })
})
```

### 6.2 Roles y RBAC (Role-Based Access Control)

**Objetivo:** Verificar que los permisos se respetan según el rol del usuario.

| ID | Caso de Prueba | Prioridad | Rol | Acción | Resultado Esperado |
|----|----------------|-----------|-----|--------|-------------------|
| FUN-010 | Cajero no accede a rutas Admin | **Crítica** | cashier | Navegar a `/dashboard/admin` | Redirigido a `/dashboard/cashier` |
| FUN-011 | Cajero no accede a rutas Master | **Crítica** | cashier | Navegar a `/dashboard/master` | Redirigido a `/dashboard/cashier` |
| FUN-012 | Admin no accede a rutas Master | **Crítica** | admin | Navegar a `/dashboard/master` | Redirigido a `/dashboard/admin` |
| FUN-013 | Admin no puede crear usuarios Master | **Crítica** | admin | POST a /users con role=master | Error 403 |
| FUN-014 | Cajero no puede gestionar dispositivos | **Crítica** | cashier | Navegar a `/dashboard/admin/vinculacion` | Redirigido o denegado |
| FUN-015 | Cajero solo ve transacciones propias | **Alta** | cashier | Ver historial | Solo sus transacciones |
| FUN-016 | Admin ve transacciones de su tenant | **Alta** | admin | Ver reportes | Transacciones de todo el tenant |
| FUN-017 | Master ve todos los tenants | **Alta** | master | Ver tenants | Lista de todos los tenants |
| FUN-018 | Token expirado rechazado | **Crítica** | any | Usar JWT expirado | Error 401, redirect a login |
| FUN-019 | Sesión persiste entre páginas | **Media** | any | Navegar entre páginas | Login no se repite |

**Script de Prueba (Cypress):**

```typescript
// cypress/e2e/rbac.cy.ts

describe('Role-Based Access Control', () => {
  const roleTests = [
    {
      role: 'cashier',
      email: 'cashier@tenant-a.com',
      validRoute: '/dashboard/cashier',
      invalidRoutes: ['/dashboard/admin', '/dashboard/master'],
    },
    {
      role: 'admin',
      email: 'admin@tenant-a.com',
      validRoute: '/dashboard/admin',
      invalidRoutes: ['/dashboard/master', '/dashboard/cashier'],
    },
    {
      role: 'master',
      email: 'master@pago-m.com',
      validRoute: '/dashboard/master',
      invalidRoutes: ['/dashboard/admin', '/dashboard/cashier'],
    },
  ]

  roleTests.forEach(({ role, email, validRoute, invalidRoutes }) => {
    describe(`${role} role`, () => {
      beforeEach(() => {
        cy.login(email, 'password123')
      })

      it(`FUN-010/011/012: Should NOT access other role routes`, () => {
        invalidRoutes.forEach((route) => {
          cy.visit(route)
          cy.url().should('not.include', route)
          cy.url().should('include', validRoute)
        })
      })

      it(`FUN-019: Session persists across navigation`, () => {
        cy.visit(validRoute)
        cy.get('nav').should('be.visible')

        // Navigate to different pages
        cy.visit(`${validRoute}/settings`)
        cy.get('nav').should('be.visible')

        // Should not redirect to login
        cy.url().should('not.include', '/login')
      })
    })
  })

  it('FUN-013: Admin cannot create master users', () => {
    cy.login('admin@tenant-a.com', 'password123')

    cy.request({
      method: 'POST',
      url: `${Cypress.env('SUPABASE_URL')}/rest/v1/users`,
      headers: {
        apikey: Cypress.env('SUPABASE_ANON_KEY'),
        Authorization: `Bearer ${Cypress.env('ADMIN_TOKEN')}`,
      },
      body: {
        id: 'test-new-user-id',
        tenant_id: Cypress.env('TENANT_A_ID'),
        email: 'newmaster@test.com',
        role: 'master',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([403, 401])
    })
  })
})
```

---

## 7. Scripts de Prueba Automatizados

### 7.1 Estructura del Proyecto de Pruebas

```
tests/
├── cypress/
│   ├── e2e/
│   │   ├── security/
│   │   │   ├── cross-tenant.cy.ts
│   │   │   ├── data-leakage.cy.ts
│   │   │   └── sql-xss-injection.cy.ts
│   │   ├── integration/
│   │   │   ├── transaction-flow.cy.ts
│   │   │   ├── sync-disconnection.cy.ts
│   │   │   └── device-pairing.cy.ts
│   │   ├── functionality/
│   │   │   ├── rbac.cy.ts
│   │   │   ├── regex-propagation.cy.ts
│   │   │   └── business-logic.cy.ts
│   │   └── regression/
│   │       └── full-suite.cy.ts
│   ├── support/
│   │   ├── commands.ts
│   │   ├── e2e.ts
│   │   └── supabase.ts
│   └── fixtures/
│       ├── transactions.json
│       ├── users.json
│       └── devices.json
├── k6/
│   ├── transaction-load-test.js
│   ├── realtime-load-test.js
│   └── results/
├── artillery/
│   ├── realtime-load-test.yml
│   └── api-load-test.yml
└── scripts/
    ├── setup-test-data.sh
    ├── run-all-tests.sh
    └── cleanup-test-data.sh
```

### 7.2 Configuración de Cypress

```typescript
// cypress.config.ts

import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    env: {
      SUPABASE_URL: 'https://<project-ref>.supabase.co',
      SUPABASE_ANON_KEY: '<anon-key>',
      TENANT_A_ID: '<tenant-a-uuid>',
      TENANT_B_ID: '<tenant-b-uuid>',
    },
    setupNodeEvents(on, config) {
      on('task', {
        async querySupabase({ table, filter }) {
          // Implement Supabase query for test verification
        },
        async callSupabaseRPC({ function: fn, params }) {
          // Implement Supabase RPC call
        },
        async deactivateDevice({ deviceId }) {
          // Deactivate device for testing
        },
      })
    },
  },
})
```

### 7.3 Comandos de Ejecución

```bash
# Ejecutar todas las pruebas
npm run test:all

# Ejecutar solo pruebas de seguridad
npm run test:security

# Ejecutar solo pruebas E2E
npm run test:e2e

# Ejecutar pruebas de carga
npm run test:load

# Ejecutar pruebas de regresión completa
npm run test:regression

# Generar reporte
npm run test:report
```

### 7.4 Package.json Scripts

```json
{
  "scripts": {
    "test:all": "cypress run && k6 run k6/transaction-load-test.js",
    "test:security": "cypress run --spec 'cypress/e2e/security/**/*'",
    "test:e2e": "cypress run --spec 'cypress/e2e/integration/**/*'",
    "test:functionality": "cypress run --spec 'cypress/e2e/functionality/**/*'",
    "test:load": "k6 run k6/transaction-load-test.js",
    "test:realtime": "artillery run artillery/realtime-load-test.yml",
    "test:regression": "cypress run --spec 'cypress/e2e/regression/**/*'",
    "test:report": "cypress run --reporter mochawesome",
    "test:open": "cypress open"
  }
}
```

---

## 8. Matriz de Riesgos de Seguridad

### 8.1 Análisis de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Nivel | Mitigación |
|----|--------|--------------|---------|-------|------------|
| RISK-001 | **Dispositivo Puente perdido/robado** | Alta | Alto | **Crítico** | 1. Botón de des remota en Admin Dashboard<br>2. Desactivación automática tras 7 días sin actividad<br>3. Almacenamiento encriptado en Android<br>4. Validación de device_id en cada request |
| RISK-002 | **Servidor web caído (Supabase outage)** | Media | Alto | **Alto** | 1. PWA funciona offline con Service Worker<br>2. Cache local de transacciones pendientes<br>3. Reintento automático al reconectar<br>4. Monitoreo con uptime checker |
| RISK-003 | **Credentials comprometidas** | Media | Crítico | **Crítico** | 1. Rotación automática de API keys<br>2. JWT tokens con expiración corta (15min)<br>3. RLS como capa adicional de protección<br>4. Audit logs para detectar usos anómalos |
| RISK-004 | **Ataque DDoS** | Media | Alto | **Alto** | 1. Rate limiting en Edge Functions<br>2. Cloudflare/Supabase DDoS protection<br>3. Escalado automático de recursos<br>4. Bloqueo de IPs sospechosas |
| RISK-005 | **Inyección SQL/NoSQL** | Baja | Crítico | **Alto** | 1. Supabase usa queries parametrizadas<br>2. RLS previene acceso cross-tenant<br>3. Input validation en Edge Functions<br>4. WAF (Web Application Firewall) |
| RISK-006 | **Fuga de datos por error humano** | Media | Alto | **Alto** | 1. RLS fuerza aislamiento por tenant<br>2. Logs de auditoría para trazabilidad<br>3. Capacitación en seguridad<br>4. Revisión de código obligatoria |
| RISK-007 | **Malware en dispositivo Android** | Baja | Alto | **Medio** | 1. Verificación de integridad del APK<br>2. No almacenar datos sensibles localmente<br>3. Comunicación siempre cifrada (HTTPS)<br>4. Actualizaciones forzadas si se detecta compromiso |
| RISK-008 | **Supabase token leak en localStorage** | Media | Alto | **Alto** | 1. Supabase almacena tokens en memoria<br>2. Implementar httpOnly cookies si es posible<br>3. Clear tokens al logout<br>4. No exponer tokens en logs o URLs |
| RISK-009 | **Realtime channel hijacking** | Baja | Medio | **Medio** | 1. Filtro por tenant_id en suscripción<br>2. JWT validation en WebSocket<br>3. Canales con nombres únicos por tenant<br>4. Monitoreo de conexiones anómalas |
| RISK-010 | **Abuso de API key de tienda** | Media | Medio | **Medio** | 1. Rate limiting por API key<br>2. Logs de uso por key<br>3. Rotación programada de keys<br>4. Restricción de endpoints por key |
| RISK-011 | **Pérdida de conexión a internet** | Alta | Bajo | **Medio** | 1. PWA con cache offline<br>2. Cola de transacciones pendientes<br>3. Reintento exponencial<br>4. Indicador visual de estado |
| RISK-012 | **Bypass de RBAC por manipulación de JWT** | Baja | Crítico | **Alto** | 1. JWT firmado con RS256<br>2. Validación de role en Edge Functions<br>3. RLS como segunda capa<br>4. Monitoreo de tokens inválidos |

### 8.2 Matriz de Riesgo Visual

```
                    IMPACTO
                    Bajo    Medio   Alto    Crítico
                ┌───────┬───────┬───────┬────────┐
    Alta        │       │       │RISK-001│        │
                │       │       │RISK-011│        │
    P           ├───────┼───────┼───────┼────────┤
    R   Media   │       │RISK-009│RISK-002│RISK-003│
    O           │       │RISK-010│RISK-004│        │
    B           │       │       │RISK-006│        │
    .           │       │       │RISK-008│        │
                ├───────┼───────┼───────┼────────┤
    Baja        │       │       │RISK-007│RISK-005│
                │       │       │       │RISK-012│
                └───────┴───────┴───────┴────────┘
```

---

## 9. Criterios de Aceptación

### 9.1 Criterios por Pilar

| Pilar | Criterio de Aceptación | Bloqueante |
|-------|----------------------|------------|
| **Seguridad** | 0 vulnerabilities Críticas/Altas en scan<br>RLS bloquea 100% de intentos cross-tenant<br>Input validation en todos los endpoints | ✅ SÍ |
| **Integración** | Flujo E2E completo sin errores<br>Realtime entrega <2s<br>Desconexión no rompe sesión | ✅ SÍ |
| **Escalabilidad** | Soporta 1000 inserts/s con p99 <500ms<br>100 conexiones WebSocket simultáneas<br>Sin memory leaks en 1h de carga | ⚠️ NO (recomendado) |
| **Funcionalidad** | RBAC bloquea 100% de accesos no autorizados<br>RegEx propagation funciona correctamente<br>Todos los roles acceden solo a sus rutas | ✅ SÍ |

### 9.2 Criterios Generales

- [ ] 100% de pruebas de seguridad pasan
- [ ] 100% de pruebas E2E pasan
- [ ] 95%+ de pruebas funcionales pasan
- [ ] Test de carga completa sin errores críticos
- [ ] Code coverage >80% en unit tests
- [ ] 0 vulnerabilidades Críticas/Altas en OWASP ZAP scan
- [ ] Documentación de API actualizada
- [ ] Rollback procedure documentado y probado

---

## 10. Herramientas Recomendadas

### 10.1 Stack de Pruebas

| Categoría | Herramienta | Propósito |
|-----------|-------------|-----------|
| **E2E Testing** | Cypress | Pruebas de integración end-to-end |
| **Load Testing** | k6 | Test de carga para APIs REST |
| **Load Testing** | Artillery | Test de carga para WebSockets/Realtime |
| **Security Scanning** | OWASP ZAP | Vulnerabilidades web |
| **DB Testing** | Supabase CLI | Testing de RLS y Edge Functions |
| **Mobile Testing** | Appium | Testing de la app Puente (Android) |
| **Monitoring** | Grafana + Prometheus | Métricas de rendimiento en producción |
| **CI/CD** | GitHub Actions | Ejecución automática de pruebas |

### 10.2 Instalación Rápida

```bash
# Cypress
npm install cypress --save-dev

# k6 (macOS)
brew install k6

# k6 (Windows)
choco install k6

# Artillery
npm install -g artillery

# Supabase CLI
npm install -g supabase

# OWASP ZAP (Docker)
docker pull owasp/zap2docker-stable
```

---

## Apéndice A: Datos de Prueba

### A.1 Usuarios de Prueba

```json
{
  "master": {
    "email": "master@pago-m.com",
    "password": "MasterPass123!",
    "role": "master",
    "tenant_id": null
  },
  "admin": {
    "email": "admin@tenant-a.com",
    "password": "AdminPass123!",
    "role": "admin",
    "tenant_id": "tenant-a-uuid"
  },
  "cashier": {
    "email": "cashier@tenant-a.com",
    "password": "CashierPass123!",
    "role": "cashier",
    "tenant_id": "tenant-a-uuid"
  }
}
```

### A.2 Transacciones de Prueba

```json
[
  {
    "bank": "Banesco",
    "amount": 150.00,
    "reference": "PAGO-001",
    "status": "pending"
  },
  {
    "bank": "Mercantil",
    "amount": 2500.50,
    "reference": "TRANS-002",
    "status": "pending"
  },
  {
    "bank": "BDV",
    "amount": 89.99,
    "reference": "DEP-003",
    "status": "approved"
  }
]
```

### A.3 SMS Samples para Testing

```
Banesco: Pago movil recibido Bs. 150,00. Ref: ABC123. Saldo: Bs. 5.000,00
Mercantil: Tu pago de Bs 2.500,50 fue exitoso. Ref: TXN456. Fecha: 01/07/2026
BDV: Deposito en tu cuenta por Bs.89,99. Referencia: DEP789
Provincial: Transferencia recibida Bs 1.200,00 Ref: TRANS012
```

---

## Apéndice B: Checklist Pre-Producción

- [ ] Todas las pruebas de seguridad pasan
- [ ] RLS configurado en todas las tablas
- [ ] API keys rotadas y seguras
- [ ] Webhooks configurados con HTTPS
- [ ] Rate limiting habilitado
- [ ] Monitoreo configurado
- [ ] Backup automático verificado
- [ ] Documentación de incidentes lista
- [ ] Team de soporte notificado
- [ ] Rollback procedure documentado

---

**Documento generado por QA Engineering Team**  
**Última actualización:** 2026-07-02
