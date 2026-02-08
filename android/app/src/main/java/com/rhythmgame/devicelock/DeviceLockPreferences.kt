package com.rhythmgame.devicelock

import android.content.Context
import android.content.SharedPreferences

class DeviceLockPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("DeviceLockPrefs", Context.MODE_PRIVATE)

    var isLockActive: Boolean
        get() = prefs.getBoolean("isLockActive", false)
        set(value) = prefs.edit().putBoolean("isLockActive", value).apply()

    var lockType: String?
        get() = prefs.getString("lockType", "overlay")
        set(value) = prefs.edit().putString("lockType", value).apply()

    var resetTime: String?
        get() = prefs.getString("resetTime", null)
        set(value) = prefs.edit().putString("resetTime", value).apply()

    var lockReason: String?
        get() = prefs.getString("lockReason", null)
        set(value) = prefs.edit().putString("lockReason", value).apply()

    var assignedByUserId: Long
        get() = prefs.getLong("assignedByUserId", -1L)
        set(value) = prefs.edit().putLong("assignedByUserId", value).apply()

    var penaltyId: Long
        get() = prefs.getLong("penaltyId", -1L)
        set(value) = prefs.edit().putLong("penaltyId", value).apply()

    var emergencyBypassCount: Int
        get() = prefs.getInt("emergencyBypassCount", 0)
        set(value) = prefs.edit().putInt("emergencyBypassCount", value).apply()

    var emergencyBypassResetDate: String?
        get() = prefs.getString("emergencyBypassResetDate", null)
        set(value) = prefs.edit().putString("emergencyBypassResetDate", value).apply()

    var accountType: String?
        get() = prefs.getString("accountType", "adult")
        set(value) = prefs.edit().putString("accountType", value).apply()

    var maxEmergencyBypasses: Int
        get() = prefs.getInt("maxEmergencyBypasses", 3)
        set(value) = prefs.edit().putInt("maxEmergencyBypasses", value).apply()

    var dismissAttemptCount: Int
        get() = prefs.getInt("dismissAttemptCount", 0)
        set(value) = prefs.edit().putInt("dismissAttemptCount", value).apply()

    var escalateAfterDismissAttempts: Int
        get() = prefs.getInt("escalateAfterDismissAttempts", 3)
        set(value) = prefs.edit().putInt("escalateAfterDismissAttempts", value).apply()
}
