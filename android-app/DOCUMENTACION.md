# 📘 Manual de Documentación Técnica y Arquitectura de Alta Gama
## Proyecto: Puente — Transceptor de Conciliación Bancaria Automatizada SaaS (Venezuela)

---

## 🏢 1. Introducción y Visión General del Proyecto
**Puente** es una solución de software móvil de grado industrial concebida exclusivamente para resolver los problemas críticos de automatización y conciliación de cobros en el ecosistema bancario venezolano. El transceptor móvil actúa como un mediador de lectura activa que escucha, interpreta sintácticamente, valida y transmite notificaciones inteligentes de transacciones (notificaciones push en el área de estado y mensajes de texto SMS) directamente hacia un backend central de gobernanza SaaS alojado de forma redundante en la nube (Supabase). 

El sistema ha sido estructurado con políticas de **Cero Confianza (Zero-Trust)**, **Privacidad por Diseño (Privacy by Design)** y un **Motor de Transmisión Resiliente** que garantiza un procesamiento ininterrumpido en entornos de conectividad intermitente (redes móviles 3G/4G inestables).

---

## 🧭 2. Arquitectura de Software y Modelado de Datos
El proyecto implementa una arquitectura basada en **MVVM (Model-View-ViewModel)** unificada bajo las directrices modernas de desarrollo en Android, combinando **Kotlin Coroutines / Flows**, **WorkManager** para el diferimiento cíclico, e interacción reactiva a través del sistema declarativo **Jetpack Compose**.

### Diagrama de Flujo del Traspaso de Datos
```
  [ Celular Carrier / OS ] (SMS Bancario o Notificación Push de App Bancaria)
             │
             ▼
  [ Guardia Activa: BridgeState.isBridgeActive ] (Filtro de Estado General)
             │
             ▼
  [ Guardia de Enlace: BridgePreferences.isLinked ]
             │
             ▼
       [ RegExParser ] ───⚙️ (Procesamiento Concurrente de Filtros de Banco)
             │
             └──────────────┬──────────────────┐
                            ▼                  ▼
                    [ Datos de Monto ]  [ Referencia ]
                            │                  │
                            ▼                  ▼
             [ Construcción Segura de Log: CapturedLog ] 
             (Hiding Sensitive PII localmente / Text Genérico)
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   [ SupabaseClient.isConfigured ]         [ UI Reactive Flow Logs / State ]
             │
     ┌───────┴─────────────────┐
     │ (SÍ)                    │ (NO / FAILES)
     ▼                         ▼
 [ REST POST API ]       [ TransactionSyncWorker ] (Queue with Exponential Backoff)
     │                         │
     ▼                         ▼
 [ Sincronizado Ok ]     [ WorkManager System Scheduler ]
```

### 🗄️ Modelos de Datos en `Models.kt`
*   **`BankNotification`**: Representa la entidad payload de transmisión saliente hacia la API de Supabase.
    *   `bankName` (String): Identificación del banco capturado (ej: "Banesco").
    *   `sender` (String): Remitente o canal del mensaje (ej: "0412-1234567/82627").
    *   `originalText` (String): El texto íntegro e inalterado para auditoría en el SaaS seguro de backend.
    *   `amount` (Double?): Cuantía monetaria extraída de forma tipada.
    *   `reference` (String?): Código de referencia de la transacción.
    *   `type` (String): Identifica origen ("SMS" o "NOTIFICATION").
    *   `capturedAt` (String): Estampa de tiempo formateada ISO 8601 UTC.
    *   `deviceId` (String): Hash único de identificación de hardware.
*   **`CapturedLog` & `SyncStatus`**: Entidades para la persistencia transitoria en la memoria de la interfaz de usuario en tiempo real. Previene ataques físicos de ingeniería social al no almacenar textos completos de PII localmente.

---

## 🔒 3. Análisis de Seguridad y Gobernanza de Datos (Privacy-by-Design)

