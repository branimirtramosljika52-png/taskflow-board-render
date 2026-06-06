package com.safenexus.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightScheme = lightColorScheme(
    primary = Color(0xFF2563EB),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDCEAFE),
    onPrimaryContainer = Color(0xFF0F172A),
    secondary = Color(0xFF0891B2),
    tertiary = Color(0xFFDB2777),
    background = Color(0xFFF6F8FC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF172033),
    surfaceVariant = Color(0xFFE8EDF7),
    outline = Color(0xFFCAD5E4),
)

private val DarkScheme = darkColorScheme(
    primary = Color(0xFF8AB4FF),
    secondary = Color(0xFF67E8F9),
    tertiary = Color(0xFFF9A8D4),
    background = Color(0xFF070B14),
    surface = Color(0xFF101827),
    onSurface = Color(0xFFE5EDF9),
)

@Composable
fun SafeNexusTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        content = content,
    )
}
