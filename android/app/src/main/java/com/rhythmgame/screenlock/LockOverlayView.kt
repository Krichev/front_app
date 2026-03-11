package com.rhythmgame.screenlock

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class LockOverlayView(context: Context) : LinearLayout(context) {

    private val titleView: TextView
    private val messageView: TextView
    private val countdownView: TextView
    private val settingsButton: Button

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.parseColor("#EE000000")) // Dark semi-transparent
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

        // Lock Icon
        val lockIcon = ImageView(context).apply {
            setImageResource(android.R.drawable.ic_lock_lock)
            val size = (80 * context.resources.displayMetrics.density).toInt()
            layoutParams = LayoutParams(size, size).apply {
                setMargins(0, 0, 0, 40)
            }
            setColorFilter(Color.WHITE)
        }

        titleView = TextView(context).apply {
            textSize = 28f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(40, 0, 40, 20)
        }

        messageView = TextView(context).apply {
            textSize = 16f
            setTextColor(Color.parseColor("#CCCCCC"))
            gravity = Gravity.CENTER
            setPadding(60, 0, 60, 40)
        }

        countdownView = TextView(context).apply {
            textSize = 24f
            setTextColor(Color.WHITE)
            setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }

        settingsButton = Button(context).apply {
            val padding = (16 * context.resources.displayMetrics.density).toInt()
            setPadding(padding * 2, padding, padding * 2, padding)
            setBackgroundColor(Color.parseColor("#333333"))
            setTextColor(Color.WHITE)
            textSize = 16f
            setOnClickListener {
                openAppSettings()
            }
        }

        addView(lockIcon)
        addView(titleView)
        addView(messageView)
        addView(countdownView)
        addView(settingsButton)

        // Intercept all touches
        setOnTouchListener { _, _ -> true }
    }

    fun updateUI(title: String, message: String, settingsLabel: String, remainingSeconds: Int) {
        titleView.text = title
        messageView.text = message
        settingsButton.text = settingsLabel
        
        if (remainingSeconds > 0) {
            val hours = remainingSeconds / 3600
            val minutes = (remainingSeconds % 3600) / 60
            val seconds = remainingSeconds % 60
            countdownView.text = if (hours > 0) {
                String.format("%02d:%02d:%02d", hours, minutes, seconds)
            } else {
                String.format("%02d:%02d", minutes, seconds)
            }
            countdownView.visibility = View.VISIBLE
        } else {
            countdownView.visibility = View.GONE
        }
    }

    private fun openAppSettings() {
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        intent?.putExtra("navigate_to", "ScreenTimeSettings")
        context.startActivity(intent)
    }
}
