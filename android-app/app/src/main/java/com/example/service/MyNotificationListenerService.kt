package com.example.service

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.example.model.BankNotification
import com.example.model.CapturedLog
import com.example.model.SyncStatus
import com.example.network.SupabaseClient
import com.example.state.BridgeState
import com.example.util.BridgePreferences
import com.example.util.RegExParser
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class MyNotificationListenerService : NotificationListenerService() {

    private val job = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + job)

    companion object {
        private const val TAG = "NotificationListener"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        // 1. Guard check: Only active if dynamic switch is enabled in UI
        if (!BridgeState.isBridgeActive.value) {
            return
        }

        // 2. Security guard: Ensure device is Linked before reading/processing
        if (!BridgePreferences.isLinked(this)) {
            Log.w(TAG, "Notification received but discarded because device is not linked yet.")
            return
        }

        val packageName = sbn.packageName ?: ""
        val extras: Bundle? = sbn.notification?.extras
        val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        // Skip blank notifications
        if (text.trim().isEmpty()) return

        // 3. Extract transaction details (amount, reference, bank) using dynamic RegExParser
        val matchResult = RegExParser.parse(text, "NOTIFICATION") ?: RegExParser.parse("$title: $text", "NOTIFICATION")

        if (matchResult != null) {
            val logId = UUID.randomUUID().toString()
            val timestamp = System.currentTimeMillis()
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            val formattedDate = sdf.format(Date(timestamp))
            val deviceId = BridgePreferences.getOrCreateDeviceId(this)

            // Create professional UI Log entry (omitting client real names/IDs)
            val capturedLog = CapturedLog(
                id = logId,
                bankName = matchResult.bankName,
                sender = if (packageName.isNotEmpty()) "$packageName ($title)" else title,
                text = "Transacción detectada exitosamente [Filtros Aplicados Satisfechos]", // avoids local caching of sensitive info text
                amount = matchResult.amount,
                reference = matchResult.reference,
                type = "Notification",
                timestamp = timestamp,
                syncStatus = SyncStatus.PENDING
            )

            BridgeState.addLog(capturedLog)

            // 4. Submit to SaaS Backend asynchronously
            serviceScope.launch {
                try {
                    if (SupabaseClient.isConfigured) {
                        val notificationPayload = BankNotification(
                            bankName = matchResult.bankName,
                            sender = packageName,
                            originalText = text, // Send original to backend to fulfill: "Solo enviar al servidor"
                            amount = matchResult.amount,
                            reference = matchResult.reference,
                            type = "NOTIFICATION",
                            capturedAt = formattedDate,
                            deviceId = deviceId
                        )

                        SupabaseClient.api.createNotification(
                            apiKey = SupabaseClient.apiKey,
                            auth = "Bearer ${SupabaseClient.apiKey}",
                            notification = notificationPayload
                        )

                        BridgeState.updateLog(capturedLog.copy(syncStatus = SyncStatus.SUCCESS))
                        BridgeState.addConnectionEvent(
                            type = "Traspaso de Notificación (${matchResult.bankName})",
                            isSuccess = true,
                            message = "Sincronizado de inmediato con el servidor SaaS. Ref: ${matchResult.reference ?: "N/D"}"
                        )
                        Log.i(TAG, "Successfully transferred bank notification for reference: ${matchResult.reference} to database!")
                    } else {
                        throw IllegalStateException("Servidor sin configurar en secrets.")
                    }
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed to upload notification payload, queueing with WorkManager...", e)
                    val errorMsg = e.localizedMessage ?: e.message ?: "Error de Red o Servidor"
                    
                    // Mark local status as FAILED in real-time UI
                    BridgeState.updateLog(
                        capturedLog.copy(
                            syncStatus = SyncStatus.FAILED,
                            errorMessage = "En cola: $errorMsg"
                        )
                    )
                    BridgeState.addConnectionEvent(
                        type = "Envío Diferido (${matchResult.bankName})",
                        isSuccess = false,
                        message = "Encolado automáticamente. Motivo: $errorMsg"
                    )

                    // 5. If failed indeed, perform exponential backoff retry using WorkManager
                    TransactionSyncWorker.enqueue(
                        context = this@MyNotificationListenerService,
                        bankName = matchResult.bankName,
                        sender = packageName,
                        originalText = text,
                        amount = matchResult.amount,
                        reference = matchResult.reference,
                        type = "NOTIFICATION",
                        timestamp = timestamp,
                        deviceId = deviceId
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
    }
}
