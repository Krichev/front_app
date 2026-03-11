package com.rhythmgame.screenlock

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class ScreenLockPreferences(context: Context) {
    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        "ScreenLockPrefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var isLockActive: Boolean
        get() = prefs.getBoolean("isLockActive", false)
        set(value) = prefs.edit().putBoolean("isLockActive", value).apply()

    var durationSeconds: Int
        get() = prefs.getInt("durationSeconds", 0)
        set(value) = prefs.edit().putInt("durationSeconds", value).apply()

    var reasonMessage: String?
        get() = prefs.getString("reasonMessage", null)
        set(value) = prefs.edit().putString("reasonMessage", value).apply()

    var locale: String
        get() = prefs.getString("locale", "en") ?: "en"
        set(value) = prefs.edit().putString("locale", value).apply()

    var lastPenaltyId: Long
        get() = prefs.getLong("lastPenaltyId", -1L)
        set(value) = prefs.edit().putLong("lastPenaltyId", value).apply()
}