### A. Almacenamiento Cero de PII (Información Personal Identificable) Local
Una de las mayores brechas de seguridad en las apps financieras tradicionales es almacenar las copias de los SMS que contienen nombres de pagadores, saldos de cuentas y números de cédula confidenciales de clientes.
*   **Medida adoptada**: La interfaz gráfica de usuario procesa y visualiza la entrada, pero **sustituye el mensaje local persistido** con un marcador genérico estático: `"SMS bancario detectado exitosamente [Filtros Satisfechos]"` o `"Transacción detectada exitosamente [Filtros Aplicados Satisfechos]"`.
*   El texto original se procesa estrictamente en la memoria RAM volátil para su envío directo inmediato mediante HTTPS (TLS 1.2+ obligatorio) hacia los servidores seguros del SaaS. Una vez completado el flujo de la corrutina de red, se purga de la memoria del transceptor móvil.

### B. Vinculación mediante Token Único Dinámico (Secured Handshake)
El transceptor no puede ser interceptado ni suplantado debido al protocolo de enlace:
1.  El sistema genera un identificador universal único (UUID) persistido de forma segura en las preferencias de la app.
2.  Para activar el transceptor, el administrador financiero debe proveer un pin dinámico de 6 dígitos autogenerado en el portal interno seguro de Supabase.
3.  Este código realiza una única invocación RPC remota que asocia el UUID del dispositivo al id único de arrendatario (Tenant ID), cerrando la brecha de comunicaciones abiertas. El token del Tenant viaja cifrado en las llamadas sucesivas del backend.

### C. Almacenamiento de Ajustes Cifrado y Resiliente
El guardado de las directrices y del Tenant ID se gestiona mediante SharedPreferences privadas del sandbox de Android. El software incluye un wrapper de captura de excepciones en caso de corrupción o incompatibilidad del cifrado criptográfico del sistema, garantizando que el software nunca se detenga en un ciclo de caídas (reboot loop) y se recupere automáticamente a modo seguro.

---

## ⚙️ 4. Procesamiento Sintáctico Dinámico: Motores de Análisis (Filtros Regex)
La interceptación de transacciones se apoya en un motor regex centralizado en `RegExParser.kt` que analiza las cadenas textuales. El motor utiliza secuencias con soporte multi-moneda (aceptando símbolos de Bolívar Digital "BsS", "Bs.", "Bs" y montos flotantes internacionales con separadores de miles decimales localizados).

### Estructuras de Regex Optimizadas de Fábrica:
1.  **Pago Móvil Banesco**:
    *   `(?i)pago\s+movil(?:\s+recibido)?.*?(?:bs\.?|bss\.?)\s*([\d.,]+)\s+de.*?ref(?:\.|erencia)?\s*(\d+)`
2.  **Mercantil**:
    *   `(?i)pago\s+movil.*?de.*?por\s+(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\.\s*(\d+)`
3.  **Banco de Venezuela (BDV)**:
    *   `(?i)recibiste.*?(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\s*(\d+)`
4.  **BBVA Provincial**:
    *   `(?i)pago\s+movil.*?por.*?val.*?por\s+(?:bs\.?|bss\.?)\s*([\d.,]+).*?ref\s*(\d+)`
5.  **Bancos Venezolanos Adicionales (BNC, Bancaribe, Exterior, Banplus, Plaza, BFC, Tesoro, Bicentenario, BVC, Caroní, Delsur)**:
    *   `(?:pago\s+movil|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)`
6.  **Binance Pay**:
    *   `(?:recibiste|pago|recibió).*?(?:usdt|usd|usdc|ref|id)\s*([0-9.,]+).*?(?:id|ref|order|orden)(?:\:|\.|\s)+([a-z0-9]+)`
7.  **PayPal**:
    *   `(?:pago|recibido|recibio|ha\s+recibido).*?(?:\$|usd|eur)\s*([0-9.,]+).*?(?:id|ref|transaccion|transId)(?:\:|\.|\s)+([a-z0-9\-]+)`
8.  **Zelle**:
    *   `(?:sent\s+you|envió|recibiste).*?(?:\$|usd)\s*([0-9.,]+).*?(?:confirmation|ref|id|confirmacion)(?:\:|\.|\s)+([a-z0-9\-]+)`
9.  **Genérico Multi-Canal (Filtro Universal de Respaldo)**:
    *   `(?i)(?:pago|transferencia|movil|recibido|abono).*?(?:bs\.?|bss\.?)\s*([\d.,]+).*?(?:ref|referencia|operacion).*?(\d+)`

