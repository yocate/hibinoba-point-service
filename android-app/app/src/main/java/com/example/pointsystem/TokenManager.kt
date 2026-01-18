package com.example.pointsystem

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

object TokenManager {
    private const val PREFS_NAME = "secure_point_prefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"

    @Volatile
    private var prefsInstance: android.content.SharedPreferences? = null

    private fun getPrefs(context: Context): android.content.SharedPreferences? {
        return prefsInstance ?: synchronized(this) {
            prefsInstance ?: try {
                val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
                EncryptedSharedPreferences.create(
                    PREFS_NAME,
                    masterKeyAlias,
                    context.applicationContext, // Use application context
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                ).also { prefsInstance = it }
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    fun saveSession(context: Context, userId: String, token: String) {
        getPrefs(context)?.edit()?.apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_TOKEN, token)
            apply()
        }
    }

    fun getSession(context: Context): Pair<String?, String?> {
        val prefs = getPrefs(context) ?: return Pair(null, null)
        val userId = prefs.getString(KEY_USER_ID, null)
        val token = prefs.getString(KEY_TOKEN, null)
        return Pair(userId, token)
    }

    fun clearSession(context: Context) {
        getPrefs(context)?.edit()?.clear()?.apply()
    }
}
