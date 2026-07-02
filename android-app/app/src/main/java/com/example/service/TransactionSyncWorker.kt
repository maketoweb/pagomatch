package com.example.service

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.example.model.BankNotification
import com.example.network.SupabaseClient
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TransactionSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        private const val TAG = "TransactionSyncWorker"
        const val KEY_BANK_NAME = "bank_name"
        const val KEY_SENDER = "sender"
        const val KEY_ORIGINAL_TEXT = "original_text"
        const val KEY_AMOUNT = "amount"
        const val KEY_REFERENCE = "reference"
        const val KEY_TYPE = "type"
        const val KEY_TIMESTAMP = "timestamp"
        const val KEY_DEVICE_ID = "device_id"

        fun createInputData(
            bankName: String,
            sender: String,
            originalText: String,
            amount: Double?,
            reference: String?,
            type: String,
            timestamp: Long,
            deviceId: String
        ) = workDataOf(
            KEY_BANK_NAME to bankName,
            KEY_SENDER to sender,
            KEY_ORIGINAL_TEXT to originalText,
            KEY_AMOUNT to (amount ?: -1.0),
            KEY_REFERENCE to (reference ?: ""),
            KEY_TYPE to type,
            KEY_TIMESTAMP to timestamp,
            KEY_DEVICE_ID to deviceId
        )

        fun enqueue(
            context: Context,
            bankName: String,
            sender: String,
            originalText: String,
            amount: Double?,
            reference: String?,
            type: String,
            timestamp: Long,
            deviceId: String
        ) {
            val constraints = androidx.work.Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build()

            val workRequest = androidx.work.OneTimeWorkRequestBuilder<TransactionSyncWorker>()
                .setConstraints(constraints)
                .setInputData(createInputData(bankName, sender, originalText, amount, reference, type, timestamp, deviceId))
                .setBackoffCriteria(
                    androidx.work.BackoffPolicy.EXPONENTIAL,
                    androidx.work.WorkRequest.MIN_BACKOFF_MILLIS,
                    java.util.concurrent.TimeUnit.MILLISECONDS
                )
                .build()

            androidx.work.WorkManager.getInstance(context).enqueue(workRequest)
            Log.d(TAG, "Enqueued deferred transaction work for reference $reference with Exponential Backoff.")
        }
    }

    override suspend fun doWork(): Result {
        val bankName = inputData.getString(KEY_BANK_NAME) ?: return Result.failure()
        val sender = inputData.getString(KEY_SENDER) ?: return Result.failure()
        val originalText = inputData.getString(KEY_ORIGINAL_TEXT) ?: return Result.failure()
        val rawAmount = inputData.getDouble(KEY_AMOUNT, -1.0)
        val amount = if (rawAmount == -1.0) null else rawAmount
        val rawRef = inputData.getString(KEY_REFERENCE)
        val reference = if (rawRef.isNullOrEmpty()) null else rawRef
        val type = inputData.getString(KEY_TYPE) ?: "NOTIFICATION"
        val timestamp = inputData.getLong(KEY_TIMESTAMP, System.currentTimeMillis())
        val deviceId = inputData.getString(KEY_DEVICE_ID) ?: ""

        val formattedDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date(timestamp))

        val payload = BankNotification(
            bankName = bankName,
            sender = sender,
            originalText = originalText,
            amount = amount,
            reference = reference,
            type = type,
            capturedAt = formattedDate,
            deviceId = deviceId
        )

        Log.i(TAG, "Sync Worker starting upload for transaction reference $reference (Attempt ${runAttemptCount + 1})")

        if (!SupabaseClient.isConfigured) {
            Log.e(TAG, "Network base config not available. Retrying...")
            return Result.retry()
        }

        return try {
            SupabaseClient.api.createNotification(
                apiKey = SupabaseClient.apiKey,
                auth = "Bearer ${SupabaseClient.apiKey}",
                notification = payload
            )
            Log.i(TAG, "Transaction sync success! Reference: $reference")
            com.example.state.BridgeState.addConnectionEvent(
                type = "Reintento de Sincronización (${bankName})",
                isSuccess = true,
                message = "Envío exitoso de transacción respaldada. Ref: ${reference ?: "N/D"}"
            )
            Result.success()
        } catch (e: Throwable) {
            Log.e(TAG, "Transaction sync attempt failed.", e)
            com.example.state.BridgeState.addConnectionEvent(
                type = "Reintento Fallido",
                isSuccess = false,
                message = "Reintento falló (Intento ${runAttemptCount + 1}): ${e.message}"
            )
            // Triggers WorkManager exponential backoff retry
            if (runAttemptCount < 10) {
                Result.retry()
            } else {
                Log.e(TAG, "Max retries reached for transaction reference $reference. Marking as failed.")
                Result.failure()
            }
        }
    }
}
