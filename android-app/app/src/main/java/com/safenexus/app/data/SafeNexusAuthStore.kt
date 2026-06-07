package com.safenexus.app.data

import android.content.Context

data class StoredSafeNexusSession(
    val user: SafeNexusUser,
    val accessToken: String,
    val cookieHeader: String,
)

class SafeNexusAuthStore(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("safe_nexus_auth", Context.MODE_PRIVATE)

    fun load(): StoredSafeNexusSession? {
        val accessToken = preferences.getString(KEY_ACCESS_TOKEN, "").orEmpty()
        val cookieHeader = preferences.getString(KEY_COOKIE_HEADER, "").orEmpty()
        val displayName = preferences.getString(KEY_DISPLAY_NAME, "").orEmpty()
        val email = preferences.getString(KEY_EMAIL, "").orEmpty()

        if (accessToken.isBlank() && cookieHeader.isBlank()) {
            return null
        }

        return StoredSafeNexusSession(
            user = SafeNexusUser(
                displayName = displayName.ifBlank { email.ifBlank { "SafeNexus" } },
                email = email,
            ),
            accessToken = accessToken,
            cookieHeader = cookieHeader,
        )
    }

    fun save(user: SafeNexusUser, accessToken: String, cookieHeader: String) {
        preferences.edit()
            .putString(KEY_DISPLAY_NAME, user.displayName)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_COOKIE_HEADER, cookieHeader)
            .apply()
    }

    fun clear() {
        preferences.edit().clear().apply()
    }

    private companion object {
        const val KEY_DISPLAY_NAME = "display_name"
        const val KEY_EMAIL = "email"
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_COOKIE_HEADER = "cookie_header"
    }
}
