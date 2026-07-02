# Plan de Desarrollo: Sistema de Conciliación Bancaria SaaS (v2.0)

## Objetivos
1. Sistema de vinculación segura mediante `Device ID` y `Pairing Code`.
2. Backend multitenant en Supabase con RLS (Row Level Security).
3. Paneles PWA con suscripción a canales Realtime.
4. App Android "Puente" con gestión de ahorro de energía y sincronización automática.

## Fases
1. **Infraestructura:** Creación de tablas, RLS y lógica de vinculación de dispositivos.
2. **Puente Android:** Desarrollo de servicio persistente, motor de RegEx dinámico y vinculación via código.
3. **Dashboards PWA:** Desarrollo de paneles (Admin, Cajero, Maestro) con lógica de filtrado por Tenant.
4. **API Gateway:** Endpoints para integración con tiendas online (WooCommerce/Shopify).
5. **QA & Launch:** Pruebas de concurrencia y despliegue.