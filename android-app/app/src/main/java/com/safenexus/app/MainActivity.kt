package com.safenexus.app

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import com.safenexus.app.ui.SafeNexusApp
import com.safenexus.app.ui.theme.SafeNexusTheme

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SafeNexusTheme {
                SafeNexusApp()
            }
        }
    }
}
