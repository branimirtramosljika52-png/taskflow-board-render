package com.safenexus.app.data

import com.safenexus.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
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
import java.util.Locale
import java.util.zip.GZIPInputStream

class SafeNexusApi(
    private val baseUrl: String = BuildConfig.SAFE_NEXUS_BASE_URL.trimEnd('/'),
) {
    private var authCookieHeader: String = ""
    private var accessToken: String = ""

    private companion object {
        const val DEFAULT_CONNECT_TIMEOUT_MS = 18_000
        const val DEFAULT_READ_TIMEOUT_MS = 24_000
        const val PDF_ACTION_READ_TIMEOUT_MS = 120_000
        const val DOCUMENT_GENERATION_READ_TIMEOUT_MS = 180_000
        const val OPENAI_PREPARE_READ_TIMEOUT_MS = 180_000
        const val DOCUMENT_GENERATION_POLL_INTERVAL_MS = 2_000L
        const val DOCUMENT_GENERATION_POLL_ATTEMPTS = 180
    }

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
            json.optJSONObject("user").toSafeNexusUser()
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
                todoTaskStatuses = json.optJSONObject("options")?.optJSONArray("todoTaskStatuses").toOptions(),
                workOrderCompanies = json.optJSONObject("options")?.optJSONArray("workOrderCompanies").toWorkOrderCompanies(),
                workOrderLocations = json.optJSONObject("options")?.optJSONArray("workOrderLocations").toWorkOrderLocations(),
                workOrderUsers = json.optJSONObject("options")?.optJSONArray("workOrderUsers").toWorkOrderUsers(),
                workOrderServices = json.optJSONObject("options")?.optJSONArray("workOrderServices").toWorkOrderServices(),
                workOrderLocationObjects = json.optJSONObject("options")?.optJSONArray("workOrderLocationObjects").toWorkOrderLocationObjects(),
                vehicles = json.optJSONArray("vehicles").toRecords(),
                measurementEquipmentRecords = json.optJSONArray("measurementEquipmentRecords").toRecords(),
                documentRecords = json.optJSONArray("documentRecords").toRecords(),
                peopleTrainingRecords = json.optJSONArray("peopleTrainingRecords").toRecords(),
                clientPortalRecords = json.optJSONArray("clientPortalRecords").toRecords(),
                rulebooks = json.optJSONArray("rulebooks").toRecords(),
                legalFrameworks = json.optJSONArray("legalFrameworks").toRecords(),
                riskAssessmentRecords = json.optJSONArray("riskAssessmentRecords").toRecords(),
                jobs = json.optJSONArray("jobs").toRecords(),
                offers = json.optJSONArray("offers").toRecords(),
                fieldInquiries = json.optJSONArray("fieldInquiries").toRecords(),
                todoTasks = json.optJSONArray("todoTasks").toRecords(),
                calendarEvents = json.optJSONArray("calendarEvents").toRecords(),
                dashboard = json.optJSONObject("dashboard").toDashboardStats(),
            )
        }
    }

    suspend fun listMobileCompanies(
        query: String = "",
        offset: Int = 0,
        limit: Int = 60,
    ): Result<PagedMobileRecords> = withContext(Dispatchers.IO) {
        runCatching {
            val params = listOf(
                "offset=${offset.coerceAtLeast(0)}",
                "limit=${limit.coerceIn(20, 120)}",
            ) + query.trim().takeIf { it.isNotBlank() }?.let { listOf("q=${it.pathSegment()}") }.orEmpty()
            val json = JSONObject(request("/api/mobile/directory/companies?${params.joinToString("&")}"))
            json.toPagedMobileRecords()
        }
    }

    suspend fun listMobileCompanyLocations(
        companyId: String,
        query: String = "",
        offset: Int = 0,
        limit: Int = 80,
    ): Result<PagedMobileRecords> = withContext(Dispatchers.IO) {
        runCatching {
            val params = listOf(
                "offset=${offset.coerceAtLeast(0)}",
                "limit=${limit.coerceIn(20, 160)}",
            ) + query.trim().takeIf { it.isNotBlank() }?.let { listOf("q=${it.pathSegment()}") }.orEmpty()
            val json = JSONObject(request("/api/mobile/directory/companies/${companyId.pathSegment()}/locations?${params.joinToString("&")}"))
            json.toPagedMobileRecords()
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
                .put("sourceFieldInquiryId", draft.sourceFieldInquiryId)
                .toString()
            request("/api/work-orders", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun polishFieldInquiryNote(
        transcript: String,
        currentNote: String,
        title: String,
        companyName: String,
        locationName: String,
        serviceLine: String,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("transcript", transcript)
                .put("currentNote", currentNote)
                .put("title", title)
                .put("companyName", companyName)
                .put("locationName", locationName)
                .put("serviceLine", serviceLine)
                .toString()
            val json = JSONObject(request("/api/mobile/field-inquiries/polish-note", method = "POST", body = payload))
            json.optString("note", transcript).ifBlank { transcript }
        }
    }

    suspend fun createFieldInquiry(draft: FieldInquiryDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/mobile/field-inquiries", method = "POST", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun createJob(draft: JobCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/jobs", method = "POST", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun createRiskAssessment(draft: RiskAssessmentCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/risk-assessments",
                method = "POST",
                body = draft.toJsonPayload(),
                readTimeoutMs = 60_000,
            )
            Unit
        }
    }

    suspend fun updateFieldInquiry(draft: FieldInquiryDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/mobile/field-inquiries/${draft.id.pathSegment()}", method = "PATCH", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun convertFieldInquiryToWorkOrder(inquiryId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/mobile/field-inquiries/${inquiryId.pathSegment()}/convert-to-work-order",
                method = "POST",
                body = JSONObject().put("syncWorkOrderExecutionDate", true).toString(),
            )
            Unit
        }
    }

    suspend fun createWorkOrderLocation(draft: WorkOrderLocationCreateDraft): Result<WorkOrderLocationOption> = withContext(Dispatchers.IO) {
        runCatching {
            val contacts = JSONArray()
            if (draft.contactName.isNotBlank() || draft.contactPhone.isNotBlank() || draft.contactEmail.isNotBlank()) {
                contacts.put(
                    JSONObject()
                        .put("name", draft.contactName)
                        .put("phone", draft.contactPhone)
                        .put("email", draft.contactEmail),
                )
            }
            val payload = JSONObject()
                .put("companyId", draft.companyId)
                .put("name", draft.name)
                .put("region", draft.region)
                .put("coordinates", draft.coordinates)
                .put("contacts", contacts)
                .put("contactName1", draft.contactName)
                .put("contactPhone1", draft.contactPhone)
                .put("contactEmail1", draft.contactEmail)
                .put("note", draft.note)
                .toString()
            val json = JSONObject(request("/api/mobile/locations", method = "POST", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrderLocationOption()
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

    suspend fun listIsznrMeasurementEquipment(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/instruments", readTimeoutMs = 120_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun listIsznrWorkEquipment(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/work-equipment?maxRecords=200", readTimeoutMs = 90_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun listIsznrPeople(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/people", readTimeoutMs = 60_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun updateWorkOrderStatus(workOrderId: String, status: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", status)
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderDates(workOrderId: String, dueDate: String, executionDate: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("dueDate", dueDate.trim())
                .put("executionDate", executionDate.trim())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderServices(workOrderId: String, serviceIds: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val serviceItems = JSONArray()
            serviceIds.distinct().forEach { serviceId ->
                serviceItems.put(JSONObject().put("serviceId", serviceId))
            }
            val payload = JSONObject()
                .put("serviceItems", serviceItems)
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderExecutors(workOrderId: String, executors: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val normalized = executors.map { it.trim() }.filter { it.isNotBlank() }.distinct()
            val payload = JSONObject()
                .put("executors", JSONArray(normalized))
                .put("executor1", normalized.getOrNull(0).orEmpty())
                .put("executor2", normalized.getOrNull(1).orEmpty())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderMeta(workOrderId: String, priority: String, tagText: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("priority", priority.trim())
                .put("tagText", tagText.trim())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderWatchers(workOrderId: String, watcherIds: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val normalized = watcherIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()
            val payload = JSONObject()
                .put("watcherIds", JSONArray(normalized))
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun createTodoTask(
        title: String,
        message: String,
        status: String,
        priority: String,
        dueDate: String,
        assignedToUserId: String,
        invitedUserIds: List<String>,
        workOrderId: String,
        companyId: String,
        locationId: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("title", title.trim())
                .put("message", message.trim())
                .put("status", status.trim().ifBlank { "open" })
                .put("priority", priority.trim().ifBlank { "Normal" })
                .put("dueDate", dueDate.trim())
                .put("assignedToUserId", assignedToUserId.trim())
                .put("invitedUserIds", JSONArray(invitedUserIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
                .put("workOrderId", workOrderId.trim())
                .put("companyId", companyId.trim())
                .put("locationId", locationId.trim())
                .toString()
            request("/api/todo-tasks", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun updateTodoTask(
        taskId: String,
        status: String? = null,
        priority: String? = null,
        dueDate: String? = null,
        assignedToUserId: String? = null,
        invitedUserIds: List<String>? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
            status?.let { payload.put("status", it.trim()) }
            priority?.let { payload.put("priority", it.trim()) }
            dueDate?.let { payload.put("dueDate", it.trim()) }
            assignedToUserId?.let { payload.put("assignedToUserId", it.trim()) }
            invitedUserIds?.let { values ->
                payload.put("invitedUserIds", JSONArray(values.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
            }
            request("/api/todo-tasks/${taskId.pathSegment()}", method = "PATCH", body = payload.toString())
            Unit
        }
    }

    suspend fun addTodoTaskComment(taskId: String, message: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("message", message.trim())
                .toString()
            request("/api/todo-tasks/${taskId.pathSegment()}/comments", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun createVehicleReservation(
        vehicleId: String,
        purpose: String,
        startAt: String,
        endAt: String,
        destination: String,
        reservedForUserId: String,
        reservedForLabel: String,
        note: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", "reserved")
                .put("purpose", purpose)
                .put("startAt", startAt)
                .put("endAt", endAt)
                .put("destination", destination)
                .put("reservedForUserId", reservedForUserId)
                .put("reservedForUserIds", JSONArray().put(reservedForUserId).takeIf { reservedForUserId.isNotBlank() } ?: JSONArray())
                .put("reservedForLabel", reservedForLabel)
                .put("reservedForLabels", JSONArray().put(reservedForLabel).takeIf { reservedForLabel.isNotBlank() } ?: JSONArray())
                .put("note", note)
                .toString()
            request("/api/vehicles/${vehicleId.pathSegment()}/reservations", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun recordVehicleUsage(
        vehicleId: String,
        mode: String,
        actionAt: String,
        odometerKm: String,
        destination: String,
        reservationId: String,
        linkedWorkOrderId: String,
        linkedWorkOrderNumber: String,
        performedBy: String,
        vehicleCondition: String,
        vehicleClean: Boolean,
        documentsPresent: Boolean,
        fuelOk: Boolean,
        damageNoted: Boolean,
        note: String,
        files: List<WorkOrderUploadFile> = emptyList(),
        signaturePngBytes: ByteArray? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val fileArray = JSONArray()
            files.forEach { upload ->
                val dataUrl = "data:${upload.fileType};base64,${Base64.getEncoder().encodeToString(upload.bytes)}"
                fileArray.put(
                    JSONObject()
                        .put("fileName", upload.fileName)
                        .put("fileType", upload.fileType)
                        .put("fileSize", upload.fileSize)
                        .put("documentCategory", upload.documentCategory)
                        .put("description", upload.description)
                        .put("dataUrl", dataUrl),
                )
            }
            val signatureDataUrl = signaturePngBytes
                ?.takeIf { it.isNotEmpty() }
                ?.let { "data:image/png;base64,${Base64.getEncoder().encodeToString(it)}" }
                .orEmpty()
            val payload = JSONObject()
                .put("mode", mode)
                .put("actionAt", actionAt)
                .put(if (mode == "return") "returnAt" else "departureAt", actionAt)
                .put("odometerKm", odometerKm)
                .put("destination", destination)
                .put("reservationId", reservationId)
                .put("linkedWorkOrderId", linkedWorkOrderId)
                .put("linkedWorkOrderNumber", linkedWorkOrderNumber)
                .put("performedBy", performedBy)
                .put("vehicleCondition", vehicleCondition)
                .put("vehicleClean", vehicleClean)
                .put("documentsPresent", documentsPresent)
                .put("fuelOk", fuelOk)
                .put("damageNoted", damageNoted)
                .put("note", note)
                .put("files", fileArray)
                .put("signatureDataUrl", signatureDataUrl)
                .toString()
            request("/api/vehicles/${vehicleId.pathSegment()}/usage", method = "POST", body = payload)
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

    suspend fun downloadPeopleTrainingImportTemplate(
        companyId: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val query = companyId.trim().takeIf { it.isNotBlank() }
                ?.let { "?companyId=${it.pathSegment()}" }
                ?: ""
            val connection = openConnection(
                "/api/people-training-records/import-template$query",
                method = "GET",
                body = null,
                accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti Excel predložak osposobljavanja (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { "osposobljavanja-import.xlsx" },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                    ?: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                bytes = bytes,
            )
        }
    }

    suspend fun importPeopleTrainingRecords(
        companyId: String,
        locationId: String,
        fileName: String,
        fileType: String,
        bytes: ByteArray,
        importMode: String = "",
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanCompanyId = companyId.trim()
            if (cleanCompanyId.isBlank()) {
                throw IllegalStateException("RN nema odabranu tvrtku za import osposobljavanja.")
            }
            val mimeType = fileType.ifBlank { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
            val payload = JSONObject()
                .put("companyId", cleanCompanyId)
                .put("locationId", locationId.trim())
                .put("fileName", fileName.ifBlank { "osposobljavanja-import.xlsx" })
                .put("fileType", mimeType)
                .put("dataUrl", "data:$mimeType;base64,${Base64.getEncoder().encodeToString(bytes)}")
                .put("importMode", importMode.trim())
                .toString()
            request(
                "/api/people-training-records/import",
                method = "POST",
                body = payload,
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            "Masovni import ljudi je spremljen."
        }
    }

    suspend fun createPeopleTrainingRecord(
        workOrderId: String,
        companyId: String,
        locationId: String,
        draft: WorkOrderTrainingManualPersonDraft,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanCompanyId = companyId.trim()
            if (cleanCompanyId.isBlank()) {
                throw IllegalStateException("RN nema odabranu tvrtku za dodavanje osobe.")
            }
            val fullName = draft.fullName.trim()
            if (fullName.isBlank()) {
                throw IllegalStateException("Upiši ime i prezime osobe.")
            }
            val payload = JSONObject()
                .put("companyId", cleanCompanyId)
                .put("locationId", locationId.trim())
                .put("fullName", fullName)
                .put("oib", draft.oib.filter { it.isDigit() })
                .put("email", draft.email.trim())
                .put("phone", draft.phone.trim())
                .put("jobTitle", draft.jobTitle.trim())
                .put("activityStatus", "DA")
                .put("trainingItems", JSONArray())
                .toString()
            val response = request(
                "/api/mobile/work-orders/${workOrderId.pathSegment()}/training/person",
                method = "POST",
                body = payload,
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            JSONObject(response).optString("message").ifBlank { "Osoba je dodana u osposobljavanja." }
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
            val workEquipmentInspectorIds = JSONArray()
            draft.workEquipmentInspectorUserIds.forEach { workEquipmentInspectorIds.put(it) }
            val workEnvironmentInspectorIds = JSONArray()
            draft.workEnvironmentInspectorUserIds.forEach { workEnvironmentInspectorIds.put(it) }
            val selectedEquipmentIds = JSONArray()
            draft.selectedEquipmentIds.forEach { selectedEquipmentIds.put(it) }
            val selectedLegalFrameworkIds = JSONArray()
            draft.selectedLegalFrameworkIds.forEach { selectedLegalFrameworkIds.put(it) }
            val selectedRulebookIds = JSONArray()
            draft.selectedRulebookIds.forEach { selectedRulebookIds.put(it) }
            val selectedWorkEquipmentRecords = JSONArray()
            draft.selectedWorkEquipmentRecords.forEach { selectedWorkEquipmentRecords.put(it.toJsonObject()) }
            val selectedWorkEnvironmentRecords = JSONArray()
            draft.selectedWorkEnvironmentRecords.forEach { selectedWorkEnvironmentRecords.put(it.toJsonObject()) }
            val manualWorkEquipments = JSONArray()
            draft.manualWorkEquipments.forEach { manualWorkEquipments.put(it.toJsonObject()) }
            val executors = JSONArray()
            draft.executors.forEach { executors.put(it) }
            val additionalRecords = JSONArray()
            draft.additionalRecords.forEach { record ->
                additionalRecords.put(
                    JSONObject()
                        .put("serviceKey", record.serviceKey)
                        .put("serviceIndex", record.serviceIndex)
                        .put("serviceCode", record.serviceCode)
                        .put("serviceName", record.serviceName)
                        .put("objectId", record.objectId)
                        .put("objectName", record.objectName),
                )
            }
            val payload = JSONObject()
                .put("objectId", draft.objectId)
                .put("objectName", draft.objectName)
                .put("inspectionDate", draft.inspectionDate)
                .put("issuedDate", draft.issuedDate)
                .put("issuedPlace", draft.issuedPlace)
                .put("testingLocation", draft.testingLocation)
                .put("note", draft.note)
                .put("inspectionType", draft.inspectionType)
                .put("completedBy", draft.completedBy)
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
                .put("selectedWorkEquipmentRecords", selectedWorkEquipmentRecords)
                .put("selectedWorkEnvironmentRecords", selectedWorkEnvironmentRecords)
                .put("manualWorkEquipments", manualWorkEquipments)
                .put("workEquipmentSubmitResult", draft.workEquipmentSubmitResult.toJsonObject())
                .put("workEnvironmentSubmitResult", draft.workEnvironmentSubmitResult.toJsonObject())
                .put("signatureMode", draft.signatureMode)
                .put("validityMonths", draft.validityMonths)
                .put("electricalValidityMonths", draft.electricalValidityMonths)
                .put("tipkaloValidityMonths", draft.tipkaloValidityMonths)
                .put("serviceValidityMonths", draft.serviceValidityMonths.toJsonObject())
                .put("executors", executors)
                .put("inspectorUserIds", inspectorIds)
                .put("inspectorUserId", draft.inspectorUserId)
                .put("authorizationHolderUserId", draft.authorizationHolderUserId)
                .put("electricalInspectorUserIds", electricalInspectorIds)
                .put("electricalInspectorUserId", draft.electricalInspectorUserId)
                .put("electricalAuthorizationHolderUserId", draft.electricalAuthorizationHolderUserId)
                .put("tipkaloInspectorUserIds", tipkaloInspectorIds)
                .put("tipkaloInspectorUserId", draft.tipkaloInspectorUserId)
                .put("tipkaloAuthorizationHolderUserId", draft.tipkaloAuthorizationHolderUserId)
                .put("radna_opremaInspectorUserIds", workEquipmentInspectorIds)
                .put("radna_opremaInspectorUserId", draft.workEquipmentInspectorUserId)
                .put("radna_opremaAuthorizationHolderUserId", draft.workEquipmentAuthorizationHolderUserId)
                .put("radni_okolisInspectorUserIds", workEnvironmentInspectorIds)
                .put("radni_okolisInspectorUserId", draft.workEnvironmentInspectorUserId)
                .put("radni_okolisAuthorizationHolderUserId", draft.workEnvironmentAuthorizationHolderUserId)
                .put("handoverVerifierUserId", draft.handoverVerifierUserId)
                .put("fieldValues", draft.fieldValues.toJsonObject())
                .put("templateFieldValues", draft.templateFieldValues.toNestedJsonObject())
                .put("fieldSheets", draft.fieldSheets.toMeasurementSheetJsonObject())
                .put("templateFieldSheets", draft.templateFieldSheets.toNestedMeasurementSheetJsonObject())
                .put("additionalRecords", additionalRecords)
                .put("includeHandoverProtocol", draft.includeHandoverProtocol)
                .put("async", true)
                .toString()
            var json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/generate-documents",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = DOCUMENT_GENERATION_READ_TIMEOUT_MS,
                ),
            )
            val jobId = json.firstClean("jobId", "id")
            var status = json.firstClean("status").lowercase()
            if (jobId.isNotBlank() && (status == "pending" || status == "running")) {
                var attempts = 0
                while (attempts < DOCUMENT_GENERATION_POLL_ATTEMPTS) {
                    delay(DOCUMENT_GENERATION_POLL_INTERVAL_MS)
                    json = JSONObject(
                        request(
                            "/api/mobile/work-orders/${workOrderId.pathSegment()}/generate-documents/jobs/${jobId.pathSegment()}",
                            readTimeoutMs = DEFAULT_READ_TIMEOUT_MS,
                        ),
                    )
                    status = json.firstClean("status").lowercase()
                    if (status == "completed") {
                        break
                    }
                    if (status == "failed") {
                        throw IllegalStateException(
                            json.firstClean("error", "message").ifBlank { "Ne mogu izraditi dokumentaciju RN-a." },
                        )
                    }
                    attempts += 1
                }
                if (status != "completed") {
                    throw IllegalStateException("Izrada dokumentacije još traje. Osvježi dokumentaciju RN-a za nekoliko trenutaka.")
                }
            }
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

    suspend fun confirmWorkOrderTraining(
        workOrderId: String,
        mode: String,
        personIds: List<String>,
        serviceKeys: List<String>,
        sendEmails: Boolean = true,
        onlyRecommended: Boolean = true,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("mode", mode.trim().ifBlank { "online_test" })
                .put("personIds", JSONArray(personIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put("serviceKeys", JSONArray(serviceKeys.map { it.trim() }.filter { it.isNotBlank() }))
                .put("onlyRecommended", onlyRecommended)
                .put("sendEmails", sendEmails)
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/training/confirm",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            json.firstClean("message").ifBlank { "Osposobljavanje je pripremljeno." }
        }
    }

    suspend fun generateWorkOrderTrainingRecord(workOrderId: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/training-record",
                    method = "POST",
                    body = "{}",
                    readTimeoutMs = 90_000,
                ),
            )
            json.firstClean("message").ifBlank { "Zapisnik osposobljavanja je spremljen u Dokumente." }
        }
    }

    suspend fun submitWorkOrderIsznrWorkEquipment(
        workOrderId: String,
        selectedItemIds: List<String>,
        manualEquipments: List<IsznrManualWorkEquipment> = emptyList(),
    ): Result<IsznrWorkEquipmentSubmitResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("selectedItemIds", JSONArray(selectedItemIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put(
                    "manualEquipments",
                    JSONArray(
                        manualEquipments
                            .map {
                                JSONObject()
                                    .put("name", it.name.trim())
                                    .put("manufacturer", it.manufacturer.trim())
                                    .put("model", it.model.trim())
                                    .put("serialNumber", it.serialNumber.trim())
                                    .put("inventoryNumber", it.inventoryNumber.trim())
                                    .put("note", it.note.trim())
                                    .put("technicalData", it.technicalData.trim())
                                    .put("purposeDescription", it.purposeDescription.trim())
                                    .put("workspacePosition", it.workspacePosition.trim())
                                    .put("workingSubstancesAndRawMaterials", it.workingSubstancesAndRawMaterials.trim())
                                    .put("useAndMaintenance", it.useAndMaintenance.trim())
                                    .put("methodsProceduresAndNorms", it.methodsProceduresAndNorms.trim())
                                    .put("deficiencies", it.deficiencies.trim())
                                    .put("measuresToEliminateDeficiencies", it.measuresToEliminateDeficiencies.trim())
                                    .put("finalGrade", it.finalGrade.trim().ifBlank { "1" })
                                    .put("mechanicalItems", JSONArray(it.mechanicalItems.map { item -> item.toJsonObject() }))
                                    .put("electricalItems", JSONArray(it.electricalItems.map { item -> item.toJsonObject() }))
                                    .put("hazardRegisterIris", JSONArray(it.hazardRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
                                    .put("harmfulnessRegisterIris", JSONArray(it.harmfulnessRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
                                    .put("strainRegisterIris", JSONArray(it.strainRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
                                    .put("attachments", JSONArray(it.attachments.map { file -> file.toJsonObject() }))
                            },
                    ),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/isznr-work-equipment",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            IsznrWorkEquipmentSubmitResult(
                message = json.firstClean("message").ifBlank { "RO zapisnik je poslan u IS ZNR." },
                isznrId = json.firstClean("isznrId"),
                recordNumber = json.firstClean("recordNumber"),
                pdfUrl = json.firstClean("pdfUrl", "isznrPdfUrl"),
                pdfBridgeUrl = absoluteSafeNexusUrl(json.firstClean("pdfBridgeUrl", "isznrPdfBridgeUrl")),
                attachmentSubmitted = json.optJSONObject("attachments")?.optInt("submitted")
                    ?: json.optJSONObject("attachment")?.optInt("submitted")
                    ?: json.optInt("attachmentSubmitted", 0),
                attachmentFailed = json.optJSONObject("attachments")?.optInt("failed")
                    ?: json.optJSONObject("attachment")?.optInt("failed")
                    ?: json.optInt("attachmentFailed", 0),
                equipmentCount = json.optInt("equipmentCount", selectedItemIds.size + manualEquipments.size),
                submittedAt = json.firstClean("submittedAt"),
            )
        }
    }

    suspend fun submitWorkOrderIsznrPhysicalFactors(
        workOrderId: String,
        selectedItemIds: List<String>,
        manualPhysicalFactors: IsznrManualPhysicalFactors = IsznrManualPhysicalFactors(),
    ): Result<IsznrWorkEquipmentSubmitResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("selectedItemIds", JSONArray(selectedItemIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put(
                    "common",
                    JSONObject()
                        .put("inspectionDate", manualPhysicalFactors.startDate.trim())
                        .put("issuedDate", manualPhysicalFactors.endDate.trim())
                        .put("testingLocation", manualPhysicalFactors.location.trim())
                        .put("outsideTemperature", manualPhysicalFactors.airTemperature.trim())
                        .put("relativeHumidity", manualPhysicalFactors.relativeAirHumidity.trim())
                        .put("airflowSpeed", manualPhysicalFactors.airFlowSpeed.trim()),
                )
                .put("manualPhysicalFactors", manualPhysicalFactors.toJsonObject())
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/isznr-work-environment",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            IsznrWorkEquipmentSubmitResult(
                message = json.firstClean("message").ifBlank { "FC zapisnik je poslan u IS ZNR." },
                isznrId = json.firstClean("isznrId"),
                recordNumber = json.firstClean("recordNumber"),
                pdfUrl = json.firstClean("pdfUrl", "isznrPdfUrl"),
                pdfBridgeUrl = absoluteSafeNexusUrl(json.firstClean("pdfBridgeUrl", "isznrPdfBridgeUrl")),
                equipmentCount = json.optInt("sourceRecordCount", selectedItemIds.size + if (manualPhysicalFactors.isReadyForIsznrPost()) 1 else 0),
                submittedAt = json.firstClean("submittedAt"),
            )
        }
    }

    private fun absoluteSafeNexusUrl(value: String): String {
        val trimmed = value.trim()
        if (trimmed.isBlank()) return ""
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            return trimmed
        }
        return if (trimmed.startsWith("/")) "$baseUrl$trimmed" else "$baseUrl/$trimmed"
    }

    suspend fun prepareWorkOrderDocumentationAi(
        workOrderId: String,
        workOrderNumber: String,
        template: WorkOrderDocumentationTemplate,
        files: List<WorkOrderDocumentationAiFile>,
        modelTier: String = "standard",
    ): Result<WorkOrderDocumentationAiResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("purpose", "document-template-runtime-ai-prefill")
                .put("templateId", template.id)
                .put("workOrderId", workOrderId)
                .put("workOrderNumber", workOrderNumber)
                .put("files", files.toDocumentationAiFilesJsonArray())
                .put("fields", template.aiFields.toDocumentationAiFieldsJsonArray())
                .put("columns", template.aiMeasurementColumns.toDocumentationAiColumnsJsonArray())
                .put("modelTier", modelTier.ifBlank { "standard" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "standard" }))
                .put("dryRun", false)
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkOrderDocumentationAiResult()
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

    suspend fun downloadPeopleTrainingDocument(
        recordId: String,
        documentId: String,
        fallbackFileName: String,
        fallbackFileType: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/people-training-records/${recordId.pathSegment()}/documents/${documentId.pathSegment()}/download"
            val connection = openConnection(path, method = "GET", body = null, accept = "*/*")
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument osposobljavanja (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "osposobljavanje-dokument" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadMobileDocument(record: MobileRecord): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val downloadPath = record.meta["downloadPath"].orEmpty().trim()
            val storageUrl = record.meta["storageUrl"].orEmpty().trim()
            val pathOrUrl = downloadPath.ifBlank { storageUrl }
            if (pathOrUrl.isBlank()) {
                throw IllegalStateException("Dokument nema dostupnu datoteku za preuzimanje.")
            }

            val connection = openBinaryDownloadConnection(pathOrUrl)
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument (${connection.responseCode})."
                })
            }

            val fallbackFileName = record.meta["fileName"].orEmpty()
                .ifBlank { record.title.ifBlank { "dokument" } }
            val fallbackFileType = record.meta["fileType"].orEmpty()
                .ifBlank { guessDocumentMimeType(fallbackFileName) }

            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadFieldInquiryDocument(
        inquiryId: String,
        documentId: String,
        fallbackFileName: String,
        fallbackFileType: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/mobile/field-inquiries/${inquiryId.pathSegment()}/documents/${documentId.pathSegment()}/download"
            val connection = openBinaryDownloadConnection(path)
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument plana terena (${connection.responseCode})."
                })
            }

            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "plan-terena-dokument" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadWorkOrderPdf(workOrderId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/work-orders/${workOrderId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
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

    suspend fun downloadVehicleEvidencePdf(vehicleId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/vehicles/${vehicleId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF evidenciju vozila (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "evidencija-vozila.pdf" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/pdf" }
                    ?: "application/pdf",
                bytes = bytes,
            )
        }
    }

    suspend fun downloadOfferPdf(offerId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/offers/${offerId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF ponude (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "ponuda.pdf" } },
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
                    readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
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
        readTimeoutMs: Int = DEFAULT_READ_TIMEOUT_MS,
    ): HttpURLConnection {
        return (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = DEFAULT_CONNECT_TIMEOUT_MS
            readTimeout = readTimeoutMs
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

    private fun openBinaryDownloadConnection(pathOrUrl: String): HttpURLConnection {
        val target = if (pathOrUrl.startsWith("http://", ignoreCase = true) || pathOrUrl.startsWith("https://", ignoreCase = true)) {
            pathOrUrl
        } else {
            "$baseUrl${if (pathOrUrl.startsWith("/")) pathOrUrl else "/$pathOrUrl"}"
        }
        return (URL(target).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = DEFAULT_CONNECT_TIMEOUT_MS
            readTimeout = PDF_ACTION_READ_TIMEOUT_MS
            setRequestProperty("Accept", "*/*")
            setRequestProperty("X-SafeNexus-Client", "android")
            if (accessToken.isNotBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            if (authCookieHeader.isNotBlank()) {
                setRequestProperty("Cookie", authCookieHeader)
            }
        }
    }

    private fun request(
        path: String,
        method: String = "GET",
        body: String? = null,
        readTimeoutMs: Int = DEFAULT_READ_TIMEOUT_MS,
        allowAuthRefresh: Boolean = true,
    ): String {
        val connection = openConnection(path, method, body, readTimeoutMs = readTimeoutMs)
        val responseText = readResponse(connection)
        rememberAuthCookies(connection)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED &&
            allowAuthRefresh &&
            !path.startsWith("/api/auth/login") &&
            !path.startsWith("/api/auth/refresh") &&
            refreshSessionInternal() != null
        ) {
            return request(path, method, body, readTimeoutMs, allowAuthRefresh = false)
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(extractErrorMessage(responseText).ifBlank {
                "SafeNexus API trenutno nije dostupan (${connection.responseCode})."
            })
        }
        return responseText
    }

    private fun refreshSessionInternal(): SafeNexusUser? {
        if (accessToken.isBlank() && authCookieHeader.isBlank()) return null

        return runCatching {
            val connection = openConnection(
                "/api/auth/refresh",
                method = "POST",
                body = "{}",
                readTimeoutMs = DEFAULT_READ_TIMEOUT_MS,
            )
            val responseText = readResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) return null

            val json = JSONObject(responseText)
            val refreshedMobileToken = json.optString("mobileAccessToken", "").trim()
            if (refreshedMobileToken.isNotBlank()) {
                accessToken = refreshedMobileToken
            }
            json.optJSONObject("user").toSafeNexusUser()
        }.getOrNull()
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

private fun JSONObject?.toSafeNexusUser(): SafeNexusUser {
    val user = this ?: JSONObject()
    return SafeNexusUser(
        displayName = user.firstClean("fullName", "displayName", "username", "email").ifBlank { "SafeNexus" },
        email = user.firstClean("email", "username"),
    )
}

private fun String.pathSegment(): String =
    URLEncoder.encode(this, Charsets.UTF_8.name()).replace("+", "%20")

private fun IsznrRoAssessmentItem.toJsonObject(): JSONObject =
    JSONObject()
        .put("registerIri", registerIri.trim())
        .put("label", label.trim())
        .put("customContent", customContent.trim())
        .put("measuredValue", measuredValue.trim())
        .put("meetsConditions", meetsConditions)

private fun IsznrRoAttachmentFile.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("fileName", fileName.trim())
        .put("fileType", fileType.trim())
        .put("fileSize", fileSize)
        .put("contentDataUrl", contentDataUrl.trim())

private fun WorkOrderDocumentationOption.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("label", label.trim())
        .put("subtitle", subtitle.trim())
        .put("status", status.trim())
        .put("meta", meta.toJsonObject())

private fun IsznrManualWorkEquipment.toJsonObject(): JSONObject =
    JSONObject()
        .put("name", name.trim())
        .put("manufacturer", manufacturer.trim())
        .put("model", model.trim())
        .put("serialNumber", serialNumber.trim())
        .put("inventoryNumber", inventoryNumber.trim())
        .put("note", note.trim())
        .put("technicalData", technicalData.trim())
        .put("purposeDescription", purposeDescription.trim())
        .put("workspacePosition", workspacePosition.trim())
        .put("workingSubstancesAndRawMaterials", workingSubstancesAndRawMaterials.trim())
        .put("useAndMaintenance", useAndMaintenance.trim())
        .put("methodsProceduresAndNorms", methodsProceduresAndNorms.trim())
        .put("deficiencies", deficiencies.trim())
        .put("measuresToEliminateDeficiencies", measuresToEliminateDeficiencies.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })
        .put("mechanicalItems", JSONArray(mechanicalItems.map { item -> item.toJsonObject() }))
        .put("electricalItems", JSONArray(electricalItems.map { item -> item.toJsonObject() }))
        .put("hazardRegisterIris", JSONArray(hazardRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("harmfulnessRegisterIris", JSONArray(harmfulnessRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("strainRegisterIris", JSONArray(strainRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("attachments", JSONArray(attachments.map { file -> file.toJsonObject() }))

private fun IsznrManualPhysicalFactors.toJsonObject(): JSONObject =
    JSONObject()
        .put("location", location.trim())
        .put("startDate", startDate.trim())
        .put("endDate", endDate.trim())
        .put("deadlineForNextExamination", deadlineForNextExamination.trim())
        .put("technicalDocumentation", technicalDocumentation.trim())
        .put("methodsProceduresAndNorms", methodsProceduresAndNorms.trim())
        .put("workProcessConditions", workProcessConditions.trim())
        .put("airTemperature", airTemperature.trim())
        .put("relativeAirHumidity", relativeAirHumidity.trim())
        .put("airFlowSpeed", airFlowSpeed.trim())
        .put("typesOfExamination", JSONArray(typesOfExamination.map { it.trim() }.filter { it.isNotBlank() }))
        .put("spaces", JSONArray(spaces.filter { it.isReadyForIsznrPost() }.map { it.toJsonObject() }))
        .put("measurements", JSONArray(measurements.filter { it.isReadyForIsznrPost() }.map { it.toJsonObject() }))

private fun IsznrFcSpaceDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("name", name.trim())
        .put("description", description.trim())
        .put("workProcess", workProcess.trim())
        .put("workEquipment", workEquipment.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })
        .put("temperatureAllowed", temperatureAllowed.trim())
        .put("temperatureMin", temperatureMin.trim())
        .put("temperatureMax", temperatureMax.trim())
        .put("humidityAllowed", humidityAllowed.trim())
        .put("humidityMin", humidityMin.trim())
        .put("humidityMax", humidityMax.trim())
        .put("airflowAllowed", airflowAllowed.trim())
        .put("airflowMin", airflowMin.trim())
        .put("airflowMax", airflowMax.trim())
        .put("illuminationAllowed", illuminationAllowed.trim())
        .put("illuminationMin", illuminationMin.trim())
        .put("illuminationMax", illuminationMax.trim())
        .put("noiseAllowed", noiseAllowed.trim())
        .put("noiseMin", noiseMin.trim())
        .put("noiseMax", noiseMax.trim())
        .put("handArmVibrationLimit", handArmVibrationLimit.trim())
        .put("handArmVibrationWarning", handArmVibrationWarning.trim())
        .put("handArmVibrationMin", handArmVibrationMin.trim())
        .put("handArmVibrationMax", handArmVibrationMax.trim())
        .put("wholeBodyVibrationLimit", wholeBodyVibrationLimit.trim())
        .put("wholeBodyVibrationWarning", wholeBodyVibrationWarning.trim())
        .put("wholeBodyVibrationMin", wholeBodyVibrationMin.trim())
        .put("wholeBodyVibrationMax", wholeBodyVibrationMax.trim())

private fun IsznrFcMeasurementDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("spaceId", spaceId.trim())
        .put("type", type.trim())
        .put("measuringPlace", measuringPlace.trim())
        .put("measuredValue", measuredValue.trim())
        .put("allowedValue", allowedValue.trim())
        .put("note", note.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })

private fun IsznrFcSpaceDraft.isReadyForIsznrPost(): Boolean =
    name.trim().isNotBlank()

private fun IsznrFcMeasurementDraft.isReadyForIsznrPost(): Boolean =
    measuringPlace.trim().isNotBlank() && measuredValue.trim().isNotBlank()

private fun IsznrManualPhysicalFactors.isReadyForIsznrPost(): Boolean =
    spaces.any { it.isReadyForIsznrPost() } && measurements.any { it.isReadyForIsznrPost() }

private fun IsznrWorkEquipmentSubmitResult.toJsonObject(): JSONObject =
    JSONObject()
        .put("message", message.trim())
        .put("isznrId", isznrId.trim())
        .put("recordNumber", recordNumber.trim())
        .put("pdfUrl", pdfUrl.trim())
        .put("pdfBridgeUrl", pdfBridgeUrl.trim())
        .put("attachmentSubmitted", attachmentSubmitted)
        .put("attachmentFailed", attachmentFailed)
        .put("equipmentCount", equipmentCount)
        .put("submittedAt", submittedAt.trim())

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

private fun guessDocumentMimeType(fileName: String): String {
    val extension = fileName.substringAfterLast('.', "").lowercase()
    return when (extension) {
        "pdf" -> "application/pdf"
        "doc" -> "application/msword"
        "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        "xls" -> "application/vnd.ms-excel"
        "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "webp" -> "image/webp"
        "txt" -> "text/plain"
        "html", "htm" -> "text/html"
        else -> "application/octet-stream"
    }
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

private fun JSONObject.firstInt(defaultValue: Int, vararg keys: String): Int {
    for (key in keys) {
        if (!has(key) || isNull(key)) continue
        val raw = opt(key)
        val value = when (raw) {
            is Number -> raw.toInt()
            is String -> raw.trim().toIntOrNull()
            else -> null
        }
        if (value != null) return value
    }
    return defaultValue
}

private fun JSONObject.firstNullableBoolean(vararg keys: String): Boolean? {
    for (key in keys) {
        if (!has(key) || isNull(key)) continue
        val raw = opt(key)
        when (raw) {
            is Boolean -> return raw
            is Number -> return raw.toInt() != 0
            is String -> {
                val normalized = raw.trim().lowercase()
                if (normalized in setOf("true", "1", "yes", "da", "passed", "pass", "polozeno")) return true
                if (normalized in setOf("false", "0", "no", "ne", "failed", "fail", "nije_polozeno")) return false
            }
        }
    }
    return null
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

private fun JSONArray?.toIntList(): List<Int> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val entry = opt(index)
            val value = when (entry) {
                is Number -> entry.toInt()
                is String -> entry.trim().toIntOrNull()
                else -> null
            }
            if (value != null) add(value)
        }
    }
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
        riskAssessmentsTotal = optInt("riskAssessmentsTotal", 0),
        measurementEquipmentTotal = optInt("measurementEquipmentTotal", 0),
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

private fun JSONObject?.toNestedStringMap(): Map<String, Map<String, String>> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val values = optJSONObject(key).toStringMap()
            if (values.isNotEmpty()) {
                put(key, values)
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

private fun FieldInquiryDraft.toJsonPayload(): String =
    JSONObject()
        .put("title", title)
        .put("status", status)
        .put("plannedDate", plannedDate)
        .put("timeFrom", timeFrom)
        .put("timeTo", timeTo)
        .put("companyId", companyId)
        .put("locationId", locationId)
        .put("workOrderId", workOrderId)
        .put("vehicleId", vehicleId)
        .put("contactName", contactName)
        .put("contactPhone", contactPhone)
        .put("serviceLine", serviceLine)
        .put("note", note)
        .put("assignedUserIds", JSONArray(assignedUserIds))
        .put("assignedUserLabels", JSONArray(assignedUserLabels))
        .put("syncWorkOrderExecutionDate", syncWorkOrderExecutionDate)
        .also { json ->
            documents?.let { docs ->
                json.put("documents", JSONArray(docs.map { it.toJsonObject() }))
            }
        }
        .toString()

private fun FieldInquiryDocumentDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id)
        .put("fileName", fileName)
        .put("fileType", fileType)
        .put("fileSize", fileSize)
        .put("documentCategory", documentCategory)
        .put("description", description)
        .put("dataUrl", dataUrl)

private fun JobCreateDraft.toJsonPayload(): String =
    JSONObject()
        .put("title", title.trim())
        .put("status", status.ifBlank { "draft" })
        .put("description", description.trim())
        .put("environment", JSONObject())
        .put("conditions", JSONObject())
        .put("hazards", JSONArray())
        .put("ppeItems", JSONArray())
        .toString()

private fun riskTextListJson(value: String): JSONArray {
    val items = value
        .split("\n", ";", ",")
        .map { it.trim() }
        .filter { it.isNotBlank() }
    return JSONArray(items)
}

private fun RiskAssessmentCreateDraft.toJsonPayload(): String {
    val jobArray = JSONArray()
    jobs.forEachIndexed { index, job ->
        val riskRows = JSONArray()
        job.riskRows.forEach { risk ->
            riskRows.put(
                JSONObject()
                    .put("hazard", risk.hazard.trim())
                    .put("source", risk.source.trim())
                    .put("possibleConsequences", risk.possibleConsequences.trim())
                    .put("riskLevel", risk.riskLevel.trim())
                    .put("existingMeasures", risk.existingMeasures.trim())
                    .put("additionalMeasures", risk.additionalMeasures.trim())
                    .put("measures", risk.measures.trim()),
            )
        }

        val ppeItems = JSONArray()
        job.ppeItems.forEach { ppe ->
            ppeItems.put(
                JSONObject()
                    .put("name", ppe.name.trim())
                    .put("category", ppe.category.trim())
                    .put("norm", ppe.norm.trim())
                    .put("description", ppe.description.trim())
                    .put("required", true)
                    .put("mandatory", true),
            )
        }

        jobArray.put(
            JSONObject()
                .put("id", "mobile-job-${System.currentTimeMillis()}-$index")
                .put("sourceJobIds", JSONArray(listOf(job.sourceJobId).filter { it.isNotBlank() }))
                .put("status", "draft")
                .put("jobTitle", job.jobTitle.trim())
                .put("shortDescription", job.description.trim().take(220))
                .put("description", job.description.trim())
                .put("tasks", job.tasks.trim())
                .put("workerCount", job.workerCount.trim())
                .put("workplace", job.workplace.trim())
                .put("workSchedule", job.workSchedule.trim())
                .put("workOrganization", job.workOrganization.trim())
                .put("workEnvironment", job.workEnvironment.trim())
                .put("workEquipment", job.workEquipment.trim())
                .put("toolsAndMachines", job.toolsAndMachines.trim())
                .put("workSubstances", job.workSubstances.trim())
                .put("trainings", job.trainings.trim())
                .put("medicalExams", job.medicalExams.trim())
                .put("ppeText", job.ppeText.trim())
                .put("note", job.note.trim())
                .put("riskRows", riskRows)
                .put("ppeItems", ppeItems),
        )
    }

    val organizationUnitArray = JSONArray()
    organizationUnits.forEachIndexed { index, unit ->
        organizationUnitArray.put(
            JSONObject()
                .put("type", unit.type.ifBlank { "workplace" })
                .put("order", index + 1)
                .put("name", unit.name.trim())
                .put("responsiblePerson", unit.responsiblePerson.trim())
                .put("workerCount", unit.workerCount.trim())
                .put("description", unit.description.trim()),
        )
    }

    val measureArray = JSONArray()
    measures.forEachIndexed { index, measure ->
        measureArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("measure", measure.measure.trim())
                .put("deadline", measure.deadline.trim())
                .put("responsiblePerson", measure.responsiblePerson.trim())
                .put("controlMethod", measure.controlMethod.trim())
                .put("status", measure.status.ifBlank { "open" }),
        )
    }

    val manualHandlingArray = JSONArray()
    manualHandling.forEachIndexed { index, item ->
        manualHandlingArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("activity", item.activity.trim())
                .put("jobId", "")
                .put("jobTitle", item.jobTitle.trim())
                .put("loadWeightKg", item.loadWeightKg.trim())
                .put("transfersPerHour", item.transfersPerHour.trim())
                .put("carryingDistanceMeters", item.carryingDistanceMeters.trim())
                .put("posture", item.posture.ifBlank { "upright" })
                .put("workConditions", item.workConditions.ifBlank { "good" })
                .put("note", item.note.trim()),
        )
    }

    val chemicalArray = JSONArray()
    chemicals.forEachIndexed { index, chemical ->
        chemicalArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("name", chemical.name.trim())
                .put("casNumber", chemical.casNumber.trim())
                .put("classification", chemical.classification.trim())
                .put("hazardStatements", riskTextListJson(chemical.hazardStatements))
                .put("ppe", chemical.ppe.trim())
                .put("storage", chemical.storage.trim())
                .put("note", chemical.note.trim()),
        )
    }

    val biologicalArray = JSONArray()
    biologicalRisks.forEachIndexed { index, biological ->
        biologicalArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("agentName", biological.agentName.trim())
                .put("category", biological.category.trim())
                .put("group", biological.group.trim())
                .put("source", biological.source.trim())
                .put("possibleConsequences", biological.possibleConsequences.trim())
                .put("existingMeasures", biological.existingMeasures.trim())
                .put("note", biological.note.trim()),
        )
    }

    val titleValue = title.trim().ifBlank {
        listOf(companyName, "Procjena rizika").filter { it.isNotBlank() }.joinToString(" - ")
    }
    val employerData = JSONObject()
        .put("fullName", employerFullName.trim().ifBlank { companyName })
        .put("address", employerAddress.trim())
        .put("mbs", employerMbs.trim())
        .put("oib", employerOib.trim())
        .put("nkdActivity", employerNkdActivity.trim())
        .put("employeeCount", employerEmployeeCount.trim())
        .put("headquarters", employerHeadquarters.trim())
        .put("detachedLocations", employerDetachedLocations.trim())
        .put("locationScope", if (locationId.isBlank()) "all" else "selected")
        .put("selectedLocationIds", JSONArray(listOf(locationId).filter { it.isNotBlank() }))
        .put("znrServiceMode", znrServiceMode.trim())
        .put("znrExperts", znrExperts.trim())
        .put("znrRepresentatives", znrRepresentatives.trim())
        .put("znrCommitteeParticipation", znrCommitteeParticipation.trim())
        .put("assessmentMembers", collaborators.trim())

    return JSONObject()
        .put("companyId", companyId)
        .put("companyName", companyName)
        .put("locationId", locationId)
        .put("locationName", locationName)
        .put("workOrderId", workOrderId)
        .put("workOrderNumber", workOrderNumber)
        .put("status", status.ifBlank { "draft" })
        .put("title", titleValue)
        .put("assessmentNumber", assessmentNumber)
        .put("assessmentType", "Procjena rizika")
        .put("assessmentDate", assessmentDate)
        .put("revisionDate", revisionDate)
        .put("completionDate", completionDate.ifBlank { assessmentDate })
        .put("teamLead", teamLead.trim())
        .put("collaborators", collaborators.trim())
        .put("employerData", employerData)
        .put("intro", intro.trim())
        .put("workProcessDescription", workProcessDescription.trim())
        .put("generalData", generalData.trim())
        .put("computerWorkplaces", computerWorkplaces.trim())
        .put("basicRules", basicRules.trim())
        .put("specialRules", specialRules.trim())
        .put("omissionsBasic", omissionsBasic.trim())
        .put("omissionsSpecial", omissionsSpecial.trim())
        .put("conclusion", conclusion.trim())
        .put("biologicalHazards", biologicalHazards.trim())
        .put("clientNote", clientNote.trim())
        .put("clientJobInputEnabled", clientJobInputEnabled)
        .put("jobs", jobArray)
        .put("organizationUnits", organizationUnitArray)
        .put("measures", measureArray)
        .put("manualHandling", manualHandlingArray)
        .put("chemicals", chemicalArray)
        .put("biologicalRisks", biologicalArray)
        .toString()
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

private fun List<WorkOrderDocumentationAiFile>.toDocumentationAiFilesJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { file ->
            array.put(
                JSONObject()
                    .put("id", file.id)
                    .put("name", file.name)
                    .put("type", file.type)
                    .put("size", file.size)
                    .put("contentDataUrl", file.contentDataUrl),
            )
        }
    }

private fun List<WorkOrderDocumentationAiField>.toDocumentationAiFieldsJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { field ->
            val rows = JSONArray()
            field.systemRows.forEach { row ->
                rows.put(
                    JSONObject()
                        .put("id", row.id)
                        .put("subtitle", row.subtitle)
                        .put("lineCount", row.lineCount)
                        .put("placeholder", row.placeholder),
                )
            }
            array.put(
                JSONObject()
                    .put("id", field.id)
                    .put("key", field.key)
                    .put("label", field.label)
                    .put("type", field.type)
                    .put("fieldType", field.fieldType)
                    .put("required", field.required)
                    .put("ai", field.ai)
                    .put("valueShape", field.valueShape)
                    .put("sectionSubtitle", field.sectionSubtitle)
                    .put("systemRows", rows),
            )
        }
    }

private fun List<WorkOrderDocumentationAiMeasurementColumn>.toDocumentationAiColumnsJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { column ->
            array.put(
                JSONObject()
                    .put("fieldId", column.fieldId)
                    .put("fieldKey", column.fieldKey)
                    .put("fieldLabel", column.fieldLabel)
                    .put("fieldDescription", column.fieldDescription)
                    .put("columnId", column.columnId)
                    .put("columnIndex", column.columnIndex)
                    .put("columnLetter", column.columnLetter)
                    .put("key", column.key)
                    .put("label", column.label)
                    .put("type", column.type)
                    .put("required", column.required)
                    .put("placeholder", column.placeholder)
                    .put("helpText", column.helpText)
                    .put("aiMapping", column.aiMapping),
            )
        }
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
                    signatureArea = item.firstClean("signatureArea"),
                    signatureRole = item.firstClean("signatureRole"),
                    signatureMultiple = item.optBoolean("signatureMultiple", true),
                    signatureMetaFields = item.optJSONArray("signatureMetaFields").toStringList(),
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
                        signatureArea = item.firstClean("signatureArea"),
                        signatureRole = item.firstClean("signatureRole"),
                        signatureMultiple = item.optBoolean("signatureMultiple", true),
                        signatureMetaFields = item.optJSONArray("signatureMetaFields").toStringList(),
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

private fun JSONObject?.toWorkOrderMeasurementSheetMap(): Map<String, WorkOrderMeasurementSheet> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val sheet = optJSONObject(key).toWorkOrderMeasurementSheet()
            if (sheet.columns.isNotEmpty()) {
                put(key, sheet)
            }
        }
    }
}

private fun JSONObject?.toNestedWorkOrderMeasurementSheetMap(): Map<String, Map<String, WorkOrderMeasurementSheet>> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val sheets = optJSONObject(key).toWorkOrderMeasurementSheetMap()
            if (sheets.isNotEmpty()) {
                put(key, sheets)
            }
        }
    }
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

private fun JSONArray?.toWorkOrderDocumentationAiSystemRows(): List<WorkOrderDocumentationAiSystemRow> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationAiSystemRow(
                    id = item.firstClean("id").ifBlank { "system-description-row-${index + 1}" },
                    subtitle = item.firstClean("subtitle", "label"),
                    lineCount = item.optInt("lineCount", 1).coerceIn(1, 8),
                    placeholder = item.firstClean("placeholder"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiFields(): List<WorkOrderDocumentationAiField> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id").ifBlank { "ai-field-${index + 1}" }
            val key = item.firstClean("key")
            val label = item.firstClean("label").ifBlank { key.ifBlank { id } }
            if (id.isBlank() && key.isBlank()) continue
            add(
                WorkOrderDocumentationAiField(
                    id = id,
                    key = key,
                    label = label,
                    type = item.firstClean("type").ifBlank { "text" },
                    fieldType = item.firstClean("fieldType", "actualFieldType").ifBlank { item.firstClean("type").ifBlank { "text" } },
                    required = item.optBoolean("required", false),
                    ai = item.optJSONObject("ai") ?: item.optJSONObject("aiConfig") ?: JSONObject(),
                    valueShape = item.firstClean("valueShape"),
                    sectionSubtitle = item.firstClean("sectionSubtitle", "section_subtitle"),
                    systemRows = item.optJSONArray("systemRows").toWorkOrderDocumentationAiSystemRows(),
                ),
            )
        }
    }.distinctBy { it.id.ifBlank { it.key } }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementColumns(): List<WorkOrderDocumentationAiMeasurementColumn> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val fieldId = item.firstClean("fieldId")
            val columnId = item.firstClean("columnId")
            if (fieldId.isBlank() || columnId.isBlank()) continue
            add(
                WorkOrderDocumentationAiMeasurementColumn(
                    fieldId = fieldId,
                    fieldKey = item.firstClean("fieldKey"),
                    fieldLabel = item.firstClean("fieldLabel"),
                    fieldDescription = item.firstClean("fieldDescription"),
                    columnId = columnId,
                    columnIndex = item.optInt("columnIndex", index),
                    columnLetter = item.firstClean("columnLetter"),
                    key = item.firstClean("key"),
                    label = item.firstClean("label").ifBlank { columnId },
                    type = item.firstClean("type").ifBlank { "text" },
                    required = item.optBoolean("required", false),
                    placeholder = item.firstClean("placeholder"),
                    helpText = item.firstClean("helpText"),
                    aiMapping = item.optJSONObject("aiMapping") ?: item.optJSONObject("ai") ?: JSONObject(),
                ),
            )
        }
    }
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
                    signatureAreas = item.optJSONArray("signatureAreas").toStringList(),
                    documentNumber = item.firstClean("documentNumber"),
                    documentName = item.firstClean("documentName", "fileName"),
                    dataSourceType = item.firstClean("dataSourceType"),
                    dataSourceTitle = item.firstClean("dataSourceTitle"),
                    dataSourceDate = item.firstClean("dataSourceDate"),
                    dataSourceWorkOrderNumber = item.firstClean("dataSourceWorkOrderNumber"),
                    fields = item.optJSONArray("fields").toWorkOrderDocumentationFields(),
                    fieldBlocks = item.optJSONArray("fieldBlocks").toWorkOrderDocumentationTemplateBlocks(),
                    inspectionTypeOptions = item.optJSONArray("inspectionTypeOptions").toDocumentationFieldOptions(),
                    measurementTables = item.optJSONArray("measurementTables").toWorkOrderMeasurementTables(),
                    aiFields = item.optJSONArray("aiFields").toWorkOrderDocumentationAiFields(),
                    aiMeasurementColumns = item.optJSONArray("aiMeasurementColumns").toWorkOrderDocumentationAiMeasurementColumns(),
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

private fun JSONArray?.toWorkOrderDocumentationSignatureAreaOptions(): List<WorkOrderDocumentationSignatureAreaOptions> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val key = item.firstClean("key", "id", "value")
            if (key.isBlank()) continue
            add(
                WorkOrderDocumentationSignatureAreaOptions(
                    key = key,
                    label = item.firstClean("label", "title", "name").ifBlank { key },
                    inspectorOptions = item.optJSONArray("inspectorOptions").toWorkOrderDocumentationOptions(),
                    authorizationOptions = item.optJSONArray("authorizationOptions").toWorkOrderDocumentationOptions(),
                    defaultInspectorIds = item.optJSONArray("defaultInspectorIds").toStringList(),
                    defaultAuthorizationHolderId = item.firstClean("defaultAuthorizationHolderId"),
                ),
            )
        }
    }.distinctBy { it.key }
}

private fun JSONObject?.toWorkOrderTrainingImportProfile(): WorkOrderTrainingImportProfile {
    if (this == null) return WorkOrderTrainingImportProfile()
    return WorkOrderTrainingImportProfile(
        enabled = optBoolean("enabled", false),
        profileName = firstClean("profileName", "name"),
        sheetName = firstClean("sheetName", "sheet"),
        headerRow = optInt("headerRow", 1),
        firstDataRow = optInt("firstDataRow", 2),
        defaultImportMode = firstClean("defaultImportMode"),
        columnCount = optInt("columnCount", 0),
        requiredColumnCount = optInt("requiredColumnCount", 0),
        columnsLabel = firstClean("columnsLabel"),
    )
}

private fun JSONArray?.toWorkOrderTrainingServices(): List<WorkOrderTrainingService> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingService(
                    id = item.firstClean("id"),
                    serviceId = item.firstClean("serviceId"),
                    serviceKey = item.firstClean("serviceKey").ifBlank { item.firstClean("id") },
                    serviceCode = item.firstClean("serviceCode"),
                    serviceName = item.firstClean("serviceName"),
                    label = item.firstClean("label", "serviceName"),
                    shortLabel = item.firstClean("shortLabel"),
                    validityMonths = item.firstClean("validityMonths"),
                    linkedLearningTestIds = item.optJSONArray("linkedLearningTestIds").toStringList(),
                    linkedLearningTestTitles = item.optJSONArray("linkedLearningTestTitles").toStringList(),
                    linkedLearningTestPassPercents = item.optJSONArray("linkedLearningTestPassPercents").toIntList(),
                    passPercent = item.firstInt(80, "passPercent"),
                    modeDefault = item.firstClean("modeDefault"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderTrainingAssignments(): List<WorkOrderTrainingAssignment> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingAssignment(
                    serviceId = item.firstClean("serviceId"),
                    serviceKey = item.firstClean("serviceKey"),
                    serviceCode = item.firstClean("serviceCode"),
                    serviceName = item.firstClean("serviceName"),
                    label = item.firstClean("label", "serviceName"),
                    mode = item.firstClean("mode"),
                    recommended = item.optBoolean("recommended", false),
                    status = item.firstClean("status"),
                    statusLabel = item.firstClean("statusLabel"),
                    proposalReason = item.firstClean("proposalReason"),
                    linkedLearningTestIds = item.optJSONArray("linkedLearningTestIds").toStringList(),
                    linkedLearningTestTitles = item.optJSONArray("linkedLearningTestTitles").toStringList(),
                    linkedLearningTestPassPercents = item.optJSONArray("linkedLearningTestPassPercents").toIntList(),
                    linkedLearningTestCount = item.optInt("linkedLearningTestCount", 0),
                    passPercent = item.firstInt(80, "passPercent"),
                    scorePercent = item.firstClean("scorePercent"),
                    passed = item.firstNullableBoolean("passed"),
                    learningStatus = item.firstClean("learningStatus"),
                    completedLearningTestCount = item.optInt("completedLearningTestCount", 0),
                    failedLearningTestCount = item.optInt("failedLearningTestCount", 0),
                    questionLimit = item.optInt("questionLimit", 0),
                    timePerQuestionSeconds = item.optInt("timePerQuestionSeconds", 0),
                    timeLimitSeconds = item.optInt("timeLimitSeconds", 0),
                    existingItemId = item.firstClean("existingItemId"),
                    existingValidUntil = item.firstClean("existingValidUntil"),
                    existingPassedOn = item.firstClean("existingPassedOn"),
                    existingDocumentId = item.firstClean("existingDocumentId"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderTrainingPeople(): List<WorkOrderTrainingPerson> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingPerson(
                    id = item.firstClean("id"),
                    fullName = item.firstClean("fullName", "name"),
                    firstName = item.firstClean("firstName"),
                    lastName = item.firstClean("lastName"),
                    oib = item.firstClean("oib"),
                    email = item.firstClean("email"),
                    phone = item.firstClean("phone"),
                    companyId = item.firstClean("companyId"),
                    companyName = item.firstClean("companyName"),
                    locationId = item.firstClean("locationId"),
                    locationName = item.firstClean("locationName"),
                    jobTitle = item.firstClean("jobTitle", "workPlace"),
                    active = item.optBoolean("active", true),
                    recommended = item.optBoolean("recommended", false),
                    recommendedCount = item.optInt("recommendedCount", 0),
                    assignments = item.optJSONArray("assignments").toWorkOrderTrainingAssignments(),
                ),
            )
        }
    }
}

private fun JSONObject?.toWorkOrderTrainingContext(): WorkOrderTrainingContext {
    if (this == null) return WorkOrderTrainingContext()
    return WorkOrderTrainingContext(
        enabled = optBoolean("enabled", false),
        companyId = firstClean("companyId"),
        companyName = firstClean("companyName"),
        locationId = firstClean("locationId"),
        locationName = firstClean("locationName"),
        defaultMode = firstClean("defaultMode").ifBlank { "online_test" },
        services = optJSONArray("services").toWorkOrderTrainingServices(),
        people = optJSONArray("people").toWorkOrderTrainingPeople(),
        peopleCount = optInt("peopleCount", 0),
        recommendedPeopleCount = optInt("recommendedPeopleCount", 0),
        proposedAssignments = optInt("proposedAssignments", 0),
        onlineAssignments = optInt("onlineAssignments", 0),
        liveAssignments = optInt("liveAssignments", 0),
        importProfile = optJSONObject("importProfile").toWorkOrderTrainingImportProfile(),
        importTemplateUrl = firstClean("importTemplateUrl"),
    )
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
        workEquipmentOptions = optJSONArray("workEquipmentOptions").toWorkOrderDocumentationOptions(),
        workEquipmentMechanicalOptions = optJSONArray("workEquipmentMechanicalOptions").toWorkOrderDocumentationOptions(),
        workEquipmentElectricalOptions = optJSONArray("workEquipmentElectricalOptions").toWorkOrderDocumentationOptions(),
        workEquipmentHazardOptions = optJSONArray("workEquipmentHazardOptions").toWorkOrderDocumentationOptions(),
        workEquipmentHarmfulnessOptions = optJSONArray("workEquipmentHarmfulnessOptions").toWorkOrderDocumentationOptions(),
        workEquipmentStrainOptions = optJSONArray("workEquipmentStrainOptions").toWorkOrderDocumentationOptions(),
        workEquipmentStatus = optJSONObject("workEquipmentStatus").toStringMap(),
        workEnvironmentOptions = optJSONArray("workEnvironmentOptions").toWorkOrderDocumentationOptions(),
        workEnvironmentStatus = optJSONObject("workEnvironmentStatus").toStringMap(),
        trainingContext = optJSONObject("trainingContext").toWorkOrderTrainingContext(),
        legalFrameworkOptions = optJSONArray("legalFrameworkOptions").toWorkOrderDocumentationOptions(),
        rulebookOptions = optJSONArray("rulebookOptions").toWorkOrderDocumentationOptions(),
        signaturePersonOptions = optJSONArray("signaturePersonOptions").toWorkOrderDocumentationSignatureAreaOptions(),
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
        serviceValidityMonths = optJSONObject("serviceValidityMonths").toStringMap(),
        fieldValues = optJSONObject("fieldValues").toStringMap(),
        templateFieldValues = optJSONObject("templateFieldValues").toNestedStringMap(),
        fieldSheets = optJSONObject("fieldSheets").toWorkOrderMeasurementSheetMap(),
        templateFieldSheets = optJSONObject("templateFieldSheets").toNestedWorkOrderMeasurementSheetMap(),
    )
}

private fun JSONObject.toWorkOrderDocumentationAiResult(): WorkOrderDocumentationAiResult {
    val result = optJSONObject("result") ?: parseJsonObject(firstClean("outputText")) ?: JSONObject()
    val dryRun = optBoolean("dryRun", false)
    val fieldSuggestions = result.optJSONArray("fieldSuggestions")
        ?: result.optJSONArray("field_suggestions")
    val measurementSuggestions = result.optJSONArray("measurementSuggestions")
        ?: result.optJSONArray("measurement_suggestions")
    val warnings = (
        result.optJSONArray("warnings").toStringList() +
            optJSONArray("warnings").toStringList()
        )
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
    return WorkOrderDocumentationAiResult(
        dryRun = dryRun,
        modelLabel = firstClean("modelLabel", "model"),
        message = if (dryRun) {
            firstClean("nextStep", "message").ifBlank { "NexAI dry-run je prošao, ali live pozivi nisu uključeni na serveru." }
        } else {
            result.firstClean("summary").ifBlank { firstClean("nextStep", "message") }
        },
        fieldSuggestions = fieldSuggestions.toWorkOrderDocumentationAiFieldSuggestions(),
        measurementSuggestions = measurementSuggestions.toWorkOrderDocumentationAiMeasurementSuggestions(),
        warnings = warnings,
    )
}

private fun JSONArray?.toWorkOrderDocumentationAiFieldSuggestions(): List<WorkOrderDocumentationAiFieldSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val value = item.opt("value") ?: item.opt("text") ?: item.opt("content") ?: ""
            val rawValueJson = value.toRawJsonText()
            val valueText = value.toAiDisplayText()
            if (rawValueJson.isBlank() && valueText.isBlank()) continue
            add(
                WorkOrderDocumentationAiFieldSuggestion(
                    fieldId = item.firstClean("fieldId", "field_id", "id"),
                    fieldKey = item.firstClean("fieldKey", "field_key", "key"),
                    fieldLabel = item.firstClean("fieldLabel", "field_label", "label"),
                    valueText = valueText,
                    rawValueJson = rawValueJson,
                    confidence = item.firstClean("confidence"),
                    reason = item.firstClean("reason", "explanation"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementSuggestions(): List<WorkOrderDocumentationAiMeasurementSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val rows = item.optJSONArray("rows").toWorkOrderDocumentationAiMeasurementRows()
            if (rows.isEmpty()) continue
            add(
                WorkOrderDocumentationAiMeasurementSuggestion(
                    fieldId = item.firstClean("fieldId", "field_id", "id"),
                    fieldKey = item.firstClean("fieldKey", "field_key", "key"),
                    fieldLabel = item.firstClean("fieldLabel", "field_label", "label"),
                    rows = rows,
                    confidence = item.firstClean("confidence"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementRows(): List<WorkOrderDocumentationAiMeasurementRowSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val values = item.optJSONObject("values").toStringMap()
            val orderedValues = item.optJSONArray("orderedValues").toStringList().ifEmpty {
                item.optJSONArray("ordered_values").toStringList()
            }
            if (values.isEmpty() && orderedValues.isEmpty()) continue
            add(
                WorkOrderDocumentationAiMeasurementRowSuggestion(
                    values = values,
                    orderedValues = orderedValues,
                    confidence = item.firstClean("confidence"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun parseJsonObject(value: String): JSONObject? =
    runCatching {
        val trimmed = value.trim()
        if (trimmed.isBlank()) null else JSONObject(trimmed)
    }.getOrNull()

private fun Any?.toRawJsonText(): String = when (this) {
    null, JSONObject.NULL -> ""
    is JSONObject, is JSONArray -> toString()
    else -> toString().trim()
}

private fun Any?.toAiDisplayText(): String {
    if (this == null || this == JSONObject.NULL) return ""
    if (this is JSONObject) {
        val blocks = optJSONArray("blocks")
        if (blocks != null) {
            val parts = mutableListOf<String>()
            for (blockIndex in 0 until blocks.length()) {
                val block = blocks.optJSONObject(blockIndex) ?: continue
                block.firstClean("title").takeIf { it.isNotBlank() }?.let(parts::add)
                block.firstClean("sectionSubtitle", "section_subtitle", "subtitle").takeIf { it.isNotBlank() }?.let(parts::add)
                val rows = block.optJSONArray("rows")
                if (rows != null) {
                    for (rowIndex in 0 until rows.length()) {
                        val row = rows.optJSONObject(rowIndex) ?: continue
                        val description = row.firstClean("description", "value", "text", "content")
                        if (description.isNotBlank()) {
                            val subtitle = row.firstClean("subtitle", "label")
                            parts.add(listOf(subtitle, description).filter { it.isNotBlank() }.joinToString(": "))
                        }
                    }
                }
            }
            return parts.distinct().joinToString("\n").trim()
        }
        return firstClean("description", "value", "text", "content").ifBlank { toString() }
    }
    if (this is JSONArray) {
        return buildList {
            for (index in 0 until length()) {
                opt(index).toAiDisplayText().takeIf { it.isNotBlank() }?.let(::add)
            }
        }.joinToString("\n")
    }
    return toString().trim()
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
            add(item.toWorkOrderLocationOption())
        }
    }.filter { it.id.isNotBlank() && it.companyId.isNotBlank() && it.name.isNotBlank() }
}

private fun JSONObject.toWorkOrderLocationOption(): WorkOrderLocationOption =
    WorkOrderLocationOption(
        id = firstClean("id"),
        companyId = firstClean("companyId"),
        name = firstClean("name"),
        coordinates = firstClean("coordinates"),
        region = firstClean("region"),
        contactName1 = firstClean("contactName1"),
        contactPhone1 = firstClean("contactPhone1"),
        contactEmail1 = firstClean("contactEmail1"),
        contactName2 = firstClean("contactName2"),
        contactPhone2 = firstClean("contactPhone2"),
        contactEmail2 = firstClean("contactEmail2"),
        contactName3 = firstClean("contactName3"),
        contactPhone3 = firstClean("contactPhone3"),
        contactEmail3 = firstClean("contactEmail3"),
    )

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
                    oib = item.firstClean("oib"),
                    isznrTags = item.optJSONArray("isznrTags").toStringList(),
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
            add(item.toWorkOrder())
        }
    }.sortedWith(
        Comparator { left, right ->
            compareWorkOrdersByNumberDescending(left, right).takeIf { it != 0 }
                ?: compareValuesBy(right, left) { it.parsedOpenedDate ?: it.parsedDueDate ?: LocalDate.MIN }
        },
    )
}

private fun JSONObject.toWorkOrder(): WorkOrder {
    val serviceDetails = optJSONArray("serviceItems").toWorkOrderServiceDetails()
    val serviceItems = serviceDetails
        .map { service -> service.name.ifBlank { service.serviceCode.ifBlank { service.serviceId } } }
        .filter { it.isNotBlank() }
        .ifEmpty { optJSONArray("serviceItems").toStringList("name", "serviceCode") }

    return WorkOrder(
        id = firstClean("id"),
        number = firstClean("workOrderNumber", "number"),
        status = firstClean("status").ifBlank { "Otvoreni RN" },
        companyId = firstClean("companyId"),
        companyName = firstClean("companyName", "company"),
        companyOib = firstClean("companyOib", "oib"),
        headquarters = firstClean("headquarters", "companyHeadquarters"),
        locationId = firstClean("locationId"),
        locationName = firstClean("locationName", "location"),
        objectId = firstClean("objectId", "locationObjectId"),
        objectName = firstClean("objectName", "locationObjectName"),
        coordinates = firstClean("coordinates"),
        region = firstClean("region"),
        serviceLine = firstClean("serviceLine"),
        serviceItems = serviceItems,
        serviceDetails = serviceDetails,
        openedDate = firstClean("openedDate", "createdAt"),
        dueDate = firstClean("dueDate"),
        executionDate = firstClean("executionDate"),
        priority = firstClean("priority").ifBlank { "Normal" },
        contactName = firstClean("contactName"),
        contactPhone = firstClean("contactPhone"),
        contactEmail = firstClean("contactEmail"),
        description = firstClean("description", "note"),
        executors = optJSONArray("executors").toStringList("fullName", "name", "label", "email"),
        completedBy = firstClean("completedBy", "completedByLabel", "createdByLabel"),
        tags = toWorkOrderTags(),
        watcherIds = optJSONArray("watcherIds").toStringList("userId", "id", "value", "email"),
    )
}

private fun JSONObject.toPagedMobileRecords(): PagedMobileRecords =
    PagedMobileRecords(
        records = optJSONArray("records").toRecords(),
        total = firstInt(0, "total"),
        offset = firstInt(0, "offset"),
        nextOffset = firstInt(0, "nextOffset"),
        hasMore = optBoolean("hasMore", false),
    )

private fun JSONObject.toWorkOrderTags(): List<String> {
    val arrayTags = optJSONArray("tags").toStringList("name", "label", "value", "title")
    val textTags = firstClean("tagText", "tagsText", "tag")
        .split(',', ';', '\n', '•')
        .map { it.trim().trim('#') }
    return (arrayTags + textTags)
        .map { it.trim().trim('#') }
        .filter { it.isNotBlank() && it != "null" }
        .distinctBy { it.lowercase(Locale.getDefault()) }
}
