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
import java.time.LocalDate
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
                workOrderStatuses = json.optJSONObject("options")?.optJSONArray("workOrderStatuses").toOptions(),
                priorities = json.optJSONObject("options")?.optJSONArray("priorities").toOptions(),
                workOrderCompanies = json.optJSONObject("options")?.optJSONArray("workOrderCompanies").toWorkOrderCompanies(),
                workOrderLocations = json.optJSONObject("options")?.optJSONArray("workOrderLocations").toWorkOrderLocations(),
                workOrderUsers = json.optJSONObject("options")?.optJSONArray("workOrderUsers").toWorkOrderUsers(),
                workOrderServices = json.optJSONObject("options")?.optJSONArray("workOrderServices").toWorkOrderServices(),
                workOrderLocationObjects = json.optJSONObject("options")?.optJSONArray("workOrderLocationObjects").toWorkOrderLocationObjects(),
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

    suspend fun createWorkOrder(draft: WorkOrderCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val serviceItems = JSONArray()
            draft.serviceIds.forEach { serviceId ->
                serviceItems.put(JSONObject().put("serviceId", serviceId))
            }
            val payload = JSONObject()
                .put("companyId", draft.companyId)
                .put("locationId", draft.locationId)
                .put("status", draft.status)
                .put("openedDate", draft.openedDate)
                .put("dueDate", draft.dueDate)
                .put("executionDate", draft.executionDate)
                .put("priority", draft.priority)
                .put("serviceLine", draft.serviceLine)
                .put("serviceItems", serviceItems)
                .put("description", draft.description)
                .put("executors", JSONArray(draft.executors))
                .put("executor1", draft.executors.getOrNull(0).orEmpty())
                .put("executor2", draft.executors.getOrNull(1).orEmpty())
                .put("completedBy", draft.completedBy)
                .put("teamLabel", draft.teamLabel)
                .put("contactName", draft.contactName)
                .put("contactPhone", draft.contactPhone)
                .put("contactEmail", draft.contactEmail)
                .put("tagText", draft.tagText)
                .put("invoiceNote", draft.invoiceNote)
                .put("linkReference", draft.linkReference)
                .put("department", draft.department)
                .toString()
            request("/api/work-orders", method = "POST", body = payload)
            Unit
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

    suspend fun updateWorkOrderServices(workOrderId: String, serviceIds: List<String>): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val serviceItems = JSONArray()
            serviceIds.distinct().forEach { serviceId ->
                serviceItems.put(JSONObject().put("serviceId", serviceId))
            }
            val payload = JSONObject()
                .put("serviceItems", serviceItems)
                .toString()
            request("/api/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload)
            Unit
        }
    }

    suspend fun createWorkOrderLocationObject(
        workOrder: WorkOrder,
        name: String,
    ): Result<WorkOrderLocationObjectOption> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("companyId", workOrder.companyId)
                .put("locationId", workOrder.locationId)
                .put("name", name)
                .toString()
            val json = JSONObject(request("/api/mobile/location-objects", method = "POST", body = payload))
            val item = json.optJSONObject("item") ?: JSONObject()
            WorkOrderLocationObjectOption(
                id = item.firstClean("id"),
                companyId = item.firstClean("companyId"),
                locationId = item.firstClean("locationId"),
                name = item.firstClean("name").ifBlank { name },
                code = item.firstClean("code"),
                description = item.firstClean("description"),
            )
        }
    }

    suspend fun registerPushToken(
        token: String,
        platform: String = "android",
        deviceId: String = "",
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            if (token.isBlank()) return@runCatching
            val payload = JSONObject()
                .put("token", token)
                .put("platform", platform)
                .put("deviceId", deviceId)
                .toString()
            request("/api/mobile/push-token", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun unregisterPushToken(token: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            if (token.isBlank()) return@runCatching
            val payload = JSONObject()
                .put("token", token)
                .toString()
            request("/api/mobile/push-token", method = "DELETE", body = payload)
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

    suspend fun generateWorkOrderDocumentation(
        workOrderId: String,
        draft: WorkOrderDocumentationDraft,
    ): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val inspectorIds = JSONArray()
            draft.inspectorUserIds.forEach { inspectorIds.put(it) }
            val electricalInspectorIds = JSONArray()
            draft.electricalInspectorUserIds.forEach { electricalInspectorIds.put(it) }
            val tipkaloInspectorIds = JSONArray()
            draft.tipkaloInspectorUserIds.forEach { tipkaloInspectorIds.put(it) }
            val selectedEquipmentIds = JSONArray()
            draft.selectedEquipmentIds.forEach { selectedEquipmentIds.put(it) }
            val selectedLegalFrameworkIds = JSONArray()
            draft.selectedLegalFrameworkIds.forEach { selectedLegalFrameworkIds.put(it) }
            val selectedRulebookIds = JSONArray()
            draft.selectedRulebookIds.forEach { selectedRulebookIds.put(it) }
            val payload = JSONObject()
                .put("objectId", draft.objectId)
                .put("objectName", draft.objectName)
                .put("inspectionDate", draft.inspectionDate)
                .put("issuedDate", draft.issuedDate)
                .put("issuedPlace", draft.issuedPlace)
                .put("testingLocation", draft.testingLocation)
                .put("note", draft.note)
                .put("inspectionType", draft.inspectionType)
                .put("outsideTemperature", draft.outsideTemperature)
                .put("relativeHumidity", draft.relativeHumidity)
                .put("airflowSpeed", draft.airflowSpeed)
                .put("weather", draft.weather)
                .put("groundCondition", draft.groundCondition)
                .put("groundResistance", draft.groundResistance)
                .put("measurementEquipmentGroup", draft.measurementEquipmentGroup)
                .put("selectedEquipmentIds", selectedEquipmentIds)
                .put("selectedLegalFrameworkIds", selectedLegalFrameworkIds)
                .put("selectedRulebookIds", selectedRulebookIds)
                .put("signatureMode", draft.signatureMode)
                .put("validityMonths", draft.validityMonths)
                .put("electricalValidityMonths", draft.electricalValidityMonths)
                .put("tipkaloValidityMonths", draft.tipkaloValidityMonths)
                .put("inspectorUserIds", inspectorIds)
                .put("inspectorUserId", draft.inspectorUserId)
                .put("authorizationHolderUserId", draft.authorizationHolderUserId)
                .put("electricalInspectorUserIds", electricalInspectorIds)
                .put("electricalInspectorUserId", draft.electricalInspectorUserId)
                .put("electricalAuthorizationHolderUserId", draft.electricalAuthorizationHolderUserId)
                .put("tipkaloInspectorUserIds", tipkaloInspectorIds)
                .put("tipkaloInspectorUserId", draft.tipkaloInspectorUserId)
                .put("tipkaloAuthorizationHolderUserId", draft.tipkaloAuthorizationHolderUserId)
                .put("fieldValues", draft.fieldValues.toJsonObject())
                .put("templateFieldValues", draft.templateFieldValues.toNestedJsonObject())
                .put("fieldSheets", draft.fieldSheets.toMeasurementSheetJsonObject())
                .put("templateFieldSheets", draft.templateFieldSheets.toNestedMeasurementSheetJsonObject())
                .put("includeHandoverProtocol", draft.includeHandoverProtocol)
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/generate-documents",
                    method = "POST",
                    body = payload,
                ),
            )
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun workOrderDocumentationContext(
        workOrderId: String,
        objectId: String = "",
    ): Result<WorkOrderDocumentationContext> = withContext(Dispatchers.IO) {
        runCatching {
            val query = if (objectId.isBlank()) "" else "?objectId=${objectId.pathSegment()}"
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}/documentation-context$query"))
            json.toWorkOrderDocumentationContext()
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

    suspend fun downloadWorkOrderPdf(workOrderId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/work-orders/${workOrderId.pathSegment()}/export-pdf"
            val connection = openConnection(path, method = "POST", body = "{}", accept = "application/pdf")
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF radnog naloga (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "radni-nalog.pdf" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/pdf" }
                    ?: "application/pdf",
                bytes = bytes,
            )
        }
    }

    suspend fun signWorkOrderPdf(
        workOrderId: String,
        signaturePngBytes: ByteArray,
        signerName: String,
        signatureLocation: String,
        signedAt: String,
        includeSignerName: Boolean,
        includeSignedAt: Boolean,
        includeSignatureLocation: Boolean,
        fallbackFileName: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val signatureDataUrl = "data:image/png;base64,${Base64.getEncoder().encodeToString(signaturePngBytes)}"
            val payload = JSONObject()
                .put("signatureDataUrl", signatureDataUrl)
                .put("signerName", signerName)
                .put("signatureLocation", signatureLocation)
                .put("signedAt", signedAt)
                .put("includeSignerName", includeSignerName)
                .put("includeSignedAt", includeSignedAt)
                .put("includeSignatureLocation", includeSignatureLocation)
                .toString()
            val json = JSONObject(
                request(
                    "/api/work-orders/${workOrderId.pathSegment()}/signature-pdf",
                    method = "POST",
                    body = payload,
                ),
            )
            val fileContentBase64 = json.firstClean("fileContentBase64", "bytesBase64", "contentBase64")
            if (fileContentBase64.isBlank()) {
                throw IllegalStateException("Potpisani PDF nije vraćen s poslužitelja.")
            }
            DownloadedDocument(
                fileName = json.firstClean("fileName").ifBlank { fallbackFileName.ifBlank { "radni-nalog-potpisano.pdf" } },
                fileType = json.firstClean("fileType").ifBlank { "application/pdf" },
                bytes = Base64.getDecoder().decode(fileContentBase64),
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

private fun parseContentDispositionFileName(value: String?): String {
    if (value.isNullOrBlank()) return ""
    val encodedMatch = Regex("""filename\*=UTF-8''([^;]+)""", RegexOption.IGNORE_CASE).find(value)
    if (encodedMatch != null) {
        return runCatching {
            java.net.URLDecoder.decode(encodedMatch.groupValues[1], Charsets.UTF_8.name())
        }.getOrDefault("")
    }
    val plainMatch = Regex("""filename="?([^";]+)"?""", RegexOption.IGNORE_CASE).find(value)
    return plainMatch?.groupValues?.getOrNull(1)?.trim().orEmpty()
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

private fun Map<String, String>.toJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, value) -> json.put(key, value) }
    return json
}

private fun Map<String, Map<String, String>>.toNestedJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, values) -> json.put(key, values.toJsonObject()) }
    return json
}

