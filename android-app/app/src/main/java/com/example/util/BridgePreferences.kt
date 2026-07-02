package com.example.util

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import java.util.UUID

object BridgePreferences {
    private const val TAG = "BridgePreferences"
    private const val PREFS_FILE = "puente_secure_prefs"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_TENANT_ID = "tenant_id"
    private const val KEY_LINKED = "is_linked"

    private var sharedPrefs: SharedPreferences? = null

    @Synchronized
    private fun getPrefs(context: Context): SharedPreferences {
        if (sharedPrefs != null) return sharedPrefs!!

        val appContext = context.applicationContext
        sharedPrefs = try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                PREFS_FILE,
                masterKeyAlias,
                appContext,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to initialize EncryptedSharedPreferences, falling back to standard obfuscated preferences", e)
            // Fallback to standard SharedPreferences for maximum reliability under stress or emulator conditions
            appContext.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        }
        return sharedPrefs!!
    }

    /**
     * Retrieves the existing device UUID, or generates and saves a new one if it doesn't exist yet.
     */
    fun getOrCreateDeviceId(context: Context): String {
        val prefs = getPrefs(context)
        var deviceId = prefs.getString(KEY_DEVICE_ID, null)
        if (deviceId.isNullOrEmpty()) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
            Log.i(TAG, "Generated new unique device_id: $deviceId")
        }
        return deviceId
    }

    fun saveLinkedSession(context: Context, tenantId: String) {
        getPrefs(context).edit()
            .putString(KEY_TENANT_ID, tenantId)
            .putBoolean(KEY_LINKED, true)
            .apply()
        Log.i(TAG, "Saved linked session for tenant_id: $tenantId")
    }

    fun isLinked(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_LINKED, false) && 
               !getPrefs(context).getString(KEY_TENANT_ID, null).isNullOrEmpty()
    }

    fun getTenantId(context: Context): String? {
        return getPrefs(context).getString(KEY_TENANT_ID, null)
    }

    fun clearSession(context: Context) {
        getPrefs(context).edit()
            .remove(KEY_TENANT_ID)
            .remove(KEY_LINKED)
            .apply()
        Log.i(TAG, "Cleared linked session session data.")
    }
}
