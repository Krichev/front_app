package com.rhythmgame.screenlock

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import android.view.WindowManager
import androidx.core.app.NotificationCompat

class ScreenLockService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: LockOverlayView? = null
    private lateinit var prefs: ScreenLockPreferences
    private var countDownTimer: CountDownTimer? = null
    private var currentRemainingSeconds = 0

    companion object {
        const val CHANNEL_ID = "ScreenLockChannel"
        const val NOTIFICATION_ID = 2001
        var isRunning = false

        // Intent Extras
        const val EXTRA_DURATION_SECONDS = "duration_seconds"
        const val EXTRA_REASON_MESSAGE = "reason_message"
        const val EXTRA_LOCALE = "locale"
        const val EXTRA_TITLE = "title"
        const val EXTRA_SETTINGS_LABEL = "settings_label"
    }

    override fun onCreate() {
        super.onCreate()
        prefs = ScreenLockPreferences(this)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val duration = intent?.getIntExtra(EXTRA_DURATION_SECONDS, prefs.durationSeconds) ?: prefs.durationSeconds
        val reason = intent?.getStringExtra(EXTRA_REASON_MESSAGE) ?: prefs.reasonMessage ?: ""
        val locale = intent?.getStringExtra(EXTRA_LOCALE) ?: prefs.locale
        val title = intent?.getStringExtra(EXTRA_TITLE) ?: (if (locale == "ru") "Экранное время истекло" else "Screen Time Expired")
        val settingsLabel = intent?.getStringExtra(EXTRA_SETTINGS_LABEL) ?: (if (locale == "ru") "Настройки" else "Settings")

        // Save state
        prefs.durationSeconds = duration
        prefs.reasonMessage = reason
        prefs.locale = locale
        prefs.isLockActive = true

        startForeground(NOTIFICATION_ID, createNotification(title, duration))
        showOverlay(title, reason, settingsLabel, duration)
        
        startTimer(duration, title, reason, settingsLabel)

        return START_STICKY
    }

    private fun showOverlay(title: String, message: String, settingsLabel: String, duration: Int) {
        if (overlayView != null) {
            overlayView?.updateUI(title, message, settingsLabel, duration)
            return
        }

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        )

        overlayView = LockOverlayView(this)
        overlayView?.updateUI(title, message, settingsLabel, duration)

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startTimer(duration: Int, title: String, message: String, settingsLabel: String) {
        countDownTimer?.cancel()
        currentRemainingSeconds = duration
        
        if (duration <= 0) {
            // If duration is 0, it means the lock is indefinite until manually deactivated
            overlayView?.updateUI(title, message, settingsLabel, 0)
            return
        }

        countDownTimer = object : CountDownTimer(duration * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                currentRemainingSeconds = (millisUntilFinished / 1000).toInt()
                overlayView?.updateUI(title, message, settingsLabel, currentRemainingSeconds)
                updateNotification(title, currentRemainingSeconds)
            }

            override fun onFinish() {
                prefs.isLockActive = false
                stopSelf()
            }
        }.start()
    }

    private fun createNotification(title: String, remainingSeconds: Int): Notification {
        val minutes = remainingSeconds / 60
        val contentText = if (remainingSeconds > 0) {
            if (prefs.locale == "ru") "Осталось $minutes минут" else "$minutes minutes remaining"
        } else {
            if (prefs.locale == "ru") "Ограничение активно" else "Screen time limit active"
        }

        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun updateNotification(title: String, remainingSeconds: Int) {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, createNotification(title, remainingSeconds))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Screen Lock Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        countDownTimer?.cancel()
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
        
        // Restart logic if needed
        if (prefs.isLockActive) {
            val restartIntent = Intent(this, ScreenLockService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent)
            } else {
                startService(restartIntent)
            }
        }
        
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
