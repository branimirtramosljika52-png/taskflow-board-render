package com.safenexus.app.data

import com.safenexus.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.CookieHandler
import java.net.CookieManager
import java.net.CookiePolicy
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.GZIPInputStream

class SafeNexusApi(
    private val baseUrl: String = BuildConfig.SAFE_NEXUS_BASE_URL.trimEnd('/'),
) {
    private var authCookieHeader: String = ""
    private var accessToken: String = ""

    init {
        if (CookieHandler.getDefault() == null) {
            CookieHandler.setDefault(CookieManager(null, CookiePolicy.ACCEPT_ALL))
        }
    }

    suspend fun login(email: String, password: String): Result<SafeNexusUser> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("email", email.trim())
                .put("password", password)
                .toString()
            val response = request("/api/auth/login", method = "POST", body = payload)
            val json = JSONObject(response)
            accessToken = json.optString("mobileAccessToken", "").trim()
            val user = json.optJSONObject("user") ?: JSONObject()
            SafeNexusUser(
                displayName = user.firstClean("fullName", "displayName", "username", "email").ifBlank { "SafeNexus" },
                email = user.firstClean("email", "username"),
            )
        }
    }

    suspend fun bootstrap(): Result<BootstrapData> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/bootstrap"))
            BootstrapData(
                workOrders = json.optJSONArray("workOrders").toWorkOrders(),
            )
        }
    }

    suspend fun workOrders(): Result<BootstrapData> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/work-orders"))
            BootstrapData(
                workOrders = json.optJSONArray("workOrders").toWorkOrders(),
            )
        }
    }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/auth/logout", method = "POST", body = "{}")
            authCookieHeader = ""
            accessToken = ""
            Unit
        }
    }

    private fun request(path: String, method: String = "GET", body: String? = null): String {
        val connection = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 18_000
            readTimeout = 24_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Accept-Encoding", "gzip")
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("X-SafeNexus-Client", "android")
            if (accessToken.isNotBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            if (authCookieHeader.isNotBlank()) {
                setRequestProperty("Cookie", authCookieHeader)
            }
            if (body != null) {
                doOutput = true
                outputStream.use { stream ->
                    stream.write(body.toByteArray(Charsets.UTF_8))
                }
            }
        }

        val responseText = readResponse(connection)
        rememberAuthCookies(connection)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(extractErrorMessage(responseText).ifBlank {
                "SafeNexus API trenutno nije dostupan (${connection.responseCode})."
            })
        }
        return responseText
    }

    private fun rememberAuthCookies(connection: HttpURLConnection) {
        val setCookieHeaders = connection.headerFields
            .filterKeys { key -> key.equals("Set-Cookie", ignoreCase = true) }
            .values
            .flatten()

        if (setCookieHeaders.isEmpty()) return

        val current = authCookieHeader
            .split(";")
            .mapNotNull { part ->
                val trimmed = part.trim()
                val separator = trimmed.indexOf("=")
                if (separator <= 0) null else trimmed.take(separator) to trimmed.drop(separator + 1)
            }
            .toMap()
            .toMutableMap()

        setCookieHeaders.forEach { header ->
            val cookiePart = header.substringBefore(";").trim()
            val separator = cookiePart.indexOf("=")
            if (separator <= 0) return@forEach

            val name = cookiePart.take(separator)
            val value = cookiePart.drop(separator + 1)
            if (name == "safety360_access" || name == "safety360_refresh") {
                if (value.isBlank()) {
                    current.remove(name)
                } else {
                    current[name] = value
                }
            }
        }

        authCookieHeader = current.entries.joinToString("; ") { (name, value) -> "$name=$value" }
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream ?: connection.inputStream
        }
        val decodedStream = if (connection.getHeaderField("Content-Encoding").equals("gzip", ignoreCase = true)) {
            GZIPInputStream(stream)
        } else {
            stream
        }
        return BufferedReader(InputStreamReader(decodedStream, Charsets.UTF_8)).use { reader ->
            reader.readText()
        }
    }

    private fun extractErrorMessage(responseText: String): String = runCatching {
        val json = JSONObject(responseText)
        json.firstClean("message", "error")
    }.getOrDefault("")
}

private fun JSONObject.firstClean(vararg keys: String): String {
    for (key in keys) {
        val value = optString(key, "").trim()
        if (value.isNotBlank() && value != "null") {
            return value
        }
    }
    return ""
}

private fun JSONArray?.toStringList(vararg keys: String): List<String> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val entry = opt(index)
            val value = when (entry) {
                is JSONObject -> entry.firstClean(*keys)
                else -> entry?.toString()?.trim().orEmpty()
            }
            if (value.isNotBlank()) add(value)
        }
    }.distinct()
}

private fun JSONArray?.toWorkOrders(): List<WorkOrder> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val serviceItems = item.optJSONArray("serviceItems").toStringList("name", "serviceCode")
            add(
                WorkOrder(
                    id = item.firstClean("id"),
                    number = item.firstClean("workOrderNumber", "number"),
                    status = item.firstClean("status").ifBlank { "Otvoreni RN" },
                    companyName = item.firstClean("companyName", "company"),
                    locationName = item.firstClean("locationName", "location"),
                    coordinates = item.firstClean("coordinates"),
                    region = item.firstClean("region"),
                    serviceLine = item.firstClean("serviceLine"),
                    serviceItems = serviceItems,
                    openedDate = item.firstClean("openedDate", "createdAt"),
                    dueDate = item.firstClean("dueDate"),
                    executionDate = item.firstClean("executionDate"),
                    priority = item.firstClean("priority").ifBlank { "Normal" },
                    contactName = item.firstClean("contactName"),
                    contactPhone = item.firstClean("contactPhone"),
                    contactEmail = item.firstClean("contactEmail"),
                    description = item.firstClean("description", "note"),
                    executors = item.optJSONArray("executors").toStringList("fullName", "name", "label", "email"),
                ),
            )
        }
    }.sortedWith(
        compareByDescending<WorkOrder> { it.parsedDueDate ?: it.parsedOpenedDate }
            .thenBy { it.number },
    )
}
