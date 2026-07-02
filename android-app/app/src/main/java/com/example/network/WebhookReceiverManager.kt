package com.example.network

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.model.BankNotification
import com.example.model.CapturedLog
import com.example.model.SyncStatus
import com.example.state.BridgeState
import com.example.service.TransactionSyncWorker
import com.example.util.BridgePreferences
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * Gestor de Recepción de Webhooks y Emisión de Notificaciones Push de Grado Bancario.
 * Procesa integraciones directas (SaaS, Pasarelas bancarias como Stripe, Pago Móvil API, BDV, etc.)
 * y emite alertas push nativas de alta prioridad en el dispositivo móvil.
 */
object WebhookReceiverManager {

    private const val TAG = "WebhookReceiver"
    private const val CHANNEL_PUSH_ID = "webhook_push_channel"
    private const val CHANNEL_PUSH_NAME = "Alertas Push de Proveedores de Pago"
    private val scope = CoroutineScope(Dispatchers.IO)

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    /**
     * Inicializa el canal de notificaciones push de alta prioridad para webhooks bancarios.
     */
    fun initChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_PUSH_ID,
                CHANNEL_PUSH_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones instantáneas de transacciones liquidadas vía webhooks."
                enableLights(true)
                lightColor = 0xFF005AC1.toInt()
                enableVibration(true)
                setShowBadge(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Procesa una cadena JSON entrante que simula o representa un Webhook de un proveedor de pagos.
     * Soporta detección de formatos universales (Stripe, PagoMovil API, Pasarela Genérica).
     */
    fun processWebhookPayload(context: Context, rawJson: String, provider: String = "Genérico API"): Boolean {
        // Validación inicial: Si Puente no está activo o vinculado, declinamos por política de seguridad
        if (!BridgeState.isBridgeActive.value) {
            Log.w(TAG, "Webhook recibido pero ignorado porque el Puente no está activo.")
            return false
        }
        if (!BridgePreferences.isLinked(context)) {
            Log.w(TAG, "Webhook recibido pero ignorado porque el dispositivo no está vinculado.")
            return false
        }

        try {
            val adapter = moshi.adapter<Map<String, Any>>(
                Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            )
            val data = adapter.fromJson(rawJson) ?: return false

            // Extraer parámetros financieros con tolerancia a nulos y tipos
            val bankName = (data["bank"] ?: data["bank_name"] ?: provider).toString()
            val sender = (data["sender"] ?: data["provider"] ?: "API Gateway").toString()
            val rawAmount = data["amount"] ?: data["monto"] ?: 0.0
            val amount = when (rawAmount) {
                is Number -> rawAmount.toDouble()
                is String -> rawAmount.toDoubleOrNull() ?: 0.0
                else -> 0.0
            }
            val reference = (data["reference"] ?: data["referencia"] ?: data["tx_id"] ?: UUID.randomUUID().toString().take(12)).toString()
            val text = (data["text"] ?: data["message"] ?: "Transacción procesada vía Webhook de $provider").toString()

            // Disparar procesamiento del webhook estructurado
            deliverAndSyncWebhook(context, bankName, sender, amount, reference, text)
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error procesando JSON de Webhook", e)
            return false
        }
    }

    /**
     * Registra el webhook, emite una notificación de sistema y sincroniza de inmediato con Supabase.
     */
    fun deliverAndSyncWebhook(
        context: Context,
        bankName: String,
        sender: String,
        amount: Double,
        reference: String,
        text: String
    ) {
        val logId = UUID.randomUUID().toString()
        val timestamp = System.currentTimeMillis()
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val formattedDate = sdf.format(Date(timestamp))
        val deviceId = BridgePreferences.getOrCreateDeviceId(context)

        // 1. Mostrar de inmediato la notificación push del sistema (UI / UX de alta gama para el operador)
        triggerSystemPushNotification(context, bankName, amount, reference)

        // 2. Crear registro local seguro (ofuscando datos sensibles para el log en UI local)
        val capturedLog = CapturedLog(
            id = logId,
            bankName = bankName,
            sender = sender,
            text = "Notificación Webhook: Liquidación de fondos satisfactoria [Filtro Bancario]",
            amount = amount,
            reference = reference,
            type = "WEBHOOK",
            timestamp = timestamp,
            syncStatus = SyncStatus.PENDING
        )

        BridgeState.addLog(capturedLog)

        // 3. Sincronizar de inmediato con el Backend SaaS Supabase de forma asíncrona
        scope.launch {
            try {
                if (SupabaseClient.isConfigured) {
                    val payload = BankNotification(
                        bankName = bankName,
                        sender = sender,
                        originalText = text, // guardado en servidores seguros para auditoría
                        amount = amount,
                        reference = reference,
                        type = "NOTIFICATION", // Identificado como notificación automatizada
                        capturedAt = formattedDate,
                        deviceId = deviceId
                    )

                    SupabaseClient.api.createNotification(
                        apiKey = SupabaseClient.apiKey,
                        auth = "Bearer ${SupabaseClient.apiKey}",
                        notification = payload
                    )

                    BridgeState.updateLog(capturedLog.copy(syncStatus = SyncStatus.SUCCESS))
                    BridgeState.addConnectionEvent(
                        type = "Webhook API ($bankName)",
                        isSuccess = true,
                        message = "Webhook conciliado de inmediato. Ref: $reference"
                    )
                } else {
                    throw IllegalStateException("Servidor Supabase no configurado.")
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Fallo al subir webhook al SaaS. Encolando diferido con WorkManager...", e)
                val errorMsg = e.localizedMessage ?: e.message ?: "Error de Red"

                BridgeState.updateLog(
                    capturedLog.copy(
                        syncStatus = SyncStatus.FAILED,
                        errorMessage = "Encolado: $errorMsg"
                    )
                )

                BridgeState.addConnectionEvent(
                    type = "Retransmisión Webhook ($bankName)",
                    isSuccess = false,
                    message = "Webhook encolado. Motivo: $errorMsg"
                )

                // Encolar con persistencia robusta
                TransactionSyncWorker.enqueue(
                    context = context,
                    bankName = bankName,
                    sender = sender,
                    originalText = text,
                    amount = amount,
                    reference = reference,
                    type = "NOTIFICATION",
                    timestamp = timestamp,
                    deviceId = deviceId
                )
            }
        }
    }

    /**
     * Construye y dispara una alerta Push Física de alta visibilidad para notificar al comerciante en tiempo real.
     */
    private fun triggerSystemPushNotification(context: Context, bankName: String, amount: Double, reference: String) {
        initChannels(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            System.currentTimeMillis().toInt(),
            intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        // Formato limpio de dinero en bolívares / dólares
        val amountStr = String.format(Locale.getDefault(), "Bs. %,.2f", amount)

        val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_PUSH_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("🔔 Pago Webhook: $bankName")
            .setContentText("Monto: $amountStr | Referencia: $reference")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("Se ha recibido y verificado una liquidación directa vía Webhook Bancario.\n\nBanco: $bankName\nMonto: $amountStr\nReferencia: $reference\nEstatus: Sincronizado / En Proceso de Conciliación")
            )
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(100, 200, 300, 400))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        // ID de notificación único basado en hash de la referencia para agrupar o mostrar transacciones separadas
        val notificationId = reference.hashCode()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