private fun WorkOrderMeasurementSheet.toJsonObject(): JSONObject {
    val columnArray = JSONArray()
    columns.forEach { column ->
        columnArray.put(
            JSONObject()
                .put("id", column.id)
                .put("label", column.label)
                .put("placeholder", column.placeholder)
                .put("width", column.width)
                .put("computed", if (column.computed.isBlank()) JSONObject.NULL else column.computed)
                .put("readonly", column.readonly),
        )
    }
    val rowArray = JSONArray()
    rows.forEach { row ->
        rowArray.put(
            JSONObject()
                .put("id", row.id)
                .put("cells", row.cells.toJsonObject())
                .put("formats", row.formats.toMeasurementFormatsJsonObject()),
        )
    }
    val mergeArray = JSONArray()
    merges.forEach { merge ->
        mergeArray.put(
            JSONObject()
                .put("rowId", merge.rowId)
                .put("columnId", merge.columnId)
                .put("rowSpan", merge.rowSpan)
                .put("colSpan", merge.colSpan),
        )
    }
    val headerArray = JSONArray()
    headerRows.forEach { headerArray.put(it) }
    return JSONObject()
        .put("columns", columnArray)
        .put("rows", rowArray)
        .put("merges", mergeArray)
        .put("headerRows", headerArray)
}

