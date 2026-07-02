package com.example.state

import android.content.Context
import com.example.model.BankPattern
import com.example.model.CapturedLog
import com.example.model.ConnectionEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object BridgeState {

    private val _isServiceRunning = MutableStateFlow(false)
    val isServiceRunning: StateFlow<Boolean> = _isServiceRunning.asStateFlow()

    private val _isBridgeActive = MutableStateFlow(false)
    val isBridgeActive: StateFlow<Boolean> = _isBridgeActive.asStateFlow()

    private val _patterns = MutableStateFlow<List<BankPattern>>(emptyList())
    val patterns: StateFlow<List<BankPattern>> = _patterns.asStateFlow()

    private val _logs = MutableStateFlow<List<CapturedLog>>(emptyList())
    val logs: StateFlow<List<CapturedLog>> = _logs.asStateFlow()

    private val _isSyncingPatterns = MutableStateFlow(false)
    val isSyncingPatterns: StateFlow<Boolean> = _isSyncingPatterns.asStateFlow()

    private val _syncError = MutableStateFlow<String?>(null)
    val syncError: StateFlow<String?> = _syncError.asStateFlow()

    private val _connectionEvents = MutableStateFlow<List<ConnectionEvent>>(emptyList())
    val connectionEvents: StateFlow<List<ConnectionEvent>> = _connectionEvents.asStateFlow()

    private val _lastSuccessfulResponseTime = MutableStateFlow<Long?>(null)
    val lastSuccessfulResponseTime: StateFlow<Long?> = _lastSuccessfulResponseTime.asStateFlow()

    fun updateServiceRunning(running: Boolean) {
        _isServiceRunning.value = running
    }

    fun updateBridgeActive(active: Boolean, context: Context? = null) {
        _isBridgeActive.value = active
        context?.let {
            val prefs = it.getSharedPreferences("bridge_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("bridge_active", active).apply()
        }
    }

    fun initBridgeActiveFromPrefs(context: Context) {
        val prefs = context.getSharedPreferences("bridge_prefs", Context.MODE_PRIVATE)
        _isBridgeActive.value = prefs.getBoolean("bridge_active", false)
    }

    fun setPatterns(list: List<BankPattern>) {
        _patterns.value = list
    }

    fun setSyncingPatterns(syncing: Boolean) {
        _isSyncingPatterns.value = syncing
    }

    fun setSyncError(error: String?) {
        _syncError.value = error
    }

    fun addLog(log: CapturedLog) {
        val current = _logs.value.toMutableList()
        current.add(0, log)
        if (current.size > 50) {
            current.removeAt(current.lastIndex)
        }
        _logs.value = current
    }

    fun updateLog(updatedLog: CapturedLog) {
        val current = _logs.value.map { if (it.id == updatedLog.id) updatedLog else it }
        _logs.value = current
    }

    fun clearLogs() {
        _logs.value = emptyList()
    }

    fun addConnectionEvent(type: String, isSuccess: Boolean, message: String) {
        val timestamp = System.currentTimeMillis()
        if (isSuccess) {
            _lastSuccessfulResponseTime.value = timestamp
        }
        val newEvent = ConnectionEvent(
            id = java.util.UUID.randomUUID().toString(),
            type = type,
            isSuccess = isSuccess,
            message = message,
            timestamp = timestamp
        )
        val current = _connectionEvents.value.toMutableList()
        current.add(0, newEvent)
        if (current.size > 5) {
            current.removeAt(current.lastIndex)
        }
        _connectionEvents.value = current
    }

    fun clearConnectionEvents() {
        _connectionEvents.value = emptyList()
    }
}
