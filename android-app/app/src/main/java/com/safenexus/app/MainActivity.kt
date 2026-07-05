package com.safenexus.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Process
import android.util.Log
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.fragment.app.FragmentActivity
import com.safenexus.app.ui.SafeNexusApp
import com.safenexus.app.ui.theme.SafeNexusTheme
import kotlin.system.exitProcess

class MainActivity : FragmentActivity() {
    private var learningTestToken by mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installCrashRecorder()
        val lastCrash = loadLastStartupCrash()
        if (lastCrash.isNotBlank()) {
            showStartupCrashScreen(lastCrash)
            return
        }
        enableEdgeToEdge()
        learningTestToken = extractLearningTestToken(intent)
        setContent {
            SafeNexusTheme {
                SafeNexusApp(learningTestToken = learningTestToken)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        learningTestToken = extractLearningTestToken(intent)
    }

    private fun extractLearningTestToken(intent: Intent?): String {
        val uri = intent?.data ?: return ""
        if (uri.scheme != "safenexus" || uri.host != "learning-test") {
            return ""
        }
        return uri.getQueryParameter("token").orEmpty().trim()
    }

    private fun installCrashRecorder() {
        val current = Thread.getDefaultUncaughtExceptionHandler()
        if (current is SafeNexusCrashHandler) return
        Thread.setDefaultUncaughtExceptionHandler(
            SafeNexusCrashHandler(applicationContext, current),
        )
    }

    private fun loadLastStartupCrash(): String =
        getSharedPreferences(CRASH_PREFS, MODE_PRIVATE)
            .getString(CRASH_TEXT_KEY, "")
            .orEmpty()

    private fun clearLastStartupCrash() {
        getSharedPreferences(CRASH_PREFS, MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
    }

    private fun showStartupCrashScreen(crashText: String) {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(36, 56, 36, 36)
            setBackgroundColor(0xFFF6F8FC.toInt())
        }
        val title = TextView(this).apply {
            text = "SafeNexus se zaustavio prije otvaranja"
            textSize = 22f
            setTextColor(0xFF0F172A.toInt())
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, 16)
        }
        val message = TextView(this).apply {
            text = "Greška je spremljena u aplikaciji. Kopiraj tekst ili obriši grešku pa pokušaj ponovno otvoriti."
            textSize = 15f
            setTextColor(0xFF475569.toInt())
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, 20)
        }
        val scroll = ScrollView(this).apply {
            addView(
                TextView(this@MainActivity).apply {
                    text = crashText
                    textSize = 12f
                    setTextColor(0xFF1E293B.toInt())
                    setPadding(18, 18, 18, 18)
                    setBackgroundColor(0xFFFFFFFF.toInt())
                },
            )
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f,
            )
        }
        val copyButton = Button(this).apply {
            text = "Kopiraj grešku"
            setOnClickListener {
                val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                clipboard.setPrimaryClip(ClipData.newPlainText("SafeNexus crash", crashText))
            }
        }
        val retryButton = Button(this).apply {
            text = "Obriši i pokušaj ponovno"
            setOnClickListener {
                clearLastStartupCrash()
                recreate()
            }
        }
        container.addView(title)
        container.addView(message)
        container.addView(scroll)
        container.addView(copyButton)
        container.addView(retryButton)
        setContentView(container)
    }

    private class SafeNexusCrashHandler(
        private val context: Context,
        private val previous: Thread.UncaughtExceptionHandler?,
    ) : Thread.UncaughtExceptionHandler {
        override fun uncaughtException(thread: Thread, throwable: Throwable) {
            val stack = Log.getStackTraceString(throwable).ifBlank {
                throwable.message.orEmpty().ifBlank { throwable::class.java.name }
            }
            context.getSharedPreferences(CRASH_PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(CRASH_TEXT_KEY, stack)
                .putLong(CRASH_AT_KEY, System.currentTimeMillis())
                .apply()
            previous?.uncaughtException(thread, throwable) ?: run {
                Process.killProcess(Process.myPid())
                exitProcess(10)
            }
        }
    }

    private companion object {
        const val CRASH_PREFS = "safe_nexus_startup_crash"
        const val CRASH_TEXT_KEY = "last_crash"
        const val CRASH_AT_KEY = "last_crash_at"
    }
}