private fun Map<String, WorkOrderMeasurementSheet>.toMeasurementSheetJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, sheet) -> json.put(key, sheet.toJsonObject()) }
    return json
}

private fun Map<String, Map<String, WorkOrderMeasurementSheet>>.toNestedMeasurementSheetJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, values) -> json.put(key, values.toMeasurementSheetJsonObject()) }
    return json
}

private fun Map<String, JSONObject>.toMeasurementFormatsJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, value) -> json.put(key, value) }
    return json
}

private fun JSONArray?.toDocumentationFieldOptions(): List<OptionItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = opt(index)
            if (item is JSONObject) {
                val value = item.firstClean("value", "id", "key", "label")
                val label = item.firstClean("label", "name", "title", "value").ifBlank { value }
                if (value.isNotBlank() || label.isNotBlank()) {
                    add(OptionItem(value.ifBlank { label }, label.ifBlank { value }))
                }
            } else {
                val value = item?.toString()?.trim().orEmpty()
                if (value.isNotBlank() && value != "null") {
                    add(OptionItem(value, value))
                }
            }
        }
    }.distinctBy { it.value }
}

private fun JSONArray?.toWorkOrderDocumentationFields(): List<WorkOrderDocumentationField> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationField(
                    id = item.firstClean("id"),
                    key = item.firstClean("key"),
                    tokenKey = item.firstClean("tokenKey"),
                    label = item.firstClean("label").ifBlank { "Polje" },
                    type = item.firstClean("type").ifBlank { "text" },
                    required = item.optBoolean("required", false),
                    helpText = item.firstClean("helpText"),
                    defaultValue = item.firstClean("defaultValue"),
                    options = item.optJSONArray("options").toDocumentationFieldOptions(),
                ),
            )
        }
    }.filter { it.id.isNotBlank() || it.key.isNotBlank() || it.tokenKey.isNotBlank() }
}

