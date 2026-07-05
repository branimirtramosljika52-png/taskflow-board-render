package com.safenexus.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import com.safenexus.app.ui.SafeNexusApp
import com.safenexus.app.ui.theme.SafeNexusTheme

class MainActivity : FragmentActivity() {
    private var learningTestToken by mutableStateOf("")
    private var fatalErrorMessage by mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Thread.setDefaultUncaughtExceptionHandler { _, error ->
            runOnUiThread {
                fatalErrorMessage = error.message ?: error::class.java.simpleName
            }
        }
        enableEdgeToEdge()
        learningTestToken = extractLearningTestToken(intent)
        setContent {
            SafeNexusTheme {
                if (fatalErrorMessage.isBlank()) {
                    SafeNexusApp(learningTestToken = learningTestToken)
                } else {
                    SafeNexusCrashFallback(fatalErrorMessage)
                }
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

@Composable
private fun SafeNexusCrashFallback(message: String) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(22.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 2.dp,
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text("SafeNexus se nije učitao", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                    Text(
                        message.ifBlank { "Nepoznata greška pri učitavanju aplikacije." },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                    )
                    Button(onClick = { android.os.Process.killProcess(android.os.Process.myPid()) }) {
                        Text("Zatvori aplikaciju")
                    }
                }
            }
        }
    }
}
