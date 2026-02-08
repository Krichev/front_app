package com.rhythmgame.devicelock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.WindowManager
import androidx.core.app.NotificationCompat

class DeviceLockService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: LockOverlayView? = null
    private lateinit var prefs: DeviceLockPreferences

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                "com.rhythmgame.devicelock.UPDATE_UI" -> {
                    updateOverlayUI()
                }
            }
        }
    }

    companion object {
        const val CHANNEL_ID = "DeviceLockChannel"
        const val NOTIFICATION_ID = 1001
        var isRunning = false
    }

    override fun onCreate() {
        super.onCreate()
        prefs = DeviceLockPreferences(this)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        
        val filter = IntentFilter("com.rhythmgame.devicelock.UPDATE_UI")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(receiver, filter)
        }
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        showOverlay()
        return START_STICKY
    }

    private fun showOverlay() {
        if (overlayView != null) return

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        // Updated flags: capture touches, block passthrough
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        )

        overlayView = LockOverlayView(
            context = this,
            onUnlockRequest = {
                val broadcastIntent = Intent("com.rhythmgame.devicelock.INTERNAL_EVENT")
                broadcastIntent.putExtra("event", "onUnlockRequested")
                sendBroadcast(broadcastIntent)
            },
            onEmergencyBypass = {
                val broadcastIntent = Intent("com.rhythmgame.devicelock.INTERNAL_EVENT")
                broadcastIntent.putExtra("event", "onEmergencyBypassUsed")
                sendBroadcast(broadcastIntent)
            }
        )

        updateOverlayUI()

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun updateOverlayUI() {
        overlayView?.updateData(
            reason = prefs.lockReason,
            resetTime = prefs.resetTime,
            allowBypass = prefs.accountType == "adult" && prefs.emergencyBypassCount < prefs.maxEmergencyBypasses
        )
    }

    private fun hideOverlay() {
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Device Lock Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Time Lock Active")
            .setContentText("Your device is currently locked.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        unregisterReceiver(receiver)
        hideOverlay()
        isRunning = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}