private fun JSONArray?.toWorkOrderDocumentationTemplateBlocks(): List<WorkOrderDocumentationTemplateBlock> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id", "key", "tokenKey")
            val label = item.firstClean("label", "typeLabel", "key").ifBlank { id }
            if (id.isNotBlank() && label.isNotBlank()) {
                add(
                    WorkOrderDocumentationTemplateBlock(
                        id = id,
                        key = item.firstClean("key"),
                        tokenKey = item.firstClean("tokenKey"),
                        label = label,
                        type = item.firstClean("type").ifBlank { "text" },
                        typeLabel = item.firstClean("typeLabel").ifBlank { item.firstClean("type").ifBlank { "Polje" } },
                        group = item.firstClean("group").ifBlank { "Predložak" },
                        required = item.optBoolean("required", false),
                        editable = item.optBoolean("editable", false),
                        helpText = item.firstClean("helpText"),
                        summary = item.firstClean("summary"),
                        options = item.optJSONArray("options").toDocumentationFieldOptions(),
                    ),
                )
            }
        }
    }.distinctBy { "${it.id}::${it.type}" }
}

private fun JSONArray?.toWorkOrderMeasurementColumns(): List<WorkOrderMeasurementColumn> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id").ifBlank { "measurement-column-${index + 1}" }
            add(
                WorkOrderMeasurementColumn(
                    id = id,
                    label = item.firstClean("label").ifBlank { "Kolona ${index + 1}" },
                    placeholder = item.firstClean("placeholder"),
                    width = item.optInt("width", 140).coerceIn(60, 260),
                    computed = item.firstClean("computed"),
                    readonly = item.optBoolean("readonly", false),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.label.isNotBlank() }
}

private fun JSONArray?.toWorkOrderMeasurementRows(columns: List<WorkOrderMeasurementColumn>): List<WorkOrderMeasurementRow> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val sourceCells = item.optJSONObject("cells").toStringMap()
            val cells = columns.associate { column -> column.id to sourceCells[column.id].orEmpty() }
            val sourceFormats = item.optJSONObject("formats").toMeasurementFormatMap()
            add(
                WorkOrderMeasurementRow(
                    id = item.firstClean("id").ifBlank { "measurement-row-${index + 1}" },
                    cells = cells,
                    formats = sourceFormats,
                ),
            )
        }
    }
}

private fun JSONObject?.toMeasurementFormatMap(): Map<String, JSONObject> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            put(key, optJSONObject(key) ?: JSONObject())
        }
    }
}

private fun JSONArray?.toWorkOrderMeasurementMerges(): List<WorkOrderMeasurementMerge> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderMeasurementMerge(
                    rowId = item.firstClean("rowId"),
                    columnId = item.firstClean("columnId"),
                    rowSpan = item.optInt("rowSpan", 1).coerceAtLeast(1),
                    colSpan = item.optInt("colSpan", 1).coerceAtLeast(1),
                ),
            )
        }
    }.filter { it.rowId.isNotBlank() && it.columnId.isNotBlank() }
}

