package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.model.CapturedLog
import com.example.model.SyncStatus
import com.example.state.BridgeState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        BridgeState.clearLogs()
        BridgeState.updateBridgeActive(false, context)
    }

    @Test
    fun readStringFromContext_isCorrect() {
        val appName = context.getString(R.string.app_name)
        assertEquals("Puente", appName)
    }

    @Test
    fun bridgeState_activation_isCorrect() {
        // Initially inactive
        assertEquals(false, BridgeState.isBridgeActive.value)

        // Toggle active
        BridgeState.updateBridgeActive(true, context)
        assertEquals(true, BridgeState.isBridgeActive.value)

        // Toggle inactive
        BridgeState.updateBridgeActive(false, context)
        assertEquals(false, BridgeState.isBridgeActive.value)
    }

    @Test
    fun bridgeState_logQueue_worksAsExpected() {
        // Assert log queue is initialized representing 0 elements
        assertEquals(0, BridgeState.logs.value.size)

        // Capture a fake log
        val textLog = CapturedLog(
            id = "test-log-1",
            bankName = "BBVA",
            sender = "BBVA",
            text = "Retiro realizado por $1,000",
            amount = 1000.0,
            reference = "9921",
            type = "SMS",
            timestamp = System.currentTimeMillis(),
            syncStatus = SyncStatus.SUCCESS
        )

        BridgeState.addLog(textLog)

        // Queue should hold exactly 1 log element after append
        assertEquals(1, BridgeState.logs.value.size)
        assertEquals("BBVA", BridgeState.logs.value[0].bankName)
        assertEquals(1000.0, BridgeState.logs.value[0].amount ?: 0.0, 0.001)

        // Clear log history
        BridgeState.clearLogs()
        assertEquals(0, BridgeState.logs.value.size)
    }
}
