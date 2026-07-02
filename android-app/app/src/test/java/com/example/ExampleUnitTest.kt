package com.example

import com.example.model.BankPattern
import com.example.util.BankParser
import org.junit.Assert.*
import org.junit.Test

class ExampleUnitTest {

    @Test
    fun testAmountCleaning() {
        assertEquals(1250.50, BankParser.cleanAmount("$1,250.50") ?: 0.0, 0.001)
        assertEquals(500.00, BankParser.cleanAmount("MXN $500.00") ?: 0.0, 0.001)
        assertEquals(12500.75, BankParser.cleanAmount("12.500,75") ?: 0.0, 0.001)
        assertEquals(350.00, BankParser.cleanAmount("350") ?: 0.0, 0.001)
        assertEquals(140.25, BankParser.cleanAmount("$  140.25 pesos") ?: 0.0, 0.001)
    }

    @Test
    fun testBBVAMessageParsing() {
        val patterns = listOf(
            BankPattern(
                id = "bbva-test",
                bankName = "BBVA",
                sender = "BBVA",
                pattern = ".*transferencia por \\$?([\\d,.]+).*ref\\.?:?\\s*(\\w+).*",
                amountGroup = 1,
                referenceGroup = 2
            )
        )

        val text = "BBVA Alertas: Se ha recibido una transferencia por $1,450.00 pesos. Ref: REF92831. Gracias."
        val result = BankParser.parseMessage("BBVA", text, patterns)

        assertNotNull(result)
        assertEquals("BBVA", result?.bankName)
        assertEquals(1450.00, result?.amount ?: 0.0, 0.001)
        assertEquals("REF92831", result?.reference)
    }

    @Test
    fun testSantanderMessageParsing() {
        val patterns = listOf(
            BankPattern(
                id = "santander-test",
                bankName = "Santander",
                sender = "Santander",
                pattern = ".*retiro de \\$?([\\d,.]+).*ref\\s*(\\w+).*",
                amountGroup = 1,
                referenceGroup = 2
            )
        )

        val text = "Santander: Retiro de $500.00 realizado en Cajero Automático. Ref SNT38217."
        val result = BankParser.parseMessage("Santander Info", text, patterns)

        assertNotNull(result)
        assertEquals("Santander", result?.bankName)
        assertEquals(500.00, result?.amount ?: 0.0, 0.001)
        assertEquals("SNT38217", result?.reference)
    }

    @Test
    fun testNonMatchingMessage() {
        val patterns = listOf(
            BankPattern(
                id = "chase-test",
                bankName = "Chase",
                sender = "Chase",
                pattern = ".*spent \\$?([\\d,.]+).*ref\\s*(\\w+).*",
                amountGroup = 1,
                referenceGroup = 2
            )
        )

        val text = "Estimado cliente, su saldo actual de cuenta es de $10,400.25."
        val result = BankParser.parseMessage("Chase", text, patterns)
        assertNull(result)
    }
}
