package com.example.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsMessage
import android.util.Log
import com.example.model.BankNotification
import com.example.model.CapturedLog
import com.example.model.SyncStatus
import com.example.network.SupabaseClient
import com.example.service.TransactionSyncWorker
import com.example.state.BridgeState
import com.example.util.BridgePreferences
import com.example.util.RegExParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
    }

    private val receiverScope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        // 1. Guard check: only process if the bridge dynamic switch is ON
        if (!BridgeState.isBridgeActive.value) {
            return
        }

        // 2. Security validation: Ensure device is linked
        if (!BridgePreferences.isLinked(context)) {
            Log.w(TAG, "SMS received but ignored because device is not linked.")
            return
        }

        if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle = intent.extras ?: return
            try {
                val pdus = bundle.get("pdus") as? Array<*> ?: return
                val format = bundle.getString("format")

                for (pdu in pdus) {
                    val message = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        SmsMessage.createFromPdu(pdu as ByteArray, format)
                    } else {
                        @Suppress("DEPRECATION")
                        SmsMessage.createFromPdu(pdu as ByteArray)
                    }

                    val sender = message.originatingAddress ?: ""
                    val text = message.messageBody ?: ""

                    if (text.trim().isEmpty()) continue

                    processSms(context, sender, text)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing incoming SMS payload", e)
            }
        }
    }

    private fun processSms(context: Context, sender: String, text: String) {
        // 3. Extract transaction details (amount, reference, bank) using dynamic RegExParser
        val matchResult = RegExParser.parse(text, "SMS")

        if (matchResult != null) {
            val logId = UUID.randomUUID().toString()
            val timestamp = System.currentTimeMillis()
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            val formattedDate = sdf.format(Date(timestamp))
            val deviceId = BridgePreferences.getOrCreateDeviceId(context)

            // Construct professional log without sensitive identities
            val capturedLog = CapturedLog(
                id = logId,
                bankName = matchResult.bankName,
                sender = sender,
                text = "SMS bancario detectado exitosamente [Filtros Satisfechos]", // protects client names/IDs locally
                amount = matchResult.amount,
                reference = matchResult.reference,
                type = "SMS",
                timestamp = timestamp,
                syncStatus = SyncStatus.PENDING
            )

            // Add to reactive UI logs
            BridgeState.addLog(capturedLog)

            val pendingResult = goAsync()

            // 4. Send payload to Supabase SaaS backend
            receiverScope.launch {
                try {
                    if (SupabaseClient.isConfigured) {
                        val notificationPayload = BankNotification(
                            bankName = matchResult.bankName,
                            sender = sender,
                            originalText = text, // sent to SaaS center for validation; not persisted locally
                            amount = matchResult.amount,
                            reference = matchResult.reference,
                            type = "SMS",
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
                            type = "Traspaso SMS (${matchResult.bankName})",
                            isSuccess = true,
                            message = "Sincronizado con el servidor de inmediato. Ref: ${matchResult.reference ?: "N/D"}"
                        )
                        Log.i(TAG, "Successfully transferred bank SMS to cloud database! Ref: ${matchResult.reference}")
                    } else {
                        throw IllegalStateException("Servidor sin configurar en secrets.")
                    }
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed to upload SMS payload. Scheduling WorkManager retry queue...", e)
                    val errorMsg = e.localizedMessage ?: e.message ?: "Error de Conexión"

                    BridgeState.updateLog(
                        capturedLog.copy(
                            syncStatus = SyncStatus.FAILED,
                            errorMessage = "En cola: $errorMsg"
                        )
                    )
                    BridgeState.addConnectionEvent(
                        type = "Envío SMS Diferido (${matchResult.bankName})",
                        isSuccess = false,
                        message = "Encolado automáticamente. Motivo: $errorMsg"
                    )

                    // 5. Enqueue delayed sync task using exponential backoff WorkManager
                    TransactionSyncWorker.enqueue(
                        context = context,
                        bankName = matchResult.bankName,
                        sender = sender,
                        originalText = text,
                        amount = matchResult.amount,
                        reference = matchResult.reference,
                        type = "SMS",
                        timestamp = timestamp,
                        deviceId = deviceId
                    )
                } finally {
                    try {
                        pendingResult.finish()
                    } catch (t: Throwable) {
                        Log.e(TAG, "Error finishing goAsync result context", t)
                    }
                }
            }
        }
    }
}
