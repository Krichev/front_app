package com.rhythmgame.screenlock

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class ScreenLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs = ScreenLockPreferences(reactContext)

    override fun getName(): String = "ScreenLockModule"

    @ReactMethod
    fun activateLock(lockData: ReadableMap, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, ScreenLockService::class.java)
            
            if (lockData.hasKey("durationSeconds")) {
                intent.putExtra(ScreenLockService.EXTRA_DURATION_SECONDS, lockData.getInt("durationSeconds"))
            }
            if (lockData.hasKey("reasonMessage")) {
                intent.putExtra(ScreenLockService.EXTRA_REASON_MESSAGE, lockData.getString("reasonMessage"))
            }
            if (lockData.hasKey("locale")) {
                intent.putExtra(ScreenLockService.EXTRA_LOCALE, lockData.getString("locale"))
            }
            if (lockData.hasKey("title")) {
                intent.putExtra(ScreenLockService.EXTRA_TITLE, lockData.getString("title"))
            }
            if (lockData.hasKey("settingsLabel")) {
                intent.putExtra(ScreenLockService.EXTRA_SETTINGS_LABEL, lockData.getString("settingsLabel"))
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ACTIVATE_LOCK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun deactivateLock(promise: Promise) {
        try {
            prefs.isLockActive = false
            val intent = Intent(reactApplicationContext, ScreenLockService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DEACTIVATE_LOCK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isLockActive(promise: Promise) {
        promise.resolve(ScreenLockService.isRunning || prefs.isLockActive)
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun updateLockInfo(lockData: ReadableMap, promise: Promise) {
        // Just restart the service with new data - onStartCommand will handle updates
        activateLock(lockData, promise)
    }
}