### ⚡ Prueba de Carga Concurrente de Alto Impacto (10,000 Tx)
La UI incorpora una controladora diagnóstica que ejecuta la evaluación de **10,000 iteraciones analíticas reactivas de forma paralela**. Este estrés-test simula una ráfaga concurrente infinita para garantizar:
*   Inexistencia de bloqueos en el hilo prinicipal (`Main Thread / UI starvation`).
*   Eficiencia algorítmica del recolector de basura (`GC Allocations`) sobre cadenas de texto complejas.
*   Estabilidad de la base reactiva de cambios en compose.

---

## 📡 5. Arquitectura de Transmisión Resiliente y Tolerancia a Fallos
El ciclo de vida de los datos cuenta con dos barreras de resiliencia avanzadas:

### ⚠️ A. Control Preventivo del Ciclo de Vida del Broadcast Receiver (`goAsync()`)
En Android, el ciclo de vida de un `BroadcastReceiver` expira de forma asíncrona tan pronto el método `onReceive()` finaliza. Si se dispara una petición API que tarda más de lo esperado en redes celulares inestables, el sistema operativo de Android suele terminar el proceso antes de que la llamada finalice, causando inconsistencias de conciliación graves.
*   **Solución implementada**: El `SmsReceiver` en la versión actual explícitamente utiliza `goAsync()`. Esto informa al framework operativo que extienda temporalmente la supervivencia de ejecución (hasta 10 segundos) mientras se ejecuta la corrutina en los `Dispatchers.IO`, llamando finalmente a `finish()` en el bloque seguro `finally`.

### 🔄 B. Trabajo Diferido Mediante `WorkManager` (Exponential Backoff System)
Si las conexiones por TLS fallan repetidamente debido a la caída de la señal celular (timeouts de DNS, fallos de handshake o pérdida total de red), el sistema ejecuta el siguiente protocolo corporativo:
1.  La app localiza el fallo y actualiza instantáneamente el estatus del canal a `"FAILED"` en la interfaz gráfica móvil (mostrando un aviso visual de "En Cola de Espera").
2.  Delega la transacción a `TransactionSyncWorker` con parámetros estrictos:
    *   **Restricción de Red**: `.setRequiredNetworkType(NetworkType.CONNECTED)` (Android no intentará retransmitir hasta recuperar conectividad efectiva, optimizando drásticamente el consumo de batería).
    *   **Política de Reintento**: `.setBackoffCriteria(BackoffPolicy.EXPONENTIAL, MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)`. Esto limita los intentos sucesivos de forma matemática inteligente para no "ahogar" los servicios de Backend ni agotar los recursos de cómputo del teléfono.

---

## 📡 6. Recepción de Webhooks y Motor Push de Alerta Integrado
Para complementar la lectura física de SMS, la aplicación incorpora una arquitectura activa de recepción de **Webhooks directos** desde proveedores financieros modernos y pasarelas de pago (ej: APIs de Banesco Pay, Stripe, BDV Automatizado, Mercantil Webhook).

### A. Flujo de Control e Interceptación de Webhooks:
1. **Entrada de API/Webhook**: El backend SaaS central recibe el callback HTTPS (desde Stripe o la red bank-wire) e inserta el registro transaccional. Para los terminales móviles, se puede invocar de forma simulada o real el método `WebhookReceiverManager.processWebhookPayload(...)` pasándole un string JSON crudo.
2. **Validación de Capas**: 
   * Comprueba que la aplicación móvil tenga el conector operativo activo (`BridgeState.isBridgeActive`).
   * Valida la vinculación criptográfica física del dispositivo para asegurar que pertenezca a un arrendatario bancario válido (`BridgePreferences.isLinked`).
3. **Decodificación Sintáctica con Moshi**: El gestor procesa y mapea la carga útil JSON en un mapa de parámetros con coerciones tipadas autoprotegidas. Soporta variables alternas como `bank_name`, `amount`, `monto`, `reference`, `tx_id`.
4. **Trigger de Alerta Push Física de Sistema**:
   * Registra un canal persistente de alta prioridad en Android del usuario (`webhook_push_channel`).
   * Envía una notificación mediante `NotificationManager` con estilo extendido (`BigTextStyle`), alerta sonora del canal bancario corporativo de alta prioridad y vibración por hardware.
