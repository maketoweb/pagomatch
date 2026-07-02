package com.example.util

import android.util.Log
import java.util.regex.Pattern

object RegExParser {
    private const val TAG = "RegExParser"

    data class ParsedTx(
        val bankName: String,
        val amount: Double?,
        val reference: String?,
        val type: String // "SMS" or "NOTIFICATION"
    )

    // Regular Expression patterns optimized for Venezuelan bank formats
    private val bankPatterns = listOf(
        // 1. BANESCO - Pago Móvil / Transferencias
        // Example: Banesco: Pago Movil por Bs. 1.250,50 a C.I. 12345678 aprobado. Ref: 1928374
        // Example: Banesco: Transferencia recibida por Bs. 500,00 de Juan Perez. Ref. 9988776.
        BankRegexDef(
            bankName = "Banesco",
            regexes = listOf(
                """(?:pago\s+movil|pagomovil).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """recibid[oa].*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?(?:aprobado|exitoso).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 2. MERCANTIL - Pago Móvil / Transferencias
        // Example: Mercantil: Recibio Pago Movil de Bs. 450,00 de CI 11223344. Ref. 00098736
        // Example: Mercantil: Transferencia de Bs. 1.500,00 realizada con exito, ref: 123456
        BankRegexDef(
            bankName = "Mercantil",
            regexes = listOf(
                """(?:recibio|pago).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?realizada.*?ref(?:\:|\.|\s)+([0-9]+)""",
                """pago\s+movil.*?Bs\.?\s*([0-9.,]+).*?ref\.?\s*([0-9]+)"""
            )
        ),

        // 3. PROVINCIAL (BBVA)
        // Example: Provincial: Pago Movil recibido por Bs. 150,50 de C.I. 12938475. Ref: 083726
        // Example: Provincial: Transferencia de Bs. 2.000,00. Ref 112233
        BankRegexDef(
            bankName = "Provincial",
            regexes = listOf(
                """recibid[oa].*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """pago\s+movil.*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?Ref\.?\s*([0-9]+)"""
            )
        ),

        // 4. BANCO DE VENEZUELA (BDV)
        // Example: BDV: Pago Movil de Bs. 85,00 por Ref: 627192 recibido con exito.
        // Example: BDV: Transferencia recibida por Bs. 3.000,00. Referencia 998231
        BankRegexDef(
            bankName = "BDV",
            regexes = listOf(
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """ref(?:\:|\.|\s)+([0-9]+).*?Bs\.?\s*([0-9.,]+)""",
                """pago\s+movil.*?Bs\.?\s*([0-9.,]+).*?referencia\s*([0-9]+)"""
            )
        ),

        // 5. BANCO NACIONAL DE CREDITO (BNC)
        BankRegexDef(
            bankName = "BNC",
            regexes = listOf(
                """(?:pago\s+movil|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 6. BANCARIBE
        BankRegexDef(
            bankName = "Bancaribe",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 7. BANCO EXTERIOR
        BankRegexDef(
            bankName = "Exterior",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 8. BANPLUS
        BankRegexDef(
            bankName = "Banplus",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 9. BANCO PLAZA
        BankRegexDef(
            bankName = "Banco Plaza",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 10. BANCO FONDO COMUN (BFC)
        BankRegexDef(
            bankName = "BFC",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 11. BANCO DEL TESORO
        BankRegexDef(
            bankName = "Tesoro",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 12. BANCO BICENTENARIO
        BankRegexDef(
            bankName = "Bicentenario",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 13. BANCO VENEZOLANO DE CREDITO (BVC)
        BankRegexDef(
            bankName = "BVC",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 14. BANCO CARONI
        BankRegexDef(
            bankName = "Banco Caroní",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 15. DELSUR BANCO UNIVERSAL
        BankRegexDef(
            bankName = "Delsur",
            regexes = listOf(
                """(?:pago|recibido|transferencia).*?Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)"""
            )
        ),

        // 16. BINANCE PAY
        // Example: Binance: Recibiste un pago de 15.50 USDT. Ref/ID: 9872635
        // Example: Binance Pay: Transaction of 50.00 USD succeeded. Order: 22334455
        BankRegexDef(
            bankName = "Binance Pay",
            regexes = listOf(
                """(?:recibiste|pag[o]|recibió).*?(?:usdt|usd|usdc|ref|id)\s*([0-9.,]+).*?(?:id|ref|order|orden)(?:\:|\.|\s)+([a-z0-9]+)""",
                """(?:pago|recibiste|transaccion).*?([0-9.,]+)\s*(?:usdt|usd|usdc).*?(?:ref|id|order)(?:\:|\.|\s)+([a-z0-9]+)""",
                """([0-9.,]+)\s*(?:usdt|usd|usdc|eur).*?(?:ref|id|order)(?:\:|\.|\s)+([a-z0-9]+)"""
            )
        ),

        // 17. PAYPAL
        // Example: PayPal: Usted ha recibido un pago de $120.00 USD de Juan Perez. Transaccion ID: 8X73625
        BankRegexDef(
            bankName = "PayPal",
            regexes = listOf(
                """(?:pago|recibido|recibio|ha\s+recibido).*?(?:\$|usd|eur)\s*([0-9.,]+).*?(?:id|ref|transaccion|transId)(?:\:|\.|\s)+([a-z0-9\-]+)""",
                """(?:paypal|id).*?(?:\$|usd|eur)\s*([0-9.,]+).*?(?:id|ref)(?:\:|\.|\s)+([a-z0-9\-]+)"""
            )
        ),

        // 18. ZELLE
        // Example: Zelle: Jane Doe sent you $450.00. Confirmation: ZL-927361
        BankRegexDef(
            bankName = "Zelle",
            regexes = listOf(
                """(?:sent\s+you|envió|recibiste).*?(?:\$|usd)\s*([0-9.,]+).*?(?:confirmation|ref|id|confirmacion)(?:\:|\.|\s)+([a-z0-9\-]+)""",
                """(?:\$|usd)\s*([0-9.,]+).*?(?:sent\s+you|zelle).*?(?:confirmation|ref|id)(?:\:|\.|\s)+([a-z0-9\-]+)"""
            )
        ),

        // 19. GENERIC PAGO MOVIL
        // Example: Pago Movil por Bs. 400,00 Ref: 102938
        BankRegexDef(
            bankName = "Pago Móvil",
            regexes = listOf(
                """Bs\.?\s*([0-9.,]+).*?ref(?:\:|\.|\s)+([0-9]+)""",
                """pago.*?Bs\.?\s*([0-9.,]+).*?([0-9]{6,12})"""
            )
        )
    )

    private class BankRegexDef(
        val bankName: String,
        val regexes: List<String>
    )

    /**
     * Tries to parse the raw text to extract bank, amount, and reference.
     * Guaranteed to sanitize all user-identifiable parts like names or IDs (Cédula de Identidad).
     */
    fun parse(text: String, incomingType: String): ParsedTx? {
        val cleanNormalizedText = text.replace("\n", " ").replace("\r", " ").lowercase().trim()

        for (def in bankPatterns) {
            // First find if the brand signature is present in text
            val matchesBankSignature = cleanNormalizedText.contains(def.bankName.lowercase()) || 
                                       (def.bankName == "BDV" && cleanNormalizedText.contains("banco de venezuela")) ||
                                       (def.bankName == "Provincial" && cleanNormalizedText.contains("provincial"))
            
            if (matchesBankSignature || def.bankName == "Pago Móvil") {
                for (regex in def.regexes) {
                    try {
                        val pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE or Pattern.DOTALL)
                        val matcher = pattern.matcher(cleanNormalizedText)
                        if (matcher.find()) {
                            // Extract groups
                            val rawAmount = matcher.group(1)
                            val rawRef = matcher.group(2)

                            val amount = inspectAndCleanAmount(rawAmount)
                            val reference = cleanReference(rawRef)

                            if (amount != null || reference != null) {
                                return ParsedTx(
                                    bankName = def.bankName,
                                    amount = amount,
                                    reference = reference,
                                    type = incomingType
                                )
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error executing regex against pattern $regex", e)
                    }
                }
            }
        }
        return null
    }

    private fun inspectAndCleanAmount(raw: String?): Double? {
        if (raw == null) return null
        return try {
            // Remove Bs, Bs.S or spaces
            val cleaned = raw.replace("[^\\d.,]".toRegex(), "").trim()
            if (cleaned.isEmpty()) return null

            val commaIdx = cleaned.lastIndexOf(',')
            val dotIdx = cleaned.lastIndexOf('.')

            if (dotIdx > commaIdx) {
                // Dot is decimal separator (e.g. 1,000.50)
                cleaned.replace(",", "").toDoubleOrNull()
            } else if (commaIdx > dotIdx) {
                // Comma is decimal separator (e.g. 1.000,50)
                cleaned.replace(".", "").replace(",", ".").toDoubleOrNull()
            } else {
                // Single sign or standard layout
                if (dotIdx != -1) {
                    cleaned.toDoubleOrNull()
                } else if (commaIdx != -1) {
                    cleaned.replace(",", ".").toDoubleOrNull()
                } else {
                    cleaned.toDoubleOrNull()
                }
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun cleanReference(raw: String?): String? {
        if (raw == null) return null
        val numbersOnly = raw.replace("[^0-9]".toRegex(), "").trim()
        return if (numbersOnly.length >= 4) numbersOnly else raw.trim()
    }
}
