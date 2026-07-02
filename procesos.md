# Procesos y Flujo de Trabajo

## 1. Vinculación (El Handshake)
- El Admin genera un código en su PWA.
- La App (Puente) ingresa el código.
- El servidor vincula el `device_id` de la App al `tenant_id` del Admin.

## 2. Captura y Match (El Proceso)
- **Captura:** La App detecta la notificación -> Envía el payload (`amount`, `ref`, `bank`) a la API.
- **Enrutamiento:** El servidor identifica al `tenant` mediante el `device_id` y guarda el pago.
- **Match:** El cajero registra el pago manualmente en su PWA -> El servidor busca el match y actualiza el estado en Realtime.

## 3. Roles y PWA
- **Master (Dueño SaaS):** Acceso global a todos los `tenants` y logs del sistema.
- **Admin (Dueño Tienda):** Crea cajeros, gestiona pagos manuales, ve cuadres diarios.
- **Cajero:** Registra montos/referencias, ve estados de pago (aprobado/denegado) en tiempo real.

## 4. API de Integración
- Las tiendas online consumen el endpoint `/validate-payment`.
- El sistema bloquea el pago hasta recibir la confirmación de la App Android vía Webhook.