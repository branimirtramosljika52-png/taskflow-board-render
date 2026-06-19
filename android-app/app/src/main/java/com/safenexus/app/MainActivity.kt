package com.safenexus.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.fragment.app.FragmentActivity
import com.safenexus.app.ui.SafeNexusApp
import com.safenexus.app.ui.theme.SafeNexusTheme

class MainActivity : FragmentActivity() {
    private var learningTestToken by mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
}
