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
        val userId = preferences.getString(KEY_USER_ID, "").orEmpty()
        val displayName = preferences.getString(KEY_DISPLAY_NAME, "").orEmpty()
        val email = preferences.getString(KEY_EMAIL, "").orEmpty()
        val profileRole = preferences.getString(KEY_PROFILE_ROLE, "").orEmpty()
        val role = preferences.getString(KEY_ROLE, "").orEmpty()
        val clientCompanyIds = preferences.getStringSet(KEY_CLIENT_COMPANY_IDS, emptySet()).orEmpty().toList()
        val clientLocationIds = preferences.getStringSet(KEY_CLIENT_LOCATION_IDS, emptySet()).orEmpty().toList()
        val clientAccessAllLocations = preferences.getBoolean(KEY_CLIENT_ACCESS_ALL_LOCATIONS, true)

        if (accessToken.isBlank() && cookieHeader.isBlank()) {
            return null
        }

        return StoredSafeNexusSession(
            user = SafeNexusUser(
                id = userId,
                displayName = displayName.ifBlank { email.ifBlank { "SafeNexus" } },
                email = email,
                profileRole = profileRole,
                role = role,
                clientCompanyIds = clientCompanyIds,
                clientLocationIds = clientLocationIds,
                clientAccessAllLocations = clientAccessAllLocations,
            ),
            accessToken = accessToken,
            cookieHeader = cookieHeader,
        )
    }

    fun save(user: SafeNexusUser, accessToken: String, cookieHeader: String) {
        preferences.edit()
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_DISPLAY_NAME, user.displayName)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_PROFILE_ROLE, user.profileRole)
            .putString(KEY_ROLE, user.role)
            .putStringSet(KEY_CLIENT_COMPANY_IDS, user.clientCompanyIds.toSet())
            .putStringSet(KEY_CLIENT_LOCATION_IDS, user.clientLocationIds.toSet())
            .putBoolean(KEY_CLIENT_ACCESS_ALL_LOCATIONS, user.clientAccessAllLocations)
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_COOKIE_HEADER, cookieHeader)
            .apply()
    }

    fun clear() {
        preferences.edit().clear().apply()
    }

    private companion object {
        const val KEY_USER_ID = "user_id"
        const val KEY_DISPLAY_NAME = "display_name"
        const val KEY_EMAIL = "email"
        const val KEY_PROFILE_ROLE = "profile_role"
        const val KEY_ROLE = "role"
        const val KEY_CLIENT_COMPANY_IDS = "client_company_ids"
        const val KEY_CLIENT_LOCATION_IDS = "client_location_ids"
        const val KEY_CLIENT_ACCESS_ALL_LOCATIONS = "client_access_all_locations"
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_COOKIE_HEADER = "cookie_header"
    }
}