private fun JSONObject?.toWorkOrderMeasurementSheet(): WorkOrderMeasurementSheet {
    if (this == null) return WorkOrderMeasurementSheet()
    val columns = optJSONArray("columns").toWorkOrderMeasurementColumns()
    val rows = optJSONArray("rows").toWorkOrderMeasurementRows(columns)
    return WorkOrderMeasurementSheet(
        columns = columns,
        rows = rows,
        merges = optJSONArray("merges").toWorkOrderMeasurementMerges(),
        headerRows = optJSONArray("headerRows").toStringList(),
    )
}

private fun JSONArray?.toWorkOrderMeasurementTables(): List<WorkOrderMeasurementTable> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val key = item.firstClean("key", "id", "tokenKey")
            add(
                WorkOrderMeasurementTable(
                    id = item.firstClean("id").ifBlank { key },
                    key = key,
                    tokenKey = item.firstClean("tokenKey"),
                    label = item.firstClean("label").ifBlank { "Excel tablica" },
                    helpText = item.firstClean("helpText"),
                    summary = item.firstClean("summary"),
                    sheet = item.optJSONObject("sheet").toWorkOrderMeasurementSheet(),
                ),
            )
        }
    }.filter { it.key.isNotBlank() && it.sheet.columns.isNotEmpty() }
}

private fun JSONArray?.toWorkOrderDocumentationTemplates(): List<WorkOrderDocumentationTemplate> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationTemplate(
                    id = item.firstClean("id"),
                    title = item.firstClean("title").ifBlank { "Zapisnik" },
                    documentType = item.firstClean("documentType"),
                    serviceName = item.firstClean("serviceName"),
                    serviceCode = item.firstClean("serviceCode", "code", "shortCode"),
                    serviceIndex = item.optInt("serviceIndex", -1),
                    documentNumber = item.firstClean("documentNumber"),
                    documentName = item.firstClean("documentName", "fileName"),
                    fields = item.optJSONArray("fields").toWorkOrderDocumentationFields(),
                    fieldBlocks = item.optJSONArray("fieldBlocks").toWorkOrderDocumentationTemplateBlocks(),
                    inspectionTypeOptions = item.optJSONArray("inspectionTypeOptions").toDocumentationFieldOptions(),
                    measurementTables = item.optJSONArray("measurementTables").toWorkOrderMeasurementTables(),
                ),
            )
        }
    }.filter { it.id.isNotBlank() }
}

private fun JSONArray?.toWorkOrderDocumentationOptions(): List<WorkOrderDocumentationOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id", "value", "key")
            val label = item.firstClean("label", "title", "name").ifBlank { id }
            if (id.isNotBlank() && label.isNotBlank()) {
                add(
                    WorkOrderDocumentationOption(
                        id = id,
                        label = label,
                        subtitle = item.firstClean("subtitle", "description", "metaLabel"),
                        status = item.firstClean("status"),
                        meta = item.optJSONObject("meta").toStringMap(),
                    ),
                )
            }
        }
    }.distinctBy { it.id }
}

private fun JSONObject.toWorkOrderDocumentationContext(): WorkOrderDocumentationContext =
    WorkOrderDocumentationContext(
        workOrderId = firstClean("workOrderId"),
        workOrderNumber = firstClean("workOrderNumber"),
        templates = optJSONArray("templates").toWorkOrderDocumentationTemplates(),
        hasTemplates = optBoolean("hasTemplates", false),
        fieldCount = optInt("fieldCount", 0),
        templateBlockCount = optInt("templateBlockCount", 0),
        measurementTableCount = optInt("measurementTableCount", 0),
        defaults = optJSONObject("defaults").toWorkOrderDocumentationDefaults(),
        measurementEquipmentOptions = optJSONArray("measurementEquipmentOptions").toWorkOrderDocumentationOptions(),
        legalFrameworkOptions = optJSONArray("legalFrameworkOptions").toWorkOrderDocumentationOptions(),
        rulebookOptions = optJSONArray("rulebookOptions").toWorkOrderDocumentationOptions(),
    )

