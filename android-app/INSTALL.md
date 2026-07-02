# 📥 Manual de Instalación y Configuración del Transceptor Puente (SaaS)

Este manual técnico describe el proceso de compilación, despliegue, otorgamiento de permisos y vinculación inicial para poner en operación el transceptor de conciliación bancaria **Puente** en entornos empresariales de producción.

---

## 📋 1. Requisitos Previos de Sistema

*   **Hardware Soportado**: Dispositivo físico Android (smartphone o tablet con ranura SIM activa) con Android 8.0 (Oreo, API Level 26) o superior.
*   **Conectividad**: Acceso permanente a Internet (WiFi o plan de datos móviles de operadoras nacionales como Movistar, Digitel o Movilnet).
*   **Canales de Entrada**: Línea telefónica habilitada y configurada para recibir notificaciones de transacciones SMS de los bancos correspondientes (eg. Banesco, Mercantil, BDV, Provincial).
*   **Credenciales del Backend**:
    *   Una instancia activa en **Supabase** (u otro SaaS de base de datos relacional).
    *   La URL del proyecto de base de datos (`SUPABASE_URL`).
    *   La clave anónima del proyecto (`SUPABASE_ANON_KEY`).

---

## 🛠️ 2. Configuración de Variables de Entorno (Secrets)

La aplicación utiliza la inyección segura de credenciales mediante el panel de **Secrets de AI Studio** para evitar el almacenamiento de claves en texto plano en el repositorio de código.

1.  En la interfaz del editor de AI Studio, diríjase a la barra lateral de **Secrets** (o configure un archivo `.env` local si trabaja localmente).
2.  Agregue las siguientes llaves obligatorias:
    *   `SUPABASE_URL` = `https://<tu-instancia-id>.supabase.co`
    *   `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...`
3.  *Nota de Resiliencia*: En caso de omitir estas variables, el sistema se inicializa en un modo híbrido de demostración simulada segura ("Demo Mode") para evitar fallas o interrupciones de carga.

---

## 🚀 3. Compilación e Instalación del Aplicativo (APK)

### Compilación desde AI Studio
1.  Para verificar la sanidad del software, ejecute el comando de compilación en el servidor secundario.
2.  Una vez finalizada la tarea exitosamente, puede exportar el proyecto completo como un archivo ZIP o descargar el instalador ejecutable `.apk` directamente desde el menú de opciones superior.

### Instalación Manual en Android
1.  Transfiera el archivo `.apk` compilado al dispositivo mediante un cable USB, correo o almacenamiento en la nube.
2.  Antes de abrir el APK, asegúrese de activar la opción **"Instalar aplicaciones desconocidas"** en los ajustes de seguridad del navegador o explorador de archivos utilizado.
3.  Abra el instalador en el dispositivo móvil y pulse **Instalar**.

---

## 🔒 4. Procedimiento de Permisos del Sistema (Crítico)

Debido a las estrictas políticas de Google Play en materia de gobernanza de información financiera personal, los servicios de automatización de fondos requieren una activación voluntaria y explícita de permisos:

### Paso A: Permiso de Recepción de Mensajes de Texto (SMS)
1.  Al abrir por primera vez la aplicación, el sistema móvil presentará una ventana interactiva solicitando permiso de acceso al hardware SMS.
2.  Seleccione **"Permitir siempre"**. Éste es el motor clave para la interceptación de flujos de pago móvil.

### Paso B: Permiso de Concentración de Notificaciones Push (Listener)
Para procesar transacciones recibidas a través de las notificaciones flotantes de las aplicaciones bancarias nativas (Push Notifications) de forma automática:
1.  Active el interruptor general **"Puente de Escucha"** en el panel de control.
2.  Si el permiso del sistema está pendiente, se presentará instantáneamente un banner naranja de advertencia titulado **"Atención requerida"**.
3.  Haga clic en el botón **"Dar Acceso en Ajustes"**.
4.  Android lo redirigirá a la ventana del sistema "Acceso a notificaciones". Localice la aplicación **Puente** en la lista y active el interruptor.
5.  Acepte la advertencia de seguridad para concluir la suscripción del canal de escucha.

---

## 🔗 5. Protocolo de Vinculación y Handshake del Transceptor

Un transceptor móvil no enlazado ignorará y descartará de la zona volátil de la memoria cualquier SMS o notificación bancaria recibida para proteger la información. El proceso detallado de vinculación física es el siguiente:

```
+--------------------------------------------------------------------+
| 1. Generación de Firma Única (UUID)                                |
|    La aplicación auto-genera un identificador de hardware único   |
|    en el primer arranque (ej: 4bf6d07d-53e3-4b67-ab66-3be3d4891a2) |
+--------------------------------------------------------------------+
                                 │
                                 ▼
+--------------------------------------------------------------------+
| 2. Obtención del Código de Handshake                               |
|    El administrador ingresa al Portal SaaS central (Supabase) y    |
|    genera un código PIN de emparejamiento aleatorio de 6 dígitos  |
|    (con caducidad asignada por seguridad, ej: 10 minutos).          |
+--------------------------------------------------------------------+
                                 │
                                 ▼
+--------------------------------------------------------------------+
| 3. Registro en el Panel de la App Móvil                            |
|    El terminal de Puente despliega la "Pantalla de Handshake".     |
|    Se digitan los 6 números del PIN y se pulsa "Vincular Ahora".   |
+--------------------------------------------------------------------+
                                 │
                                 ▼
+--------------------------------------------------------------------+
| 4. Endpoint Seguro RPC                                              |
|    La app realiza una llamada REST POST HTTPS directa enviando:    |
|    - El ID de dispositivo (UUID)                                   |
|    - El PIN temporal introducido                                   |
+--------------------------------------------------------------------+
                                 │
                                 ▼
+--------------------------------------------------------------------+
| 5. Vinculación y Acoplamiento SaaS Directo                        |
|    - El servidor valida el PIN e identifica la cuenta (Tenant).     |
|    - Devuelve una firma de confirmación y el Tenant ID asociado.    |
|    - El dispositivo guarda el Tenant ID de forma local y persistente|
|      y entra en el estado acoplado permanente "isLinked = true".  |
+--------------------------------------------------------------------+
```

Una vez establecido el enlace, el terminal cargará instantáneamente el panel administrativo principal y comenzará a reportar toda la telemetría en tiempo real de forma exclusiva a las base de datos de dicho arrendatario financiero.

---

## ⚡ 6. Demostración y Prueba de Carga

Para verificar que el recolector de basura de Android, el motor sintáctico y el motor de hilos estén operando de forma balanceada bajo condiciones extremas:
1.  En la interfaz principal de la aplicación, diríjase a la sección **"Prueba de Carga (10,000 Tx)"**.
2.  Haga clic en el botón **"Lanzar Prueba de Estrés"**.
3.  El motor activará una corrutina concurrente en segundo plano para procesar ráfagas de 10,000 textos bancarios continuos utilizando la biblioteca reactiva.
4.  Al concluir de forma instantánea, el panel mostrará un recuadro verde con la telemetría e indicadores de rendimiento de asignación de memoria. Compruebe que la interfaz no se haya congelado durante la prueba.
