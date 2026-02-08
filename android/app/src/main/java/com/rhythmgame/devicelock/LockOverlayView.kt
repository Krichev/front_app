package com.rhythmgame.devicelock

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class LockOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
    private val onUnlockRequest: () -> Unit = {},
    private val onEmergencyBypass: () -> Unit = {}
) : LinearLayout(context, attrs, defStyleAttr) {

    private val titleView: TextView
    private val countdownView: TextView
    private val reasonView: TextView
    private val unlockButton: Button
    private val bypassButton: Button

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.parseColor("#E6000000")) // Semi-transparent black
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

        titleView = TextView(context).apply {
            text = "Screen Time Expired"
            textSize = 24f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 20)
        }

        reasonView = TextView(context).apply {
            text = "Lock active"
            textSize = 16f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 40)
        }

        countdownView = TextView(context).apply {
            text = "Resetting soon..."
            textSize = 18f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 40)
        }

        unlockButton = Button(context).apply {
            text = "Request Unlock"
            setOnClickListener { onUnlockRequest() }
        }

        bypassButton = Button(context).apply {
            text = "Emergency Bypass"
            setOnClickListener { onEmergencyBypass() }
        }

        addView(titleView)
        addView(reasonView)
        addView(countdownView)
        addView(unlockButton)
        addView(LinearLayout(context).apply { layoutParams = LayoutParams(1, 20) }) // Spacer
        addView(bypassButton)
    }

    fun updateData(reason: String?, resetTime: String?, allowBypass: Boolean) {
        reason?.let { reasonView.text = it }
        resetTime?.let { countdownView.text = "Resets at: $it" }
        bypassButton.visibility = if (allowBypass) View.VISIBLE else View.GONE
    }
}