private fun JSONObject?.toWorkOrderDocumentationDefaults(): WorkOrderDocumentationDefaults {
    if (this == null) return WorkOrderDocumentationDefaults()
    return WorkOrderDocumentationDefaults(
        inspectionDate = firstClean("inspectionDate"),
        issuedDate = firstClean("issuedDate"),
        issuedPlace = firstClean("issuedPlace"),
        testingLocation = firstClean("testingLocation"),
        note = firstClean("note"),
        inspectionType = firstClean("inspectionType"),
        outsideTemperature = firstClean("outsideTemperature"),
        relativeHumidity = firstClean("relativeHumidity"),
        airflowSpeed = firstClean("airflowSpeed"),
        weather = firstClean("weather"),
        groundCondition = firstClean("groundCondition"),
        groundResistance = firstClean("groundResistance"),
        measurementEquipmentGroup = firstClean("measurementEquipmentGroup"),
        selectedEquipmentIds = optJSONArray("selectedEquipmentIds").toStringList(),
        selectedLegalFrameworkIds = optJSONArray("selectedLegalFrameworkIds").toStringList(),
        selectedRulebookIds = optJSONArray("selectedRulebookIds").toStringList(),
        signatureMode = firstClean("signatureMode"),
        validityMonths = firstClean("validityMonths"),
        electricalValidityMonths = firstClean("electricalValidityMonths"),
        tipkaloValidityMonths = firstClean("tipkaloValidityMonths"),
    )
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

private fun JSONArray?.toOptions(): List<OptionItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val value = item.firstClean("value")
            val label = item.firstClean("label").ifBlank { value }
            if (value.isNotBlank()) add(OptionItem(value, label))
        }
    }
}

private fun JSONArray?.toWorkOrderCompanies(): List<WorkOrderCompanyOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderCompanyOption(
                    id = item.firstClean("id"),
                    name = item.firstClean("name"),
                    oib = item.firstClean("oib"),
                    headquarters = item.firstClean("headquarters"),
                    contractType = item.firstClean("contractType"),
                    contactPhone = item.firstClean("contactPhone"),
                    contactEmail = item.firstClean("contactEmail"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.name.isNotBlank() }
}

private fun JSONArray?.toWorkOrderLocations(): List<WorkOrderLocationOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderLocationOption(
                    id = item.firstClean("id"),
                    companyId = item.firstClean("companyId"),
                    name = item.firstClean("name"),
                    coordinates = item.firstClean("coordinates"),
                    region = item.firstClean("region"),
                    contactName1 = item.firstClean("contactName1"),
                    contactPhone1 = item.firstClean("contactPhone1"),
                    contactEmail1 = item.firstClean("contactEmail1"),
                    contactName2 = item.firstClean("contactName2"),
                    contactPhone2 = item.firstClean("contactPhone2"),
                    contactEmail2 = item.firstClean("contactEmail2"),
                    contactName3 = item.firstClean("contactName3"),
                    contactPhone3 = item.firstClean("contactPhone3"),
                    contactEmail3 = item.firstClean("contactEmail3"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.companyId.isNotBlank() && it.name.isNotBlank() }
}

private fun JSONArray?.toWorkOrderUsers(): List<WorkOrderUserOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderUserOption(
                    id = item.firstClean("id"),
                    label = item.firstClean("label"),
                    fullName = item.firstClean("fullName"),
                    email = item.firstClean("email"),
                ),
            )
        }
    }.filter { it.label.isNotBlank() }
}

private fun JSONArray?.toWorkOrderServices(): List<WorkOrderServiceOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderServiceOption(
                    id = item.firstClean("id"),
                    name = item.firstClean("name"),
                    serviceCode = item.firstClean("serviceCode"),
                    type = item.firstClean("type"),
                    validityMonths = item.firstClean("validityMonths"),
                    note = item.firstClean("note"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && (it.name.isNotBlank() || it.serviceCode.isNotBlank()) }
}

