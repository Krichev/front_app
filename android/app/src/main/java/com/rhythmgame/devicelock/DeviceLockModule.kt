package com.rhythmgame.devicelock

import android.app.admin.DevicePolicyManager
import android.content.*
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class DeviceLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs = DeviceLockPreferences(reactContext)

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.rhythmgame.devicelock.INTERNAL_EVENT") {
                val event = intent.getStringExtra("event")
                if (event != null) {
                    val params = Arguments.createMap()
                    when (event) {
                        "onEmergencyBypassUsed" -> {
                            prefs.emergencyBypassCount++
                            params.putInt("remainingBypasses", prefs.maxEmergencyBypasses - prefs.emergencyBypassCount)
                        }
                    }
                    emitEvent(event, params)
                }
            }
        }
    }

    init {
        val filter = IntentFilter("com.rhythmgame.devicelock.INTERNAL_EVENT")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            reactContext.registerReceiver(receiver, filter)
        }
    }

    override fun getName(): String = "DeviceLockModule"

    @ReactMethod
    fun activateLock(config: ReadableMap, promise: Promise) {
        try {
            prefs.isLockActive = true
            if (config.hasKey("lockType")) prefs.lockType = config.getString("lockType")
            if (config.hasKey("resetTime")) prefs.resetTime = config.getString("resetTime")
            if (config.hasKey("lockReason")) prefs.lockReason = config.getString("lockReason")
            if (config.hasKey("assignedByUserId")) prefs.assignedByUserId = config.getDouble("assignedByUserId").toLong()
            if (config.hasKey("penaltyId")) prefs.penaltyId = config.getDouble("penaltyId").toLong()
            if (config.hasKey("accountType")) prefs.accountType = config.getString("accountType")
            if (config.hasKey("maxEmergencyBypasses")) prefs.maxEmergencyBypasses = config.getInt("maxEmergencyBypasses")
            if (config.hasKey("escalateAfterDismissAttempts")) prefs.escalateAfterDismissAttempts = config.getInt("escalateAfterDismissAttempts")

            val intent = Intent(reactApplicationContext, DeviceLockService::class.java)
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
        prefs.isLockActive = false
        val intent = Intent(reactApplicationContext, DeviceLockService::class.java)
        reactApplicationContext.stopService(intent)
        promise.resolve(null)
    }

    @ReactMethod
    fun escalateToHardLock(promise: Promise) {
        val dpm = reactApplicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminName = ComponentName(reactApplicationContext, DeviceAdminReceiver::class.java)
        if (dpm.isAdminActive(adminName)) {
            dpm.lockNow()
            promise.resolve(null)
        } else {
            promise.reject("HARD_LOCK_ERROR", "Device Admin not active")
        }
    }

    @ReactMethod
    fun isOverlayPermissionGranted(promise: Promise) {
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
    fun isDeviceAdminActive(promise: Promise) {
        val dpm = reactApplicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminName = ComponentName(reactApplicationContext, DeviceAdminReceiver::class.java)
        promise.resolve(dpm.isAdminActive(adminName))
    }

    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        val adminName = ComponentName(reactApplicationContext, DeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminName)
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enhanced lock requires device admin to lock the screen.")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun updateLockScreenData(data: ReadableMap) {
        if (data.hasKey("resetTime")) prefs.resetTime = data.getString("resetTime")
        val intent = Intent("com.rhythmgame.devicelock.UPDATE_UI")
        reactApplicationContext.sendBroadcast(intent)
    }

    @ReactMethod
    fun getLockStatus(promise: Promise) {
        val status = Arguments.createMap()
        status.putBoolean("isActive", prefs.isLockActive)
        status.putString("lockType", prefs.lockType)
        status.putInt("emergencyBypassesUsed", prefs.emergencyBypassCount)
        status.putInt("emergencyBypassesRemaining", prefs.maxEmergencyBypasses - prefs.emergencyBypassCount)
        promise.resolve(status)
    }

    fun emitEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}