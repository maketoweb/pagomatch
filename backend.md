1. Arquitectura de Procesamiento (Edge Functions)
El backend utiliza Supabase Edge Functions (basadas en Deno/TypeScript). Son funciones serverless que se ejecutan bajo demanda, ideales para el modelo de escalabilidad que buscas.

Endpoint /api/v1/ingest: Recepción de datos del "Puente" (APK).

Lógica: Recibe el payload del dispositivo, consulta la tabla devices para validar el device_id, y realiza el INSERT en transactions.

Endpoint /api/v1/match: Lógica de conciliación del Cajero.

Lógica: Recibe monto, referencia, tenant_id. Realiza un SELECT con WHERE status = 'pending'. Si hay coincidencia, actualiza a approved y dispara el Webhook.

Endpoint /api/v1/webhook-out: Notificación hacia tiendas externas.

Lógica: Envía un POST al endpoint registrado por el cliente cuando un pago es validado.

2. Motor de Validación y RegEx
La lógica de parsing no está en la App, está en la base de datos para facilitar el mantenimiento:

Gestión dinámica: Cuando el "Puente" inicia, descarga los patrones (bank_patterns) desde Supabase.

Actualización: Si un banco cambia el formato de sus SMS, tú solo editas el regex_pattern en la tabla bank_patterns y todos los dispositivos se actualizan en su siguiente reinicio.

3. Seguridad de Acceso (RBAC)
Todo el backend está protegido por Row Level Security (RLS) y JWT:

Verificación JWT: Cada petición de los paneles PWA incluye un token de Supabase Auth.

Validación de Roles: Las funciones validan que el usuario auth.uid() tenga permisos para realizar la acción (ej: solo el admin puede crear un cajero).

4. Flujo de Datos y Eventos
Entrada: El "Puente" detecta una notificación -> /ingest.

Procesamiento: El sistema asigna el tenant_id automáticamente mediante el device_id.

Realtime: Supabase emite un evento postgres_changes en la tabla transactions.

Respuesta: Los paneles PWA (Cajeros) que están suscritos a ese canal, renderizan el resultado instantáneamente en la pantalla.

5. API de Integración (B2B)
Para que tiendas online se integren, el backend provee:

Autenticación: Cada tienda tiene un api_key único que debe enviar en los headers (x-api-key).

Webhooks: El usuario configura su URL en el Panel Admin. Cuando el pago se marca como approved, el sistema hace un fetch hacia esa URL.

Flujo de Seguridad en el Backend
Fragmento de código
graph TD
    A[APK Puente] -->|Payload JSON| B(Edge Function /ingest)
    B --> C{¿Device Valido?}
    C -->|Si| D[Insertar en transactions]
    D --> E[Realtime Update]
    E --> F[Panel Cajero PWA]
    D --> G{¿Es Pago Integrado?}
    G -->|Si| H[Webhook a Tienda Online]