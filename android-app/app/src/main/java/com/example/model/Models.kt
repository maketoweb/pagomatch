package com.example.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class BankPattern(
    @Json(name = "id") val id: String? = null,
    @Json(name = "bank_name") val bankName: String,
    @Json(name = "sender") val sender: String,
    @Json(name = "pattern") val pattern: String,
    @Json(name = "amount_group") val amountGroup: Int = 1,
    @Json(name = "reference_group") val referenceGroup: Int = 2
)

@JsonClass(generateAdapter = true)
data class BankNotification(
    @Json(name = "id") val id: String? = null,
    @Json(name = "bank_name") val bankName: String,
    @Json(name = "sender") val sender: String,
    @Json(name = "original_text") val originalText: String,
    @Json(name = "amount") val amount: Double?,
    @Json(name = "reference") val reference: String?,
    @Json(name = "type") val type: String, // "SMS" or "NOTIFICATION"
    @Json(name = "captured_at") val capturedAt: String,
    @Json(name = "device_id") val deviceId: String? = null
)

@JsonClass(generateAdapter = true)
data class LinkDeviceRequest(
    @Json(name = "code") val code: String,
    @Json(name = "device_id") val deviceId: String
)

@JsonClass(generateAdapter = true)
data class LinkDeviceResponse(
    @Json(name = "tenant_id") val tenantId: String?,
    @Json(name = "status") val status: String?
)

data class CapturedLog(
    val id: String,
    val bankName: String,
    val sender: String,
    val text: String,
    val amount: Double?,
    val reference: String?,
    val type: String, // "SMS" or "Notification"
    val timestamp: Long,
    val syncStatus: SyncStatus,
    val errorMessage: String? = null
)

enum class SyncStatus {
    PENDING, SUCCESS, FAILED
}

data class ConnectionEvent(
    val id: String,
    val type: String, // e.g., "Sincronización de Filtros", "Ping de Validación", "Envío de Notificación"
    val isSuccess: Boolean,
    val message: String,
    val timestamp: Long
)