private fun JSONArray?.toWorkOrderLocationObjects(): List<WorkOrderLocationObjectOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderLocationObjectOption(
                    id = item.firstClean("id"),
                    companyId = item.firstClean("companyId"),
                    locationId = item.firstClean("locationId"),
                    name = item.firstClean("name").ifBlank { "Objekt" },
                    code = item.firstClean("code"),
                    description = item.firstClean("description"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.locationId.isNotBlank() && it.name.isNotBlank() }
        .sortedWith(compareBy<WorkOrderLocationObjectOption> { it.name.lowercase() }.thenBy { it.code.lowercase() })
}

private fun JSONArray?.toWorkOrderServiceDetails(): List<WorkOrderServiceItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = opt(index)
            if (item is JSONObject) {
                add(
                    WorkOrderServiceItem(
                        serviceId = item.firstClean("serviceId", "id", "serviceCatalogId", "catalogServiceId"),
                        name = item.firstClean("name", "serviceName", "title"),
                        serviceCode = item.firstClean("serviceCode", "code", "shortLabel"),
                        serviceStatus = item.firstClean("serviceStatus", "progressStatus", "workStatus"),
                        quantity = item.firstClean("quantity", "measurementQuantity", "count").ifBlank { "1" },
                    ),
                )
            } else {
                val value = item?.toString()?.trim().orEmpty()
                if (value.isNotBlank() && value != "null") {
                    add(WorkOrderServiceItem("", value, "", "", "1"))
                }
            }
        }
    }.filter { it.name.isNotBlank() || it.serviceCode.isNotBlank() || it.serviceId.isNotBlank() }
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

private val workOrderNumberPartPattern = Regex("""\d+""")

private fun workOrderNumberSortParts(value: String): List<Long> =
    workOrderNumberPartPattern.findAll(value)
        .mapNotNull { match -> match.value.toLongOrNull() }
        .toList()

private fun compareWorkOrdersByNumberDescending(left: WorkOrder, right: WorkOrder): Int {
    val leftParts = workOrderNumberSortParts(left.number)
    val rightParts = workOrderNumberSortParts(right.number)
    val maxParts = maxOf(leftParts.size, rightParts.size)

    for (index in 0 until maxParts) {
        val leftPart = leftParts.getOrNull(index) ?: Long.MIN_VALUE
        val rightPart = rightParts.getOrNull(index) ?: Long.MIN_VALUE
        if (leftPart != rightPart) {
            return rightPart.compareTo(leftPart)
        }
    }

    return right.number.compareTo(left.number, ignoreCase = true)
}

private fun JSONArray?.toWorkOrders(): List<WorkOrder> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val serviceDetails = item.optJSONArray("serviceItems").toWorkOrderServiceDetails()
            val serviceItems = serviceDetails
                .map { service -> service.name.ifBlank { service.serviceCode.ifBlank { service.serviceId } } }
                .filter { it.isNotBlank() }
                .ifEmpty { item.optJSONArray("serviceItems").toStringList("name", "serviceCode") }
            add(
                WorkOrder(
                    id = item.firstClean("id"),
                    number = item.firstClean("workOrderNumber", "number"),
                    status = item.firstClean("status").ifBlank { "Otvoreni RN" },
                    companyId = item.firstClean("companyId"),
                    companyName = item.firstClean("companyName", "company"),
                    companyOib = item.firstClean("companyOib", "oib"),
                    headquarters = item.firstClean("headquarters", "companyHeadquarters"),
                    locationId = item.firstClean("locationId"),
                    locationName = item.firstClean("locationName", "location"),
                    objectId = item.firstClean("objectId", "locationObjectId"),
                    objectName = item.firstClean("objectName", "locationObjectName"),
                    coordinates = item.firstClean("coordinates"),
                    region = item.firstClean("region"),
                    serviceLine = item.firstClean("serviceLine"),
                    serviceItems = serviceItems,
                    serviceDetails = serviceDetails,
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
        Comparator { left, right ->
            compareWorkOrdersByNumberDescending(left, right).takeIf { it != 0 }
                ?: compareValuesBy(right, left) { it.parsedOpenedDate ?: it.parsedDueDate ?: LocalDate.MIN }
        },
    )
}