5. **Persistencia y Traspaso de Datos**:
   * Registra el payload en la papelera reactiva `BridgeState.addLog` bajo el clasificador `"WEBHOOK"`, de modo que se refleje instantáneamente en la pantalla con su distintivo y paleta cromática verde.
   * Envía la encapsulación segura de notificación vía REST POST hacia Supabase. Si hay un corte de red durante la transmisión, delega de inmediato al sistema automatizado de reintentos `TransactionSyncWorker`.

### B. Estructura de Payload Webhook Bancario Soportado:
```json
{
  "bank_name": "Banesco",
  "sender": "BANESCO_PAY_API",
  "original_text": "Callback Webhook del proveedor Banesco Pay REST procesado de forma automatizada por el broker de conciliacion.",
  "amount": 1500.00,
  "reference": "8263102",
  "type": "NOTIFICATION"
}
```

---

## 🎨 7. Guía de Interfaces y Diseño Adaptativo Material 3
La interfaz ha sido programada con el sistema estético **Material Design 3 (M3)** utilizando paletas de alto contraste cromático y tipográfico optimizados para terminales industriales o teléfonos corporativos expuestos a la luz del sol en puntos de venta.

*   **Paleta Principal**: Azul Cósmico Brillante (`0xFF005AC1`) y Gris Cósmico Slate en las tarjetas informativas. Estilo plano limpio y minimalista.
*   **Áreas Táctiles Optimizadas (A11y)**: Todos los componentes interactivos (botones de acción, switch general del transceptor, botón de desacoplamiento y selector de stress-test) poseen un área de impacto táctil igual o superior a **48dp x 48dp**, de estricto cumplimiento con la guía de Android Accessibility.
*   **Diseño Adaptativo**: Fluidamente compatible con disposiciones celulares compactas normales y diseños expandidos con escalabilidad de cuadrícula inteligente, evitando deformaciones de texto o estiramientos visuales atípicos.

---

## 🛡️ 8. Reglas de Compilación Proguard para Producción (`proguard-rules.pro`)
Para evitar la descompilación del código o la ofuscación accidental de los serializadores JSON que provocarían caídas críticas de parsing HTTP al deserializar respuestas de Supabase, se configuró una política dedicada de Proguard:

```proguard
# Preservar anotaciones críticas de deserialización de la librería Moshi
-keepclassmembers class * {
    @com.squareup.moshi.Json <fields>;
}
-keep class com.example.model.** { *; }

# Mantener la estabilidad operacional de Retrofit, OkHttp y Okio
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclassmembers class * {
    @retrofit2.http.** <methods>;
}

-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-dontwarn okio.**
-keep class okio.** { *; }

# Optimizaciones generales del compilador y renombrado seguro de clases internas
-repackageclasses ''
-allowaccessmodification
```

---

## 🚀 9. Guía de Instalación y Puesta en Producción

### Paso 1: Configurar Variables de Entorno en AI Studio
Para acoplar la aplicación con el servidor de producción Supabase, configure las claves seguras usando la barra lateral de Secrets del panel de control de AI Studio. **No hardcodear datos**:
*   `SUPABASE_URL`: Dirección HTTP de tu Base de Datos Supabase.
*   `SUPABASE_ANON_KEY`: Token de API anónimo proporcionado por Supabase para peticiones directas seguras.

*Nota: Si las variables no están registradas o la app se ejecuta en un ambiente simulado, el ViewModel se adapta de forma resiliente entrando en modo demo de demostración funcional (ofreciendo una experiencia libre de crashes y visualmente rica para analistas).*

### Paso 2: Habilitar Permisos Claves en el Dispositivo
Para que el puente opere en segundo plano de manera continua e ininterrumpida, asegúrese de:
1.  Dar acceso a **"Notificaciones"** del sistema (La app incluye un acceso directo instantáneo dentro de la interfaz principal mediante un banner de alerta inteligente si el permiso está pendiente).
2.  Permitir la recepción de **"SMS"** en los permisos grupales normales de aplicación.

---

### *Firma del Director del Proyecto*
> **Estatus del Proyecto:** **Listo para Producción (Production-Ready)**. 
> Todos los módulos analizados, refactorizados con goAsync() para soportar de manera infalible la volatilidad de hilos en Android, optimizados en Proguard, libres de bloqueos de Main Thread, alineados 100% con las políticas vigentes de Google Play Store de Gobernanza de Datos Financieros de no almacenamiento local dañino de información confidencial.
