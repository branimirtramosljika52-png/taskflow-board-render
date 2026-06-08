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
import java.net.URLEncoder
import java.net.URL
import java.util.Base64
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

    fun restoreSession(storedAccessToken: String, storedCookieHeader: String) {
        accessToken = storedAccessToken.trim()
        authCookieHeader = storedCookieHeader.trim()
    }

    fun clearSession() {
        accessToken = ""
        authCookieHeader = ""
    }

    fun currentAccessToken(): String = accessToken

    fun currentAuthCookieHeader(): String = authCookieHeader

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
            val json = JSONObject(request("/api/mobile/bootstrap"))
            BootstrapData(
                workOrders = json.optJSONArray("workOrders").toWorkOrders(),
                companies = json.optJSONArray("companies").toRecords(),
                locations = json.optJSONArray("locations").toRecords(),
                vehicles = json.optJSONArray("vehicles").toRecords(),
                documentRecords = json.optJSONArray("documentRecords").toRecords(),
                peopleTrainingRecords = json.optJSONArray("peopleTrainingRecords").toRecords(),
                clientPortalRecords = json.optJSONArray("clientPortalRecords").toRecords(),
                rulebooks = json.optJSONArray("rulebooks").toRecords(),
                calendarEvents = json.optJSONArray("calendarEvents").toRecords(),
                dashboard = json.optJSONObject("dashboard").toDashboardStats(),
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

    suspend fun updateWorkOrderStatus(workOrderId: String, status: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", status)
                .toString()
            request("/api/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload)
            Unit
        }
    }

    suspend fun listWorkOrderDocuments(workOrderId: String): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/work-orders/${workOrderId.pathSegment()}/documents"))
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun uploadWorkOrderDocuments(
        workOrderId: String,
        files: List<WorkOrderUploadFile>,
        sourceType: String = "editor",
    ): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val payloadFiles = JSONArray()
            files.forEach { upload ->
                val dataUrl = "data:${upload.fileType};base64,${Base64.getEncoder().encodeToString(upload.bytes)}"
                payloadFiles.put(
                    JSONObject()
                        .put("fileName", upload.fileName)
                        .put("fileType", upload.fileType)
                        .put("fileSize", upload.fileSize)
                        .put("documentCategory", upload.documentCategory)
                        .put("description", upload.description)
                        .put("dataUrl", dataUrl),
                )
            }
            val payload = JSONObject()
                .put("sourceType", sourceType)
                .put("files", payloadFiles)
                .toString()
            val json = JSONObject(request("/api/work-orders/${workOrderId.pathSegment()}/documents", method = "POST", body = payload))
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun deleteWorkOrderDocument(workOrderId: String, documentId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/work-orders/${workOrderId.pathSegment()}/documents/${documentId.pathSegment()}",
                method = "DELETE",
            )
            Unit
        }
    }

    suspend fun downloadWorkOrderDocument(
        workOrderId: String,
        document: WorkOrderDocument,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/work-orders/${workOrderId.pathSegment()}/documents/${document.id.pathSegment()}/download"
            val connection = openConnection(path, method = "GET", body = null, accept = "*/*")
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = document.fileName.ifBlank { "dokument" },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { document.fileType }
                    ?: document.fileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/auth/logout", method = "POST", body = "{}")
            clearSession()
            Unit
        }
    }

    private fun openConnection(
        path: String,
        method: String = "GET",
        body: String? = null,
        accept: String = "application/json",
    ): HttpURLConnection {
        return (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 18_000
            readTimeout = 24_000
            setRequestProperty("Accept", accept)
            if (accept == "application/json") {
                setRequestProperty("Accept-Encoding", "gzip")
            }
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
    }

    private fun request(path: String, method: String = "GET", body: String? = null): String {
        val connection = openConnection(path, method, body)
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

    private fun readBinaryResponse(connection: HttpURLConnection): ByteArray {
        val stream = if (connection.responseCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream ?: connection.inputStream
        }
        return stream.use { it.readBytes() }
    }

    private fun extractErrorMessage(responseText: String): String = runCatching {
        val json = JSONObject(responseText)
        json.firstClean("message", "error")
    }.getOrDefault("")
}

private fun String.pathSegment(): String =
    URLEncoder.encode(this, Charsets.UTF_8.name()).replace("+", "%20")

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

private fun JSONObject?.toDashboardStats(): DashboardStats {
    if (this == null) return DashboardStats()
    return DashboardStats(
        workOrdersTotal = optInt("workOrdersTotal", 0),
        activeWorkOrders = optInt("activeWorkOrders", 0),
        overdueWorkOrders = optInt("overdueWorkOrders", 0),
        closedWorkOrders = optInt("closedWorkOrders", 0),
        vehiclesTotal = optInt("vehiclesTotal", 0),
        reservationsTotal = optInt("reservationsTotal", 0),
        documentsTotal = optInt("documentsTotal", 0),
        trainingsTotal = optInt("trainingsTotal", 0),
        clientPortalTotal = optInt("clientPortalTotal", 0),
        rulebooksTotal = optInt("rulebooksTotal", 0),
    )
}

private fun JSONObject?.toStringMap(): Map<String, String> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val value = opt(key)
            if (value != null && value != JSONObject.NULL) {
                val text = value.toString().trim()
                if (text.isNotBlank() && text != "null") {
                    put(key, text)
                }
            }
        }
    }
}

private fun JSONArray?.toRecords(): List<MobileRecord> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                MobileRecord(
                    id = item.firstClean("id"),
                    title = item.firstClean("title").ifBlank { "Zapis" },
                    subtitle = item.firstClean("subtitle"),
                    status = item.firstClean("status"),
                    kind = item.firstClean("kind"),
                    date = item.firstClean("date"),
                    relatedId = item.firstClean("relatedId"),
                    coordinates = item.firstClean("coordinates"),
                    meta = item.optJSONObject("meta").toStringMap(),
                ),
            )
        }
    }.sortedWith(
        compareBy<MobileRecord> { if (it.parsedDate == null) 1 else 0 }
            .thenBy { it.parsedDate }
            .thenBy { it.title.lowercase() },
    )
}

private fun JSONArray?.toWorkOrderDocuments(): List<WorkOrderDocument> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocument(
                    id = item.firstClean("id"),
                    workOrderId = item.firstClean("workOrderId"),
                    fileName = item.firstClean("fileName", "name").ifBlank { "Dokument" },
                    fileType = item.firstClean("fileType", "mimeType"),
                    fileSize = item.optLong("fileSize", item.optLong("size", 0L)),
                    documentCategory = item.firstClean("documentCategory", "category").ifBlank { "Ostalo" },
                    description = item.firstClean("description"),
                    sourceType = item.firstClean("sourceType").ifBlank { "editor" },
                    createdAt = item.firstClean("createdAt", "updatedAt"),
                ),
            )
        }
    }.sortedByDescending { it.createdAt }
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
