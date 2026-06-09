@file:OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)

package com.safenexus.app.ui

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.OpenableColumns
import android.provider.MediaStore
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint as AndroidPaint
import android.graphics.Path as AndroidPath
import androidx.activity.result.IntentSenderRequest
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Business
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.FilterList
import androidx.compose.material.icons.rounded.Fingerprint
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.Image
import androidx.compose.material.icons.rounded.InsertDriveFile
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.ListAlt
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import com.safenexus.app.data.BootstrapData
import com.safenexus.app.data.CoordinatePoint
import com.safenexus.app.data.DashboardStats
import com.safenexus.app.data.DownloadedDocument
import com.safenexus.app.data.MobileRecord
import com.safenexus.app.data.SafeNexusApi
import com.safenexus.app.data.SafeNexusAuthStore
import com.safenexus.app.data.SafeNexusUser
import com.safenexus.app.data.WorkOrder
import com.safenexus.app.data.WorkOrderCompanyOption
import com.safenexus.app.data.WorkOrderCreateDraft
import com.safenexus.app.data.WorkOrderDocumentationContext
import com.safenexus.app.data.WorkOrderDocumentationAdditionalRecord
import com.safenexus.app.data.WorkOrderDocumentationDraft
import com.safenexus.app.data.WorkOrderDocumentationField
import com.safenexus.app.data.WorkOrderDocumentationOption
import com.safenexus.app.data.WorkOrderDocumentationSignatureAreaOptions
import com.safenexus.app.data.WorkOrderDocumentationTemplate
import com.safenexus.app.data.WorkOrderDocumentationTemplateBlock
import com.safenexus.app.data.WorkOrderDocument
import com.safenexus.app.data.WorkOrderLocationObjectOption
import com.safenexus.app.data.WorkOrderLocationOption
import com.safenexus.app.data.WorkOrderMeasurementColumn
import com.safenexus.app.data.WorkOrderMeasurementSheet
import com.safenexus.app.data.WorkOrderMeasurementTable
import com.safenexus.app.data.WorkOrderServiceItem
import com.safenexus.app.data.WorkOrderServiceOption
import com.safenexus.app.data.WorkOrderUploadFile
import com.safenexus.app.data.WorkOrderUserOption
import com.safenexus.app.data.parseDateOrNull
import com.google.firebase.messaging.FirebaseMessaging
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.ByteArrayOutputStream
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class WorkOrderFilter(val label: String) {
    All("SVE"),
    Active("OTVORENI"),
    Overdue("U TIJEKU"),
    Closed("ZAVRŠENI"),
}

enum class WorkOrderViewMode(val label: String) {
    List("Lista"),
    Map("Karta"),
}

enum class AppSection(val label: String) {
    Operations("Operativa"),
    WorkOrders("RN"),
    Calendar("Kalendar"),
    Vehicles("Vozila"),
    More("Više"),
}

enum class CalendarViewMode(val label: String) {
    Day("Dan"),
    Week("Tjedan"),
    Month("Mjesec"),
}

private data class MainMenuShortcut(
    val label: String,
    val description: String,
    val section: AppSection,
    val icon: ImageVector,
)

enum class WorkOrderDocumentInputMode(
    val label: String,
    val description: String,
    val icon: ImageVector,
    val defaultCategory: WorkOrderDocumentCategory,
) {
    Scan(
        "Skeniraj dokument",
        "Rubovi, perspektiva, više stranica i jedan PDF.",
        Icons.Rounded.CameraAlt,
        WorkOrderDocumentCategory.VerifiedWorkOrder,
    ),
    Photos(
        "Dodaj fotografije",
        "Priloži jednu ili više fotografija s uređaja.",
        Icons.Rounded.Image,
        WorkOrderDocumentCategory.Photos,
    ),
    Pdf(
        "Odaberi PDF",
        "Priloži gotov PDF dokument.",
        Icons.Rounded.PictureAsPdf,
        WorkOrderDocumentCategory.Report,
    ),
    File(
        "Odaberi datoteku",
        "PDF, Word, Excel, slike i ostali prilozi.",
        Icons.Rounded.Folder,
        WorkOrderDocumentCategory.Other,
    ),
}

enum class WorkOrderDocumentCategory(val value: String, val label: String) {
    VerifiedWorkOrder("Ovjereni Radni nalog", "Ovjereni radni nalog"),
    Report("Zapisnik", "Zapisnik"),
    Project("Projekt", "Projekt"),
    SingleLineDiagram("Jednopolna shema", "Jednopolna shema"),
    Photos("Fotografije", "Fotografije"),
    Elaborate("Elaborat", "Elaborat"),
    Other("Ostalo", "Ostalo"),
}

private const val WORK_ORDER_DOCUMENT_MAX_SIZE_BYTES = 12L * 1024L * 1024L

private val workOrderDocumentAllowedMimeTypes = arrayOf(
    "application/pdf",
    "image/*",
    "message/rfc822",
    "application/vnd.ms-outlook",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
)

private data class PendingDocumentSelection(
    val workOrder: WorkOrder,
    val uris: List<Uri>,
    val mode: WorkOrderDocumentInputMode,
)

private val biometricAuthenticators =
    BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL

private val workOrderStatusOptions = listOf(
    "Otvoreni RN",
    "Gotov RN",
    "Ovjeren RN",
    "Fakturiran RN",
    "Storno RN",
)

data class AppState(
    val user: SafeNexusUser? = null,
    val rememberedUser: SafeNexusUser? = null,
    val data: BootstrapData = BootstrapData(),
    val workOrders: List<WorkOrder> = emptyList(),
    val selectedWorkOrder: WorkOrder? = null,
    val selectedRecord: MobileRecord? = null,
    val isCreatingWorkOrder: Boolean = false,
    val section: AppSection = AppSection.Operations,
    val query: String = "",
    val filter: WorkOrderFilter = WorkOrderFilter.All,
    val viewMode: WorkOrderViewMode = WorkOrderViewMode.List,
    val workOrderDocumentsWorkOrderId: String = "",
    val workOrderDocuments: List<WorkOrderDocument> = emptyList(),
    val workOrderDocumentsLoading: Boolean = false,
    val documentationContextWorkOrderId: String = "",
    val documentationContext: WorkOrderDocumentationContext = WorkOrderDocumentationContext(),
    val documentationContextLoading: Boolean = false,
    val isLoading: Boolean = false,
    val error: String = "",
    val notice: String = "",
)

class SafeNexusViewModel(application: Application) : AndroidViewModel(application) {
    private val api = SafeNexusApi()
    private val authStore = SafeNexusAuthStore(application)
    private val workOrderMutationVersions = mutableMapOf<String, Int>()
    private var shouldRememberSession = false

    var state by mutableStateOf(AppState())
        private set

    init {
        loadRememberedSession()
    }

    private fun loadRememberedSession() {
        val storedSession = authStore.load()
        state = state.copy(rememberedUser = storedSession?.user)
    }

    fun unlockRememberedSession() {
        val storedSession = authStore.load()
        if (storedSession == null) {
            shouldRememberSession = false
            state = state.copy(rememberedUser = null, error = "Nema spremljene prijave. Prijavi se emailom i lozinkom.")
            return
        }
        shouldRememberSession = true
        api.restoreSession(storedSession.accessToken, storedSession.cookieHeader)
        state = state.copy(user = storedSession.user, rememberedUser = storedSession.user, isLoading = true, error = "")
        registerPushToken()
        refresh()
    }

    fun login(email: String, password: String, rememberSession: Boolean) {
        if (email.isBlank() || password.isBlank()) {
            state = state.copy(error = "Upisi email i lozinku.")
            return
        }
        state = state.copy(isLoading = true, error = "")
        viewModelScope.launch {
            api.login(email, password)
                .onSuccess { user ->
                    shouldRememberSession = rememberSession
                    if (rememberSession) {
                        authStore.save(user, api.currentAccessToken(), api.currentAuthCookieHeader())
                    } else {
                        authStore.clear()
                    }
                    state = state.copy(
                        user = user,
                        rememberedUser = if (rememberSession) user else null,
                        isLoading = false,
                        error = "",
                    )
                    registerPushToken()
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(isLoading = false, error = error.message ?: "Prijava nije uspjela.")
                }
        }
    }

    fun registerPushToken() {
        if (state.user == null) return
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token ->
                if (token.isBlank()) return@addOnSuccessListener
                viewModelScope.launch {
                    api.registerPushToken(
                        token = token,
                        platform = "android",
                        deviceId = androidDeviceId(),
                    )
                }
            }
    }

    fun refresh() {
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.bootstrap()
                .onSuccess { data ->
                    if (shouldRememberSession) {
                        state.user?.let { user ->
                            authStore.save(user, api.currentAccessToken(), api.currentAuthCookieHeader())
                        }
                    }
                    val selectedId = state.selectedWorkOrder?.id
                    state = state.copy(
                        data = data,
                        workOrders = data.workOrders,
                        selectedWorkOrder = selectedId?.let { id -> data.workOrders.firstOrNull { it.id == id } } ?: state.selectedWorkOrder,
                        isLoading = false,
                        error = "",
                    )
                }
                .onFailure { error ->
                    val message = error.message ?: "Ne mogu učitati mobilne podatke."
                    if (message.contains("(401)")) {
                        api.clearSession()
                        authStore.clear()
                        shouldRememberSession = false
                        state = AppState(error = "Sesija je istekla. Prijavi se ponovno.")
                    } else {
                        state = state.copy(isLoading = false, error = message)
                    }
                }
        }
    }

    fun logout() {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token ->
                if (token.isNotBlank()) {
                    viewModelScope.launch { api.unregisterPushToken(token) }
                }
            }
        viewModelScope.launch { api.logout() }
        api.clearSession()
        authStore.clear()
        shouldRememberSession = false
        state = AppState()
    }

    fun updateQuery(value: String) {
        state = state.copy(query = value)
    }

    fun updateFilter(value: WorkOrderFilter) {
        state = state.copy(filter = value)
    }

    fun updateViewMode(value: WorkOrderViewMode) {
        state = state.copy(viewMode = value)
    }

    fun updateSection(value: AppSection) {
        state = state.copy(section = value, selectedRecord = null, isCreatingWorkOrder = false)
    }

    fun selectWorkOrder(value: WorkOrder?) {
        state = state.copy(
            selectedWorkOrder = value,
            selectedRecord = null,
            isCreatingWorkOrder = false,
            workOrderDocumentsWorkOrderId = value?.id.orEmpty(),
            workOrderDocuments = emptyList(),
            workOrderDocumentsLoading = value != null,
            error = "",
            notice = "",
        )
        value?.id?.takeIf { it.isNotBlank() }?.let(::loadWorkOrderDocuments)
    }

    fun selectRecord(value: MobileRecord?) {
        state = state.copy(selectedRecord = value, selectedWorkOrder = null, isCreatingWorkOrder = false)
    }

    fun openWorkOrderCreate() {
        state = state.copy(
            section = AppSection.WorkOrders,
            selectedWorkOrder = null,
            selectedRecord = null,
            isCreatingWorkOrder = true,
            error = "",
            notice = "",
        )
    }

    fun closeWorkOrderCreate() {
        state = state.copy(isCreatingWorkOrder = false, error = "", notice = "")
    }

    fun createWorkOrder(draft: WorkOrderCreateDraft) {
        if (draft.companyId.isBlank()) {
            state = state.copy(error = "Odaberi naručitelja.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.createWorkOrder(draft)
                .onSuccess {
                    state = state.copy(
                        isLoading = false,
                        isCreatingWorkOrder = false,
                        section = AppSection.WorkOrders,
                        notice = "Novi radni nalog je otvoren.",
                    )
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu otvoriti radni nalog.",
                    )
                }
        }
    }

    fun showError(message: String) {
        state = state.copy(isLoading = false, workOrderDocumentsLoading = false, error = message, notice = "")
    }

    private fun beginWorkOrderMutation(workOrderId: String): Int {
        val nextVersion = (workOrderMutationVersions[workOrderId] ?: 0) + 1
        workOrderMutationVersions[workOrderId] = nextVersion
        return nextVersion
    }

    private fun isCurrentWorkOrderMutation(workOrderId: String, version: Int): Boolean =
        workOrderMutationVersions[workOrderId] == version

    private fun replaceWorkOrderInState(updatedWorkOrder: WorkOrder, notice: String = "") {
        val updatedOrders = state.workOrders.map { item ->
            if (item.id == updatedWorkOrder.id) updatedWorkOrder else item
        }
        val nextOrders = if (updatedOrders.any { it.id == updatedWorkOrder.id }) {
            updatedOrders
        } else {
            listOf(updatedWorkOrder) + state.workOrders
        }
        val updatedSelected = state.selectedWorkOrder?.let { selected ->
            if (selected.id == updatedWorkOrder.id) updatedWorkOrder else selected
        }
        state = state.copy(
            data = state.data.copy(workOrders = nextOrders),
            workOrders = nextOrders,
            selectedWorkOrder = updatedSelected,
            isLoading = false,
            error = "",
            notice = notice,
        )
    }

    private fun buildOptimisticServiceWorkOrder(workOrder: WorkOrder, selectedServiceIds: List<String>): WorkOrder {
        val serviceLookup = state.data.workOrderServices.associateBy { it.id }
        val serviceDetails = selectedServiceIds.map { serviceId ->
            val service = serviceLookup[serviceId]
            WorkOrderServiceItem(
                serviceId = serviceId,
                name = service?.name ?: serviceId,
                serviceCode = service?.serviceCode.orEmpty(),
                serviceStatus = "",
                quantity = "1",
            )
        }
        val serviceLabels = serviceDetails
            .map { service -> service.name.ifBlank { service.serviceCode.ifBlank { service.serviceId } } }
            .filter { it.isNotBlank() }
        return workOrder.copy(
            serviceLine = serviceLabels.joinToString(" · "),
            serviceItems = serviceLabels,
            serviceDetails = serviceDetails,
        )
    }

    fun updateWorkOrderStatus(workOrder: WorkOrder, status: String) {
        if (workOrder.id.isBlank() || status.isBlank() || status == workOrder.status) return

        val mutationVersion = beginWorkOrderMutation(workOrder.id)
        val previousWorkOrder = state.workOrders.firstOrNull { it.id == workOrder.id } ?: workOrder
        replaceWorkOrderInState(workOrder.copy(status = status))
        viewModelScope.launch {
            api.updateWorkOrderStatus(workOrder.id, status)
                .onSuccess { updatedWorkOrder ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(updatedWorkOrder, "Status RN-a je spremljen.")
                    }
                }
                .onFailure { error ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(previousWorkOrder)
                        state = state.copy(error = error.message ?: "Ne mogu spremiti status RN-a.", notice = "")
                    }
                }
        }
    }

    fun updateWorkOrderServices(workOrder: WorkOrder, selectedServiceIds: List<String>) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za spremanje usluga.")
            return
        }
        val normalizedIds = selectedServiceIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        val mutationVersion = beginWorkOrderMutation(workOrder.id)
        val previousWorkOrder = state.workOrders.firstOrNull { it.id == workOrder.id } ?: workOrder
        replaceWorkOrderInState(buildOptimisticServiceWorkOrder(workOrder, normalizedIds))
        viewModelScope.launch {
            api.updateWorkOrderServices(workOrder.id, normalizedIds)
                .onSuccess { updatedWorkOrder ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(updatedWorkOrder, "Usluge RN-a su spremljene.")
                    }
                }
                .onFailure { error ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(previousWorkOrder)
                        state = state.copy(error = error.message ?: "Ne mogu spremiti usluge RN-a.", notice = "")
                    }
                }
        }
    }

    private fun loadWorkOrderDocuments(workOrderId: String) {
        if (workOrderId.isBlank()) return

        state = state.copy(
            workOrderDocumentsWorkOrderId = workOrderId,
            workOrderDocumentsLoading = true,
            error = "",
        )
        viewModelScope.launch {
            api.listWorkOrderDocuments(workOrderId)
                .onSuccess { documents ->
                    if (state.workOrderDocumentsWorkOrderId == workOrderId) {
                        state = state.copy(
                            workOrderDocuments = documents,
                            workOrderDocumentsLoading = false,
                            error = "",
                        )
                    }
                }
                .onFailure { error ->
                    if (state.workOrderDocumentsWorkOrderId == workOrderId) {
                        state = state.copy(
                            workOrderDocumentsLoading = false,
                            error = error.message ?: "Ne mogu učitati dokumentaciju RN-a.",
                        )
                    }
                }
        }
    }

    fun refreshWorkOrderDocuments() {
        val workOrderId = state.selectedWorkOrder?.id ?: return
        loadWorkOrderDocuments(workOrderId)
    }

    fun loadWorkOrderDocumentationContext(workOrder: WorkOrder, objectId: String = "") {
        val workOrderId = workOrder.id.trim()
        if (workOrderId.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za izradu dokumentacije.")
            return
        }

        state = state.copy(
            documentationContextWorkOrderId = workOrderId,
            documentationContext = WorkOrderDocumentationContext(workOrderId = workOrderId, workOrderNumber = workOrder.displayNumber),
            documentationContextLoading = true,
            error = "",
            notice = "",
        )
        viewModelScope.launch {
            api.workOrderDocumentationContext(workOrderId, objectId)
                .onSuccess { context ->
                    if (state.documentationContextWorkOrderId == workOrderId) {
                        state = state.copy(
                            documentationContext = context,
                            documentationContextLoading = false,
                            error = "",
                        )
                    }
                }
                .onFailure { error ->
                    if (state.documentationContextWorkOrderId == workOrderId) {
                        state = state.copy(
                            documentationContextLoading = false,
                            error = error.message ?: "Ne mogu učitati polja predloška za RN.",
                        )
                    }
                }
        }
    }

    fun updateWorkOrderExecutors(workOrder: WorkOrder, executors: List<String>) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za spremanje izvršitelja.")
            return
        }
        val normalized = executors.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        val mutationVersion = beginWorkOrderMutation(workOrder.id)
        val previousWorkOrder = state.workOrders.firstOrNull { it.id == workOrder.id } ?: workOrder
        replaceWorkOrderInState(workOrder.copy(executors = normalized))
        viewModelScope.launch {
            api.updateWorkOrderExecutors(workOrder.id, normalized)
                .onSuccess { updatedWorkOrder ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(updatedWorkOrder, "Izvršitelji RN-a su spremljeni.")
                    }
                }
                .onFailure { error ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(previousWorkOrder)
                        state = state.copy(error = error.message ?: "Ne mogu spremiti izvršitelje RN-a.", notice = "")
                    }
                }
        }
    }

    fun createVehicleReservation(
        vehicle: MobileRecord,
        purpose: String,
        startAt: String,
        endAt: String,
        destination: String,
        reservedForUserId: String,
        reservedForLabel: String,
        note: String,
    ) {
        if (vehicle.id.isBlank()) {
            state = state.copy(error = "Vozilo nema ispravan ID za rezervaciju.")
            return
        }
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.createVehicleReservation(
                vehicleId = vehicle.id,
                purpose = purpose,
                startAt = startAt,
                endAt = endAt,
                destination = destination,
                reservedForUserId = reservedForUserId,
                reservedForLabel = reservedForLabel,
                note = note,
            )
                .onSuccess {
                    state = state.copy(isLoading = false, notice = "Rezervacija vozila je spremljena.")
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu spremiti rezervaciju vozila.",
                    )
                }
        }
    }

    fun createWorkOrderLocationObject(
        workOrder: WorkOrder,
        name: String,
        onCreated: (WorkOrderLocationObjectOption) -> Unit,
    ) {
        val normalizedName = name.trim()
        if (normalizedName.isBlank()) {
            state = state.copy(error = "Upiši naziv objekta.")
            return
        }
        if (workOrder.companyId.isBlank() || workOrder.locationId.isBlank()) {
            state = state.copy(error = "RN mora imati tvrtku i lokaciju za dodavanje objekta.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.createWorkOrderLocationObject(workOrder, normalizedName)
                .onSuccess { createdObject ->
                    val nextObjects = (
                        state.data.workOrderLocationObjects.filter { it.id != createdObject.id } + createdObject
                    ).sortedWith(
                        compareBy<WorkOrderLocationObjectOption> { it.name.lowercase(Locale.getDefault()) }
                            .thenBy { it.code.lowercase(Locale.getDefault()) },
                    )
                    state = state.copy(
                        data = state.data.copy(workOrderLocationObjects = nextObjects),
                        isLoading = false,
                        notice = "Objekt je dodan i odabran za zapisnik.",
                    )
                    onCreated(createdObject)
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu dodati objekt lokacije.",
                    )
                }
        }
    }

    fun generateWorkOrderDocumentation(workOrder: WorkOrder, draft: WorkOrderDocumentationDraft) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za izradu dokumentacije.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.generateWorkOrderDocumentation(workOrder.id, draft)
                .onSuccess { documents ->
                    state = state.copy(
                        isLoading = false,
                        notice = if (documents.isNotEmpty()) {
                            "Dokumentacija je izrađena i spremljena uz RN."
                        } else {
                            "Izrada dokumentacije je završena."
                        },
                    )
                    loadWorkOrderDocuments(workOrder.id)
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu izraditi dokumentaciju RN-a.",
                    )
                }
        }
    }

    fun uploadWorkOrderDocuments(
        context: Context,
        workOrder: WorkOrder,
        uris: List<Uri>,
        category: WorkOrderDocumentCategory,
        mode: WorkOrderDocumentInputMode,
    ) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za dodavanje dokumentacije.")
            return
        }
        if (uris.isEmpty()) {
            state = state.copy(error = "Odaberi barem jedan dokument.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            runCatching {
                val uploads = buildWorkOrderDocumentUploadFiles(
                    context = context,
                    workOrder = workOrder,
                    uris = uris,
                    category = category,
                    mode = mode,
                )
                api.uploadWorkOrderDocuments(
                    workOrderId = workOrder.id,
                    files = uploads,
                    sourceType = "editor",
                ).getOrThrow()
            }
                .onSuccess {
                    state = state.copy(
                        isLoading = false,
                        notice = "Dokumentacija je spremljena.",
                    )
                    loadWorkOrderDocuments(workOrder.id)
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu spremiti dokumentaciju RN-a.",
                    )
                }
        }
    }

    fun deleteWorkOrderDocument(document: WorkOrderDocument) {
        val workOrderId = state.selectedWorkOrder?.id ?: document.workOrderId
        if (workOrderId.isBlank() || document.id.isBlank()) {
            state = state.copy(error = "Dokument nema ispravan ID za brisanje.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.deleteWorkOrderDocument(workOrderId, document.id)
                .onSuccess {
                    state = state.copy(isLoading = false, notice = "Dokument je obrisan.")
                    loadWorkOrderDocuments(workOrderId)
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu obrisati dokument.",
                    )
                }
        }
    }

    fun openWorkOrderDocument(context: Context, document: WorkOrderDocument) {
        downloadWorkOrderDocument(context, document, openAfterDownload = true)
    }

    fun downloadWorkOrderDocument(context: Context, document: WorkOrderDocument, openAfterDownload: Boolean = false) {
        val workOrderId = state.selectedWorkOrder?.id ?: document.workOrderId
        if (workOrderId.isBlank() || document.id.isBlank()) {
            state = state.copy(error = "Dokument nije moguće preuzeti.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.downloadWorkOrderDocument(workOrderId, document)
                .onSuccess { downloaded ->
                    if (openAfterDownload) {
                        val uri = runCatching { cacheDownloadedDocument(context, downloaded) }.getOrElse { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti dokument za pregled.",
                            )
                            return@onSuccess
                        }
                        val opened = openCachedDocument(context, uri, downloaded.fileType)
                        state = state.copy(
                            isLoading = false,
                            notice = if (opened) "Dokument je otvoren." else "Dokument je preuzet u privremenu mapu aplikacije.",
                            error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje ove vrste dokumenta.",
                        )
                    } else {
                        runCatching { saveDownloadedDocument(context, downloaded) }
                            .onSuccess {
                                state = state.copy(isLoading = false, notice = "Dokument je spremljen u Preuzimanja / SafeNexus.")
                            }
                            .onFailure { error ->
                                state = state.copy(
                                    isLoading = false,
                                    error = error.message ?: "Ne mogu spremiti dokument u Preuzimanja.",
                                )
                            }
                    }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu preuzeti dokument.",
                    )
                }
        }
    }

    fun downloadWorkOrderPdf(context: Context, workOrder: WorkOrder) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "Radni nalog nema ispravan ID za PDF.")
            return
        }

        val fallbackFileName = "${workOrder.displayNumber.ifBlank { "radni-nalog" }}.pdf"
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.downloadWorkOrderPdf(workOrder.id, fallbackFileName)
                .onSuccess { downloaded ->
                    runCatching { saveDownloadedDocument(context, downloaded) }
                        .onSuccess { uri ->
                            val opened = openCachedDocument(context, uri, downloaded.fileType)
                            state = state.copy(
                                isLoading = false,
                                notice = if (opened) {
                                    "PDF radnog naloga je spremljen u Preuzimanja / SafeNexus i otvoren."
                                } else {
                                    "PDF radnog naloga je spremljen u Preuzimanja / SafeNexus."
                                },
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje PDF-a.",
                            )
                        }
                        .onFailure { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti PDF radnog naloga.",
                            )
                        }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu preuzeti PDF radnog naloga.",
                    )
                }
        }
    }

    fun signWorkOrderPdf(
        context: Context,
        workOrder: WorkOrder,
        signaturePngBytes: ByteArray,
        signerName: String,
        signatureLocation: String,
        includeSignerName: Boolean,
        includeSignedAt: Boolean,
        includeSignatureLocation: Boolean,
    ) {
        if (workOrder.id.isBlank()) {
            state = state.copy(error = "Radni nalog nema ispravan ID za potpis.")
            return
        }
        if (signaturePngBytes.isEmpty()) {
            state = state.copy(error = "Potpis je prazan.")
            return
        }

        val fallbackFileName = "${workOrder.displayNumber.ifBlank { "radni-nalog" }}-potpisano.pdf"
        val resolvedSignerName = signerName.trim()
        val signedAt = java.time.ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.signWorkOrderPdf(
                workOrderId = workOrder.id,
                signaturePngBytes = signaturePngBytes,
                signerName = resolvedSignerName,
                signatureLocation = signatureLocation.trim(),
                signedAt = signedAt,
                includeSignerName = includeSignerName,
                includeSignedAt = includeSignedAt,
                includeSignatureLocation = includeSignatureLocation,
                fallbackFileName = fallbackFileName,
            )
                .onSuccess { downloaded ->
                    runCatching { saveDownloadedDocument(context, downloaded) }
                        .onSuccess { uri ->
                            val opened = openCachedDocument(context, uri, downloaded.fileType)
                            state = state.copy(
                                isLoading = false,
                                notice = if (opened) {
                                    "Potpisani RN je spremljen, dodan u dokumentaciju i otvoren."
                                } else {
                                    "Potpisani RN je spremljen i dodan u dokumentaciju."
                                },
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje PDF-a.",
                            )
                            loadWorkOrderDocuments(workOrder.id)
                        }
                        .onFailure { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti potpisani RN na mobitel.",
                            )
                            loadWorkOrderDocuments(workOrder.id)
                        }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu potpisati radni nalog.",
                    )
                }
        }
    }

    private fun androidDeviceId(): String =
        Settings.Secure.getString(getApplication<Application>().contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
}

@Composable
fun SafeNexusApp(viewModel: SafeNexusViewModel = viewModel()) {
    val state = viewModel.state
    val context = LocalContext.current
    val notificationPermissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        viewModel.registerPushToken()
    }
    var documentationActionTarget by remember { mutableStateOf<WorkOrder?>(null) }
    var documentationWizardTarget by remember { mutableStateOf<WorkOrder?>(null) }
    var documentationWizardObjectId by remember { mutableStateOf("") }
    var signatureActionTarget by remember { mutableStateOf<WorkOrder?>(null) }
    var serviceManagementTarget by remember { mutableStateOf<WorkOrder?>(null) }
    var pendingPicker by remember { mutableStateOf<Pair<WorkOrder, WorkOrderDocumentInputMode>?>(null) }
    var pendingSelection by remember { mutableStateOf<PendingDocumentSelection?>(null) }
    val confirmDocumentSelection: (WorkOrderDocumentCategory) -> Unit = { category ->
        val selection = pendingSelection
        pendingSelection = null
        if (selection != null) {
            viewModel.uploadWorkOrderDocuments(
                context = context.applicationContext,
                workOrder = selection.workOrder,
                uris = selection.uris,
                category = category,
                mode = selection.mode,
            )
        }
    }
    val photoLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        val target = pendingPicker
        pendingPicker = null
        if (target != null && uris.isNotEmpty()) {
            pendingSelection = PendingDocumentSelection(target.first, uris, target.second)
        }
    }
    val pdfLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        val target = pendingPicker
        pendingPicker = null
        if (target != null && uris.isNotEmpty()) {
            pendingSelection = PendingDocumentSelection(target.first, uris, target.second)
        }
    }
    val fileLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        val target = pendingPicker
        pendingPicker = null
        if (target != null && uris.isNotEmpty()) {
            pendingSelection = PendingDocumentSelection(target.first, uris, target.second)
        }
    }
    val documentScannerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        val target = pendingPicker
        pendingPicker = null
        if (result.resultCode == Activity.RESULT_OK && target != null) {
            val scanResult = GmsDocumentScanningResult.fromActivityResultIntent(result.data)
            val pdfUri = scanResult?.pdf?.uri
            if (pdfUri != null) {
                pendingSelection = PendingDocumentSelection(target.first, listOf(pdfUri), target.second)
            } else {
                viewModel.showError("Sken nije vratio PDF dokument.")
            }
        }
    }
    val startDocumentationFlow: (WorkOrder, WorkOrderDocumentInputMode) -> Unit = { workOrder, mode ->
        documentationActionTarget = null
        pendingPicker = workOrder to mode
        when (mode) {
            WorkOrderDocumentInputMode.Scan -> {
                val activity = context.findFragmentActivity()
                if (activity == null) {
                    pendingPicker = null
                    viewModel.showError("Skeniranje dokumenta nije dostupno u ovom prikazu.")
                } else {
                    val options = GmsDocumentScannerOptions.Builder()
                        .setGalleryImportAllowed(true)
                        .setPageLimit(30)
                        .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_PDF)
                        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
                        .build()
                    GmsDocumentScanning.getClient(options)
                        .getStartScanIntent(activity)
                        .addOnSuccessListener { intentSender ->
                            documentScannerLauncher.launch(IntentSenderRequest.Builder(intentSender).build())
                        }
                        .addOnFailureListener { error ->
                            pendingPicker = null
                            viewModel.showError(error.message ?: "Ne mogu pokrenuti skeniranje dokumenta.")
                        }
                }
            }
            WorkOrderDocumentInputMode.Photos -> photoLauncher.launch("image/*")
            WorkOrderDocumentInputMode.Pdf -> pdfLauncher.launch(arrayOf("application/pdf"))
            WorkOrderDocumentInputMode.File -> fileLauncher.launch(workOrderDocumentAllowedMimeTypes)
        }
    }
    val openDocumentationActions: (WorkOrder) -> Unit = { workOrder ->
        documentationActionTarget = workOrder
    }
    val openMobileRecord: (MobileRecord) -> Unit = { record ->
        val linkedWorkOrder = state.workOrders.firstOrNull { workOrder ->
            record.kind == "work_order" && (
                workOrder.id == record.relatedId ||
                    workOrder.id == record.id.removePrefix("work-order:")
                )
        }
        if (linkedWorkOrder != null) {
            viewModel.selectWorkOrder(linkedWorkOrder)
        } else {
            viewModel.selectRecord(record)
        }
    }

    LaunchedEffect(state.user?.email) {
        if (state.user == null) return@LaunchedEffect
        viewModel.registerPushToken()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasPermission) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    AnimatedContent(targetState = state.user != null, label = "auth") { isSignedIn ->
        if (isSignedIn) {
            if (state.isCreatingWorkOrder) {
                WorkOrderCreateScreen(
                    data = state.data,
                    isLoading = state.isLoading,
                    error = state.error,
                    onBack = viewModel::closeWorkOrderCreate,
                    onSave = viewModel::createWorkOrder,
                )
            } else {
            val selected = state.selectedWorkOrder
            if (selected == null) {
                val selectedRecord = state.selectedRecord
                if (selectedRecord == null) {
                    WorkOrdersScreen(
                        state = state,
                        onQueryChange = viewModel::updateQuery,
                        onFilterChange = viewModel::updateFilter,
                        onViewModeChange = viewModel::updateViewMode,
                        onSectionChange = viewModel::updateSection,
                        onRefresh = viewModel::refresh,
                        onLogout = viewModel::logout,
                        onOpenWorkOrder = viewModel::selectWorkOrder,
                        onOpenRecord = openMobileRecord,
                        onNewWorkOrder = viewModel::openWorkOrderCreate,
                        onStatusChange = viewModel::updateWorkOrderStatus,
                        onAddDocumentation = openDocumentationActions,
                    )
                } else {
                    MobileRecordDetailScreen(
                        record = selectedRecord,
                        users = state.data.workOrderUsers,
                        currentUserLabel = state.user?.displayName.orEmpty(),
                        isLoading = state.isLoading,
                        onBack = { viewModel.selectRecord(null) },
                        onReserveVehicle = viewModel::createVehicleReservation,
                    )
                }
            } else {
                WorkOrderDetailScreen(
                    workOrder = selected,
                    services = state.data.workOrderServices,
                    users = state.data.workOrderUsers,
                    isLoading = state.isLoading,
                    error = state.error,
                    notice = state.notice,
                    documents = state.workOrderDocuments,
                    documentsLoading = state.workOrderDocumentsLoading,
                    statusOptions = state.data.workOrderStatuses.map { it.value }.ifEmpty { workOrderStatusOptions },
                    onBack = { viewModel.selectWorkOrder(null) },
                    onStatusChange = viewModel::updateWorkOrderStatus,
                    onExecutorsChange = viewModel::updateWorkOrderExecutors,
                    onManageServices = { workOrder -> serviceManagementTarget = workOrder },
                    onGenerateDocumentation = { workOrder ->
                        documentationWizardTarget = workOrder
                        documentationWizardObjectId = workOrder.objectId
                        viewModel.loadWorkOrderDocumentationContext(workOrder, documentationWizardObjectId)
                    },
                    onAddDocumentation = openDocumentationActions,
                    onDownloadPdf = { workOrder -> viewModel.downloadWorkOrderPdf(context.applicationContext, workOrder) },
                    onSignWorkOrder = { workOrder -> signatureActionTarget = workOrder },
                    onOpenDocument = { document -> viewModel.openWorkOrderDocument(context.applicationContext, document) },
                    onDownloadDocument = { document -> viewModel.downloadWorkOrderDocument(context.applicationContext, document) },
                    onDeleteDocument = viewModel::deleteWorkOrderDocument,
                    onRefreshDocuments = viewModel::refreshWorkOrderDocuments,
                )
            }
            }
        } else {
            LoginScreen(
                isLoading = state.isLoading,
                error = state.error,
                rememberedUser = state.rememberedUser,
                onLogin = viewModel::login,
                onUnlockRememberedSession = viewModel::unlockRememberedSession,
            )
        }
    }

    documentationActionTarget?.let { workOrder ->
        WorkOrderDocumentationActionDialog(
            workOrder = workOrder,
            onDismiss = { documentationActionTarget = null },
            onSelect = { mode -> startDocumentationFlow(workOrder, mode) },
        )
    }
    serviceManagementTarget?.let { workOrder ->
        WorkOrderServiceManagementDialog(
            workOrder = workOrder,
            services = state.data.workOrderServices,
            isLoading = state.isLoading,
            onDismiss = { serviceManagementTarget = null },
            onSelectionChange = { selectedServiceIds ->
                viewModel.updateWorkOrderServices(workOrder, selectedServiceIds)
            },
        )
    }
    documentationWizardTarget?.let { workOrder ->
        WorkOrderDocumentationWizardDialog(
            workOrder = workOrder,
            users = state.data.workOrderUsers,
            services = state.data.workOrderServices,
            locationObjects = state.data.workOrderLocationObjects,
            selectedObjectId = documentationWizardObjectId,
            context = if (state.documentationContextWorkOrderId == workOrder.id) {
                state.documentationContext
            } else {
                WorkOrderDocumentationContext(workOrderId = workOrder.id, workOrderNumber = workOrder.displayNumber)
            },
            contextLoading = state.documentationContextLoading && state.documentationContextWorkOrderId == workOrder.id,
            isLoading = state.isLoading,
            onDismiss = { documentationWizardTarget = null },
            onObjectSelectionChange = { objectId ->
                documentationWizardObjectId = objectId
                viewModel.loadWorkOrderDocumentationContext(workOrder, objectId)
            },
            onCreateObject = { name ->
                viewModel.createWorkOrderLocationObject(workOrder, name) { createdObject ->
                    documentationWizardObjectId = createdObject.id
                    viewModel.loadWorkOrderDocumentationContext(workOrder, createdObject.id)
                }
            },
            onExecutorsChange = { executors ->
                viewModel.updateWorkOrderExecutors(workOrder, executors)
            },
            onConfirm = { draft ->
                documentationWizardTarget = null
                viewModel.generateWorkOrderDocumentation(workOrder, draft)
            },
        )
    }
    signatureActionTarget?.let { workOrder ->
        WorkOrderFingerSignatureDialog(
            workOrder = workOrder,
            defaultSignerName = "",
            isLoading = state.isLoading,
            onDismiss = { signatureActionTarget = null },
            onConfirm = { signatureBytes, signerName, signatureLocation, includeSignerName, includeSignedAt, includeSignatureLocation ->
                signatureActionTarget = null
                viewModel.signWorkOrderPdf(
                    context = context.applicationContext,
                    workOrder = workOrder,
                    signaturePngBytes = signatureBytes,
                    signerName = signerName,
                    signatureLocation = signatureLocation,
                    includeSignerName = includeSignerName,
                    includeSignedAt = includeSignedAt,
                    includeSignatureLocation = includeSignatureLocation,
                )
            },
        )
    }
    pendingSelection?.let { selection ->
        WorkOrderDocumentCategoryDialog(
            selection = selection,
            isLoading = state.isLoading,
            onDismiss = { pendingSelection = null },
            onConfirm = confirmDocumentSelection,
        )
    }
}

@Composable
private fun WorkOrderFingerSignatureDialog(
    workOrder: WorkOrder,
    defaultSignerName: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (ByteArray, String, String, Boolean, Boolean, Boolean) -> Unit,
) {
    val strokes = remember(workOrder.id) { mutableStateListOf<List<Offset>>() }
    var currentStroke by remember(workOrder.id) { mutableStateOf<List<Offset>>(emptyList()) }
    var canvasSize by remember(workOrder.id) { mutableStateOf(IntSize.Zero) }
    var signerName by remember(workOrder.id, defaultSignerName) { mutableStateOf(defaultSignerName) }
    var includeSignerName by remember(workOrder.id) { mutableStateOf(true) }
    var includeSignedAt by remember(workOrder.id) { mutableStateOf(true) }
    var includeSignatureLocation by remember(workOrder.id) { mutableStateOf(true) }
    var signatureLocation by remember(workOrder.id) {
        mutableStateOf(
            listOf(workOrder.locationName, workOrder.coordinates)
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .joinToString(" · "),
        )
    }
    var gpsMessage by remember(workOrder.id) { mutableStateOf("") }
    var gpsLoading by remember(workOrder.id) { mutableStateOf(false) }
    var gpsRequestNonce by remember(workOrder.id) { mutableStateOf(0) }
    val context = LocalContext.current
    val captureGpsLocation = {
        gpsLoading = true
        gpsMessage = "Dohvaćam GPS lokaciju..."
        requestSignatureGpsLocation(
            context = context.applicationContext,
            onResult = { locationText ->
                signatureLocation = locationText
                gpsMessage = "GPS lokacija je dodana u potpis."
                gpsLoading = false
            },
            onError = { message ->
                gpsMessage = message
                gpsLoading = false
            },
        )
    }
    val gpsPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            captureGpsLocation()
        } else {
            gpsMessage = "Bez dozvole za lokaciju GPS se ne može upisati u potpis."
        }
    }
    LaunchedEffect(includeSignatureLocation, gpsRequestNonce) {
        if (!includeSignatureLocation || isLoading) {
            return@LaunchedEffect
        }

        if (hasSignatureLocationPermission(context)) {
            captureGpsLocation()
        } else {
            gpsMessage = "Dopusti lokaciju za GPS potpis."
            gpsPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                ),
            )
        }
    }
    val hasSignature = strokes.any { it.isNotEmpty() }
    val inkColor = MaterialTheme.colorScheme.primary

    AlertDialog(
        onDismissRequest = {
            if (!isLoading) onDismiss()
        },
        title = {
            Text("Potpiši radni nalog")
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Potpiši prstom u polje. Potpis se utiskuje dolje desno na PDF radnog naloga.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                )
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    SignatureMetadataCheckbox(
                        checked = includeSignerName,
                        enabled = !isLoading,
                        label = "Dodaj ime i prezime",
                        onCheckedChange = { includeSignerName = it },
                    )
                    SignatureMetadataCheckbox(
                        checked = includeSignedAt,
                        enabled = !isLoading,
                        label = "Dodaj datum i vrijeme",
                        onCheckedChange = { includeSignedAt = it },
                    )
                    SignatureMetadataCheckbox(
                        checked = includeSignatureLocation,
                        enabled = !isLoading,
                        label = "Dodaj GPS lokaciju",
                        onCheckedChange = {
                            includeSignatureLocation = it
                            if (it) {
                                gpsRequestNonce += 1
                            }
                        },
                    )
                }
                OutlinedTextField(
                    value = signerName,
                    onValueChange = { signerName = it },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading && includeSignerName,
                    singleLine = true,
                    label = { Text("Ime i prezime potpisnika") },
                )
                OutlinedTextField(
                    value = signatureLocation,
                    onValueChange = { signatureLocation = it },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading && includeSignatureLocation,
                    singleLine = true,
                    label = { Text("Lokacija potpisa") },
                    placeholder = { Text("GPS koordinate potpisa") },
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (gpsLoading && includeSignatureLocation) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(
                            Icons.Rounded.LocationOn,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    }
                    Text(
                        text = if (!includeSignatureLocation) {
                            "GPS lokacija neće biti dodana u PDF."
                        } else {
                            gpsMessage.ifBlank { "GPS lokacija se automatski dodaje u PDF uz potpis." }
                        },
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    )
                }
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    tonalElevation = 1.dp,
                    color = Color.White,
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(Color.White)
                            .onSizeChanged { canvasSize = it }
                            .pointerInput(isLoading) {
                                if (!isLoading) {
                                    detectDragGestures(
                                        onDragStart = { offset ->
                                            currentStroke = listOf(offset)
                                            strokes.add(currentStroke)
                                        },
                                        onDrag = { change, _ ->
                                            change.consume()
                                            val nextStroke = currentStroke + change.position
                                            currentStroke = nextStroke
                                            if (strokes.isNotEmpty()) {
                                                strokes[strokes.lastIndex] = nextStroke
                                            }
                                        },
                                        onDragEnd = { currentStroke = emptyList() },
                                        onDragCancel = { currentStroke = emptyList() },
                                    )
                                }
                            },
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            strokes.forEach { points ->
                                when {
                                    points.size == 1 -> drawCircle(
                                        color = inkColor,
                                        radius = 3.5f,
                                        center = points.first(),
                                    )
                                    points.size > 1 -> {
                                        val path = Path().apply {
                                            moveTo(points.first().x, points.first().y)
                                            points.drop(1).forEach { point -> lineTo(point.x, point.y) }
                                        }
                                        drawPath(
                                            path = path,
                                            color = inkColor,
                                            style = Stroke(width = 5.5f),
                                        )
                                    }
                                }
                            }
                        }
                        if (!hasSignature) {
                            Text(
                                text = "Potpis",
                                modifier = Modifier.align(Alignment.Center),
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color(0xFF94A3B8),
                            )
                        }
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = workOrder.displayNumber,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    TextButton(
                        onClick = {
                            strokes.clear()
                            currentStroke = emptyList()
                        },
                        enabled = !isLoading && hasSignature,
                    ) {
                        Text("Obriši")
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(
                        renderSignaturePng(
                            strokes = strokes.map { it.toList() },
                            widthPx = canvasSize.width,
                            heightPx = canvasSize.height,
                        ),
                        signerName.trim(),
                        signatureLocation.trim(),
                        includeSignerName,
                        includeSignedAt,
                        includeSignatureLocation,
                    )
                },
                enabled = !isLoading && hasSignature && canvasSize.width > 0 && canvasSize.height > 0,
            ) {
                Text("Potpiši i otvori PDF")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Odustani")
            }
        },
    )
}

@Composable
private fun SignatureMetadataCheckbox(
    checked: Boolean,
    enabled: Boolean,
    label: String,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = enabled) { onCheckedChange(!checked) }
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = onCheckedChange,
            enabled = enabled,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = if (enabled) 0.86f else 0.42f),
        )
    }
}

private fun renderSignaturePng(
    strokes: List<List<Offset>>,
    widthPx: Int,
    heightPx: Int,
): ByteArray {
    val safeWidth = widthPx.coerceAtLeast(480)
    val safeHeight = heightPx.coerceAtLeast(220)
    val scaleX = safeWidth / widthPx.coerceAtLeast(1).toFloat()
    val scaleY = safeHeight / heightPx.coerceAtLeast(1).toFloat()
    val bitmap = Bitmap.createBitmap(safeWidth, safeHeight, Bitmap.Config.ARGB_8888)
    bitmap.eraseColor(AndroidColor.TRANSPARENT)
    val canvas = AndroidCanvas(bitmap)
    val paint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
        color = AndroidColor.BLACK
        style = AndroidPaint.Style.STROKE
        strokeWidth = (safeWidth / 92f).coerceIn(4f, 8f)
        strokeCap = AndroidPaint.Cap.ROUND
        strokeJoin = AndroidPaint.Join.ROUND
    }
    val dotPaint = AndroidPaint(paint).apply {
        style = AndroidPaint.Style.FILL
    }

    strokes.filter { it.isNotEmpty() }.forEach { points ->
        if (points.size == 1) {
            val point = points.first()
            canvas.drawCircle(point.x * scaleX, point.y * scaleY, paint.strokeWidth / 2f, dotPaint)
        } else {
            val path = AndroidPath().apply {
                moveTo(points.first().x * scaleX, points.first().y * scaleY)
                points.drop(1).forEach { point ->
                    lineTo(point.x * scaleX, point.y * scaleY)
                }
            }
            canvas.drawPath(path, paint)
        }
    }

    return ByteArrayOutputStream().use { output ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
        output.toByteArray()
    }
}

private fun hasSignatureLocationPermission(context: Context): Boolean =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

@SuppressLint("MissingPermission")
private fun requestSignatureGpsLocation(
    context: Context,
    onResult: (String) -> Unit,
    onError: (String) -> Unit,
) {
    if (!hasSignatureLocationPermission(context)) {
        onError("Nema dozvole za GPS lokaciju potpisa.")
        return
    }

    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    if (locationManager == null) {
        onError("GPS lokacija nije dostupna na ovom uređaju.")
        return
    }

    val hasFinePermission = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_FINE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    val candidateProviders = buildList {
        if (hasFinePermission) add(LocationManager.GPS_PROVIDER)
        add(LocationManager.NETWORK_PROVIDER)
        add(LocationManager.PASSIVE_PROVIDER)
    }.distinct()
    val enabledProviders = candidateProviders.filter { provider ->
        provider == LocationManager.PASSIVE_PROVIDER ||
            runCatching { locationManager.isProviderEnabled(provider) }.getOrDefault(false)
    }

    if (enabledProviders.isEmpty()) {
        onError("Uključi lokaciju na mobitelu pa ponovno dohvati GPS.")
        return
    }

    fun bestLocation(locations: List<Location>): Location? =
        locations
            .filter { it.latitude in -90.0..90.0 && it.longitude in -180.0..180.0 }
            .maxWithOrNull(
                compareBy<Location> { if (it.provider == LocationManager.GPS_PROVIDER) 2 else 1 }
                    .thenBy { if (it.hasAccuracy()) -it.accuracy else Float.NEGATIVE_INFINITY }
                    .thenBy { it.time },
            )

    val lastKnownLocations = enabledProviders.mapNotNull { provider ->
        runCatching { locationManager.getLastKnownLocation(provider) }.getOrNull()
    }
    val lastKnown = bestLocation(lastKnownLocations)
    val now = System.currentTimeMillis()
    if (
        lastKnown != null &&
        now - lastKnown.time <= 120_000L &&
        (!lastKnown.hasAccuracy() || lastKnown.accuracy <= 35f)
    ) {
        onResult(formatSignatureGpsLocation(lastKnown))
        return
    }

    val handler = Handler(Looper.getMainLooper())
    var completed = false
    var bestFreshLocation: Location? = lastKnown
    var timeoutRunnable: Runnable? = null
    lateinit var listener: LocationListener

    fun completeWith(location: Location?) {
        if (completed) return
        completed = true
        runCatching { locationManager.removeUpdates(listener) }
        timeoutRunnable?.let { handler.removeCallbacks(it) }
        if (location != null) {
            onResult(formatSignatureGpsLocation(location))
        } else {
            onError("GPS lokacija nije pronađena. Provjeri da je lokacija uključena.")
        }
    }

    listener = LocationListener { location ->
        bestFreshLocation = bestLocation(listOfNotNull(bestFreshLocation, location))
        val isPreciseGps = location.provider == LocationManager.GPS_PROVIDER &&
            (!location.hasAccuracy() || location.accuracy <= 50f)
        val isGoodEnough = location.hasAccuracy() && location.accuracy <= 35f
        if (isPreciseGps || isGoodEnough) {
            completeWith(location)
        }
    }

    var requestedAnyProvider = false
    enabledProviders
        .filter { it != LocationManager.PASSIVE_PROVIDER }
        .forEach { provider ->
            runCatching {
                locationManager.requestLocationUpdates(
                    provider,
                    1000L,
                    0f,
                    listener,
                    Looper.getMainLooper(),
                )
                requestedAnyProvider = true
            }
        }

    if (!requestedAnyProvider) {
        completeWith(lastKnown)
        return
    }

    val timeout = Runnable {
        completeWith(bestFreshLocation)
    }
    timeoutRunnable = timeout
    handler.postDelayed(timeout, 12_000L)
}

private fun formatSignatureGpsLocation(location: Location): String {
    val latitude = String.format(Locale.US, "%.6f", location.latitude)
    val longitude = String.format(Locale.US, "%.6f", location.longitude)
    val accuracy = if (location.hasAccuracy()) "±${Math.round(location.accuracy)} m" else "točnost nepoznata"
    val provider = when (location.provider) {
        LocationManager.GPS_PROVIDER -> "GPS"
        LocationManager.NETWORK_PROVIDER -> "mreža"
        LocationManager.PASSIVE_PROVIDER -> "zadnja lokacija"
        else -> location.provider.orEmpty().ifBlank { "lokacija" }
    }
    val timestamp = runCatching {
        LocalDateTime.ofInstant(
            Instant.ofEpochMilli(location.time.takeIf { it > 0L } ?: System.currentTimeMillis()),
            ZoneId.systemDefault(),
        ).format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm"))
    }.getOrDefault(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm")))
    return "$provider: $latitude, $longitude · $accuracy · dohvaćeno $timestamp"
}

@Composable
private fun LoginScreen(
    isLoading: Boolean,
    error: String,
    rememberedUser: SafeNexusUser?,
    onLogin: (String, String, Boolean) -> Unit,
    onUnlockRememberedSession: () -> Unit,
) {
    var email by remember(rememberedUser?.email) { mutableStateOf(rememberedUser?.email.orEmpty()) }
    var password by remember { mutableStateOf("") }
    var rememberSession by remember { mutableStateOf(true) }
    var biometricError by remember { mutableStateOf("") }
    val context = LocalContext.current
    val displayedError = error.ifBlank { biometricError }
    val requestSavedLogin = {
        biometricError = ""
        requestBiometricLogin(
            context = context,
            onSuccess = onUnlockRememberedSession,
            onError = { biometricError = it },
        )
    }

    LaunchedEffect(rememberedUser?.email) {
        if (rememberedUser != null && !isLoading) {
            requestSavedLogin()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF061121), Color(0xFF0C2340), Color(0xFFEFF6FF)),
                    startY = 0f,
                    endY = 1500f,
                ),
            )
            .padding(WindowInsets.safeDrawing.asPaddingValues())
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp, vertical = 22.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BrandMark()
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = Color.White.copy(alpha = 0.12f),
                    ) {
                        Text(
                            text = "MOBILE",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFFD7E8FF),
                            fontWeight = FontWeight.Black,
                        )
                    }
                }
                Text(
                    text = "SafeNexus",
                    style = MaterialTheme.typography.displaySmall,
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                )
                Text(
                    text = "Radni nalozi, lokacije i rokovi spremni za teren.",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFFC7D8EF),
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    LoginMetricPill("RN")
                    LoginMetricPill("Karta")
                    LoginMetricPill("Sigurna sesija")
                }
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(30.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 16.dp),
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(15.dp),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Prijava",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF0F172A),
                        )
                        Text(
                            text = "Nastavi tamo gdje si stao.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF64748B),
                        )
                    }
                    if (rememberedUser != null) {
                        RememberedSessionCard(
                            user = rememberedUser,
                            isLoading = isLoading,
                            onBiometricLogin = requestSavedLogin,
                        )
                    }
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Rounded.Mail, contentDescription = null) },
                        label = { Text("Email") },
                        singleLine = true,
                        shape = RoundedCornerShape(18.dp),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next,
                        ),
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Rounded.Lock, contentDescription = null) },
                        label = { Text("Lozinka") },
                        singleLine = true,
                        shape = RoundedCornerShape(18.dp),
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done,
                        ),
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !isLoading) { rememberSession = !rememberSession }
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(
                            checked = rememberSession,
                            onCheckedChange = { rememberSession = it },
                            enabled = !isLoading,
                        )
                        Spacer(Modifier.width(6.dp))
                        Column {
                            Text("Zapamti prijavu", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                            Text(
                                "Automatski otvori RN-ove pri sljedecem ulasku.",
                                style = MaterialTheme.typography.labelMedium,
                                color = Color(0xFF64748B),
                            )
                        }
                    }
                    AnimatedVisibility(displayedError.isNotBlank(), enter = fadeIn(), exit = fadeOut()) {
                        MessageCard(text = displayedError, isError = true)
                    }
                    Button(
                        onClick = {
                            biometricError = ""
                            onLogin(email, password, rememberSession)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !isLoading,
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White,
                            )
                        } else {
                            Text("Uđi u SafeNexus", fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LoginMetricPill(text: String) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = Color.White.copy(alpha = 0.12f),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp),
            style = MaterialTheme.typography.labelMedium,
            color = Color(0xFFD7E8FF),
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun RememberedSessionCard(
    user: SafeNexusUser,
    isLoading: Boolean,
    onBiometricLogin: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFFEFF6FF),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Spremljena prijava",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color(0xFF1D4ED8),
                        fontWeight = FontWeight.Black,
                    )
                    Text(
                        text = user.displayName.ifBlank { user.email },
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF0F172A),
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Icon(
                    imageVector = Icons.Rounded.Fingerprint,
                    contentDescription = null,
                    tint = Color(0xFF2563EB),
                    modifier = Modifier.size(34.dp),
                )
            }
            Button(
                onClick = onBiometricLogin,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = !isLoading,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A)),
            ) {
                Icon(Icons.Rounded.Fingerprint, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Otključaj otiskom", fontWeight = FontWeight.Black)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrderCreateScreen(
    data: BootstrapData,
    isLoading: Boolean,
    error: String,
    onBack: () -> Unit,
    onSave: (WorkOrderCreateDraft) -> Unit,
) {
    var companyId by remember { mutableStateOf("") }
    var locationId by remember { mutableStateOf("") }
    var status by remember(data.workOrderStatuses) { mutableStateOf(data.workOrderStatuses.firstOrNull()?.value ?: "Otvoreni RN") }
    var openedDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var dueDate by remember { mutableStateOf("") }
    var executionDate by remember { mutableStateOf("") }
    var priority by remember(data.priorities) { mutableStateOf(data.priorities.firstOrNull { it.value == "Normal" }?.value ?: "Normal") }
    var serviceLine by remember { mutableStateOf("") }
    var selectedServiceIds by remember { mutableStateOf(emptyList<String>()) }
    var description by remember { mutableStateOf("") }
    var selectedExecutors by remember { mutableStateOf(emptyList<String>()) }
    var completedBy by remember { mutableStateOf("") }
    var teamLabel by remember { mutableStateOf("") }
    var contactName by remember { mutableStateOf("") }
    var contactPhone by remember { mutableStateOf("") }
    var contactEmail by remember { mutableStateOf("") }
    var tagText by remember { mutableStateOf("") }
    var invoiceNote by remember { mutableStateOf("") }
    var linkReference by remember { mutableStateOf("") }
    var department by remember { mutableStateOf("") }
    val company = data.workOrderCompanies.firstOrNull { it.id == companyId }
    val availableLocations = remember(companyId, data.workOrderLocations) {
        data.workOrderLocations.filter { location -> companyId.isBlank() || location.companyId == companyId }
    }
    val selectedLocation = availableLocations.firstOrNull { it.id == locationId }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = "Natrag")
                    }
                },
                title = {
                    Column {
                        Text("Novi radni nalog", fontWeight = FontWeight.Bold)
                        Text("Broj RN-a dodjeljuje se automatski", style = MaterialTheme.typography.labelMedium)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(26.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Osnovni podaci", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                        DetailRow(Icons.Rounded.Work, "Broj radnog naloga", "Automatski nakon spremanja")
                        WorkOrderSelectField(
                            label = "Naručitelj",
                            value = companyId,
                            valueLabel = company?.name.orEmpty(),
                            options = data.workOrderCompanies.map { it.id to it.name },
                            enabled = !isLoading,
                            onSelect = { next ->
                                companyId = next
                                locationId = ""
                                contactName = ""
                                contactPhone = ""
                                contactEmail = ""
                            },
                        )
                        WorkOrderSelectField(
                            label = "Lokacija",
                            value = locationId,
                            valueLabel = selectedLocation?.name.orEmpty(),
                            options = availableLocations.map { it.id to it.name },
                            enabled = !isLoading && companyId.isNotBlank(),
                            onSelect = { next ->
                                locationId = next
                                availableLocations.firstOrNull { it.id == next }?.let { location ->
                                    contactName = location.contactName1
                                    contactPhone = location.contactPhone1
                                    contactEmail = location.contactEmail1
                                }
                            },
                        )
                        if (company != null || selectedLocation != null) {
                            Text(
                                listOfNotNull(
                                    company?.oib?.takeIf { it.isNotBlank() }?.let { "OIB $it" },
                                    company?.headquarters?.takeIf { it.isNotBlank() },
                                    selectedLocation?.region?.takeIf { it.isNotBlank() },
                                ).joinToString(" · "),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = openedDate,
                                onValueChange = { openedDate = it },
                                modifier = Modifier.weight(1f),
                                label = { Text("Datum") },
                                singleLine = true,
                                enabled = !isLoading,
                                shape = RoundedCornerShape(16.dp),
                            )
                            OutlinedTextField(
                                value = dueDate,
                                onValueChange = { dueDate = it },
                                modifier = Modifier.weight(1f),
                                label = { Text("Rok") },
                                singleLine = true,
                                enabled = !isLoading,
                                shape = RoundedCornerShape(16.dp),
                            )
                        }
                        WorkOrderSelectField(
                            label = "Status",
                            value = status,
                            valueLabel = data.workOrderStatuses.firstOrNull { it.value == status }?.label ?: status,
                            options = (data.workOrderStatuses.ifEmpty {
                                listOf(
                                    com.safenexus.app.data.OptionItem("Otvoreni RN", "Otvoreni RN"),
                                    com.safenexus.app.data.OptionItem("Gotov RN", "Gotov RN"),
                                    com.safenexus.app.data.OptionItem("Ovjeren RN", "Ovjeren RN"),
                                )
                            }).map { it.value to it.label },
                            enabled = !isLoading,
                            onSelect = { status = it },
                        )
                    }
                }
            }

            item {
                ExpandableFormSection(
                    title = "Izvršitelji",
                    summary = if (selectedExecutors.isEmpty()) "Nije dodijeljeno" else selectedExecutors.joinToString(", "),
                    initiallyExpanded = true,
                ) {
                    WorkOrderMultiSelectChips(
                        options = data.workOrderUsers.map { it.label to it.label },
                        selected = selectedExecutors,
                        enabled = !isLoading,
                        emptyText = "Nema aktivnih korisnika za odabir.",
                        onToggle = { value ->
                            selectedExecutors = selectedExecutors.toggleValue(value)
                        },
                    )
                    WorkOrderTextField("Odgovorna osoba", completedBy, { completedBy = it }, enabled = !isLoading)
                    WorkOrderTextField("Tim / grupa", teamLabel, { teamLabel = it }, enabled = !isLoading)
                }
            }

            item {
                ExpandableFormSection(
                    title = "Radovi",
                    summary = serviceLine.ifBlank { "${selectedServiceIds.size} usluga" },
                    initiallyExpanded = true,
                ) {
                    WorkOrderTextField("Naziv / usluga", serviceLine, { serviceLine = it }, enabled = !isLoading)
                    WorkOrderMultiSelectChips(
                        options = data.workOrderServices.map { service ->
                            service.id to listOf(service.serviceCode, service.name).filter { it.isNotBlank() }.joinToString(" · ")
                        },
                        selected = selectedServiceIds,
                        enabled = !isLoading,
                        emptyText = "Katalog usluga nije dostupan.",
                        onToggle = { value ->
                            selectedServiceIds = selectedServiceIds.toggleValue(value)
                            val selectedNames = data.workOrderServices
                                .filter { service -> service.id in selectedServiceIds }
                                .map { service -> service.name.ifBlank { service.serviceCode } }
                                .filter { it.isNotBlank() }
                            if (selectedNames.isNotEmpty()) {
                                serviceLine = selectedNames.joinToString(" · ")
                            }
                        },
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(118.dp),
                        label = { Text("Opis radova") },
                        enabled = !isLoading,
                        shape = RoundedCornerShape(16.dp),
                    )
                }
            }

            item {
                ExpandableFormSection(
                    title = "Kontakt i dodatni podaci",
                    summary = listOf(contactName, priority, tagText).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { "Opcionalno" },
                    initiallyExpanded = false,
                ) {
                    WorkOrderSelectField(
                        label = "Prioritet",
                        value = priority,
                        valueLabel = data.priorities.firstOrNull { it.value == priority }?.label ?: priority,
                        options = (data.priorities.ifEmpty {
                            listOf(
                                com.safenexus.app.data.OptionItem("Urgent", "Urgent"),
                                com.safenexus.app.data.OptionItem("High", "High"),
                                com.safenexus.app.data.OptionItem("Normal", "Normal"),
                                com.safenexus.app.data.OptionItem("Niski prioritet", "Niski prioritet"),
                                com.safenexus.app.data.OptionItem("Bez prioriteta", "Bez prioriteta"),
                            )
                        }).map { it.value to it.label },
                        enabled = !isLoading,
                        onSelect = { priority = it },
                    )
                    WorkOrderTextField("Kontakt osoba", contactName, { contactName = it }, enabled = !isLoading)
                    WorkOrderTextField("Kontakt telefon", contactPhone, { contactPhone = it }, enabled = !isLoading)
                    WorkOrderTextField("Kontakt email", contactEmail, { contactEmail = it }, enabled = !isLoading)
                    WorkOrderTextField("Datum izvršenja", executionDate, { executionDate = it }, enabled = !isLoading)
                    WorkOrderTextField("Odjel", department, { department = it }, enabled = !isLoading)
                    WorkOrderTextField("Tagovi", tagText, { tagText = it }, enabled = !isLoading)
                    WorkOrderTextField("Veza RN", linkReference, { linkReference = it }, enabled = !isLoading)
                    WorkOrderTextField("Interna napomena / faktura", invoiceNote, { invoiceNote = it }, enabled = !isLoading)
                }
            }

            item {
                ExpandableFormSection(
                    title = "Dokumentacija",
                    summary = "Dodaje se nakon spremanja RN-a",
                    initiallyExpanded = false,
                ) {
                    DetailRow(Icons.Rounded.Description, "Dokumentacija", "Spremi radni nalog, zatim ga otvori i dodaj sken, PDF, fotografije ili datoteke.")
                }
            }

            item {
                AnimatedVisibility(error.isNotBlank()) {
                    MessageCard(text = error, isError = true)
                }
            }
            item {
                Button(
                    onClick = {
                        onSave(
                            WorkOrderCreateDraft(
                                companyId = companyId,
                                locationId = locationId,
                                status = status,
                                openedDate = openedDate,
                                dueDate = dueDate,
                                executionDate = executionDate,
                                priority = priority,
                                serviceLine = serviceLine,
                                serviceIds = selectedServiceIds,
                                description = description,
                                executors = selectedExecutors,
                                completedBy = completedBy,
                                teamLabel = teamLabel,
                                contactName = contactName,
                                contactPhone = contactPhone,
                                contactEmail = contactEmail,
                                tagText = tagText,
                                invoiceNote = invoiceNote,
                                linkReference = linkReference,
                                department = department,
                            ),
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = !isLoading && companyId.isNotBlank(),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Otvori radni nalog", fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
private fun ExpandableFormSection(
    title: String,
    summary: String,
    initiallyExpanded: Boolean,
    content: @Composable ColumnScope.() -> Unit,
) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Text(
                        summary.ifBlank { "Opcionalno" },
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant) {
                    Text(
                        text = if (expanded) "-" else "+",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        fontWeight = FontWeight.Black,
                    )
                }
            }
            AnimatedVisibility(expanded) {
                Column(verticalArrangement = Arrangement.spacedBy(11.dp), content = content)
            }
        }
    }
}

@Composable
private fun WorkOrderTextField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    enabled: Boolean,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        singleLine = true,
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
    )
}

private fun isoDateToMillis(value: String): Long? =
    parseDateOrNull(value)
        ?.atStartOfDay(ZoneId.systemDefault())
        ?.toInstant()
        ?.toEpochMilli()

private fun millisToIsoDate(value: Long?): String =
    value?.let {
        Instant.ofEpochMilli(it)
            .atZone(ZoneId.systemDefault())
            .toLocalDate()
            .toString()
    }.orEmpty()

private fun formatDatePickerLabel(value: String): String =
    parseDateOrNull(value)
        ?.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
        ?: value

@Composable
private fun WorkOrderDatePickerField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    enabled: Boolean,
) {
    var openPicker by remember { mutableStateOf(false) }
    OutlinedButton(
        onClick = { openPicker = true },
        modifier = Modifier.fillMaxWidth(),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 13.dp),
    ) {
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
            Text(
                formatDatePickerLabel(value).ifBlank { "Odaberi datum" },
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
            )
        }
        Icon(Icons.Rounded.CalendarMonth, contentDescription = null)
    }
    if (openPicker) {
        val pickerState = rememberDatePickerState(initialSelectedDateMillis = isoDateToMillis(value))
        DatePickerDialog(
            onDismissRequest = { openPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        onChange(millisToIsoDate(pickerState.selectedDateMillis))
                        openPicker = false
                    },
                ) {
                    Text("Spremi")
                }
            },
            dismissButton = {
                TextButton(onClick = { openPicker = false }) {
                    Text("Odustani")
                }
            },
        ) {
            DatePicker(state = pickerState)
        }
    }
}

@Composable
private fun WorkOrderSelectField(
    label: String,
    value: String,
    valueLabel: String,
    options: List<Pair<String, String>>,
    enabled: Boolean,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            enabled = enabled && options.isNotEmpty(),
            shape = RoundedCornerShape(16.dp),
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 13.dp),
        ) {
            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
                Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
                Text(
                    valueLabel.ifBlank { "Odaberi" },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.heightIn(max = 360.dp),
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = {
                        Text(
                            option.second,
                            fontWeight = if (option.first == value) FontWeight.Black else FontWeight.Normal,
                        )
                    },
                    onClick = {
                        expanded = false
                        onSelect(option.first)
                    },
                )
            }
        }
    }
}

@Composable
private fun WorkOrderMultiSelectChips(
    options: List<Pair<String, String>>,
    selected: List<String>,
    enabled: Boolean,
    emptyText: String,
    onToggle: (String) -> Unit,
) {
    if (options.isEmpty()) {
        Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
        return
    }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        options.take(80).forEach { option ->
            FilterChip(
                selected = option.first in selected,
                onClick = { onToggle(option.first) },
                enabled = enabled,
                label = {
                    Text(option.second, maxLines = 1, overflow = TextOverflow.Ellipsis)
                },
            )
        }
    }
}

@Composable
private fun DocumentationMultiSelectField(
    label: String,
    options: List<WorkOrderDocumentationOption>,
    selectedIds: Set<String>,
    enabled: Boolean,
    emptyText: String,
    onChange: (Set<String>) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            if (selectedIds.isNotEmpty()) {
                Text(
                    "${selectedIds.size} odabrano",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
        if (options.isEmpty()) {
            Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
            return
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            options.take(96).forEach { option ->
                val selected = option.id in selectedIds
                FilterChip(
                    selected = selected,
                    onClick = {
                        onChange(
                            if (selected) {
                                selectedIds - option.id
                            } else {
                                selectedIds + option.id
                            },
                        )
                    },
                    enabled = enabled,
                    leadingIcon = if (selected) {
                        {
                            Icon(
                                Icons.Rounded.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    } else {
                        null
                    },
                    label = {
                        Column {
                            Text(option.label, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            val subtitle = listOf(option.subtitle, option.status)
                                .map { it.trim() }
                                .filter { it.isNotBlank() }
                                .distinct()
                                .joinToString(" · ")
                            if (subtitle.isNotBlank()) {
                                Text(
                                    subtitle,
                                    style = MaterialTheme.typography.labelSmall,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                                )
                            }
                        }
                    },
                )
            }
        }
        if (options.size > 96) {
            Text(
                "Prikazano prvih 96 stavki. Za kraći prikaz koristi grupu opreme ili pretraživanje u webu.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
            )
        }
    }
}

private fun List<String>.toggleValue(value: String): List<String> =
    if (value in this) filterNot { it == value } else this + value

private fun requestBiometricLogin(
    context: Context,
    onSuccess: () -> Unit,
    onError: (String) -> Unit,
) {
    val activity = context.findFragmentActivity()
    if (activity == null) {
        onError("Biometrijska prijava nije dostupna u ovom prikazu.")
        return
    }

    val biometricManager = BiometricManager.from(context)
    val availability = biometricManager.canAuthenticate(biometricAuthenticators)
    if (availability != BiometricManager.BIOMETRIC_SUCCESS) {
        onError(biometricAvailabilityMessage(availability))
        return
    }

    val prompt = BiometricPrompt(
        activity,
        ContextCompat.getMainExecutor(context),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                if (
                    errorCode == BiometricPrompt.ERROR_CANCELED ||
                    errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                    errorCode == BiometricPrompt.ERROR_USER_CANCELED
                ) {
                    return
                }
                onError(errString.toString().ifBlank { "Biometrijska prijava nije uspjela." })
            }

            override fun onAuthenticationFailed() {
                onError("Otisak nije prepoznat. Pokusaj ponovno.")
            }
        },
    )

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Otključaj SafeNexus")
        .setSubtitle("Potvrdi identitet za spremljenu prijavu.")
        .setAllowedAuthenticators(biometricAuthenticators)
        .build()

    prompt.authenticate(promptInfo)
}

private tailrec fun Context.findFragmentActivity(): FragmentActivity? = when (this) {
    is FragmentActivity -> this
    is ContextWrapper -> baseContext.findFragmentActivity()
    else -> null
}

private fun biometricAvailabilityMessage(status: Int): String = when (status) {
    BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "Senzor otiska trenutno nije dostupan."
    BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "Na mobitelu prvo dodaj otisak prsta ili zaključavanje zaslona."
    BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> "Ovaj mobitel nema podržanu biometrijsku prijavu."
    BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> "Mobitel treba sigurnosno ažuriranje za biometrijsku prijavu."
    BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> "Ova verzija uređaja ne podržava traženi način biometrijske prijave."
    BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> "Ne mogu provjeriti biometrijsku prijavu na ovom uređaju."
    else -> "Biometrijska prijava nije dostupna."
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrdersScreen(
    state: AppState,
    onQueryChange: (String) -> Unit,
    onFilterChange: (WorkOrderFilter) -> Unit,
    onViewModeChange: (WorkOrderViewMode) -> Unit,
    onSectionChange: (AppSection) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onOpenWorkOrder: (WorkOrder) -> Unit,
    onOpenRecord: (MobileRecord) -> Unit,
    onNewWorkOrder: () -> Unit,
    onStatusChange: (WorkOrder, String) -> Unit,
    onAddDocumentation: (WorkOrder) -> Unit,
) {
    val normalizedQuery = remember(state.query) { state.query.trim().lowercase() }
    val filtered = remember(state.workOrders, normalizedQuery, state.filter) {
        state.workOrders
            .filter { workOrder ->
                when (state.filter) {
                    WorkOrderFilter.All -> true
                    WorkOrderFilter.Active -> workOrder.isOpenRnStatus()
                    WorkOrderFilter.Overdue -> workOrder.isInProgressRnStatus()
                    WorkOrderFilter.Closed -> workOrder.isClosed
                }
            }
            .filter { workOrder -> normalizedQuery.isBlank() || workOrder.matchesSearch(normalizedQuery) }
    }
    val mapPoints = remember(filtered) { buildWorkOrderMapPoints(filtered) }
    val filteredCalendar = remember(state.data.calendarEvents, normalizedQuery) {
        state.data.calendarEvents.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredVehicles = remember(state.data.vehicles, normalizedQuery) {
        state.data.vehicles.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    var quickActionsExpanded by remember(state.section) { mutableStateOf(false) }
    var mainMenuExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            if (state.section == AppSection.WorkOrders) {
                WorkOrdersTopBar(
                    currentSection = state.section,
                    viewMode = state.viewMode,
                    mainMenuExpanded = mainMenuExpanded,
                    onMainMenuExpandedChange = { mainMenuExpanded = it },
                    onSectionChange = { section ->
                        mainMenuExpanded = false
                        onSectionChange(section)
                    },
                    onViewModeChange = onViewModeChange,
                    onRefresh = onRefresh,
                    onLogout = {
                        mainMenuExpanded = false
                        onLogout()
                    },
                    onNewWorkOrder = onNewWorkOrder,
                )
            } else {
                MainAppTopBar(
                    currentSection = state.section,
                    displayName = state.user?.displayName.orEmpty(),
                    mainMenuExpanded = mainMenuExpanded,
                    onMainMenuExpandedChange = { mainMenuExpanded = it },
                    onSectionChange = { section ->
                        mainMenuExpanded = false
                        onSectionChange(section)
                    },
                    onRefresh = onRefresh,
                    onLogout = {
                        mainMenuExpanded = false
                        onLogout()
                    },
                )
            }
        },
        floatingActionButton = {
            if (state.section == AppSection.WorkOrders) {
                WorkOrderQuickActionsFab(
                    expanded = quickActionsExpanded,
                    filter = state.filter,
                    viewMode = state.viewMode,
                    onToggle = { quickActionsExpanded = !quickActionsExpanded },
                    onNewWorkOrder = {
                        quickActionsExpanded = false
                        onNewWorkOrder()
                    },
                    onRefresh = {
                        quickActionsExpanded = false
                        onRefresh()
                    },
                    onViewModeChange = { value ->
                        quickActionsExpanded = false
                        onViewModeChange(value)
                    },
                    onFilterChange = { value ->
                        quickActionsExpanded = false
                        onFilterChange(value)
                    },
                )
            }
        },
        bottomBar = {
            MainBottomBar(
                selected = state.section,
                onSectionChange = onSectionChange,
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.section == AppSection.Operations) {
                item {
                    OperationsContent(
                        stats = state.data.dashboard,
                        workOrders = state.workOrders,
                    )
                }
                item {
                    AnimatedVisibility(state.isLoading) {
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    }
                    AnimatedVisibility(state.error.isNotBlank()) {
                        MessageCard(text = state.error, isError = true)
                    }
                    AnimatedVisibility(state.notice.isNotBlank()) {
                        MessageCard(text = state.notice, isError = false)
                    }
                }
            } else if (state.section == AppSection.Calendar) {
                item {
                    ModuleSearchField(
                        query = state.query,
                        onQueryChange = onQueryChange,
                        label = "Pretraga događaja, tvrtke, statusa",
                    )
                }
                item {
                    CalendarContent(
                        records = filteredCalendar,
                        onOpenRecord = onOpenRecord,
                    )
                }
            } else if (state.section == AppSection.Vehicles) {
                item {
                    ModuleSearchField(
                        query = state.query,
                        onQueryChange = onQueryChange,
                        label = "Pretraga vozila, registracije, statusa",
                    )
                }
                item {
                    RecordsContent(
                        title = "Vozila",
                        records = filteredVehicles,
                        emptyText = "Nema vozila za prikaz.",
                        icon = Icons.Rounded.Business,
                        onOpenRecord = onOpenRecord,
                    )
                }
            } else if (state.section == AppSection.More) {
                item {
                    ModuleSearchField(
                        query = state.query,
                        onQueryChange = onQueryChange,
                        label = "Pretraga dokumentacije i modula",
                    )
                }
                item {
                    MoreContent(
                        data = state.data,
                        query = normalizedQuery,
                        onOpenRecord = onOpenRecord,
                    )
                }
            } else {
            item {
                WorkOrdersListSummary(
                    total = state.workOrders.size,
                    query = state.query,
                    onQueryChange = onQueryChange,
                )
            }
            item {
                WorkOrderTabs(
                    selected = state.filter,
                    onFilterChange = onFilterChange,
                )
            }
            item {
                AnimatedVisibility(state.isLoading) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                AnimatedVisibility(state.error.isNotBlank()) {
                    MessageCard(text = state.error, isError = true)
                }
                AnimatedVisibility(state.notice.isNotBlank()) {
                    MessageCard(text = state.notice, isError = false)
                }
            }
            if (state.viewMode == WorkOrderViewMode.Map) {
                if (filtered.isEmpty() && !state.isLoading) {
                    item {
                        EmptyWorkOrders()
                    }
                } else if (mapPoints.isEmpty() && !state.isLoading) {
                    item {
                        NoCoordinateWorkOrders()
                    }
                } else {
                    item {
                        WorkOrderMapPanel(
                            points = mapPoints,
                            totalWorkOrders = filtered.size,
                            onOpenWorkOrder = onOpenWorkOrder,
                        )
                    }
                    items(mapPoints, key = { "map-${it.workOrder.id}" }) { entry ->
                    WorkOrderCard(
                        workOrder = entry.workOrder,
                        isLoading = state.isLoading,
                        statusOptions = state.data.workOrderStatuses.map { it.value }.ifEmpty { workOrderStatusOptions },
                        onClick = { onOpenWorkOrder(entry.workOrder) },
                            onStatusChange = { status -> onStatusChange(entry.workOrder, status) },
                            onAddDocumentation = { onAddDocumentation(entry.workOrder) },
                        )
                    }
                }
            } else if (filtered.isEmpty() && !state.isLoading) {
                item {
                    EmptyWorkOrders()
                }
            } else {
                items(filtered, key = { it.id }) { workOrder ->
                    WorkOrderCard(
                        workOrder = workOrder,
                        isLoading = state.isLoading,
                        statusOptions = state.data.workOrderStatuses.map { it.value }.ifEmpty { workOrderStatusOptions },
                        onClick = { onOpenWorkOrder(workOrder) },
                        onStatusChange = { status -> onStatusChange(workOrder, status) },
                        onAddDocumentation = { onAddDocumentation(workOrder) },
                    )
                }
            }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainAppTopBar(
    currentSection: AppSection,
    displayName: String,
    mainMenuExpanded: Boolean,
    onMainMenuExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    TopAppBar(
        navigationIcon = {
            MainMenuButton(
                currentSection = currentSection,
                expanded = mainMenuExpanded,
                onExpandedChange = onMainMenuExpandedChange,
                onSectionChange = onSectionChange,
                onLogout = onLogout,
            )
        },
        title = {
            Column {
                Text(currentSection.label, fontWeight = FontWeight.Bold)
                Text(
                    text = displayName,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        actions = {
            IconButton(onClick = onRefresh) {
                Icon(Icons.Rounded.Refresh, contentDescription = "Osvježi")
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrdersTopBar(
    currentSection: AppSection,
    viewMode: WorkOrderViewMode,
    mainMenuExpanded: Boolean,
    onMainMenuExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection) -> Unit,
    onViewModeChange: (WorkOrderViewMode) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onNewWorkOrder: () -> Unit,
) {
    TopAppBar(
        navigationIcon = {
            MainMenuButton(
                currentSection = currentSection,
                expanded = mainMenuExpanded,
                onExpandedChange = onMainMenuExpandedChange,
                onSectionChange = onSectionChange,
                onLogout = onLogout,
            )
        },
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFEAF2FF),
                ) {
                    Icon(
                        Icons.Rounded.Work,
                        contentDescription = null,
                        modifier = Modifier
                            .size(36.dp)
                            .padding(8.dp),
                        tint = Color(0xFF0B63E5),
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    "Radni nalozi",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        actions = {
            IconButton(onClick = onRefresh) {
                Icon(Icons.Rounded.Search, contentDescription = "Osvježi")
            }
            IconButton(
                onClick = {
                    onViewModeChange(
                        if (viewMode == WorkOrderViewMode.Map) WorkOrderViewMode.List else WorkOrderViewMode.Map,
                    )
                },
            ) {
                Icon(
                    Icons.Rounded.FilterList,
                    contentDescription = if (viewMode == WorkOrderViewMode.Map) "Prikaži listu" else "Prikaži kartu",
                )
            }
            Button(
                onClick = onNewWorkOrder,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0B63E5)),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 8.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(3.dp))
                Text("Novi", fontWeight = FontWeight.Bold, maxLines = 1)
            }
            Spacer(Modifier.width(4.dp))
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFFFAFCFF)),
    )
}

@Composable
private fun MainMenuButton(
    currentSection: AppSection,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection) -> Unit,
    onLogout: () -> Unit,
) {
    Box {
        IconButton(onClick = { onExpandedChange(true) }) {
            Icon(Icons.Rounded.Menu, contentDescription = "Glavni izbornik")
        }
        MainMenuDropdown(
            expanded = expanded,
            currentSection = currentSection,
            onDismiss = { onExpandedChange(false) },
            onSectionChange = onSectionChange,
            onLogout = onLogout,
        )
    }
}

@Composable
private fun MainMenuDropdown(
    expanded: Boolean,
    currentSection: AppSection,
    onDismiss: () -> Unit,
    onSectionChange: (AppSection) -> Unit,
    onLogout: () -> Unit,
) {
    val shortcuts = remember {
        listOf(
            MainMenuShortcut("Operativa", "Pregled terena, rokova i prioriteta", AppSection.Operations, Icons.Rounded.Work),
            MainMenuShortcut("Radni nalozi", "Lista, karta, statusi i skeniranje RN-a", AppSection.WorkOrders, Icons.Rounded.CheckCircle),
            MainMenuShortcut("Kalendar", "Dnevni, tjedni i mjesečni raspored", AppSection.Calendar, Icons.Rounded.CalendarMonth),
            MainMenuShortcut("Vozila", "Pregled vozila, servisa i rezervacija", AppSection.Vehicles, Icons.Rounded.Business),
            MainMenuShortcut("Svi moduli", "Dokumenti, periodika, portal i pravilnici", AppSection.More, Icons.Rounded.Map),
            MainMenuShortcut("Dokumenti", "PDF dokumenti, pravilnici i zapisnici", AppSection.More, Icons.Rounded.Mail),
            MainMenuShortcut("Zapisnici", "Pregled, statusi i potpisani zapisi", AppSection.More, Icons.Rounded.CheckCircle),
            MainMenuShortcut("Periodika", "Rokovi, pregledi i isteci", AppSection.More, Icons.Rounded.CalendarMonth),
            MainMenuShortcut("Osposobljavanja", "ZOS, liječnički pregledi i uvjerenja", AppSection.More, Icons.Rounded.Fingerprint),
            MainMenuShortcut("Klijentski portal", "Dokumentacija i klijentski pregled", AppSection.More, Icons.Rounded.Map),
            MainMenuShortcut("Tvrtke", "Klijenti, kontakti i povezani podaci", AppSection.More, Icons.Rounded.Business),
            MainMenuShortcut("Lokacije", "Lokacije tvrtki i radnih naloga", AppSection.More, Icons.Rounded.LocationOn),
            MainMenuShortcut("Pravilnici", "Temeljna dokumentacija i aktivni pravilnici", AppSection.More, Icons.Rounded.Lock),
        )
    }

    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismiss,
        modifier = Modifier.width(318.dp),
    ) {
        shortcuts.forEach { shortcut ->
            val selected = when (shortcut.label) {
                "Operativa" -> currentSection == AppSection.Operations
                "Radni nalozi" -> currentSection == AppSection.WorkOrders
                "Kalendar" -> currentSection == AppSection.Calendar
                "Vozila" -> currentSection == AppSection.Vehicles
                "Svi moduli" -> currentSection == AppSection.More
                else -> false
            }
            DropdownMenuItem(
                text = {
                    Column {
                        Text(
                            shortcut.label,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            shortcut.description,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                },
                leadingIcon = {
                    Icon(
                        shortcut.icon,
                        contentDescription = null,
                        tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                trailingIcon = {
                    if (selected) {
                        Text(
                            "Aktivno",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                },
                onClick = {
                    onSectionChange(shortcut.section)
                    onDismiss()
                },
            )
        }
        DropdownMenuItem(
            text = {
                Column {
                    Text("Odjava", fontWeight = FontWeight.Bold)
                    Text(
                        "Zatvori trenutnu prijavu",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    )
                }
            },
            leadingIcon = { Icon(Icons.Rounded.Lock, contentDescription = null) },
            onClick = {
                onDismiss()
                onLogout()
            },
        )
    }
}

@Composable
private fun WorkOrdersListSummary(
    total: Int,
    query: String,
    onQueryChange: (String) -> Unit,
) {
    var showSearch by remember { mutableStateOf(query.isNotBlank()) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Ukupno:",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF334155),
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.width(5.dp))
            Text(
                total.toString(),
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF0B63E5),
                fontWeight = FontWeight.Black,
            )
            Spacer(Modifier.weight(1f))
            TextButton(onClick = { showSearch = !showSearch }) {
                Icon(Icons.Rounded.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(if (showSearch) "Sakrij" else "Traži")
            }
        }

        AnimatedVisibility(showSearch) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                label = { Text("Pretraga RN, klijent, lokacija, usluga") },
                singleLine = true,
            )
        }
    }
}

@Composable
private fun WorkOrderTabs(
    selected: WorkOrderFilter,
    onFilterChange: (WorkOrderFilter) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom,
    ) {
        WorkOrderFilter.entries.forEach { filter ->
            val isSelected = selected == filter
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onFilterChange(filter) }
                    .padding(top = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    filter.label,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Black,
                    color = if (isSelected) Color(0xFF0B63E5) else Color(0xFF475569),
                    maxLines = 1,
                )
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .height(3.dp)
                        .fillMaxWidth()
                        .background(if (isSelected) Color(0xFF0B63E5) else Color.Transparent),
                )
            }
        }
    }
}

@Composable
private fun WorkOrderQuickActionsFab(
    expanded: Boolean,
    filter: WorkOrderFilter,
    viewMode: WorkOrderViewMode,
    onToggle: () -> Unit,
    onNewWorkOrder: () -> Unit,
    onRefresh: () -> Unit,
    onViewModeChange: (WorkOrderViewMode) -> Unit,
    onFilterChange: (WorkOrderFilter) -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        AnimatedVisibility(expanded) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    QuickActionButton(
                        label = "Novi nalog",
                        icon = Icons.Rounded.Add,
                        isPrimary = true,
                        onClick = onNewWorkOrder,
                    )
                    QuickActionButton(
                        label = if (viewMode == WorkOrderViewMode.Map) "Prikaži listu" else "Prikaži kartu",
                        icon = if (viewMode == WorkOrderViewMode.Map) Icons.Rounded.Work else Icons.Rounded.Map,
                        onClick = {
                            onViewModeChange(
                                if (viewMode == WorkOrderViewMode.Map) WorkOrderViewMode.List else WorkOrderViewMode.Map,
                            )
                        },
                    )
                    QuickActionButton(
                        label = "Osvježi RN",
                        icon = Icons.Rounded.Refresh,
                        onClick = onRefresh,
                    )
                    QuickActionDivider()
                    QuickFilterAction("Svi RN", WorkOrderFilter.All, filter, onFilterChange)
                    QuickFilterAction("Otvoreni", WorkOrderFilter.Active, filter, onFilterChange)
                    QuickFilterAction("U tijeku", WorkOrderFilter.Overdue, filter, onFilterChange)
                    QuickFilterAction("Završeni", WorkOrderFilter.Closed, filter, onFilterChange)
                }
            }
        }

        FloatingActionButton(
            onClick = onToggle,
            containerColor = Color(0xFF0B63E5),
            contentColor = Color.White,
        ) {
            Icon(
                if (expanded) Icons.Rounded.ArrowBack else Icons.Rounded.Add,
                contentDescription = if (expanded) "Zatvori brze akcije" else "Brze akcije",
            )
        }
    }
}

@Composable
private fun QuickFilterAction(
    label: String,
    value: WorkOrderFilter,
    selected: WorkOrderFilter,
    onFilterChange: (WorkOrderFilter) -> Unit,
) {
    QuickActionButton(
        label = label,
        icon = if (selected == value) Icons.Rounded.CheckCircle else Icons.Rounded.FilterList,
        isSelected = selected == value,
        onClick = { onFilterChange(value) },
    )
}

@Composable
private fun QuickActionButton(
    label: String,
    icon: ImageVector,
    isPrimary: Boolean = false,
    isSelected: Boolean = false,
    onClick: () -> Unit,
) {
    val background = when {
        isPrimary -> Color(0xFF0B63E5)
        isSelected -> Color(0xFFEAF2FF)
        else -> Color(0xFFF8FAFC)
    }
    val contentColor = when {
        isPrimary -> Color.White
        isSelected -> Color(0xFF0B63E5)
        else -> Color(0xFF0F172A)
    }

    Surface(
        modifier = Modifier
            .width(190.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = background,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(19.dp), tint = contentColor)
            Spacer(Modifier.width(10.dp))
            Text(
                label,
                color = contentColor,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun QuickActionDivider() {
    Box(
        modifier = Modifier
            .width(190.dp)
            .height(1.dp)
            .background(Color(0xFFE2E8F0)),
    )
}

@Composable
private fun MainBottomBar(
    selected: AppSection,
    onSectionChange: (AppSection) -> Unit,
) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        AppSection.entries.forEach { section ->
            NavigationBarItem(
                selected = selected == section,
                onClick = { onSectionChange(section) },
                icon = {
                    Icon(
                        imageVector = section.icon(),
                        contentDescription = section.label,
                    )
                },
                label = { Text(section.label) },
            )
        }
    }
}

private fun AppSection.icon(): ImageVector = when (this) {
    AppSection.Operations -> Icons.Rounded.Work
    AppSection.WorkOrders -> Icons.Rounded.CheckCircle
    AppSection.Calendar -> Icons.Rounded.CalendarMonth
    AppSection.Vehicles -> Icons.Rounded.Business
    AppSection.More -> Icons.Rounded.Map
}

@Composable
private fun OperationsContent(
    stats: DashboardStats,
    workOrders: List<WorkOrder>,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        WorkOrderHero(workOrders)
        DashboardMetricGrid(stats)
        PriorityWorkOrders(workOrders)
    }
}

@Composable
private fun DashboardMetricGrid(stats: DashboardStats) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = "Pregled sustava",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Black,
        )
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            DashboardMetricTile("RN ukupno", stats.workOrdersTotal.toString(), Icons.Rounded.Work)
            DashboardMetricTile("Aktivni RN", stats.activeWorkOrders.toString(), Icons.Rounded.CheckCircle)
            DashboardMetricTile("Kasne", stats.overdueWorkOrders.toString(), Icons.Rounded.ErrorOutline)
            DashboardMetricTile("Vozila", stats.vehiclesTotal.toString(), Icons.Rounded.Business)
            DashboardMetricTile("Dokumenti", stats.documentsTotal.toString(), Icons.Rounded.Mail)
            DashboardMetricTile("Osposobljavanja", stats.trainingsTotal.toString(), Icons.Rounded.Fingerprint)
            DashboardMetricTile("Klijentski portal", stats.clientPortalTotal.toString(), Icons.Rounded.Map)
            DashboardMetricTile("Pravilnici", stats.rulebooksTotal.toString(), Icons.Rounded.Lock)
        }
    }
}

@Composable
private fun DashboardMetricTile(
    label: String,
    value: String,
    icon: ImageVector,
) {
    Surface(
        modifier = Modifier.width(156.dp),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun PriorityWorkOrders(workOrders: List<WorkOrder>) {
    val priority = remember(workOrders) {
        workOrders
            .filter { workOrder -> !workOrder.isClosed }
            .sortedWith(
                compareByDescending<WorkOrder> { it.isOverdue }
                    .thenBy { it.parsedDueDate ?: it.parsedOpenedDate },
            )
            .take(4)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Prioritet za teren", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
            if (priority.isEmpty()) {
                Text(
                    "Nema aktivnih radnih naloga za brzi pregled.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                )
            } else {
                priority.forEach { workOrder ->
                    RecordLine(
                        title = workOrder.displayNumber,
                        subtitle = listOf(workOrder.companyName, workOrder.locationName).filter { it.isNotBlank() }.joinToString(" - "),
                        status = workOrder.status,
                        date = workOrder.dueDate,
                        icon = Icons.Rounded.Work,
                    )
                }
            }
        }
    }
}

@Composable
private fun ModuleSearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    label: String,
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = Modifier.fillMaxWidth(),
        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
        label = { Text(label) },
        singleLine = true,
    )
}

@Composable
private fun CalendarContent(
    records: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    var mode by remember { mutableStateOf(CalendarViewMode.Month) }
    val today = remember { LocalDate.now() }
    var selectedDate by remember { mutableStateOf(today) }
    val recordsByDate = remember(records) {
        records
            .mapNotNull { record -> record.parsedDate?.let { date -> date to record } }
            .groupBy({ it.first }, { it.second })
            .mapValues { (_, entries) ->
                entries.sortedWith(compareBy<MobileRecord> { recordKindLabel(it.kind) }.thenBy { it.title })
            }
    }
    val selectedRecords = remember(recordsByDate, selectedDate) {
        recordsByDate[selectedDate].orEmpty()
    }
    val datedRecordsCount = remember(recordsByDate) {
        recordsByDate.values.sumOf { it.size }
    }
    val changePeriod = { delta: Long ->
        selectedDate = when (mode) {
            CalendarViewMode.Day -> selectedDate.plusDays(delta)
            CalendarViewMode.Week -> selectedDate.plusWeeks(delta)
            CalendarViewMode.Month -> selectedDate.plusMonths(delta)
        }
    }
    val goToday = {
        selectedDate = today
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                    Icon(
                        Icons.Rounded.CalendarMonth,
                        contentDescription = null,
                        modifier = Modifier
                            .size(40.dp)
                            .padding(10.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Kalendar", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Text(
                        "$datedRecordsCount događaja iz RN-ova, vozila, periodike i osposobljavanja",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }

            CalendarModePicker(
                mode = mode,
                onModeChange = { mode = it },
            )

            CalendarNavigation(
                title = calendarPeriodTitle(mode, selectedDate),
                onPrevious = { changePeriod(-1) },
                onToday = goToday,
                onNext = { changePeriod(1) },
            )

            when (mode) {
                CalendarViewMode.Day -> DayCalendarView(
                    date = selectedDate,
                    records = selectedRecords,
                    onOpenRecord = onOpenRecord,
                )
                CalendarViewMode.Week -> WeekCalendarView(
                    selectedDate = selectedDate,
                    today = today,
                    recordsByDate = recordsByDate,
                    onDateSelected = { selectedDate = it },
                )
                CalendarViewMode.Month -> MonthCalendarView(
                    selectedDate = selectedDate,
                    today = today,
                    recordsByDate = recordsByDate,
                    onDateSelected = { selectedDate = it },
                )
            }

            if (mode != CalendarViewMode.Day) {
                CalendarAgenda(
                    title = "Događaji za ${formatCalendarDate(selectedDate)}",
                    records = selectedRecords,
                    emptyText = "Nema događaja za odabrani datum.",
                    onOpenRecord = onOpenRecord,
                )
            }
        }
    }
}

@Composable
private fun CalendarModePicker(
    mode: CalendarViewMode,
    onModeChange: (CalendarViewMode) -> Unit,
) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        CalendarViewMode.entries.forEach { entry ->
            FilterChip(
                selected = mode == entry,
                onClick = { onModeChange(entry) },
                label = { Text(entry.label) },
            )
        }
    }
}

@Composable
private fun CalendarNavigation(
    title: String,
    onPrevious: () -> Unit,
    onToday: () -> Unit,
    onNext: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(onClick = onPrevious) {
                Text("<", fontWeight = FontWeight.Black)
            }
            Text(
                title,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            TextButton(onClick = onToday) {
                Text("Danas")
            }
            TextButton(onClick = onNext) {
                Text(">", fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun DayCalendarView(
    date: LocalDate,
    records: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.58f),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                calendarDayTitle(date),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
            )
            CalendarAgenda(
                title = "Raspored dana",
                records = records,
                emptyText = "Za ovaj dan nema događaja.",
                onOpenRecord = onOpenRecord,
                compact = true,
            )
        }
    }
}

@Composable
private fun WeekCalendarView(
    selectedDate: LocalDate,
    today: LocalDate,
    recordsByDate: Map<LocalDate, List<MobileRecord>>,
    onDateSelected: (LocalDate) -> Unit,
) {
    val weekStart = remember(selectedDate) { startOfCalendarWeek(selectedDate) }
    val days = remember(weekStart, recordsByDate, today) {
        (0 until 7).map { index ->
            val date = weekStart.plusDays(index.toLong())
            CalendarDayCell(
                date = date,
                inCurrentMonth = true,
                isToday = date == today,
                records = recordsByDate[date].orEmpty(),
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            days.forEach { day ->
                CalendarWeekDay(
                    day = day,
                    selected = day.date == selectedDate,
                    onClick = { onDateSelected(day.date) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun MonthCalendarView(
    selectedDate: LocalDate,
    today: LocalDate,
    recordsByDate: Map<LocalDate, List<MobileRecord>>,
    onDateSelected: (LocalDate) -> Unit,
) {
    val days = remember(selectedDate.year, selectedDate.monthValue, recordsByDate, today) {
        buildCalendarMonthDays(selectedDate, recordsByDate, today)
    }

    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            calendarWeekdayLabels.forEach { label ->
                Text(
                    label,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                )
            }
        }
        days.chunked(7).forEach { week ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                week.forEach { day ->
                    CalendarMonthDay(
                        day = day,
                        selected = day.date == selectedDate,
                        onClick = { onDateSelected(day.date) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun CalendarWeekDay(
    day: CalendarDayCell,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val containerColor = when {
        selected -> MaterialTheme.colorScheme.primary
        day.isToday -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.66f)
    }
    val textColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface

    Surface(
        modifier = modifier
            .height(96.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = containerColor,
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                calendarWeekdayLabels[day.date.dayOfWeek.value - 1],
                style = MaterialTheme.typography.labelSmall,
                color = textColor.copy(alpha = 0.72f),
                maxLines = 1,
            )
            Text(
                day.date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleMedium,
                color = textColor,
                fontWeight = FontWeight.Black,
            )
            CalendarCountPill(count = day.records.size, selected = selected)
        }
    }
}

@Composable
private fun CalendarMonthDay(
    day: CalendarDayCell,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val muted = !day.inCurrentMonth
    val containerColor = when {
        selected -> MaterialTheme.colorScheme.primary
        day.isToday -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.86f)
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = if (muted) 0.28f else 0.62f)
    }
    val textColor = if (selected) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onSurface.copy(alpha = if (muted) 0.42f else 0.92f)
    }

    Surface(
        modifier = modifier
            .height(88.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = containerColor,
    ) {
        Column(
            modifier = Modifier.padding(7.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    day.date.dayOfMonth.toString(),
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.labelLarge,
                    color = textColor,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                )
                if (day.records.isNotEmpty()) {
                    CalendarCountPill(count = day.records.size, selected = selected)
                }
            }
            day.records.take(2).forEach { record ->
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = if (selected) Color.White.copy(alpha = 0.18f) else calendarRecordColor(record.kind).copy(alpha = 0.16f),
                ) {
                    Text(
                        record.title.ifBlank { recordKindLabel(record.kind) },
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) MaterialTheme.colorScheme.onPrimary else calendarRecordColor(record.kind),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun CalendarCountPill(
    count: Int,
    selected: Boolean,
) {
    if (count <= 0) {
        Spacer(Modifier.height(18.dp))
        return
    }
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = if (selected) Color.White.copy(alpha = 0.2f) else MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
    ) {
        Text(
            count.toString(),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Black,
            maxLines = 1,
        )
    }
}

@Composable
private fun CalendarAgenda(
    title: String,
    records: List<MobileRecord>,
    emptyText: String,
    onOpenRecord: (MobileRecord) -> Unit,
    compact: Boolean = false,
) {
    Column(verticalArrangement = Arrangement.spacedBy(if (compact) 8.dp else 10.dp)) {
        Text(
            title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Black,
        )
        if (records.isEmpty()) {
            if (emptyText.isNotBlank()) {
                Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            }
        } else {
            records.take(80).forEach { record ->
                RecordLine(
                    title = record.title,
                    subtitle = record.subtitle.ifBlank { recordKindLabel(record.kind) },
                    status = record.status,
                    date = record.date,
                    icon = recordIcon(record),
                    onClick = { onOpenRecord(record) },
                )
            }
            if (records.size > 80) {
                Text(
                    "Prikazano je prvih 80 događaja za odabrani datum.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            }
        }
    }
}

private data class CalendarDayCell(
    val date: LocalDate,
    val inCurrentMonth: Boolean,
    val isToday: Boolean,
    val records: List<MobileRecord>,
)

private val calendarWeekdayLabels = listOf("Pon", "Uto", "Sri", "Cet", "Pet", "Sub", "Ned")

private fun buildCalendarMonthDays(
    selectedDate: LocalDate,
    recordsByDate: Map<LocalDate, List<MobileRecord>>,
    today: LocalDate,
): List<CalendarDayCell> {
    val firstDayOfMonth = selectedDate.withDayOfMonth(1)
    val gridStart = startOfCalendarWeek(firstDayOfMonth)
    return (0 until 42).map { index ->
        val date = gridStart.plusDays(index.toLong())
        CalendarDayCell(
            date = date,
            inCurrentMonth = date.month == selectedDate.month && date.year == selectedDate.year,
            isToday = date == today,
            records = recordsByDate[date].orEmpty(),
        )
    }
}

private fun startOfCalendarWeek(date: LocalDate): LocalDate =
    date.minusDays((date.dayOfWeek.value - 1).toLong())

private fun calendarPeriodTitle(mode: CalendarViewMode, selectedDate: LocalDate): String = when (mode) {
    CalendarViewMode.Day -> calendarDayTitle(selectedDate)
    CalendarViewMode.Week -> {
        val start = startOfCalendarWeek(selectedDate)
        val end = start.plusDays(6)
        "${formatCalendarDate(start)} - ${formatCalendarDate(end)}"
    }
    CalendarViewMode.Month -> "${calendarMonthName(selectedDate.monthValue)} ${selectedDate.year}."
}

private fun calendarDayTitle(date: LocalDate): String =
    "${calendarWeekdayLabels[date.dayOfWeek.value - 1]}, ${formatCalendarDate(date)}"

private fun formatCalendarDate(date: LocalDate): String =
    "${date.dayOfMonth.toString().padStart(2, '0')}.${date.monthValue.toString().padStart(2, '0')}.${date.year}."

private fun calendarMonthName(month: Int): String = when (month) {
    1 -> "Sijecanj"
    2 -> "Veljaca"
    3 -> "Ozujak"
    4 -> "Travanj"
    5 -> "Svibanj"
    6 -> "Lipanj"
    7 -> "Srpanj"
    8 -> "Kolovoz"
    9 -> "Rujan"
    10 -> "Listopad"
    11 -> "Studeni"
    12 -> "Prosinac"
    else -> ""
}

private fun calendarRecordColor(kind: String): Color = when (kind) {
    "work_order" -> Color(0xFF2563EB)
    "vehicle", "vehicle_reservation" -> Color(0xFF059669)
    "document" -> Color(0xFF7C3AED)
    "training" -> Color(0xFFDC2626)
    "rulebook" -> Color(0xFFB45309)
    else -> Color(0xFF475569)
}

@Composable
private fun RecordsContent(
    title: String,
    records: List<MobileRecord>,
    emptyText: String,
    icon: ImageVector,
    onOpenRecord: ((MobileRecord) -> Unit)? = null,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                    Icon(
                        icon,
                        contentDescription = null,
                        modifier = Modifier
                            .size(40.dp)
                            .padding(10.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Text(
                        "${records.size} zapisa",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }

            if (records.isEmpty()) {
                Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            } else {
                records.take(80).forEach { record ->
                    RecordLine(
                        title = record.title,
                        subtitle = record.subtitle,
                        status = record.status,
                        date = record.date,
                        icon = recordIcon(record, icon),
                        onClick = if (onOpenRecord == null) null else {
                            { onOpenRecord(record) }
                        },
                    )
                }
                if (records.size > 80) {
                    Text(
                        "Prikazano je prvih 80 zapisa. Koristi pretragu za sužavanje.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
        }
    }
}

@Composable
private fun MoreContent(
    data: BootstrapData,
    query: String,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ModuleGroup("Dokumenti i zapisnici", data.documentRecords, Icons.Rounded.Mail, query, onOpenRecord)
        ModuleGroup("Osposobljavanja", data.peopleTrainingRecords, Icons.Rounded.Fingerprint, query, onOpenRecord)
        ModuleGroup("Klijentski portal", data.clientPortalRecords, Icons.Rounded.Map, query, onOpenRecord)
        ModuleGroup("Tvrtke", data.companies, Icons.Rounded.Business, query, onOpenRecord)
        ModuleGroup("Lokacije", data.locations, Icons.Rounded.LocationOn, query, onOpenRecord)
        ModuleGroup("Pravilnici", data.rulebooks, Icons.Rounded.Lock, query, onOpenRecord)
    }
}

@Composable
private fun ModuleGroup(
    title: String,
    records: List<MobileRecord>,
    icon: ImageVector,
    query: String,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val filtered = remember(records, query) { records.filter { record -> record.matchesSearch(query) } }

    RecordsContent(
        title = title,
        records = filtered,
        emptyText = "Nema zapisa za prikaz.",
        icon = icon,
        onOpenRecord = onOpenRecord,
    )
}

@Composable
private fun RecordLine(
    title: String,
    subtitle: String,
    status: String,
    date: String,
    icon: ImageVector,
    onClick: (() -> Unit)? = null,
) {
    val clickableModifier = if (onClick == null) Modifier else Modifier.clickable(onClick = onClick)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .then(clickableModifier),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.62f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(22.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    title.ifBlank { "Zapis" },
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                val secondary = listOf(subtitle, formatDateLabel(date)).filter { it.isNotBlank() }.joinToString(" - ")
                if (secondary.isNotBlank()) {
                    Text(
                        secondary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            if (status.isNotBlank()) {
                Spacer(Modifier.width(8.dp))
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                ) {
                    Text(
                        status,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

private fun recordIcon(record: MobileRecord, fallback: ImageVector = Icons.Rounded.Work): ImageVector = when (record.kind) {
    "work_order" -> Icons.Rounded.Work
    "vehicle", "vehicle_reservation" -> Icons.Rounded.Business
    "document" -> Icons.Rounded.Mail
    "training" -> Icons.Rounded.Fingerprint
    "company" -> Icons.Rounded.Business
    "location" -> Icons.Rounded.LocationOn
    "rulebook" -> Icons.Rounded.Lock
    "client_portal" -> Icons.Rounded.Map
    else -> fallback
}

private fun recordKindLabel(kind: String): String = when (kind) {
    "work_order" -> "Radni nalog"
    "vehicle" -> "Vozilo"
    "vehicle_reservation" -> "Rezervacija vozila"
    "document" -> "Dokument"
    "training" -> "Osposobljavanje"
    "company" -> "Tvrtka"
    "location" -> "Lokacija"
    "rulebook" -> "Pravilnik"
    "client_portal" -> "Klijentski portal"
    else -> "Zapis"
}

private fun formatRecordMetaLabel(key: String): String {
    val normalized = key
        .replace(Regex("([a-z])([A-Z])"), "\$1 \$2")
        .replace('_', ' ')
        .trim()
    return normalized.replaceFirstChar { char ->
        if (char.isLowerCase()) char.titlecase() else char.toString()
    }
}

private data class WorkOrderMapPoint(
    val workOrder: WorkOrder,
    val point: CoordinatePoint,
)

private fun WorkOrder.matchesSearch(query: String): Boolean {
    return number.contains(query, ignoreCase = true) ||
        status.contains(query, ignoreCase = true) ||
        companyName.contains(query, ignoreCase = true) ||
        locationName.contains(query, ignoreCase = true) ||
        coordinates.contains(query, ignoreCase = true) ||
        region.contains(query, ignoreCase = true) ||
        serviceLine.contains(query, ignoreCase = true) ||
        description.contains(query, ignoreCase = true)
}

private fun WorkOrder.isOpenRnStatus(): Boolean {
    val normalized = status
        .lowercase()
        .replace("š", "s")
        .replace("ž", "z")
    return normalized.contains("otvoren")
}

private fun WorkOrder.isInProgressRnStatus(): Boolean {
    val normalized = status
        .lowercase()
        .replace("š", "s")
        .replace("ž", "z")
    return (!isClosed && !isOpenRnStatus()) || normalized.contains("tijek")
}

private fun WorkOrder.primaryExecutorLabel(): String =
    executors.firstOrNull()?.ifBlank { null } ?: "Nije dodijeljen"

private fun WorkOrder.serviceBulletItems(): List<String> {
    val items = serviceItems
        .map { item -> item.trim() }
        .filter { item -> item.isNotBlank() }
    if (items.isNotEmpty()) return items
    return serviceLine
        .split(" - ", "·", ",")
        .map { item -> item.trim() }
        .filter { item -> item.isNotBlank() }
        .ifEmpty { listOf("Bez upisane usluge") }
}

private fun buildWorkOrderMapPoints(workOrders: List<WorkOrder>): List<WorkOrderMapPoint> {
    return workOrders.mapNotNull { workOrder ->
        workOrder.coordinatePoint?.let { point ->
            WorkOrderMapPoint(workOrder, point)
        }
    }
}

@Composable
private fun NoCoordinateWorkOrders() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(Icons.Rounded.Map, contentDescription = null, modifier = Modifier.size(38.dp), tint = MaterialTheme.colorScheme.primary)
            Text("Nema dostupnih lokacija za prikaz na karti.", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(
                "Upisi latitude i longitude na lokaciji ili radnom nalogu pa ce se marker pojaviti ovdje.",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
            )
        }
    }
}

@Composable
private fun WorkOrderMapPanel(
    points: List<WorkOrderMapPoint>,
    totalWorkOrders: Int,
    onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Column(modifier = Modifier.padding(start = 16.dp, top = 16.dp, end = 16.dp)) {
                Text("Karta radnih naloga", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(
                    "${points.size} od $totalWorkOrders RN ima koordinate.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            }
            WorkOrderLeafletMap(
                points = points,
                onOpenWorkOrder = onOpenWorkOrder,
            )
        }
    }
}

private class WorkOrderMapBridge(
    private val points: List<WorkOrderMapPoint>,
    private val onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun openWorkOrder(workOrderId: String) {
        val workOrder = points
            .firstOrNull { entry -> entry.workOrder.id == workOrderId }
            ?.workOrder
            ?: return

        mainHandler.post {
            onOpenWorkOrder(workOrder)
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun WorkOrderLeafletMap(
    points: List<WorkOrderMapPoint>,
    onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    val html = remember(points) { buildWorkOrderLeafletHtml(points) }
    val bridge = remember(points, onOpenWorkOrder) {
        WorkOrderMapBridge(points, onOpenWorkOrder)
    }

    AndroidView(
        modifier = Modifier
            .fillMaxWidth()
            .height(400.dp)
            .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)),
        factory = { context ->
            WebView(context).apply {
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                        return handleWorkOrderMapUrl(request.url, points, onOpenWorkOrder)
                    }
                }
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                settings.allowFileAccessFromFileURLs = true
                settings.allowUniversalAccessFromFileURLs = true
                addJavascriptInterface(bridge, "SafeNexus")
                setBackgroundColor(android.graphics.Color.TRANSPARENT)
            }
        },
        update = { webView ->
            webView.removeJavascriptInterface("SafeNexus")
            webView.addJavascriptInterface(bridge, "SafeNexus")
            if (webView.tag != html) {
                webView.tag = html
                webView.loadDataWithBaseURL(
                    "file:///android_asset/leaflet/",
                    html,
                    "text/html",
                    "UTF-8",
                    null,
                )
            }
        },
    )
}

private fun handleWorkOrderMapUrl(
    uri: Uri,
    points: List<WorkOrderMapPoint>,
    onOpenWorkOrder: (WorkOrder) -> Unit,
): Boolean {
    if (uri.scheme != "safenexus" || uri.host != "work-order") {
        return false
    }

    val workOrderId = uri.lastPathSegment.orEmpty()
    val workOrder = points
        .firstOrNull { entry -> entry.workOrder.id == workOrderId }
        ?.workOrder
        ?: return true
    onOpenWorkOrder(workOrder)
    return true
}

private fun buildWorkOrderLeafletHtml(points: List<WorkOrderMapPoint>): String {
    val markers = JSONArray()
    points.forEach { entry ->
        val workOrder = entry.workOrder
        markers.put(
            JSONObject()
                .put("id", workOrder.id)
                .put("number", workOrder.displayNumber)
                .put("company", workOrder.companyName.ifBlank { "Bez tvrtke" })
                .put("status", workOrder.status.ifBlank { "Bez statusa" })
                .put("lat", entry.point.latitude)
                .put("lng", entry.point.longitude),
        )
    }

    return """
        <!doctype html>
        <html lang="hr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <link rel="stylesheet" href="leaflet.css">
          <link rel="stylesheet" href="MarkerCluster.css">
          <link rel="stylesheet" href="MarkerCluster.Default.css">
          <style>
            html, body, #map {
              width: 100%;
              height: 100%;
              margin: 0;
            }
            body {
              background: #eef4ff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            #map {
              min-height: 400px;
            }
            .leaflet-container {
              background: #e6eef8;
              font: inherit;
            }
            .sn-popup {
              display: grid;
              gap: 7px;
              min-width: 210px;
              color: #111827;
            }
            .sn-popup strong {
              color: #1d4ed8;
              font-size: 15px;
              font-weight: 800;
            }
            .sn-popup span {
              color: #475569;
              font-size: 13px;
              line-height: 1.35;
            }
            .sn-status {
              display: inline-flex;
              width: fit-content;
              padding: 4px 8px;
              border-radius: 999px;
              background: #dbeafe;
              color: #1d4ed8 !important;
              font-size: 12px !important;
              font-weight: 800;
            }
            .sn-open {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-top: 4px;
              padding: 8px 10px;
              border-radius: 10px;
              background: #2563eb;
              color: #ffffff !important;
              font-size: 13px;
              font-weight: 800;
              text-decoration: none;
            }
            .marker-cluster-small,
            .marker-cluster-medium,
            .marker-cluster-large {
              background-color: rgba(37, 99, 235, 0.22);
            }
            .marker-cluster-small div,
            .marker-cluster-medium div,
            .marker-cluster-large div {
              background-color: rgba(37, 99, 235, 0.88);
              color: #ffffff;
              font-weight: 800;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="leaflet.js"></script>
          <script src="leaflet.markercluster.js"></script>
          <script>
            const markers = $markers;
            const map = L.map("map", {
              zoomControl: true,
              attributionControl: true
            });

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution: "&copy; OpenStreetMap"
            }).addTo(map);

            const clusterLayer = L.markerClusterGroup({
              showCoverageOnHover: false,
              spiderfyOnMaxZoom: true,
              maxClusterRadius: 52
            });

            function escapeHtml(value) {
              return String(value || "").replace(/[&<>"']/g, function(char) {
                return {
                  "&": "&amp;",
                  "<": "&lt;",
                  ">": "&gt;",
                  "\"": "&quot;",
                  "'": "&#039;"
                }[char];
              });
            }

            markers.forEach(function(marker) {
              const leafletMarker = L.marker([marker.lat, marker.lng]);
              const safeId = encodeURIComponent(marker.id);
              leafletMarker.bindPopup([
                "<div class='sn-popup'>",
                "<strong>" + escapeHtml(marker.number) + "</strong>",
                "<span>" + escapeHtml(marker.company) + "</span>",
                "<span class='sn-status'>" + escapeHtml(marker.status) + "</span>",
                "<a class='sn-open' href='safenexus://work-order/" + safeId + "' onclick='window.SafeNexus.openWorkOrder(" + JSON.stringify(marker.id) + "); return false;'>Otvori radni nalog</a>",
                "</div>"
              ].join(""));
              clusterLayer.addLayer(leafletMarker);
            });

            map.addLayer(clusterLayer);

            if (markers.length === 0) {
              document.body.innerHTML = "<div style='display:grid;place-items:center;height:100%;padding:24px;color:#475569;font-weight:800;text-align:center;'>Nema dostupnih lokacija za prikaz na karti.</div>";
            } else if (markers.length === 1) {
              map.setView([markers[0].lat, markers[0].lng], 14);
            } else {
              const bounds = L.latLngBounds(markers.map(function(marker) {
                return [marker.lat, marker.lng];
              }));
              map.fitBounds(bounds, { padding: [28, 28] });
            }

            setTimeout(function() {
              map.invalidateSize(false);
            }, 80);
          </script>
        </body>
        </html>
    """.trimIndent()
}

@Composable
private fun WorkOrderHero(workOrders: List<WorkOrder>) {
    val active = workOrders.count { !it.isClosed }
    val overdue = workOrders.count { it.isOverdue }
    val closed = workOrders.count { it.isClosed }

    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF123B7A), Color(0xFF1D4ED8), Color(0xFF0891B2)),
                    ),
                )
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.16f),
                ) {
                    Icon(
                        Icons.Rounded.Work,
                        contentDescription = null,
                        modifier = Modifier.padding(12.dp),
                        tint = Color.White,
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Terenski cockpit",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Fokus na RN-ove koje trebaš danas riješiti.",
                        color = Color(0xFFDDEBFF),
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard("Aktivni", active.toString(), Color(0xFFDBEAFE))
                MetricCard("Kasne", overdue.toString(), Color(0xFFFFEDD5))
                MetricCard("Zatvoreni", closed.toString(), Color(0xFFD1FAE5))
            }
        }
    }
}

@Composable
private fun RowScope.MetricCard(label: String, value: String, color: Color) {
    Surface(
        modifier = Modifier.weight(1f),
        shape = RoundedCornerShape(18.dp),
        color = Color.White.copy(alpha = 0.15f),
        tonalElevation = 0.dp,
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = color)
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color.White.copy(alpha = 0.82f))
        }
    }
}

private data class RnStatusStyle(
    val label: String,
    val accent: Color,
    val background: Color,
)

private fun rnStatusStyle(workOrder: WorkOrder): RnStatusStyle {
    return when {
        workOrder.isClosed -> RnStatusStyle("ZAVRŠENI", Color(0xFF7C3AED), Color(0xFFF3E8FF))
        workOrder.isInProgressRnStatus() -> RnStatusStyle("U TIJEKU", Color(0xFF2E7D32), Color(0xFFE8F5E9))
        else -> RnStatusStyle("OTVORENI", Color(0xFF0B63E5), Color(0xFFEAF2FF))
    }
}

@Composable
private fun RnStatusMenuChip(
    currentStatus: String,
    statusOptions: List<String>,
    enabled: Boolean,
    onStatusSelected: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val pseudoOrder = WorkOrder(
        id = "",
        number = "",
        status = currentStatus,
        companyId = "",
        companyName = "",
        companyOib = "",
        headquarters = "",
        locationId = "",
        locationName = "",
        objectId = "",
        objectName = "",
        coordinates = "",
        region = "",
        serviceLine = "",
        serviceItems = emptyList(),
        serviceDetails = emptyList(),
        openedDate = "",
        dueDate = "",
        executionDate = "",
        priority = "",
        contactName = "",
        contactPhone = "",
        contactEmail = "",
        description = "",
        executors = emptyList(),
    )
    val style = rnStatusStyle(pseudoOrder)

    Box {
        Surface(
            modifier = Modifier.clickable(enabled = enabled) { expanded = true },
            shape = RoundedCornerShape(7.dp),
            color = style.background,
        ) {
            Text(
                text = style.label,
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 8.dp),
                color = style.accent,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Black,
                maxLines = 1,
            )
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            statusOptions.ifEmpty { workOrderStatusOptions }.forEach { status ->
                DropdownMenuItem(
                    text = {
                        Text(
                            status,
                            fontWeight = if (status == currentStatus) FontWeight.Bold else FontWeight.Normal,
                        )
                    },
                    enabled = enabled && status != currentStatus,
                    onClick = {
                        expanded = false
                        onStatusSelected(status)
                    },
                )
            }
        }
    }
}

@Composable
private fun RnVerticalDivider() {
    Box(
        modifier = Modifier
            .padding(horizontal = 12.dp)
            .width(1.dp)
            .height(48.dp)
            .background(Color(0xFFE5E7EB)),
    )
}

@Composable
private fun RnNumberBlock(workOrder: WorkOrder, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(shape = RoundedCornerShape(8.dp), color = rnStatusStyle(workOrder).background) {
            Text(
                "#",
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 8.dp),
                color = rnStatusStyle(workOrder).accent,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
            )
        }
        Spacer(Modifier.width(9.dp))
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                "Broj radnog naloga",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF64748B),
                maxLines = 1,
            )
            Text(
                workOrder.displayNumber,
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFF0F172A),
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun RnCompanyBlock(workOrder: WorkOrder, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Rounded.Business,
            contentDescription = null,
            modifier = Modifier.size(22.dp),
            tint = rnStatusStyle(workOrder).accent,
        )
        Spacer(Modifier.width(8.dp))
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text("Tvrtka", style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B), maxLines = 1)
            Text(
                workOrder.companyName.ifBlank { "Bez tvrtke" },
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF0F172A),
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun RnInfoBlock(
    icon: ImageVector,
    label: String,
    value: String,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(24.dp), tint = tint)
        Spacer(Modifier.width(10.dp))
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
            Text(
                value,
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF0F172A),
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun WorkOrderCard(
    workOrder: WorkOrder,
    isLoading: Boolean,
    statusOptions: List<String>,
    onClick: () -> Unit,
    onStatusChange: (String) -> Unit,
    onAddDocumentation: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFBFDFF)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(
            modifier = Modifier.padding(15.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RnStatusMenuChip(
                    currentStatus = workOrder.status,
                    statusOptions = statusOptions,
                    enabled = !isLoading,
                    onStatusSelected = onStatusChange,
                )
                Spacer(Modifier.width(10.dp))
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        "Broj RN",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF64748B),
                        maxLines = 1,
                    )
                    Text(
                        workOrder.displayNumber,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF0F172A),
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    "›",
                    modifier = Modifier.padding(start = 6.dp),
                    color = Color(0xFF64748B),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Light,
                )
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(15.dp),
                color = Color(0xFFEAF2FF).copy(alpha = 0.72f),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Rounded.Business,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = rnStatusStyle(workOrder).accent,
                    )
                    Spacer(Modifier.width(10.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("Tvrtka", style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
                        Text(
                            workOrder.companyName.ifBlank { "Bez tvrtke" },
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color(0xFF0F172A),
                            fontWeight = FontWeight.Black,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                RnInfoBlock(
                    icon = Icons.Rounded.LocationOn,
                    label = "Lokacija",
                    value = workOrder.locationName.ifBlank { "Lokacija nije upisana" },
                    tint = rnStatusStyle(workOrder).accent,
                    modifier = Modifier.fillMaxWidth(),
                )
                RnInfoBlock(
                    icon = Icons.Rounded.Business,
                    label = "Izvršitelj",
                    value = workOrder.primaryExecutorLabel(),
                    tint = rnStatusStyle(workOrder).accent,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(15.dp),
                color = Color(0xFFF8FAFC),
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp),
                ) {
                Text(
                    "Usluge",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF64748B),
                    fontWeight = FontWeight.Black,
                )
                val services = workOrder.serviceBulletItems()
                services.take(3).forEach { service ->
                    Row(verticalAlignment = Alignment.Top) {
                        Text("•", color = rnStatusStyle(workOrder).accent, modifier = Modifier.padding(end = 7.dp))
                        Text(
                            service,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF0F172A),
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                if (services.size > 3) {
                    Text(
                        "+${services.size - 3} stavke",
                        color = Color(0xFF0B63E5),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Black,
                    )
                }
                }
            }

            if (!isLoading) {
                OutlinedButton(
                    onClick = onAddDocumentation,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
                ) {
                    Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("Dodaj dokumentaciju", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MobileRecordDetailScreen(
    record: MobileRecord,
    users: List<WorkOrderUserOption>,
    currentUserLabel: String,
    isLoading: Boolean,
    onBack: () -> Unit,
    onReserveVehicle: (MobileRecord, String, String, String, String, String, String, String) -> Unit,
) {
    BackHandler(onBack = onBack)
    var reservationDialogOpen by remember(record.id) { mutableStateOf(false) }
    if (reservationDialogOpen) {
        VehicleReservationDialog(
            vehicle = record,
            users = users,
            currentUserLabel = currentUserLabel,
            isLoading = isLoading,
            onDismiss = { reservationDialogOpen = false },
            onConfirm = { purpose, startAt, endAt, destination, reservedForUserId, reservedForLabel, note ->
                reservationDialogOpen = false
                onReserveVehicle(record, purpose, startAt, endAt, destination, reservedForUserId, reservedForLabel, note)
            },
        )
    }
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = "Natrag")
                    }
                },
                title = {
                    Column {
                        Text(recordKindLabel(record.kind), fontWeight = FontWeight.Bold)
                        Text(
                            record.status.ifBlank { "Mobilni zapis" },
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surface.copy(alpha = 0.72f)) {
                        Icon(
                            recordIcon(record),
                            contentDescription = null,
                            modifier = Modifier
                                .size(50.dp)
                                .padding(13.dp),
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    }
                    Text(
                        record.title.ifBlank { "Zapis" },
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Black,
                    )
                    if (record.subtitle.isNotBlank()) {
                        Text(record.subtitle, style = MaterialTheme.typography.bodyLarge)
                    }
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (record.status.isNotBlank()) {
                            AssistChip(onClick = {}, label = { Text(record.status) })
                        }
                        if (record.date.isNotBlank()) {
                            AssistChip(
                                onClick = {},
                                leadingIcon = { Icon(Icons.Rounded.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                label = { Text(formatDateLabel(record.date).ifBlank { record.date.take(10) }) },
                            )
                        }
                    }
                    if (record.kind == "vehicle") {
                        Button(
                            onClick = { reservationDialogOpen = true },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                        ) {
                            Icon(Icons.Rounded.CalendarMonth, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Rezerviraj vozilo", fontWeight = FontWeight.Black)
                        }
                    }
                }
            }

            DetailSection("Osnovno") {
                DetailRow(recordIcon(record), "Vrsta", recordKindLabel(record.kind))
                DetailRow(Icons.Rounded.CheckCircle, "Status", record.status.ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.CalendarMonth, "Datum", formatDateLabel(record.date).ifBlank { record.date.ifBlank { "Nije upisano" } })
                if (record.relatedId.isNotBlank()) {
                    DetailRow(Icons.Rounded.Work, "Povezani zapis", record.relatedId)
                }
                if (record.coordinates.isNotBlank()) {
                    DetailRow(Icons.Rounded.Map, "Koordinate", record.coordinates)
                }
            }

            if (record.meta.isNotEmpty()) {
                DetailSection("Podaci") {
                    record.meta.entries
                        .sortedBy { entry -> entry.key }
                        .forEach { entry ->
                            DetailRow(
                                Icons.Rounded.Business,
                                formatRecordMetaLabel(entry.key),
                                entry.value.ifBlank { "Nije upisano" },
                            )
                        }
                }
            }
        }
    }
}

@Composable
private fun VehicleReservationDialog(
    vehicle: MobileRecord,
    users: List<WorkOrderUserOption>,
    currentUserLabel: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (String, String, String, String, String, String, String) -> Unit,
) {
    val today = remember { LocalDate.now().toString() }
    var startDate by remember(vehicle.id) { mutableStateOf(today) }
    var endDate by remember(vehicle.id) { mutableStateOf(today) }
    var purpose by remember(vehicle.id) { mutableStateOf("Službeni put") }
    var destination by remember(vehicle.id) { mutableStateOf("") }
    val userOptions = remember(users) {
        listOf("" to "Ručno upisano") + users.map { user ->
            user.id to user.label.ifBlank { user.fullName.ifBlank { user.email } }
        }
    }
    var reservedForUserId by remember(vehicle.id, currentUserLabel, users) {
        mutableStateOf(
            users.firstOrNull { user ->
                listOf(user.label, user.fullName, user.email).any { it.equals(currentUserLabel, ignoreCase = true) }
            }?.id.orEmpty(),
        )
    }
    var reservedForLabel by remember(vehicle.id, currentUserLabel) { mutableStateOf(currentUserLabel) }
    var startKm by remember(vehicle.id) { mutableStateOf(vehicle.meta["odometerKm"].orEmpty()) }
    var endKm by remember(vehicle.id) { mutableStateOf("") }
    var vehicleClean by remember(vehicle.id) { mutableStateOf(true) }
    var documentsPresent by remember(vehicle.id) { mutableStateOf(true) }
    var fuelOk by remember(vehicle.id) { mutableStateOf(true) }
    var damageNoted by remember(vehicle.id) { mutableStateOf(false) }
    var note by remember(vehicle.id) { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth(0.96f),
        properties = DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("Rezervacija vozila", fontWeight = FontWeight.Black)
                Text(
                    vehicle.title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 620.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                WorkOrderDatePickerField("Početak rezervacije", startDate, { startDate = it }, !isLoading)
                WorkOrderDatePickerField("Kraj rezervacije", endDate, { endDate = it }, !isLoading)
                WorkOrderTextField("Svrha rezervacije", purpose, { purpose = it }, !isLoading)
                WorkOrderTextField("Odredište", destination, { destination = it }, !isLoading)
                WorkOrderSelectField(
                    label = "Korisnik vozila",
                    value = reservedForUserId,
                    valueLabel = userOptions.firstOrNull { it.first == reservedForUserId }?.second ?: "Ručno upisano",
                    options = userOptions,
                    enabled = !isLoading && users.isNotEmpty(),
                    onSelect = { next ->
                        reservedForUserId = next
                        if (next.isNotBlank()) {
                            reservedForLabel = userOptions.firstOrNull { it.first == next }?.second.orEmpty()
                        }
                    },
                )
                WorkOrderTextField("Ime korisnika vozila", reservedForLabel, { reservedForLabel = it }, !isLoading)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = startKm,
                        onValueChange = { startKm = it.filter(Char::isDigit).take(7) },
                        modifier = Modifier.weight(1f),
                        label = { Text("Početni km") },
                        singleLine = true,
                        enabled = !isLoading,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(16.dp),
                    )
                    OutlinedTextField(
                        value = endKm,
                        onValueChange = { endKm = it.filter(Char::isDigit).take(7) },
                        modifier = Modifier.weight(1f),
                        label = { Text("Krajnji km") },
                        singleLine = true,
                        enabled = !isLoading,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(16.dp),
                    )
                }
                Text("Stanje vozila", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                VehicleChecklistRow("Vozilo čisto", vehicleClean, !isLoading) { vehicleClean = it }
                VehicleChecklistRow("Dokumenti u vozilu", documentsPresent, !isLoading) { documentsPresent = it }
                VehicleChecklistRow("Gorivo / baterija uredno", fuelOk, !isLoading) { fuelOk = it }
                VehicleChecklistRow("Oštećenje evidentirano", damageNoted, !isLoading) { damageNoted = it }
                WorkOrderTextField("Napomena", note, { note = it }, !isLoading)
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val checklist = listOf(
                        "Početni km: ${startKm.ifBlank { "-" }}",
                        "Krajnji km: ${endKm.ifBlank { "-" }}",
                        "Vozilo čisto: ${if (vehicleClean) "da" else "ne"}",
                        "Dokumenti u vozilu: ${if (documentsPresent) "da" else "ne"}",
                        "Gorivo / baterija uredno: ${if (fuelOk) "da" else "ne"}",
                        "Oštećenje evidentirano: ${if (damageNoted) "da" else "ne"}",
                        note.takeIf { it.isNotBlank() }?.let { "Napomena: $it" },
                    ).filterNotNull().joinToString("\n")
                    onConfirm(
                        purpose.trim(),
                        "${startDate}T08:00:00",
                        "${endDate}T17:00:00",
                        destination.trim(),
                        reservedForUserId.trim(),
                        reservedForLabel.trim(),
                        checklist,
                    )
                },
                enabled = !isLoading && purpose.isNotBlank() && startDate.isNotBlank() && endDate.isNotBlank(),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Spremi rezervaciju", fontWeight = FontWeight.Black)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Odustani")
            }
        },
    )
}

@Composable
private fun VehicleChecklistRow(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onChange(!checked) },
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Checkbox(checked = checked, onCheckedChange = onChange, enabled = enabled)
            Spacer(Modifier.width(8.dp))
            Text(label, fontWeight = FontWeight.SemiBold)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrderDetailScreen(
    workOrder: WorkOrder,
    services: List<WorkOrderServiceOption>,
    users: List<WorkOrderUserOption>,
    isLoading: Boolean,
    error: String,
    notice: String,
    documents: List<WorkOrderDocument>,
    documentsLoading: Boolean,
    statusOptions: List<String>,
    onBack: () -> Unit,
    onStatusChange: (WorkOrder, String) -> Unit,
    onExecutorsChange: (WorkOrder, List<String>) -> Unit,
    onManageServices: (WorkOrder) -> Unit,
    onGenerateDocumentation: (WorkOrder) -> Unit,
    onAddDocumentation: (WorkOrder) -> Unit,
    onDownloadPdf: (WorkOrder) -> Unit,
    onSignWorkOrder: (WorkOrder) -> Unit,
    onOpenDocument: (WorkOrderDocument) -> Unit,
    onDownloadDocument: (WorkOrderDocument) -> Unit,
    onDeleteDocument: (WorkOrderDocument) -> Unit,
    onRefreshDocuments: () -> Unit,
) {
    BackHandler(onBack = onBack)
    val executorOptions = remember(users, workOrder.executors) {
        (
            users.map { user -> user.label.ifBlank { user.fullName.ifBlank { user.email } } } +
                workOrder.executors
            )
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .map { it to it }
    }
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = "Natrag")
                    }
                },
                title = {
                    Column {
                        Text(workOrder.displayNumber, fontWeight = FontWeight.Bold)
                        Text(
                            workOrder.status,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatusChip(workOrder)
                    Text(
                        workOrder.companyName.ifBlank { "Bez tvrtke" },
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Black,
                    )
                    Text(workOrder.displayService, style = MaterialTheme.typography.bodyLarge)
                    Text(
                        listOf(workOrder.locationName, workOrder.objectName.takeIf { it.isNotBlank() }?.let { "Objekt: $it" })
                            .filterNotNull()
                            .filter { it.isNotBlank() }
                            .joinToString(" · ")
                            .ifBlank { "Lokacija nije upisana" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        WorkOrderStatusMenu(
                            currentStatus = workOrder.status,
                            statusOptions = statusOptions,
                            enabled = !isLoading,
                            onStatusSelected = { status -> onStatusChange(workOrder, status) },
                        )
                        OutlinedButton(
                            onClick = { onManageServices(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp),
                        ) {
                            Icon(Icons.Rounded.ListAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Usluge")
                        }
                        OutlinedButton(
                            onClick = { onGenerateDocumentation(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp),
                        ) {
                            Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Izradi dokumentaciju")
                        }
                        OutlinedButton(
                            onClick = { onAddDocumentation(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp),
                        ) {
                            Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Dokumentacija")
                        }
                        OutlinedButton(
                            onClick = { onDownloadPdf(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp),
                        ) {
                            Icon(Icons.Rounded.PictureAsPdf, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Preuzmi PDF RN")
                        }
                        Button(
                            onClick = { onSignWorkOrder(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp),
                        ) {
                            Icon(Icons.Rounded.Fingerprint, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Potpiši RN")
                        }
                    }
                }
            }

            DetailSection("Osnovno") {
                DetailRow(Icons.Rounded.LocationOn, "Lokacija", workOrder.locationName.ifBlank { "Nije upisano" })
                if (workOrder.objectName.isNotBlank()) {
                    DetailRow(Icons.Rounded.Business, "Objekt", workOrder.objectName)
                }
                DetailRow(Icons.Rounded.CalendarMonth, "Otvoren", formatDateLabel(workOrder.openedDate).ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.CalendarMonth, "Rok", formatDateLabel(workOrder.dueDate).ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.CalendarMonth, "Izvršenje", formatDateLabel(workOrder.executionDate).ifBlank { "Nije upisano" })
                DocumentationExecutorsEditor(
                    executorOptions = executorOptions,
                    selectedExecutors = workOrder.executors,
                    enabled = !isLoading,
                    onChange = { next -> onExecutorsChange(workOrder, next) },
                )
            }

            AnimatedVisibility(isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            AnimatedVisibility(error.isNotBlank()) {
                MessageCard(text = error, isError = true)
            }
            AnimatedVisibility(notice.isNotBlank()) {
                MessageCard(text = notice, isError = false)
            }

            WorkOrderDocumentationSection(
                documents = documents,
                loading = documentsLoading,
                isBusy = isLoading,
                onGenerateDocumentation = { onGenerateDocumentation(workOrder) },
                onAddDocumentation = { onAddDocumentation(workOrder) },
                onOpenDocument = onOpenDocument,
                onDownloadDocument = onDownloadDocument,
                onDeleteDocument = onDeleteDocument,
                onRefreshDocuments = onRefreshDocuments,
            )

            WorkOrderServicesDetailSection(
                workOrder = workOrder,
                services = services,
                isBusy = isLoading,
                onManageServices = { onManageServices(workOrder) },
            )

            DetailSection("Lokacija i kontakt") {
                DetailRow(Icons.Rounded.LocationOn, "Lokacija", workOrder.locationName.ifBlank { "Nije upisano" })
                if (workOrder.coordinates.isNotBlank()) {
                    DetailRow(Icons.Rounded.Map, "Koordinate", workOrder.coordinates)
                }
                DetailRow(Icons.Rounded.Business, "Kontakt", workOrder.contactName.ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.Call, "Telefon", workOrder.contactPhone.ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.Mail, "Email", workOrder.contactEmail.ifBlank { "Nije upisano" })
            }

            DetailSection("Opis") {
                DetailRow(Icons.Rounded.Work, "Prioritet", workOrder.priority)
                Text(
                    text = workOrder.description.ifBlank { "Nema dodatnog opisa." },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.78f),
                )
            }
        }
    }
}

@Composable
private fun WorkOrderServicesDetailSection(
    workOrder: WorkOrder,
    services: List<WorkOrderServiceOption>,
    isBusy: Boolean,
    onManageServices: () -> Unit,
) {
    val selectedIds = remember(workOrder.serviceDetails, workOrder.serviceItems, services) {
        resolveWorkOrderSelectedServiceIds(workOrder, services)
    }
    DetailSection("Usluge RN-a") {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "${workOrder.serviceDetails.size.takeIf { it > 0 } ?: selectedIds.size} odabrano",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Black,
                )
                Text(
                    "Dodaj, ukloni ili promijeni usluge na radnom nalogu.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            }
            OutlinedButton(onClick = onManageServices, enabled = !isBusy, shape = RoundedCornerShape(14.dp)) {
                Icon(Icons.Rounded.Tune, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(6.dp))
                Text("Upravljaj")
            }
        }
        if (workOrder.serviceDetails.isEmpty() && workOrder.serviceItems.isEmpty()) {
            Text(
                "Nema upisanih usluga.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
            )
        } else {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (workOrder.serviceDetails.isNotEmpty()) {
                    workOrder.serviceDetails.forEach { service ->
                        AssistChip(
                            onClick = {},
                            leadingIcon = {
                                Text(
                                    service.serviceCode.ifBlank { "#" },
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Black,
                                )
                            },
                            label = {
                                Text(
                                    service.name.ifBlank { service.serviceCode.ifBlank { "Usluga" } },
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            },
                        )
                    }
                } else {
                    workOrder.serviceItems.forEach { service ->
                        AssistChip(onClick = {}, label = { Text(service, maxLines = 1, overflow = TextOverflow.Ellipsis) })
                    }
                }
            }
        }
    }
}

private fun normalizeServiceMatch(value: String): String =
    value.trim()
        .lowercase(Locale.getDefault())
        .replace(Regex("\\s+"), " ")

private fun resolveWorkOrderSelectedServiceIds(
    workOrder: WorkOrder,
    services: List<WorkOrderServiceOption>,
): List<String> {
    val ids = workOrder.serviceDetails.map { it.serviceId }.filter { it.isNotBlank() }
    if (ids.isNotEmpty()) return ids.distinct()

    val serviceLookup = services.flatMap { service ->
        listOf(service.id, service.name, service.serviceCode)
            .map { normalizeServiceMatch(it) }
            .filter { it.isNotBlank() }
            .map { key -> key to service.id }
    }.toMap()

    return workOrder.serviceItems
        .mapNotNull { label -> serviceLookup[normalizeServiceMatch(label)] }
        .distinct()
}

@Composable
private fun WorkOrderServiceManagementDialog(
    workOrder: WorkOrder,
    services: List<WorkOrderServiceOption>,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSelectionChange: (List<String>) -> Unit,
) {
    var query by remember(workOrder.id) { mutableStateOf("") }
    var selectedIds by remember(workOrder.id, workOrder.serviceDetails, services) {
        mutableStateOf(resolveWorkOrderSelectedServiceIds(workOrder, services).toSet())
    }
    var didInitializeAutoSave by remember(workOrder.id) { mutableStateOf(false) }
    var lastAutoSavedIds by remember(workOrder.id) { mutableStateOf(selectedIds) }
    var saveStatus by remember(workOrder.id) { mutableStateOf("Spremljeno") }
    val serviceSearchIndex = remember(services) {
        services.associate { service ->
            service.id to normalizeServiceMatch(
                listOf(service.name, service.serviceCode, service.type, service.note)
                    .joinToString(" "),
            )
        }
    }
    val filteredServices = remember(services, serviceSearchIndex, query) {
        val normalizedQuery = normalizeServiceMatch(query)
        if (normalizedQuery.isBlank()) {
            services
        } else {
            services.filter { service ->
                serviceSearchIndex[service.id]?.contains(normalizedQuery) == true
            }
        }
    }
    val groupedServices = remember(filteredServices) {
        filteredServices
            .groupBy { service -> service.type.ifBlank { "Bez odjela" } }
            .toSortedMap(compareBy<String> { it == "Bez odjela" }.thenBy { it.lowercase(Locale.getDefault()) })
    }
    LaunchedEffect(selectedIds) {
        if (!didInitializeAutoSave) {
            didInitializeAutoSave = true
            lastAutoSavedIds = selectedIds
            return@LaunchedEffect
        }
        if (selectedIds == lastAutoSavedIds) {
            saveStatus = "Spremljeno"
            return@LaunchedEffect
        }
        saveStatus = "Sprema se..."
        delay(320)
        onSelectionChange(selectedIds.toList())
        lastAutoSavedIds = selectedIds
        saveStatus = "Spremljeno"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth(0.96f),
        properties = DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("Usluge radnog naloga", fontWeight = FontWeight.Black)
                Text(
                    "${workOrder.displayNumber} · ${selectedIds.size} odabrano",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
                Text(
                    saveStatus,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (saveStatus.startsWith("Sprema")) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.54f)
                    },
                    fontWeight = FontWeight.Bold,
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                AnimatedVisibility(saveStatus.startsWith("Sprema")) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Pretraži usluge") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    singleLine = true,
                    enabled = !isLoading,
                    shape = RoundedCornerShape(16.dp),
                )
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 430.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f),
                ) {
                    LazyColumn(
                        modifier = Modifier.padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(7.dp),
                    ) {
                        if (filteredServices.isEmpty()) {
                            item {
                                Text(
                                    "Nema usluga za ovaj filter.",
                                    modifier = Modifier.padding(12.dp),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                                )
                            }
                        }
                        groupedServices.forEach { (department, departmentServices) ->
                            item("department-$department") {
                                Text(
                                    department,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Black,
                                )
                            }
                            items(departmentServices, key = { it.id }) { service ->
                                val selected = service.id in selectedIds
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable(enabled = !isLoading) {
                                            selectedIds = if (selected) {
                                                selectedIds - service.id
                                            } else {
                                                selectedIds + service.id
                                            }
                                        },
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (selected) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    },
                                    tonalElevation = if (selected) 2.dp else 0.dp,
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Checkbox(
                                            checked = selected,
                                            onCheckedChange = { checked ->
                                                selectedIds = if (checked) selectedIds + service.id else selectedIds - service.id
                                            },
                                            enabled = !isLoading,
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                service.name.ifBlank { service.serviceCode.ifBlank { "Usluga" } },
                                                fontWeight = FontWeight.Black,
                                                maxLines = 2,
                                                overflow = TextOverflow.Ellipsis,
                                            )
                                            Text(
                                                listOf(service.serviceCode, service.validityMonths.takeIf { it.isNotBlank() }?.let { "$it mj." })
                                                    .filterNotNull()
                                                    .filter { it.isNotBlank() }
                                                    .joinToString(" · "),
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                enabled = !isLoading,
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Zatvori", fontWeight = FontWeight.Black)
            }
        },
    )
}

@Composable
private fun WorkOrderDocumentationSection(
    documents: List<WorkOrderDocument>,
    loading: Boolean,
    isBusy: Boolean,
    onGenerateDocumentation: () -> Unit,
    onAddDocumentation: () -> Unit,
    onOpenDocument: (WorkOrderDocument) -> Unit,
    onDownloadDocument: (WorkOrderDocument) -> Unit,
    onDeleteDocument: (WorkOrderDocument) -> Unit,
    onRefreshDocuments: () -> Unit,
) {
    DetailSection("Dokumentacija") {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Button(
                onClick = onGenerateDocumentation,
                enabled = !isBusy,
                shape = RoundedCornerShape(16.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
            ) {
                Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Izradi", fontWeight = FontWeight.Black)
            }
            Button(
                onClick = onAddDocumentation,
                enabled = !isBusy,
                shape = RoundedCornerShape(16.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Dodaj", fontWeight = FontWeight.Black)
            }
            IconButton(onClick = onRefreshDocuments, enabled = !loading && !isBusy) {
                Icon(Icons.Rounded.Refresh, contentDescription = "Osvježi dokumentaciju")
            }
        }

        AnimatedVisibility(loading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }

        if (!loading && documents.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.62f),
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Rounded.InsertDriveFile, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Još nema dokumentacije", fontWeight = FontWeight.Bold)
                        Text(
                            "Dodaj sken, PDF, fotografije ili drugu datoteku.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        )
                    }
                }
            }
        }

        documents.forEach { document ->
            WorkOrderDocumentCard(
                document = document,
                enabled = !isBusy,
                onOpen = { onOpenDocument(document) },
                onDownload = { onDownloadDocument(document) },
                onDelete = { onDeleteDocument(document) },
            )
        }
    }
}

@Composable
private fun WorkOrderDocumentCard(
    document: WorkOrderDocument,
    enabled: Boolean,
    onOpen: () -> Unit,
    onDownload: () -> Unit,
    onDelete: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(12.dp), color = workOrderDocumentAccent(document).copy(alpha = 0.13f)) {
                Icon(
                    imageVector = workOrderDocumentIcon(document),
                    contentDescription = null,
                    tint = workOrderDocumentAccent(document),
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = document.displayName,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Black,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = listOf(
                        document.documentCategory,
                        formatFileSizeLabel(document.fileSize),
                        formatDateLabel(document.createdAt),
                    ).filter { it.isNotBlank() }.joinToString(" · "),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            IconButton(onClick = onOpen, enabled = enabled) {
                Icon(Icons.Rounded.Visibility, contentDescription = "Pregled", tint = MaterialTheme.colorScheme.primary)
            }
            IconButton(onClick = onDownload, enabled = enabled) {
                Icon(Icons.Rounded.Download, contentDescription = "Preuzmi", tint = MaterialTheme.colorScheme.primary)
            }
            IconButton(onClick = onDelete, enabled = enabled) {
                Icon(Icons.Rounded.Delete, contentDescription = "Briši", tint = Color(0xFFDC2626))
            }
        }
    }
}

@Composable
private fun WorkOrderDocumentationActionDialog(
    workOrder: WorkOrder,
    onDismiss: () -> Unit,
    onSelect: (WorkOrderDocumentInputMode) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth(0.98f),
        properties = DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("Dodaj dokumentaciju", fontWeight = FontWeight.Black)
                Text(
                    text = workOrder.displayNumber,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                WorkOrderDocumentInputMode.entries.forEach { mode ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(mode) },
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.52f),
                    ) {
                        Row(
                            modifier = Modifier.padding(13.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(mode.icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(mode.label, fontWeight = FontWeight.Black)
                                Text(
                                    mode.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Odustani")
            }
        },
    )
}

private data class DocumentationServiceFlowItem(
    val serviceKey: String,
    val serviceName: String,
    val serviceCode: String,
    val serviceIndex: Int,
    val documentNumbers: List<String>,
    val documentNames: List<String>,
    val templateCount: Int,
)

private data class DocumentationAdditionalObjectRecord(
    val serviceKey: String,
    val serviceIndex: Int,
    val serviceCode: String,
    val serviceName: String,
    val objectId: String,
    val objectName: String,
)

private data class DocumentationFlowTab(
    val key: String,
    val label: String,
    val serviceItem: DocumentationServiceFlowItem? = null,
    val additionalRecordIndex: Int? = null,
)

private const val DOCUMENTATION_BASICS_FLOW_KEY = "__basics__"
private const val DOCUMENTATION_SUMMARY_FLOW_KEY = "__summary__"
private const val DOCUMENTATION_EXTRA_FLOW_PREFIX = "__extra__"

private fun DocumentationServiceFlowItem.serviceValidityKey(): String =
    listOf(serviceCode, serviceName, serviceKey)
        .firstOrNull { it.isNotBlank() }
        .orEmpty()

private fun documentationAdditionalRecordFlowKey(record: DocumentationAdditionalObjectRecord, index: Int): String =
    "$DOCUMENTATION_EXTRA_FLOW_PREFIX:${record.serviceKey}:${record.objectId}:$index"

private fun buildDocumentationFlowTabs(
    flowItems: List<DocumentationServiceFlowItem>,
    additionalRecords: List<DocumentationAdditionalObjectRecord>,
): List<DocumentationFlowTab> {
    val tabs = mutableListOf(
        DocumentationFlowTab(
            key = DOCUMENTATION_BASICS_FLOW_KEY,
            label = "Osnovno",
        ),
    )
    flowItems.forEachIndexed { serviceIndex, item ->
        val serviceLabel = item.serviceCode.ifBlank { item.serviceName.ifBlank { "Usluga" } }
        tabs += DocumentationFlowTab(
            key = item.serviceKey,
            label = "${serviceIndex + 1}. $serviceLabel",
            serviceItem = item,
        )
        additionalRecords.forEachIndexed { recordIndex, record ->
            if (record.serviceKey == item.serviceKey) {
                val sequence = tabs.count { tab -> tab.serviceItem?.serviceKey == item.serviceKey } + 1
                tabs += DocumentationFlowTab(
                    key = documentationAdditionalRecordFlowKey(record, recordIndex),
                    label = "$sequence. ${record.serviceCode.ifBlank { item.serviceCode.ifBlank { "Usluga" } }}",
                    serviceItem = item,
                    additionalRecordIndex = recordIndex,
                )
            }
        }
    }
    tabs += DocumentationFlowTab(
        key = DOCUMENTATION_SUMMARY_FLOW_KEY,
        label = "Sažetak",
    )
    return tabs
}

private fun normalizeDocumentationSignatureAreaKey(value: String): String =
    value.trim()
        .lowercase(Locale.getDefault())
        .replace(Regex("[^a-z0-9_-]+"), "_")
        .trim('_')
        .ifBlank { "elektro" }

private fun inferDocumentationSignatureAreas(
    templates: List<WorkOrderDocumentationTemplate>,
    flowItem: DocumentationServiceFlowItem?,
): List<String> {
    val explicitAreas = templates
        .flatMap { template -> template.signatureAreas }
        .map(::normalizeDocumentationSignatureAreaKey)
        .filter { it.isNotBlank() }
        .distinct()
    if (explicitAreas.isNotEmpty()) {
        return explicitAreas
    }

    val text = listOf(flowItem?.serviceCode, flowItem?.serviceName)
        .filterNotNull()
        .joinToString(" ")
        .lowercase(Locale.getDefault())
    return when {
        Regex("\\b(tzin|tipkalo)\\b").containsMatchIn(text) || text.contains("isklop napona") -> listOf("tipkalo")
        Regex("\\b(spr|panik)\\b").containsMatchIn(text) || text.contains("panik rasvjet") -> listOf("elektro")
        else -> listOf("elektro")
    }
}

private fun List<WorkOrderDocumentationSignatureAreaOptions>.areaOptions(key: String): WorkOrderDocumentationSignatureAreaOptions {
    val normalizedKey = normalizeDocumentationSignatureAreaKey(key)
    return firstOrNull { normalizeDocumentationSignatureAreaKey(it.key) == normalizedKey }
        ?: WorkOrderDocumentationSignatureAreaOptions(
            key = normalizedKey,
            label = when (normalizedKey) {
                "tipkalo", "tzin" -> "Tipkalo za isklop napona"
                "elektro" -> "Sigurnosna panik rasvjeta"
                else -> normalizedKey.replace('_', ' ').replaceFirstChar { it.titlecase(Locale.getDefault()) }
            },
        )
}

private fun WorkOrderDocumentationOption.matchesExecutorLabel(executors: List<String>): Boolean {
    val normalizedExecutors = executors
        .map { normalizeServiceMatch(it) }
        .filter { it.isNotBlank() }
        .toSet()
    if (normalizedExecutors.isEmpty()) return false
    return listOf(id, label, subtitle, status)
        .map { normalizeServiceMatch(it) }
        .filter { it.isNotBlank() }
        .any { normalizedExecutors.contains(it) }
}

private fun WorkOrderDocumentationSignatureAreaOptions.defaultInspectorIdsForExecutors(executors: List<String>): Set<String> {
    if (executors.isEmpty()) return emptySet()
    return defaultInspectorIds
        .map { it.trim() }
        .filter { id -> inspectorOptions.firstOrNull { it.id == id }?.matchesExecutorLabel(executors) == true }
        .toSet()
}

private fun WorkOrderDocumentationSignatureAreaOptions.defaultAuthorizationIdForExecutors(executors: List<String>): String {
    if (executors.isEmpty()) return ""
    val defaultId = defaultAuthorizationHolderId.trim()
    return defaultId.takeIf { id -> authorizationOptions.firstOrNull { it.id == id }?.matchesExecutorLabel(executors) == true }.orEmpty()
}

private val documentationSignatureFieldTypes = setOf(
    "qualified_inspectors",
    "inspector_signature",
    "authorization_holder_signature",
    "digital_signature",
)

private data class DocumentationPersonFieldRule(
    val id: String,
    val label: String,
    val signatureArea: String,
    val role: String,
    val multiple: Boolean,
    val required: Boolean,
    val helpText: String,
    val priority: Int,
)

private fun normalizeDocumentationSignatureRole(value: String, type: String = ""): String {
    val normalized = value.trim()
        .lowercase(Locale.getDefault())
        .replace("_", " ")
        .replace("-", " ")
    return when {
        normalized.contains("company") || normalized.contains("klijent") || normalized.contains("narucitelj") -> "company_responsible"
        normalized.contains("authorize") || normalized.contains("ovlast") || normalized.contains("nositelj") || normalized.contains("odgovorn") -> "authorize"
        type.equals("authorization_holder_signature", ignoreCase = true) -> "authorize"
        else -> "inspect"
    }
}

private fun isDocumentationSignatureFieldType(type: String): Boolean =
    documentationSignatureFieldTypes.contains(type.lowercase(Locale.getDefault()))

private fun WorkOrderDocumentationField.toPersonFieldRule(template: WorkOrderDocumentationTemplate): DocumentationPersonFieldRule? {
    if (!isDocumentationSignatureFieldType(type)) return null
    val role = normalizeDocumentationSignatureRole(signatureRole, type)
    return DocumentationPersonFieldRule(
        id = "${template.id}::${id.ifBlank { key.ifBlank { tokenKey } }}",
        label = label.ifBlank { if (role == "authorize") "Odgovorna osoba" else "Ispitivanje obavili" },
        signatureArea = normalizeDocumentationSignatureAreaKey(signatureArea),
        role = role,
        multiple = role == "inspect" && signatureMultiple,
        required = required,
        helpText = helpText,
        priority = if (type.equals("qualified_inspectors", ignoreCase = true)) 0 else 1,
    )
}

private fun WorkOrderDocumentationTemplateBlock.toPersonFieldRule(template: WorkOrderDocumentationTemplate): DocumentationPersonFieldRule? {
    if (!isDocumentationSignatureFieldType(type)) return null
    val role = normalizeDocumentationSignatureRole(signatureRole, type)
    return DocumentationPersonFieldRule(
        id = "${template.id}::${id.ifBlank { key.ifBlank { tokenKey } }}",
        label = label.ifBlank { if (role == "authorize") "Odgovorna osoba" else "Ispitivanje obavili" },
        signatureArea = normalizeDocumentationSignatureAreaKey(signatureArea),
        role = role,
        multiple = role == "inspect" && signatureMultiple,
        required = required,
        helpText = helpText,
        priority = if (type.equals("qualified_inspectors", ignoreCase = true)) 0 else 1,
    )
}

private fun buildDocumentationPersonFieldRules(templates: List<WorkOrderDocumentationTemplate>): List<DocumentationPersonFieldRule> {
    val rules = templates.flatMap { template ->
        template.fieldBlocks.mapNotNull { block -> block.toPersonFieldRule(template) } +
            template.fields.mapNotNull { field -> field.toPersonFieldRule(template) }
    }
    return rules
        .sortedWith(compareBy<DocumentationPersonFieldRule> { it.priority }.thenBy { it.label.lowercase(Locale.getDefault()) })
        .groupBy { "${it.signatureArea}::${it.role}" }
        .map { (_, areaRules) ->
            areaRules.reduce { current, next ->
                current.copy(
                    required = current.required || next.required,
                    helpText = listOf(current.helpText, next.helpText)
                        .map { it.trim() }
                        .filter { it.isNotBlank() }
                        .distinct()
                        .joinToString(" "),
                    multiple = current.multiple || next.multiple,
                )
            }
        }
}

private data class DocumentationEnvironmentVisibility(
    val outsideTemperature: Boolean = false,
    val relativeHumidity: Boolean = false,
    val airflowSpeed: Boolean = false,
    val weather: Boolean = false,
    val groundCondition: Boolean = false,
    val groundResistance: Boolean = false,
) {
    val any: Boolean
        get() = outsideTemperature || relativeHumidity || airflowSpeed || weather || groundCondition || groundResistance
}

private fun buildDocumentationEnvironmentVisibility(templates: List<WorkOrderDocumentationTemplate>): DocumentationEnvironmentVisibility {
    val lookup = normalizeTemplateFieldLookup(
        templates.joinToString(" ") { template ->
            listOf(
                template.title,
                template.documentType,
                template.fields.joinToString(" ") { field ->
                    listOf(field.id, field.key, field.tokenKey, field.label, field.helpText).joinToString(" ")
                },
                template.fieldBlocks.joinToString(" ") { block ->
                    listOf(block.id, block.key, block.tokenKey, block.label, block.typeLabel, block.group, block.helpText, block.summary).joinToString(" ")
                },
            ).joinToString(" ")
        },
    )
    fun hasAny(vararg aliases: String): Boolean =
        aliases.any { alias -> lookup.contains(normalizeTemplateFieldLookup(alias)) }
    return DocumentationEnvironmentVisibility(
        outsideTemperature = hasAny("vanjska temperatura", "outside temperature"),
        relativeHumidity = hasAny("relativna vlaga", "relative humidity", "humidity"),
        airflowSpeed = hasAny("strujanje zraka", "brzina zraka", "airflow", "air flow"),
        weather = hasAny("vremenski uvjeti", "weather"),
        groundCondition = hasAny("stanje tla", "ground condition"),
        groundResistance = hasAny("otpor tla", "ground resistance"),
    )
}

private fun WorkOrderDocumentationTemplate.documentationServiceKey(): String {
    val indexKey = serviceIndex.takeIf { it >= 0 }?.let { "service-$it" }.orEmpty()
    val fallback = listOf(serviceCode, serviceName, documentType, title)
        .firstOrNull { it.isNotBlank() }
        .orEmpty()
        .lowercase(Locale.getDefault())
    return indexKey.ifBlank { fallback.ifBlank { id } }
}

private fun documentationServiceShortCode(
    serviceCode: String,
    serviceName: String,
    serviceIndex: Int,
): String {
    val explicitCode = serviceCode.trim()
    if (explicitCode.isNotBlank() && explicitCode.length <= 18) return explicitCode.uppercase(Locale.getDefault())
    val source = explicitCode.ifBlank { serviceName }
    val acronym = source
        .split(Regex("[^\\p{L}\\p{N}]+"))
        .mapNotNull { part -> part.firstOrNull()?.uppercaseChar()?.toString() }
        .joinToString("")
        .take(8)
    return acronym.ifBlank { "USL-${serviceIndex + 1}" }
}

private fun buildDocumentationServiceFlowItems(
    templates: List<WorkOrderDocumentationTemplate>,
    workOrder: WorkOrder,
): List<DocumentationServiceFlowItem> {
    if (templates.isEmpty()) {
        val fallbackService = workOrder.displayService.takeIf { it != "Bez upisane usluge" }.orEmpty()
        return listOf(
            DocumentationServiceFlowItem(
                serviceKey = "fallback",
                serviceName = fallbackService.ifBlank { "Usluga" },
                serviceCode = "USL-1",
                serviceIndex = 0,
                documentNumbers = listOf(workOrder.displayNumber).filter { it.isNotBlank() },
                documentNames = emptyList(),
                templateCount = 0,
            ),
        )
    }
    return templates
        .groupBy { template -> template.documentationServiceKey() }
        .map { (serviceKey, serviceTemplates) ->
            val firstTemplate = serviceTemplates.minWithOrNull(
                compareBy<WorkOrderDocumentationTemplate> { it.serviceIndex.takeIf { index -> index >= 0 } ?: Int.MAX_VALUE }
                    .thenBy { it.serviceName.lowercase(Locale.getDefault()) }
            )
            val serviceName = firstTemplate?.serviceName
                ?.ifBlank { firstTemplate.documentType.ifBlank { firstTemplate.title } }
                ?.ifBlank { "Usluga" }
                ?: "Usluga"
            val serviceIndex = firstTemplate?.serviceIndex ?: Int.MAX_VALUE
            val serviceCode = documentationServiceShortCode(firstTemplate?.serviceCode.orEmpty(), serviceName, serviceIndex.takeIf { it != Int.MAX_VALUE } ?: 0)
            DocumentationServiceFlowItem(
                serviceKey = serviceKey,
                serviceName = serviceName,
                serviceCode = serviceCode,
                serviceIndex = serviceIndex,
                documentNumbers = serviceTemplates.mapNotNull { template -> template.documentNumber.ifBlank { null } }.distinct(),
                documentNames = serviceTemplates.mapNotNull { template -> template.documentName.ifBlank { null } }.distinct(),
                templateCount = serviceTemplates.size,
            )
        }
        .sortedWith(compareBy<DocumentationServiceFlowItem> { it.serviceIndex }.thenBy { it.serviceName.lowercase(Locale.getDefault()) })
}

private fun inspectionTypeMatchesOptions(value: String, options: List<Pair<String, String>>): Boolean {
    val trimmed = value.trim()
    if (trimmed.isBlank()) return false
    return options.any { option ->
        option.first.equals(trimmed, ignoreCase = true) || option.second.equals(trimmed, ignoreCase = true)
    }
}

private fun chooseInspectionTypeValue(
    savedValue: String,
    options: List<Pair<String, String>>,
    fallbackValue: String,
): String {
    val saved = savedValue.trim()
    if (saved.isNotBlank() && (options.isEmpty() || inspectionTypeMatchesOptions(saved, options))) {
        return saved
    }
    val fallback = fallbackValue.trim()
    if (fallback.isNotBlank() && (options.isEmpty() || inspectionTypeMatchesOptions(fallback, options))) {
        return fallback
    }
    return options.firstOrNull()?.first.orEmpty()
}

private data class DocumentationStandardValues(
    val inspectionDate: String,
    val issuedDate: String,
    val inspectionType: String,
    val testingLocation: String,
    val outsideTemperature: String,
    val relativeHumidity: String,
    val airflowSpeed: String,
    val weather: String,
    val groundCondition: String,
    val groundResistance: String,
    val measurementEquipmentGroup: String,
    val inspectorUserId: String,
    val inspectorLabel: String,
    val authorizationHolderUserId: String,
    val authorizationHolderLabel: String,
    val electricalInspectorUserId: String,
    val electricalInspectorLabel: String,
    val electricalAuthorizationHolderUserId: String,
    val electricalAuthorizationHolderLabel: String,
    val tipkaloInspectorUserId: String,
    val tipkaloInspectorLabel: String,
    val tipkaloAuthorizationHolderUserId: String,
    val tipkaloAuthorizationHolderLabel: String,
    val selectedEquipmentCount: Int,
    val selectedLegalCount: Int,
    val selectedRulebookCount: Int,
)

private fun WorkOrderDocumentationField.lookupText(): String =
    normalizeTemplateFieldLookup(listOf(id, key, tokenKey, label, type, signatureArea, signatureRole).joinToString(" "))

private fun WorkOrderDocumentationTemplateBlock.lookupText(): String =
    normalizeTemplateFieldLookup(listOf(id, key, tokenKey, label, type, typeLabel, group, signatureArea, signatureRole).joinToString(" "))

private fun standardDocumentationSignatureValue(
    signatureArea: String,
    role: String,
    type: String = "",
    standard: DocumentationStandardValues,
): String {
    val area = normalizeDocumentationSignatureAreaKey(signatureArea)
    val normalizedRole = normalizeDocumentationSignatureRole(role, type)
    if (normalizedRole == "authorize") {
        return when (area) {
            "tipkalo", "tzin" -> standard.tipkaloAuthorizationHolderLabel.ifBlank { standard.tipkaloAuthorizationHolderUserId }
            "elektro" -> standard.electricalAuthorizationHolderLabel.ifBlank { standard.electricalAuthorizationHolderUserId }
            else -> standard.authorizationHolderLabel.ifBlank { standard.authorizationHolderUserId }
        }
    }
    return when (area) {
        "tipkalo", "tzin" -> standard.tipkaloInspectorLabel.ifBlank { standard.tipkaloInspectorUserId }
        "elektro" -> standard.electricalInspectorLabel.ifBlank { standard.electricalInspectorUserId }
        else -> standard.inspectorLabel.ifBlank { standard.inspectorUserId }
    }
}

private fun standardDocumentationValueForLookup(lookup: String, standard: DocumentationStandardValues): String? =
    when {
        lookup.contains("datum ispitivanja") || lookup.contains("inspection date") || lookup.contains("date of inspection") ->
            standard.inspectionDate
        lookup.contains("datum izdavanja") || lookup.contains("issued date") || lookup.contains("date issued") ->
            standard.issuedDate
        lookup.contains("vrsta ispitivanja") || lookup.contains("inspection type") ->
            standard.inspectionType
        lookup.contains("mjesto ispitivanja") ||
            lookup.contains("lokacija ispitivanja") ||
            lookup.contains("testing location") ||
            lookup.contains("inspection location") ->
            standard.testingLocation
        lookup.contains("temperatura") || lookup.contains("outside temperature") || lookup.contains("vanjska temperatura") ->
            standard.outsideTemperature
        lookup.contains("relativna vlaga") || lookup.contains("vlaga") || lookup.contains("humidity") ->
            standard.relativeHumidity
        lookup.contains("strujanje zraka") || lookup.contains("brzina zraka") || lookup.contains("airflow") || lookup.contains("air flow") ->
            standard.airflowSpeed
        lookup.contains("vrijeme") || lookup.contains("weather") ->
            standard.weather
        lookup.contains("stanje tla") || lookup.contains("ground condition") ->
            standard.groundCondition
        lookup.contains("otpor tla") || lookup.contains("ground resistance") ->
            standard.groundResistance
        lookup.contains("grupa mjerne") || lookup.contains("measurement equipment group") || lookup.contains("mjerna oprema grupa") ->
            standard.measurementEquipmentGroup
        lookup.contains("elektro") && (lookup.contains("nositelj") || lookup.contains("holder") || lookup.contains("ovlast")) ->
            standard.electricalAuthorizationHolderLabel
        lookup.contains("tipkalo") && (lookup.contains("nositelj") || lookup.contains("holder") || lookup.contains("ovlast")) ->
            standard.tipkaloAuthorizationHolderLabel
        lookup.contains("elektro") && (lookup.contains("ispitivac") || lookup.contains("ispitivao") || lookup.contains("inspector")) ->
            standard.electricalInspectorLabel
        lookup.contains("tipkalo") && (lookup.contains("ispitivac") || lookup.contains("ispitivao") || lookup.contains("inspector")) ->
            standard.tipkaloInspectorLabel
        lookup.contains("nositelj") || lookup.contains("authorization holder") || lookup.contains("holder") ->
            standard.authorizationHolderLabel
        lookup.contains("ispitivac") || lookup.contains("ispitivao") || lookup.contains("inspector") ->
            standard.inspectorLabel
        else -> null
    }?.trim()

private fun standardDocumentationValueForField(
    field: WorkOrderDocumentationField,
    standard: DocumentationStandardValues,
): String? {
    if (field.type.equals("qualified_inspectors", ignoreCase = true)) {
        return standardDocumentationSignatureValue(field.signatureArea, field.signatureRole, field.type, standard)
    }
    if (field.type.equals("inspector_signature", ignoreCase = true)) {
        return standardDocumentationSignatureValue(field.signatureArea, field.signatureRole, field.type, standard)
    }
    if (field.type.equals("authorization_holder_signature", ignoreCase = true) ||
        field.type.equals("digital_signature", ignoreCase = true)
    ) {
        return standardDocumentationSignatureValue(field.signatureArea, field.signatureRole, field.type, standard)
    }
    return standardDocumentationValueForLookup(field.lookupText(), standard)
}

private fun buildStandardTemplateFieldValues(
    templates: List<WorkOrderDocumentationTemplate>,
    standard: DocumentationStandardValues,
): Map<String, String> =
    buildMap {
        templates.forEach { template ->
            template.fields.forEach { field ->
                val value = standardDocumentationValueForField(field, standard).orEmpty()
                if (value.isNotBlank()) {
                    put(templateFieldStateKey(template, field), value)
                }
            }
        }
    }

private fun isDocumentationRequiredValueFilled(field: WorkOrderDocumentationField, value: String): Boolean {
    val normalized = value.trim()
    return when (field.type.lowercase(Locale.getDefault())) {
        "checkbox", "toggle" -> normalized.equals("true", ignoreCase = true) ||
            normalized == "1" ||
            normalized.equals("da", ignoreCase = true)
        else -> normalized.isNotBlank()
    }
}

private fun findMissingRequiredDocumentationFields(
    templates: List<WorkOrderDocumentationTemplate>,
    values: Map<String, String>,
    standard: DocumentationStandardValues,
): List<String> {
    val missing = mutableListOf<String>()
    val seen = mutableSetOf<String>()

    templates.forEach { template ->
        template.fields.filter { it.required }.forEach { field ->
            val value = values[templateFieldStateKey(template, field)]
                ?: standardDocumentationValueForField(field, standard)
                ?: ""
            if (!isDocumentationRequiredValueFilled(field, value)) {
                val label = listOf(template.serviceCode, field.label)
                    .filter { it.isNotBlank() }
                    .joinToString(" - ")
                    .ifBlank { field.label.ifBlank { "Obavezno polje" } }
                if (seen.add(label)) missing.add(label)
            }
        }
        template.fieldBlocks.filter { it.required }.forEach { block ->
            val lookup = block.lookupText()
            val standardValue = standardDocumentationValueForLookup(lookup, standard).orEmpty()
            val matchingField = findTemplateFieldForBlock(template, block)
            val matchingValue = matchingField?.let { field ->
                values[templateFieldStateKey(template, field)]
                    ?: standardDocumentationValueForField(field, standard)
                    ?: ""
            }.orEmpty()
            val complete = when (block.type.lowercase(Locale.getDefault())) {
                "equipment_list" -> standard.selectedEquipmentCount > 0
                "legal_list" -> standard.selectedLegalCount > 0 || standard.selectedRulebookCount > 0
                "measurement_table" -> true
                "chapter" -> true
                "qualified_inspectors", "inspector_signature", "authorization_holder_signature", "digital_signature" ->
                    standardDocumentationSignatureValue(block.signatureArea, block.signatureRole, block.type, standard).isNotBlank()
                else -> matchingValue.isNotBlank() || standardValue.isNotBlank()
            }
            if (!complete) {
                val label = listOf(template.serviceCode, block.label)
                    .filter { it.isNotBlank() }
                    .joinToString(" - ")
                    .ifBlank { block.label.ifBlank { "Obavezni blok" } }
                if (seen.add(label)) missing.add(label)
            }
        }
    }

    return missing
}

@Composable
private fun WorkOrderDocumentationWizardDialog(
    workOrder: WorkOrder,
    users: List<WorkOrderUserOption>,
    services: List<WorkOrderServiceOption>,
    locationObjects: List<WorkOrderLocationObjectOption>,
    selectedObjectId: String,
    context: WorkOrderDocumentationContext,
    contextLoading: Boolean,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onObjectSelectionChange: (String) -> Unit,
    onCreateObject: (String) -> Unit,
    onExecutorsChange: (List<String>) -> Unit,
    onConfirm: (WorkOrderDocumentationDraft) -> Unit,
) {
    val today = remember { LocalDate.now().toString() }
    val userOptions = remember(users) {
        listOf("" to "Nije odabrano") + users.map { user ->
            user.id to user.label.ifBlank { user.fullName.ifBlank { user.email } }
        }
    }
    val userLabelById = remember(userOptions) { userOptions.toMap() }
    val executorOptions = remember(users, workOrder.executors) {
        (
            users.map { user -> user.label.ifBlank { user.fullName.ifBlank { user.email } } } +
                workOrder.executors
            )
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .map { it to it }
    }
    var editableExecutors by remember(workOrder.id, workOrder.executors) {
        mutableStateOf(workOrder.executors.map { it.trim() }.filter { it.isNotBlank() }.distinct())
    }
    var completedBy by remember(workOrder.id, workOrder.completedBy, workOrder.executors) {
        mutableStateOf(workOrder.completedBy.ifBlank { workOrder.executors.firstOrNull().orEmpty() })
    }
    val completedByOptions = remember(editableExecutors, completedBy) {
        (listOf("") + editableExecutors + listOf(completedBy))
            .map { it.trim() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .map { it to it.ifBlank { "Nije odabrano" } }
    }
    val serviceFlowItems = remember(context.templates, workOrder.displayNumber, workOrder.displayService) {
        buildDocumentationServiceFlowItems(context.templates, workOrder)
    }
    var additionalRecords by remember(workOrder.id, serviceFlowItems) {
        mutableStateOf(emptyList<DocumentationAdditionalObjectRecord>())
    }
    val flowTabs = remember(serviceFlowItems, additionalRecords) {
        buildDocumentationFlowTabs(serviceFlowItems, additionalRecords)
    }
    var selectedFlowService by remember(workOrder.id, serviceFlowItems) {
        mutableStateOf(DOCUMENTATION_BASICS_FLOW_KEY)
    }
    LaunchedEffect(flowTabs, selectedFlowService) {
        if (flowTabs.none { it.key == selectedFlowService }) {
            selectedFlowService = DOCUMENTATION_BASICS_FLOW_KEY
        }
    }
    val basicsFlowSelected = selectedFlowService == DOCUMENTATION_BASICS_FLOW_KEY
    val summaryFlowSelected = selectedFlowService == DOCUMENTATION_SUMMARY_FLOW_KEY
    val selectedFlowTab = remember(flowTabs, selectedFlowService) {
        flowTabs.firstOrNull { it.key == selectedFlowService } ?: flowTabs.firstOrNull()
    }
    val selectedAdditionalRecord = selectedFlowTab?.additionalRecordIndex?.let { index -> additionalRecords.getOrNull(index) }
    val selectedFlowItem = remember(serviceFlowItems, selectedFlowTab, selectedAdditionalRecord) {
        selectedFlowTab?.serviceItem ?: when {
            summaryFlowSelected -> null
            basicsFlowSelected -> serviceFlowItems.firstOrNull()
            else -> serviceFlowItems.firstOrNull()
        }
    }
    val activeTemplates = remember(context.templates, selectedFlowItem?.serviceKey, summaryFlowSelected) {
        if (summaryFlowSelected) {
            return@remember emptyList()
        }
        val serviceKey = selectedFlowItem?.serviceKey.orEmpty()
        if (serviceKey.isBlank() || serviceKey == "fallback") {
            context.templates
        } else {
            context.templates.filter { template ->
                template.documentationServiceKey().equals(serviceKey, ignoreCase = true)
            }.ifEmpty { context.templates }
        }
    }
    val templateInspectionOptions = remember(activeTemplates) {
        buildTemplateInspectionTypeOptions(activeTemplates)
    }
    val templateInspectionDefault = remember(activeTemplates) {
        getTemplateInspectionTypeDefault(activeTemplates)
    }
    val inspectionOptions = templateInspectionOptions
    val defaultInspectionType = remember(templateInspectionDefault, inspectionOptions) {
        chooseInspectionTypeValue(templateInspectionDefault, inspectionOptions, "")
    }
    val defaults = context.defaults
    var inspectionDate by remember(workOrder.id, defaults.inspectionDate) { mutableStateOf(defaults.inspectionDate.ifBlank { today }) }
    var issuedDate by remember(workOrder.id, defaults.issuedDate) { mutableStateOf(defaults.issuedDate.ifBlank { inspectionDate.ifBlank { today } }) }
    var testingLocation by remember(workOrder.id, defaults.testingLocation) {
        mutableStateOf(defaults.testingLocation.ifBlank { workOrder.locationName })
    }
    val initialInspectionType = remember(defaults.inspectionType, defaultInspectionType, inspectionOptions) {
        chooseInspectionTypeValue(defaults.inspectionType, inspectionOptions, defaultInspectionType)
    }
    var inspectionType by remember(workOrder.id, initialInspectionType) {
        mutableStateOf(initialInspectionType)
    }
    LaunchedEffect(selectedFlowService, defaultInspectionType, inspectionOptions) {
        inspectionType = chooseInspectionTypeValue(inspectionType, inspectionOptions, defaultInspectionType)
    }
    var outsideTemperature by remember(workOrder.id, defaults.outsideTemperature) { mutableStateOf(defaults.outsideTemperature) }
    var relativeHumidity by remember(workOrder.id, defaults.relativeHumidity) { mutableStateOf(defaults.relativeHumidity) }
    var airflowSpeed by remember(workOrder.id, defaults.airflowSpeed) { mutableStateOf(defaults.airflowSpeed) }
    var weather by remember(workOrder.id, defaults.weather) { mutableStateOf(defaults.weather) }
    var groundCondition by remember(workOrder.id, defaults.groundCondition) { mutableStateOf(defaults.groundCondition) }
    var groundResistance by remember(workOrder.id, defaults.groundResistance) { mutableStateOf(defaults.groundResistance) }
    var measurementEquipmentGroup by remember(workOrder.id, defaults.measurementEquipmentGroup) {
        mutableStateOf(defaults.measurementEquipmentGroup)
    }
    val measurementEquipmentOptionIds = remember(context.measurementEquipmentOptions) {
        context.measurementEquipmentOptions.map { it.id }.toSet()
    }
    val legalFrameworkOptionIds = remember(context.legalFrameworkOptions) {
        context.legalFrameworkOptions.map { it.id }.toSet()
    }
    val rulebookOptionIds = remember(context.rulebookOptions) {
        context.rulebookOptions.map { it.id }.toSet()
    }
    var selectedEquipmentIds by remember(workOrder.id, defaults.selectedEquipmentIds, measurementEquipmentOptionIds) {
        mutableStateOf(defaults.selectedEquipmentIds.filter { measurementEquipmentOptionIds.contains(it) }.toSet())
    }
    var selectedLegalFrameworkIds by remember(workOrder.id, defaults.selectedLegalFrameworkIds, legalFrameworkOptionIds) {
        mutableStateOf(defaults.selectedLegalFrameworkIds.filter { legalFrameworkOptionIds.contains(it) }.toSet())
    }
    var selectedRulebookIds by remember(workOrder.id, defaults.selectedRulebookIds, rulebookOptionIds) {
        mutableStateOf(defaults.selectedRulebookIds.filter { rulebookOptionIds.contains(it) }.toSet())
    }
    val measurementEquipmentGroupOptions = remember(context.measurementEquipmentOptions, measurementEquipmentGroup) {
        val standardGroups = ('A'..'M').map { "Grupa $it" }
        val equipmentGroups = context.measurementEquipmentOptions.mapNotNull { option ->
            option.meta["deviceCode"]
                ?: option.meta["device_code"]
                ?: option.meta["code"]
                ?: option.meta["oznaka"]
        }
        (listOf("") + standardGroups + equipmentGroups + listOf(measurementEquipmentGroup))
            .map { it.trim() }
            .filter { it.isBlank() || it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .sortedWith(compareBy<String> { it.isNotBlank() }.thenBy { it.lowercase(Locale.getDefault()) })
            .map { value -> value to value.ifBlank { "Bez odabira" } }
    }
    val visibleMeasurementEquipmentOptions = remember(context.measurementEquipmentOptions, measurementEquipmentGroup, selectedEquipmentIds) {
        val selectedGroup = measurementEquipmentGroup.trim()
        if (selectedGroup.isBlank()) {
            context.measurementEquipmentOptions
        } else {
            context.measurementEquipmentOptions.filter { option ->
                option.id in selectedEquipmentIds ||
                    listOf(
                        option.meta["deviceCode"],
                        option.meta["device_code"],
                        option.meta["code"],
                        option.meta["oznaka"],
                    ).any { value -> value?.trim()?.equals(selectedGroup, ignoreCase = true) == true }
            }.ifEmpty { context.measurementEquipmentOptions }
        }
    }
    val currentDocumentNumber = selectedFlowItem?.documentNumbers?.firstOrNull()
        ?: activeTemplates.firstOrNull()?.documentNumber
        ?: workOrder.displayNumber
    val summaryDocumentNumbers = remember(serviceFlowItems, workOrder.displayNumber) {
        serviceFlowItems
            .flatMap { item -> item.documentNumbers }
            .distinct()
            .joinToString(", ")
            .ifBlank { workOrder.displayNumber }
    }
    val summaryServiceLabel = remember(serviceFlowItems, workOrder.displayService) {
        if (serviceFlowItems.size > 1) {
            serviceFlowItems.joinToString(", ") { item -> item.serviceCode }
        } else {
            serviceFlowItems.firstOrNull()?.serviceName ?: workOrder.displayService
        }
    }
    var signatureMode by remember(workOrder.id, defaults.signatureMode) { mutableStateOf(defaults.signatureMode.ifBlank { "digital" }) }
    val includeHandoverProtocol = true
    var validityMonths by remember(workOrder.id, defaults.validityMonths) { mutableStateOf(defaults.validityMonths.ifBlank { "12" }) }
    var serviceValidityMonths by remember(workOrder.id, serviceFlowItems, defaults.serviceValidityMonths) {
        mutableStateOf(
            serviceFlowItems.associate { item ->
                item.serviceValidityKey() to (
                    defaults.serviceValidityMonths[item.serviceValidityKey()]
                        ?: defaults.serviceValidityMonths[item.serviceCode]
                        ?: defaults.serviceValidityMonths[item.serviceName]
                        ?: validityMonths.ifBlank { "12" }
                    )
            },
        )
    }
    var electricalValidityMonths by remember(workOrder.id, defaults.electricalValidityMonths) {
        mutableStateOf(defaults.electricalValidityMonths.ifBlank { validityMonths.ifBlank { "12" } })
    }
    var tipkaloValidityMonths by remember(workOrder.id, defaults.tipkaloValidityMonths) {
        mutableStateOf(defaults.tipkaloValidityMonths.ifBlank { validityMonths.ifBlank { "12" } })
    }
    var inspectorUserId by remember(workOrder.id) { mutableStateOf("") }
    var authorizationHolderUserId by remember(workOrder.id) { mutableStateOf("") }
    var inspectorUserIds by remember(workOrder.id) { mutableStateOf(emptySet<String>()) }
    var electricalInspectorUserId by remember(workOrder.id) { mutableStateOf("") }
    var electricalInspectorUserIds by remember(workOrder.id) { mutableStateOf(emptySet<String>()) }
    var electricalAuthorizationHolderUserId by remember(workOrder.id) { mutableStateOf("") }
    var tipkaloInspectorUserId by remember(workOrder.id) { mutableStateOf("") }
    var tipkaloInspectorUserIds by remember(workOrder.id) { mutableStateOf(emptySet<String>()) }
    var tipkaloAuthorizationHolderUserId by remember(workOrder.id) { mutableStateOf("") }
    val allPromptTemplates = remember(context) {
        context.templates
            .map { template -> template.copy(fields = template.fields.filter { it.label.isNotBlank() }) }
            .filter { it.fields.isNotEmpty() }
    }
    val promptTemplates = remember(activeTemplates) {
        activeTemplates
            .map { template -> template.copy(fields = template.fields.filter { it.label.isNotBlank() }) }
            .filter { it.fields.isNotEmpty() }
    }
    val blockTemplates = remember(activeTemplates) {
        activeTemplates.filter { template -> template.fieldBlocks.isNotEmpty() }
    }
    val allPersonRules = remember(context.templates) {
        buildDocumentationPersonFieldRules(context.templates)
    }
    val environmentVisibility = remember(context.templates) {
        buildDocumentationEnvironmentVisibility(context.templates)
    }
    var additionalRecordTarget by remember(workOrder.id) {
        mutableStateOf<DocumentationServiceFlowItem?>(null)
    }
    var additionalRecordObjectId by remember(workOrder.id) { mutableStateOf("") }
    val templateDefaultsKey = remember(context) {
        context.templates.joinToString("|") { template ->
            "${template.id}:${template.fields.joinToString(",") { field -> "${field.id}:${field.defaultValue}" }}"
        }
    }
    var templateFieldValues by remember(workOrder.id, templateDefaultsKey) {
        mutableStateOf(defaultTemplateFieldValues(allPromptTemplates))
    }
    LaunchedEffect(workOrder.id, context.signaturePersonOptions, editableExecutors) {
        context.signaturePersonOptions.forEach { options ->
            val area = normalizeDocumentationSignatureAreaKey(options.key)
            val defaultInspectors = options.defaultInspectorIdsForExecutors(editableExecutors)
            val defaultAuthorization = options.defaultAuthorizationIdForExecutors(editableExecutors)
            when (area) {
                "tipkalo", "tzin" -> {
                    if (tipkaloInspectorUserIds.isEmpty() && defaultInspectors.isNotEmpty()) {
                        tipkaloInspectorUserIds = defaultInspectors
                        tipkaloInspectorUserId = defaultInspectors.firstOrNull().orEmpty()
                    }
                    if (tipkaloAuthorizationHolderUserId.isBlank() && defaultAuthorization.isNotBlank()) {
                        tipkaloAuthorizationHolderUserId = defaultAuthorization
                    }
                }
                "elektro" -> {
                    if (electricalInspectorUserIds.isEmpty() && defaultInspectors.isNotEmpty()) {
                        electricalInspectorUserIds = defaultInspectors
                        electricalInspectorUserId = defaultInspectors.firstOrNull().orEmpty()
                    }
                    if (electricalAuthorizationHolderUserId.isBlank() && defaultAuthorization.isNotBlank()) {
                        electricalAuthorizationHolderUserId = defaultAuthorization
                    }
                }
                else -> {
                    if (inspectorUserIds.isEmpty() && defaultInspectors.isNotEmpty()) {
                        inspectorUserIds = defaultInspectors
                        inspectorUserId = defaultInspectors.firstOrNull().orEmpty()
                    }
                    if (authorizationHolderUserId.isBlank() && defaultAuthorization.isNotBlank()) {
                        authorizationHolderUserId = defaultAuthorization
                    }
                }
            }
        }
    }
    val allMeasurementTemplates = remember(context) {
        context.templates
            .map { template -> template.copy(measurementTables = template.measurementTables.filter { it.sheet.columns.isNotEmpty() }) }
            .filter { it.measurementTables.isNotEmpty() }
    }
    val measurementTemplates = remember(activeTemplates) {
        activeTemplates
            .map { template -> template.copy(measurementTables = template.measurementTables.filter { it.sheet.columns.isNotEmpty() }) }
            .filter { it.measurementTables.isNotEmpty() }
    }
    val measurementDefaultsKey = remember(context) {
        context.templates.joinToString("|") { template ->
            "${template.id}:${template.measurementTables.joinToString(",") { table -> "${table.key}:${table.sheet.rows.size}:${table.sheet.columns.size}" }}"
        }
    }
    var measurementSheets by remember(workOrder.id, measurementDefaultsKey) {
        mutableStateOf(defaultMeasurementSheetValues(allMeasurementTemplates))
    }
    val availableLocationObjects = remember(workOrder.companyId, workOrder.locationId, locationObjects) {
        locationObjects
            .filter { item ->
                item.locationId == workOrder.locationId &&
                    (item.companyId == workOrder.companyId || item.companyId.isBlank() || workOrder.companyId.isBlank())
            }
            .sortedWith(
                compareBy<WorkOrderLocationObjectOption> { it.name.lowercase(Locale.getDefault()) }
                    .thenBy { it.code.lowercase(Locale.getDefault()) },
            )
    }
    val selectedObject = remember(selectedObjectId, availableLocationObjects) {
        availableLocationObjects.firstOrNull { it.id == selectedObjectId }
    }
    val activeObjectId = selectedAdditionalRecord?.objectId ?: selectedObjectId
    val activeSelectedObject = remember(activeObjectId, availableLocationObjects, selectedAdditionalRecord) {
        availableLocationObjects.firstOrNull { it.id == activeObjectId }
            ?: selectedAdditionalRecord?.let { record ->
                WorkOrderLocationObjectOption(
                    id = record.objectId,
                    companyId = workOrder.companyId,
                    locationId = workOrder.locationId,
                    name = record.objectName,
                    code = "",
                    description = "",
                )
            }
    }
    val objectOptions = remember(availableLocationObjects) {
        listOf("" to "Nema objekta") +
            availableLocationObjects.map { item ->
                item.id to listOf(item.name, item.code.takeIf { it.isNotBlank() }?.let { "($it)" })
                    .filterNotNull()
                    .joinToString(" ")
            } +
            listOf("__add_new__" to "+ Dodaj novi objekt")
    }
    var newObjectDialogOpen by remember(workOrder.id) { mutableStateOf(false) }
    var newObjectName by remember(workOrder.id, availableLocationObjects.size) {
        mutableStateOf("Objekt ${availableLocationObjects.size + 1}")
    }
    var requiredWarning by remember(workOrder.id) { mutableStateOf("") }
    val standardValues = DocumentationStandardValues(
        inspectionDate = inspectionDate.trim(),
        issuedDate = issuedDate.trim(),
        inspectionType = inspectionType.trim(),
        testingLocation = testingLocation.trim(),
        outsideTemperature = outsideTemperature.trim(),
        relativeHumidity = relativeHumidity.trim(),
        airflowSpeed = airflowSpeed.trim(),
        weather = weather.trim(),
        groundCondition = groundCondition.trim(),
        groundResistance = groundResistance.trim(),
        measurementEquipmentGroup = measurementEquipmentGroup.trim(),
        inspectorUserId = inspectorUserId,
        inspectorLabel = userLabelById[inspectorUserId].orEmpty().takeIf { inspectorUserId.isNotBlank() }.orEmpty(),
        authorizationHolderUserId = authorizationHolderUserId,
        authorizationHolderLabel = userLabelById[authorizationHolderUserId].orEmpty().takeIf { authorizationHolderUserId.isNotBlank() }.orEmpty(),
        electricalInspectorUserId = electricalInspectorUserId,
        electricalInspectorLabel = electricalInspectorUserIds
            .ifEmpty { setOf(electricalInspectorUserId).filter { it.isNotBlank() }.toSet() }
            .mapNotNull { userLabelById[it] }
            .joinToString(", "),
        electricalAuthorizationHolderUserId = electricalAuthorizationHolderUserId,
        electricalAuthorizationHolderLabel = userLabelById[electricalAuthorizationHolderUserId].orEmpty().takeIf { electricalAuthorizationHolderUserId.isNotBlank() }.orEmpty(),
        tipkaloInspectorUserId = tipkaloInspectorUserId,
        tipkaloInspectorLabel = tipkaloInspectorUserIds
            .ifEmpty { setOf(tipkaloInspectorUserId).filter { it.isNotBlank() }.toSet() }
            .mapNotNull { userLabelById[it] }
            .joinToString(", "),
        tipkaloAuthorizationHolderUserId = tipkaloAuthorizationHolderUserId,
        tipkaloAuthorizationHolderLabel = userLabelById[tipkaloAuthorizationHolderUserId].orEmpty().takeIf { tipkaloAuthorizationHolderUserId.isNotBlank() }.orEmpty(),
        selectedEquipmentCount = selectedEquipmentIds.size,
        selectedLegalCount = selectedLegalFrameworkIds.size,
        selectedRulebookCount = selectedRulebookIds.size,
    )
    val standardTemplateFieldValues = remember(allPromptTemplates, standardValues) {
        buildStandardTemplateFieldValues(allPromptTemplates, standardValues)
    }
    val effectiveTemplateFieldValues = remember(templateFieldValues, standardTemplateFieldValues) {
        standardTemplateFieldValues + templateFieldValues
    }
    val missingRequiredFields = remember(allPromptTemplates, effectiveTemplateFieldValues, standardValues) {
        findMissingRequiredDocumentationFields(allPromptTemplates, effectiveTemplateFieldValues, standardValues)
    }
    val formLoading = isLoading || contextLoading
    val selectedFlowIndex = flowTabs.indexOfFirst { it.key == selectedFlowService }.coerceAtLeast(0)
    val previousFlowKey = flowTabs.getOrNull(selectedFlowIndex - 1)?.key
    val nextFlowKey = flowTabs.getOrNull(selectedFlowIndex + 1)?.key

    if (newObjectDialogOpen) {
        AlertDialog(
            onDismissRequest = { newObjectDialogOpen = false },
            title = { Text("Novi objekt", fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        workOrder.locationName.ifBlank { "Lokacija nije upisana" },
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                    OutlinedTextField(
                        value = newObjectName,
                        onValueChange = { newObjectName = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Naziv objekta") },
                        singleLine = true,
                        enabled = !formLoading,
                        shape = RoundedCornerShape(16.dp),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val name = newObjectName.trim()
                        if (name.isNotBlank()) {
                            newObjectDialogOpen = false
                            onCreateObject(name)
                        }
                    },
                    enabled = !formLoading && newObjectName.isNotBlank(),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Dodaj objekt", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { newObjectDialogOpen = false }, enabled = !formLoading) {
                    Text("Odustani")
                }
            },
        )
    }

    additionalRecordTarget?.let { target ->
        val usedObjectIds = additionalRecords
            .filter { it.serviceKey == target.serviceKey }
            .map { it.objectId }
            .toSet() + selectedObjectId
        val selectableObjects = availableLocationObjects.filter { it.id !in usedObjectIds }
        AlertDialog(
            onDismissRequest = { additionalRecordTarget = null },
            title = { Text("Novi zapisnik za objekt", fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "${target.serviceCode} - ${target.serviceName}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                    )
                    if (selectableObjects.isEmpty()) {
                        Text(
                            "Nema slobodnog objekta za ovu uslugu. Dodaj novi objekt na lokaciji pa ponovno dugo pritisni uslugu.",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                        )
                    } else {
                        WorkOrderSelectField(
                            label = "Objekt za dodatni zapisnik",
                            value = additionalRecordObjectId,
                            valueLabel = selectableObjects.firstOrNull { it.id == additionalRecordObjectId }?.name ?: "Odaberi objekt",
                            options = selectableObjects.map { item ->
                                item.id to listOf(item.name, item.code.takeIf { it.isNotBlank() }?.let { "($it)" })
                                    .filterNotNull()
                                    .joinToString(" ")
                            },
                            enabled = !formLoading,
                            onSelect = { additionalRecordObjectId = it },
                        )
                    }
                    Text(
                        "Dodatni zapisnik ulazi i u primopredajni zapisnik.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val selected = selectableObjects.firstOrNull { it.id == additionalRecordObjectId }
                        if (selected != null) {
                            val newRecord = DocumentationAdditionalObjectRecord(
                                serviceKey = target.serviceKey,
                                serviceIndex = target.serviceIndex,
                                serviceCode = target.serviceCode,
                                serviceName = target.serviceName,
                                objectId = selected.id,
                                objectName = selected.name,
                            )
                            val nextRecords = additionalRecords + newRecord
                            additionalRecords = nextRecords
                            selectedFlowService = documentationAdditionalRecordFlowKey(newRecord, nextRecords.lastIndex)
                            additionalRecordTarget = null
                            additionalRecordObjectId = ""
                        }
                    },
                    enabled = !formLoading && additionalRecordObjectId.isNotBlank() && selectableObjects.isNotEmpty(),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Dodaj zapisnik", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { additionalRecordTarget = null }, enabled = !formLoading) {
                    Text("Odustani")
                }
            },
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth(0.96f),
        properties = DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text("Izrada dokumentacije", fontWeight = FontWeight.Black)
                Text(
                    text = "${workOrder.displayNumber} - ${workOrder.companyName.ifBlank { "Bez tvrtke" }}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                if (serviceFlowItems.isNotEmpty()) {
                    DocumentationProcessToolbar(
                        flowTabs = flowTabs,
                        selectedService = selectedFlowService,
                        enabled = !formLoading,
                        onSelectService = { selectedFlowService = it },
                        onLongPressService = { item ->
                            val usedObjectIds = additionalRecords
                                .filter { it.serviceKey == item.serviceKey }
                                .map { it.objectId }
                                .toSet() + selectedObjectId
                            val nextObject = availableLocationObjects.firstOrNull { it.id !in usedObjectIds }
                            additionalRecordTarget = item
                            additionalRecordObjectId = nextObject?.id.orEmpty()
                        },
                    )
                }
                if (requiredWarning.isNotBlank()) {
                    MessageCard(text = requiredWarning, isError = true)
                }
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = if (serviceFlowItems.isNotEmpty()) 540.dp else 660.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {

                if (basicsFlowSelected) {
                WizardSection(title = "Osnovno", icon = Icons.Rounded.Description) {
                    Text(
                        "Podaci vrijede za sve zapisnike u ovom RN-u i automatski popunjavaju povezana polja iz web predložaka.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                    DocumentationCoreBasicsContent(
                        documentNumber = currentDocumentNumber,
                        serviceName = selectedFlowItem?.serviceName ?: inspectionType,
                        showDocumentNumber = false,
                        inspectionDate = inspectionDate,
                        onInspectionDateChange = { inspectionDate = it },
                        issuedDate = issuedDate,
                        onIssuedDateChange = { issuedDate = it },
                        testingLocation = testingLocation,
                        onTestingLocationChange = { testingLocation = it },
                        measurementEquipmentGroup = measurementEquipmentGroup,
                        measurementEquipmentGroupOptions = measurementEquipmentGroupOptions,
                        onMeasurementEquipmentGroupChange = { measurementEquipmentGroup = it },
                        outsideTemperature = outsideTemperature,
                        relativeHumidity = relativeHumidity,
                        airflowSpeed = airflowSpeed,
                        weather = weather,
                        groundCondition = groundCondition,
                        groundResistance = groundResistance,
                        onOutsideTemperatureChange = { outsideTemperature = it },
                        onRelativeHumidityChange = { relativeHumidity = it },
                        onAirflowSpeedChange = { airflowSpeed = it },
                        onWeatherChange = { weather = it },
                        onGroundConditionChange = { groundCondition = it },
                        onGroundResistanceChange = { groundResistance = it },
                        environmentVisibility = environmentVisibility,
                        enabled = !formLoading,
                    )
                    DocumentationExecutorsEditor(
                        executorOptions = executorOptions,
                        selectedExecutors = editableExecutors,
                        enabled = !formLoading,
                        onChange = {
                            editableExecutors = it
                            onExecutorsChange(it)
                        },
                    )
                    DocumentationServiceValiditySection(
                        flowItems = serviceFlowItems,
                        serviceValidityMonths = serviceValidityMonths,
                        onServiceValidityMonthsChange = { key, value ->
                            serviceValidityMonths = serviceValidityMonths + (key to value)
                        },
                        enabled = !formLoading,
                    )
                    DocumentationServicePeopleSection(
                        personRules = allPersonRules,
                        areaOptions = context.signaturePersonOptions,
                        inspectorUserIds = inspectorUserIds,
                        onInspectorUserIdsChange = {
                            inspectorUserIds = it
                            inspectorUserId = it.firstOrNull().orEmpty()
                        },
                        authorizationHolderUserId = authorizationHolderUserId,
                        onAuthorizationHolderUserIdChange = { authorizationHolderUserId = it },
                        electricalInspectorUserIds = electricalInspectorUserIds,
                        onElectricalInspectorUserIdsChange = {
                            electricalInspectorUserIds = it
                            electricalInspectorUserId = it.firstOrNull().orEmpty()
                        },
                        electricalAuthorizationHolderUserId = electricalAuthorizationHolderUserId,
                        onElectricalAuthorizationHolderUserIdChange = { electricalAuthorizationHolderUserId = it },
                        tipkaloInspectorUserIds = tipkaloInspectorUserIds,
                        onTipkaloInspectorUserIdsChange = {
                            tipkaloInspectorUserIds = it
                            tipkaloInspectorUserId = it.firstOrNull().orEmpty()
                        },
                        tipkaloAuthorizationHolderUserId = tipkaloAuthorizationHolderUserId,
                        onTipkaloAuthorizationHolderUserIdChange = { tipkaloAuthorizationHolderUserId = it },
                        enabled = !formLoading,
                    )
                }
                }

                if (!summaryFlowSelected && !basicsFlowSelected) {
                WizardSection(title = "Objekt zapisnika", icon = Icons.Rounded.Business) {
                    WorkOrderSelectField(
                        label = "Objekt / oprema",
                        value = activeObjectId,
                        valueLabel = activeSelectedObject?.name ?: if (activeObjectId.isBlank()) "Nema objekta" else "Odabrani objekt nije više dostupan",
                        options = objectOptions,
                        enabled = !formLoading,
                        onSelect = { value ->
                            if (value == "__add_new__") {
                                newObjectName = "Objekt ${availableLocationObjects.size + 1}"
                                newObjectDialogOpen = true
                            } else {
                                val additionalIndex = selectedFlowTab?.additionalRecordIndex
                                if (additionalIndex != null) {
                                    val nextObject = availableLocationObjects.firstOrNull { it.id == value }
                                    var updatedRecordForTab: DocumentationAdditionalObjectRecord? = null
                                    additionalRecords = additionalRecords.mapIndexed { index, record ->
                                        if (index == additionalIndex) {
                                            record.copy(
                                                objectId = value,
                                                objectName = nextObject?.name.orEmpty(),
                                            ).also { updatedRecordForTab = it }
                                        } else {
                                            record
                                        }
                                    }
                                    updatedRecordForTab?.let { updated ->
                                        selectedFlowService = documentationAdditionalRecordFlowKey(updated, additionalIndex)
                                    }
                                } else {
                                    onObjectSelectionChange(value)
                                }
                            }
                        },
                    )
                    Text(
                        if (activeSelectedObject != null) {
                            listOf(
                                activeSelectedObject.code.takeIf { it.isNotBlank() }?.let { "Šifra: $it" },
                                activeSelectedObject.description.takeIf { it.isNotBlank() },
                            ).filterNotNull().joinToString(" · ").ifBlank { "Zapisnik će koristiti ovaj objekt i njegove stare vrijednosti ako postoje." }
                        } else {
                            "Ako nema objekta, zapisnik se vodi samo po lokaciji."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    )
                }
                val templateControls = DocumentationTemplateStandardControls(
                    documentNumber = currentDocumentNumber,
                    serviceName = selectedFlowItem?.serviceName ?: inspectionType,
                    inspectionDate = inspectionDate,
                    onInspectionDateChange = { inspectionDate = it },
                    issuedDate = issuedDate,
                    onIssuedDateChange = { issuedDate = it },
                    inspectionType = inspectionType,
                    inspectionOptions = inspectionOptions,
                    onInspectionTypeChange = { inspectionType = it },
                    testingLocation = testingLocation,
                    onTestingLocationChange = { testingLocation = it },
                    measurementEquipmentGroup = measurementEquipmentGroup,
                    measurementEquipmentGroupOptions = measurementEquipmentGroupOptions,
                    onMeasurementEquipmentGroupChange = { measurementEquipmentGroup = it },
                    measurementEquipmentOptions = visibleMeasurementEquipmentOptions,
                    selectedEquipmentIds = selectedEquipmentIds,
                    onSelectedEquipmentIdsChange = { selectedEquipmentIds = it },
                    legalFrameworkOptions = context.legalFrameworkOptions,
                    selectedLegalFrameworkIds = selectedLegalFrameworkIds,
                    onSelectedLegalFrameworkIdsChange = { selectedLegalFrameworkIds = it },
                    rulebookOptions = context.rulebookOptions,
                    selectedRulebookIds = selectedRulebookIds,
                    onSelectedRulebookIdsChange = { selectedRulebookIds = it },
                    measurementSheets = measurementSheets,
                    onMeasurementSheetChange = { key, sheet -> measurementSheets = measurementSheets + (key to sheet) },
                    enabled = !formLoading,
                )

                when {
                    contextLoading -> Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Text("Učitavam blokove iz templatea...")
                    }
                    !context.hasTemplates -> Text(
                        "Za ovaj RN nije pronađen povezani template.",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                    )
                    blockTemplates.isEmpty() -> Text(
                        "Template nema dodatnih blokova za mobilni prikaz.",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                    )
                    else -> blockTemplates.forEach { template ->
                        TemplateBlockOverview(
                            template = template,
                            values = effectiveTemplateFieldValues,
                            standardControls = templateControls,
                            onChange = { field, value ->
                                templateFieldValues = templateFieldValues + (templateFieldStateKey(template, field) to value)
                            },
                        )
                    }
                }

                if (blockTemplates.isEmpty()) {
                    WizardSection(title = "Mjerna i ispitna oprema", icon = Icons.Rounded.Work) {
                        WorkOrderSelectField(
                            label = "Grupa mjerne opreme",
                            value = measurementEquipmentGroup,
                            valueLabel = measurementEquipmentGroup.ifBlank { "Bez odabira" },
                            options = measurementEquipmentGroupOptions,
                            enabled = !formLoading,
                            onSelect = { measurementEquipmentGroup = it },
                        )
                        DocumentationMultiSelectField(
                            label = "Uređaji za zapisnik",
                            options = visibleMeasurementEquipmentOptions,
                            selectedIds = selectedEquipmentIds,
                            enabled = !formLoading,
                            emptyText = "Nema upisane mjerne i ispitne opreme za ovu organizaciju.",
                            onChange = { selectedEquipmentIds = it },
                        )
                    }

                    WizardSection(title = "Pravilnici i propisi", icon = Icons.Rounded.Lock) {
                        DocumentationMultiSelectField(
                            label = "Propisi iz web predloška",
                            options = context.legalFrameworkOptions,
                            selectedIds = selectedLegalFrameworkIds,
                            enabled = !formLoading,
                            emptyText = "Nema propisa povezanih s predlošcima.",
                            onChange = { selectedLegalFrameworkIds = it },
                        )
                        DocumentationMultiSelectField(
                            label = "Interni pravilnici",
                            options = context.rulebookOptions,
                            selectedIds = selectedRulebookIds,
                            enabled = !formLoading,
                            emptyText = "Nema pravilnika za ovu organizaciju.",
                            onChange = { selectedRulebookIds = it },
                        )
                    }
                }

                if (blockTemplates.isEmpty()) {
                    WizardSection(title = "Polja iz predloška", icon = Icons.Rounded.InsertDriveFile) {
                        when {
                            contextLoading -> Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                Text("Učitavam polja iz web predložaka...")
                            }
                            !context.hasTemplates -> Text(
                                "Za ovaj RN nije pronađen povezani template.",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                            )
                            promptTemplates.isEmpty() -> Text(
                                "Povezani predlošci nemaju dodatnih ručnih polja.",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                            )
                            else -> promptTemplates.forEach { template ->
                                TemplateFieldGroup(
                                    template = template,
                                    values = effectiveTemplateFieldValues,
                                    enabled = !formLoading,
                                    onChange = { field, value ->
                                        templateFieldValues = templateFieldValues + (templateFieldStateKey(template, field) to value)
                                    },
                                )
                            }
                        }
                    }
                }

                if (blockTemplates.isEmpty()) {
                    WizardSection(title = "Excel / mjerenja", icon = Icons.Rounded.Description) {
                        when {
                            contextLoading -> Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                Text("Učitavam Excel tablice...")
                            }
                            measurementTemplates.isEmpty() -> Text(
                                "Povezani predlošci nemaju Excel tablicu za mjerenja.",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                            )
                            else -> measurementTemplates.forEach { template ->
                                template.measurementTables.forEach { table ->
                                    MeasurementTableEditor(
                                        template = template,
                                        table = table,
                                        sheet = measurementSheets[measurementSheetStateKey(template, table)] ?: table.sheet,
                                        enabled = !formLoading,
                                        onSheetChange = { nextSheet ->
                                            measurementSheets = measurementSheets + (measurementSheetStateKey(template, table) to nextSheet)
                                        },
                                    )
                                }
                            }
                        }
                    }
                }

                }
                if (summaryFlowSelected) {
                DocumentationSummarySection(
                    workOrder = workOrder,
                    flowItems = serviceFlowItems,
                    additionalRecords = additionalRecords,
                    selectedService = summaryServiceLabel,
                    documentNumber = summaryDocumentNumbers,
                    objectName = selectedObject?.name.orEmpty(),
                    inspectionDate = inspectionDate,
                    issuedDate = issuedDate,
                    testingLocation = testingLocation,
                    selectedEquipmentCount = selectedEquipmentIds.size,
                    selectedLegalCount = selectedLegalFrameworkIds.size,
                    selectedRulebookCount = selectedRulebookIds.size,
                    signatureMode = signatureMode,
                    completedBy = completedBy,
                    completedByOptions = completedByOptions,
                    includeHandoverProtocol = includeHandoverProtocol,
                    enabled = !formLoading,
                    onSignatureMode = { signatureMode = it },
                    onCompletedByChange = { completedBy = it },
                    onIncludeHandoverProtocol = {},
                )
                }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (!summaryFlowSelected) {
                        selectedFlowService = nextFlowKey ?: DOCUMENTATION_SUMMARY_FLOW_KEY
                        return@Button
                    }
                    if (missingRequiredFields.isNotEmpty()) {
                        requiredWarning = "Popuni obavezno: ${missingRequiredFields.take(5).joinToString(", ")}${if (missingRequiredFields.size > 5) "..." else ""}."
                        selectedFlowService = DOCUMENTATION_BASICS_FLOW_KEY
                        return@Button
                    }
                    requiredWarning = ""
                    val templatePayload = buildTemplateFieldPayload(allPromptTemplates, effectiveTemplateFieldValues)
                    val sheetPayload = buildMeasurementSheetPayload(allMeasurementTemplates, measurementSheets)
                    val serviceValidityPayload = buildServiceValidityPayload(serviceFlowItems, serviceValidityMonths, validityMonths)
                    val primaryValidityMonths = serviceValidityPayload.values.firstOrNull { it.isNotBlank() }
                        ?: validityMonths.trim()
                    val draft = WorkOrderDocumentationDraft(
                        objectId = selectedObject?.id.orEmpty(),
                        objectName = selectedObject?.name.orEmpty(),
                        inspectionDate = inspectionDate.trim(),
                        issuedDate = issuedDate.trim(),
                        issuedPlace = "",
                        testingLocation = testingLocation.trim(),
                        note = "",
                        inspectionType = inspectionType.trim(),
                        completedBy = completedBy.trim(),
                        outsideTemperature = outsideTemperature.trim(),
                        relativeHumidity = relativeHumidity.trim(),
                        airflowSpeed = airflowSpeed.trim(),
                        weather = weather.trim(),
                        groundCondition = groundCondition.trim(),
                        groundResistance = groundResistance.trim(),
                        measurementEquipmentGroup = measurementEquipmentGroup.trim(),
                        selectedEquipmentIds = selectedEquipmentIds.toList(),
                        selectedLegalFrameworkIds = selectedLegalFrameworkIds.toList(),
                        selectedRulebookIds = selectedRulebookIds.toList(),
                        signatureMode = signatureMode,
                        validityMonths = primaryValidityMonths,
                        electricalValidityMonths = electricalValidityMonths.trim(),
                        tipkaloValidityMonths = tipkaloValidityMonths.trim(),
                        serviceValidityMonths = serviceValidityPayload,
                        executors = editableExecutors,
                        inspectorUserIds = inspectorUserIds.toList(),
                        inspectorUserId = inspectorUserId.ifBlank { inspectorUserIds.firstOrNull().orEmpty() },
                        authorizationHolderUserId = authorizationHolderUserId,
                        electricalInspectorUserIds = electricalInspectorUserIds.toList(),
                        electricalInspectorUserId = electricalInspectorUserId.ifBlank { electricalInspectorUserIds.firstOrNull().orEmpty() },
                        electricalAuthorizationHolderUserId = electricalAuthorizationHolderUserId,
                        tipkaloInspectorUserIds = tipkaloInspectorUserIds.toList(),
                        tipkaloInspectorUserId = tipkaloInspectorUserId.ifBlank { tipkaloInspectorUserIds.firstOrNull().orEmpty() },
                        tipkaloAuthorizationHolderUserId = tipkaloAuthorizationHolderUserId,
                        fieldValues = templatePayload.first,
                        templateFieldValues = templatePayload.second,
                        fieldSheets = sheetPayload.first,
                        templateFieldSheets = sheetPayload.second,
                        additionalRecords = additionalRecords.map { record ->
                            WorkOrderDocumentationAdditionalRecord(
                                serviceKey = record.serviceKey,
                                serviceIndex = record.serviceIndex,
                                serviceCode = record.serviceCode,
                                serviceName = record.serviceName,
                                objectId = record.objectId,
                                objectName = record.objectName,
                            )
                        },
                        includeHandoverProtocol = includeHandoverProtocol,
                    )
                    onConfirm(draft)
                },
                enabled = !formLoading,
                shape = RoundedCornerShape(16.dp),
            ) {
                if (formLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    if (summaryFlowSelected) "Izradi dokumentaciju" else "Dalje",
                    fontWeight = FontWeight.Black,
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = {
                    if (previousFlowKey != null) {
                        selectedFlowService = previousFlowKey
                    } else {
                        onDismiss()
                    }
                },
                enabled = !formLoading,
            ) {
                Text(if (previousFlowKey != null) "Natrag" else "Odustani")
            }
        },
    )

}

private fun templateFieldPayloadKey(field: WorkOrderDocumentationField): String =
    field.id.ifBlank { field.key.ifBlank { field.tokenKey } }.trim()

private fun templateFieldStateKey(
    template: WorkOrderDocumentationTemplate,
    field: WorkOrderDocumentationField,
): String = "${template.id}::${templateFieldPayloadKey(field)}"

private fun normalizeTemplateFieldLookup(value: String): String =
    value.trim()
        .replace("_", " ")
        .replace("-", " ")
        .replace(Regex("\\s+"), " ")
        .lowercase(Locale.getDefault())

private fun isInspectionTypeTemplateField(field: WorkOrderDocumentationField): Boolean {
    return listOf(field.id, field.key, field.tokenKey, field.label)
        .map(::normalizeTemplateFieldLookup)
        .any { value ->
            value == "vrsta ispitivanja" ||
                value == "inspection type" ||
                value == "work order inspection type" ||
                value.contains("vrsta ispitivanja") ||
                value.contains("inspection type")
        }
}

private fun getInspectionTypeTemplateFields(templates: List<WorkOrderDocumentationTemplate>): List<WorkOrderDocumentationField> =
    templates.flatMap { template -> template.fields }.filter(::isInspectionTypeTemplateField)

private fun buildTemplateInspectionTypeOptions(templates: List<WorkOrderDocumentationTemplate>): List<Pair<String, String>> =
    (
        templates.flatMap { template -> template.inspectionTypeOptions } +
            getInspectionTypeTemplateFields(templates).flatMap { field -> field.options }
        )
        .flatMap { field ->
            val value = field.value.ifBlank { field.label }.trim()
            val label = field.label.ifBlank { field.value }.trim()
            if (value.isBlank() && label.isBlank()) emptyList() else listOf(value.ifBlank { label } to label.ifBlank { value })
        }
        .distinctBy { it.first.lowercase(Locale.getDefault()) }

private fun getTemplateInspectionTypeDefault(templates: List<WorkOrderDocumentationTemplate>): String =
    getInspectionTypeTemplateFields(templates)
        .firstNotNullOfOrNull { field -> field.defaultValue.trim().takeIf { it.isNotBlank() } }
        .orEmpty()

private fun defaultTemplateFieldValues(templates: List<WorkOrderDocumentationTemplate>): Map<String, String> =
    buildMap {
        templates.forEach { template ->
            template.fields.forEach { field ->
                val key = templateFieldStateKey(template, field)
                if (field.defaultValue.isNotBlank()) {
                    put(key, field.defaultValue)
                } else if (field.type.equals("checkbox", ignoreCase = true) || field.type.equals("toggle", ignoreCase = true)) {
                    put(key, "false")
                }
            }
        }
    }

private fun buildTemplateFieldPayload(
    templates: List<WorkOrderDocumentationTemplate>,
    values: Map<String, String>,
): Pair<Map<String, String>, Map<String, Map<String, String>>> {
    val flatValues = mutableMapOf<String, String>()
    val templateValues = mutableMapOf<String, MutableMap<String, String>>()

    templates.forEach { template ->
        template.fields.forEach { field ->
            val stateKey = templateFieldStateKey(template, field)
            val value = values[stateKey]?.trim().orEmpty()
            val isBooleanField = field.type.equals("checkbox", ignoreCase = true) || field.type.equals("toggle", ignoreCase = true)
            if (value.isNotBlank() || isBooleanField) {
                val payloadValue = if (isBooleanField) {
                    if (value.equals("true", ignoreCase = true) || value == "1" || value.equals("da", ignoreCase = true)) "true" else "false"
                } else {
                    value
                }
                listOf(field.id, field.key, field.tokenKey)
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .forEach { key -> flatValues[key] = payloadValue }

                val payloadKey = templateFieldPayloadKey(field)
                if (payloadKey.isNotBlank()) {
                    templateValues.getOrPut(template.id) { mutableMapOf() }[payloadKey] = payloadValue
                    if (field.key.isNotBlank()) templateValues.getOrPut(template.id) { mutableMapOf() }[field.key] = payloadValue
                    if (field.tokenKey.isNotBlank()) templateValues.getOrPut(template.id) { mutableMapOf() }[field.tokenKey] = payloadValue
                }
            }
        }
    }

    return flatValues to templateValues.mapValues { it.value.toMap() }
}

private fun buildServiceValidityPayload(
    flowItems: List<DocumentationServiceFlowItem>,
    values: Map<String, String>,
    fallback: String,
): Map<String, String> =
    buildMap {
        flowItems.forEach { item ->
            val value = values[item.serviceValidityKey()].orEmpty().ifBlank { fallback }.trim()
            if (value.isNotBlank()) {
                listOf(item.serviceValidityKey(), item.serviceKey, item.serviceCode, item.serviceName)
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .distinctBy { it.lowercase(Locale.getDefault()) }
                    .forEach { key -> put(key, value) }
            }
        }
    }

private fun measurementSheetStateKey(
    template: WorkOrderDocumentationTemplate,
    table: WorkOrderMeasurementTable,
): String = "${template.id}::${table.key.ifBlank { table.id.ifBlank { table.tokenKey } }}"

private fun defaultMeasurementSheetValues(templates: List<WorkOrderDocumentationTemplate>): Map<String, WorkOrderMeasurementSheet> =
    buildMap {
        templates.forEach { template ->
            template.measurementTables.forEach { table ->
                put(measurementSheetStateKey(template, table), table.sheet)
            }
        }
    }

private fun buildMeasurementSheetPayload(
    templates: List<WorkOrderDocumentationTemplate>,
    sheets: Map<String, WorkOrderMeasurementSheet>,
): Pair<Map<String, WorkOrderMeasurementSheet>, Map<String, Map<String, WorkOrderMeasurementSheet>>> {
    val flatSheets = mutableMapOf<String, WorkOrderMeasurementSheet>()
    val templateSheets = mutableMapOf<String, MutableMap<String, WorkOrderMeasurementSheet>>()

    templates.forEach { template ->
        template.measurementTables.forEach { table ->
            val sheet = sheets[measurementSheetStateKey(template, table)] ?: table.sheet
            listOf(table.id, table.key, table.tokenKey)
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .forEach { key -> flatSheets[key] = sheet }
            val payloadKey = table.key.ifBlank { table.id.ifBlank { table.tokenKey } }
            if (payloadKey.isNotBlank()) {
                templateSheets.getOrPut(template.id) { mutableMapOf() }[payloadKey] = sheet
                if (table.id.isNotBlank()) templateSheets.getOrPut(template.id) { mutableMapOf() }[table.id] = sheet
                if (table.tokenKey.isNotBlank()) templateSheets.getOrPut(template.id) { mutableMapOf() }[table.tokenKey] = sheet
            }
        }
    }

    return flatSheets to templateSheets.mapValues { it.value.toMap() }
}

private fun updateMeasurementSheetCell(
    sheet: WorkOrderMeasurementSheet,
    rowId: String,
    columnId: String,
    value: String,
): WorkOrderMeasurementSheet =
    sheet.copy(
        rows = sheet.rows.map { row ->
            if (row.id == rowId) {
                row.copy(cells = row.cells + (columnId to value))
            } else {
                row
            }
        },
    )

private data class MeasurementCellSelection(
    val rowIndex: Int,
    val columnIndex: Int,
)

private fun measurementColumnLabel(index: Int): String {
    var value = index + 1
    var label = ""
    while (value > 0) {
        val remainder = (value - 1) % 26
        label = ('A'.code + remainder).toChar().toString() + label
        value = (value - 1) / 26
    }
    return label
}

private fun measurementCellReference(rowIndex: Int, columnIndex: Int): String =
    "${measurementColumnLabel(columnIndex)}${rowIndex + 1}"

private fun parseMeasurementCellReferenceMobile(reference: String): MeasurementCellSelection? {
    val match = Regex("^\\$?([A-Za-z]+)\\$?(\\d+)$").matchEntire(reference.trim()) ?: return null
    val letters = match.groupValues[1].uppercase(Locale.getDefault())
    val rowIndex = match.groupValues[2].toIntOrNull()?.minus(1) ?: return null
    var columnIndex = 0
    letters.forEach { char ->
        columnIndex = (columnIndex * 26) + (char.code - 'A'.code + 1)
    }
    columnIndex -= 1
    return if (rowIndex >= 0 && columnIndex >= 0) MeasurementCellSelection(rowIndex, columnIndex) else null
}

private fun parseMeasurementNumberMobile(value: String): Double? =
    value.trim().replace(",", ".").toDoubleOrNull()

private fun WorkOrderMeasurementSheet.measurementRaw(rowIndex: Int, columnIndex: Int): String {
    val row = rows.getOrNull(rowIndex) ?: return ""
    val column = columns.getOrNull(columnIndex) ?: return ""
    return row.cells[column.id].orEmpty()
}

private fun WorkOrderMeasurementSheet.measurementAverage(rowIndex: Int): Double? {
    val row = rows.getOrNull(rowIndex) ?: return null
    val preferredValues = listOf("reading1", "reading2", "reading3")
        .mapNotNull { key -> parseMeasurementNumberMobile(row.cells[key].orEmpty()) }
    val values = preferredValues.ifEmpty {
        columns
            .filter { it.computed.isBlank() }
            .mapNotNull { column -> parseMeasurementNumberMobile(row.cells[column.id].orEmpty()) }
            .take(3)
    }
    return values.takeIf { it.isNotEmpty() }?.average()
}

private fun formatMeasurementNumberMobile(value: Double): String {
    val formatter = NumberFormat.getNumberInstance(Locale("hr", "HR"))
    formatter.minimumFractionDigits = 0
    formatter.maximumFractionDigits = 6
    return formatter.format(value)
}

private fun WorkOrderMeasurementSheet.measurementCellDisplay(rowIndex: Int, columnIndex: Int, stack: Set<String> = emptySet()): String {
    val column = columns.getOrNull(columnIndex) ?: return ""
    if (column.computed.equals("average", ignoreCase = true)) {
        return measurementAverage(rowIndex)?.let(::formatMeasurementNumberMobile).orEmpty()
    }
    val raw = measurementRaw(rowIndex, columnIndex)
    if (!raw.trim().startsWith("=")) {
        return raw
    }
    return runCatching {
        evaluateMeasurementFormulaValueMobile(raw, this, rowIndex, columnIndex, stack).displayText()
    }.getOrElse { "#ERROR" }
}

private class MobileMeasurementFormulaParser(
    private val expression: String,
    private val sheet: WorkOrderMeasurementSheet,
    private val currentRowIndex: Int,
    private val currentColumnIndex: Int,
    private val stack: Set<String>,
) {
    private var index = 0

    fun parse(): MobileFormulaValue {
        val value = parseExpression()
        skipWhitespace()
        if (index < expression.length) error("Višak znakova u formuli.")
        return value
    }

    private fun parseExpression(): MobileFormulaValue {
        return parseComparison()
    }

    private fun parseComparison(): MobileFormulaValue {
        var value = parseAddition()
        while (true) {
            skipWhitespace()
            val operator = consumeComparisonOperator() ?: return value
            val right = parseAddition()
            value = MobileFormulaValue.scalar(compareFormulaValues(value.value, right.value, operator))
        }
    }

    private fun parseAddition(): MobileFormulaValue {
        var value = parseTerm()
        while (true) {
            skipWhitespace()
            value = when {
                consume('+') -> MobileFormulaValue.scalar(value.asNumber() + parseTerm().asNumber())
                consume('-') -> MobileFormulaValue.scalar(value.asNumber() - parseTerm().asNumber())
                else -> return value
            }
        }
    }

    private fun parseTerm(): MobileFormulaValue {
        var value = parseFactor()
        while (true) {
            skipWhitespace()
            value = when {
                consume('*') -> MobileFormulaValue.scalar(value.asNumber() * parseFactor().asNumber())
                consume('/') -> {
                    val divisor = parseFactor().asNumber()
                    if (divisor == 0.0) error("Dijeljenje s nulom.")
                    MobileFormulaValue.scalar(value.asNumber() / divisor)
                }
                else -> return value
            }
        }
    }

    private fun parseFactor(): MobileFormulaValue {
        skipWhitespace()
        if (consume('+')) return parseFactor()
        if (consume('-')) return MobileFormulaValue.scalar(-parseFactor().asNumber())
        if (consume('(')) {
            val value = parseExpression()
            requireClosing(')')
            return value
        }
        if (peek() == '"') return MobileFormulaValue.scalar(parseString())
        if (peek()?.isDigit() == true || peek() == '.') return MobileFormulaValue.scalar(parseNumber())
        if (peek()?.isLetter() == true || peek() == '$') return parseIdentifierOrCell()
        error("Nepoznat simbol.")
    }

    private fun parseIdentifierOrCell(): MobileFormulaValue {
        val start = index
        if (peek() == '$') index += 1
        while (peek()?.isLetter() == true) index += 1
        if (peek() == '$') index += 1
        val hasDigits = peek()?.isDigit() == true
        while (peek()?.isDigit() == true) index += 1
        val token = expression.substring(start, index)
        if (hasDigits) {
            val first = readCellValue(token)
            skipWhitespace()
            if (!consume(':')) return first
            val end = readCellToken()
            return MobileFormulaValue.matrix(readRangeValues(token, end))
        }

        skipWhitespace()
        val normalizedToken = token.uppercase(Locale.getDefault())
        if (!consume('(')) {
            return when (normalizedToken) {
                "TRUE" -> MobileFormulaValue.scalar(true)
                "FALSE" -> MobileFormulaValue.scalar(false)
                else -> error("Nepoznata oznaka: $token")
            }
        }
        return evaluateFunction(normalizedToken, readFunctionArgumentExpressions())
    }

    private fun evaluateFunction(name: String, args: List<String>): MobileFormulaValue {
        fun evaluate(argument: String): MobileFormulaValue =
            MobileMeasurementFormulaParser(argument, sheet, currentRowIndex, currentColumnIndex, stack).parse()

        fun numericValues(): List<Double> =
            args.flatMap { evaluate(it).flatten() }
                .filter { String.format(Locale.ROOT, "%s", it ?: "").trim().isNotEmpty() }
                .map { coerceFormulaNumber(it) }

        return when (name) {
            "IF" -> {
                if (args.size != 3) error("IF trazi 3 argumenta.")
                if (evaluate(args[0]).asBoolean()) evaluate(args[1]) else evaluate(args[2])
            }
            "IFERROR" -> {
                if (args.size != 2) error("IFERROR trazi 2 argumenta.")
                runCatching { evaluate(args[0]) }.getOrElse { evaluate(args[1]) }
            }
            "SUM" -> MobileFormulaValue.scalar(numericValues().sum())
            "AVERAGE" -> {
                val values = numericValues()
                if (values.isEmpty()) error("AVERAGE trazi barem jednu brojcanu vrijednost.")
                MobileFormulaValue.scalar(values.average())
            }
            "MIN" -> {
                val values = numericValues()
                if (values.isEmpty()) error("MIN trazi barem jednu brojcanu vrijednost.")
                MobileFormulaValue.scalar(values.minOrNull() ?: 0.0)
            }
            "MAX" -> {
                val values = numericValues()
                if (values.isEmpty()) error("MAX trazi barem jednu brojcanu vrijednost.")
                MobileFormulaValue.scalar(values.maxOrNull() ?: 0.0)
            }
            "COUNT" -> MobileFormulaValue.scalar(numericValues().size.toDouble())
            "ROW" -> MobileFormulaValue.scalar(evaluateRowFunction(args))
            "ROWS" -> MobileFormulaValue.scalar(evaluateRowsFunction(args))
            "RANDBETWEEN" -> {
                if (args.size != 2) error("RANDBETWEEN trazi 2 argumenta.")
                val min = kotlin.math.floor(evaluate(args[0]).asNumber()).toInt()
                val max = kotlin.math.floor(evaluate(args[1]).asNumber()).toInt()
                if (max < min) error("RANDBETWEEN trazi da je drugi broj veci ili jednak prvom.")
                MobileFormulaValue.scalar((min..max).random().toDouble())
            }
            else -> error("Nepodržana funkcija: $name")
        }
    }

    private fun evaluateRowFunction(args: List<String>): Double {
        if (args.isEmpty()) return (currentRowIndex + 1).toDouble()
        if (args.size != 1) error("ROW trazi 0 ili 1 argument.")
        val cell = parseMeasurementCellReferenceMobile(args[0].trim())
        if (cell != null) return (cell.rowIndex + 1).toDouble()
        return (currentRowIndex + 1).toDouble()
    }

    private fun evaluateRowsFunction(args: List<String>): Double {
        if (args.size != 1) error("ROWS trazi 1 argument.")
        val argument = args[0].trim()
        val parts = argument.split(":", limit = 2)
        if (parts.size == 1) {
            val cell = parseMeasurementCellReferenceMobile(parts[0])
            if (cell != null) return (cell.rowIndex + 1).toDouble()
        } else {
            val start = parseMeasurementCellReferenceMobile(parts[0])
            val end = parseMeasurementCellReferenceMobile(parts[1])
            if (start != null && end != null) {
                return (kotlin.math.abs(end.rowIndex - start.rowIndex) + 1).toDouble()
            }
        }
        val evaluated = MobileMeasurementFormulaParser(argument, sheet, currentRowIndex, currentColumnIndex, stack).parse()
        return if (evaluated.isMatrix()) evaluated.matrixRows().size.toDouble() else 1.0
    }

    private fun readCellToken(): String {
        skipWhitespace()
        val start = index
        if (peek() == '$') index += 1
        while (peek()?.isLetter() == true) index += 1
        if (peek() == '$') index += 1
        while (peek()?.isDigit() == true) index += 1
        val token = expression.substring(start, index)
        if (parseMeasurementCellReferenceMobile(token) == null) error("Neispravna referenca.")
        return token
    }

    private fun readCellValue(reference: String): MobileFormulaValue {
        val address = parseMeasurementCellReferenceMobile(reference) ?: error("Neispravna referenca.")
        return MobileFormulaValue.scalar(sheet.measurementCellValue(address.rowIndex, address.columnIndex, stack))
    }

    private fun readRangeValues(startReference: String, endReference: String): List<List<Any?>> {
        val start = parseMeasurementCellReferenceMobile(startReference) ?: error("Neispravna referenca.")
        val end = parseMeasurementCellReferenceMobile(endReference) ?: error("Neispravna referenca.")
        val rowRange = minOf(start.rowIndex, end.rowIndex)..maxOf(start.rowIndex, end.rowIndex)
        val columnRange = minOf(start.columnIndex, end.columnIndex)..maxOf(start.columnIndex, end.columnIndex)
        return rowRange.map { rowIndex ->
            columnRange.map { columnIndex -> sheet.measurementCellValue(rowIndex, columnIndex, stack) }
        }
    }

    private fun parseNumber(): Double {
        val start = index
        while (peek()?.isDigit() == true) index += 1
        if (peek() == '.') {
            index += 1
            while (peek()?.isDigit() == true) index += 1
        }
        return expression.substring(start, index).toDoubleOrNull() ?: error("Neispravan broj.")
    }

    private fun parseString(): String {
        if (!consume('"')) error("Nedostaje navodnik.")
        val builder = StringBuilder()
        while (index < expression.length) {
            val current = expression[index]
            if (current == '"') {
                if (expression.getOrNull(index + 1) == '"') {
                    builder.append('"')
                    index += 2
                    continue
                }
                index += 1
                return builder.toString()
            }
            builder.append(current)
            index += 1
        }
        error("Nedostaje zatvaranje teksta.")
    }

    private fun readFunctionArgumentExpressions(): List<String> {
        val args = mutableListOf<String>()
        val current = StringBuilder()
        var depth = 0
        var inString = false
        var hasContent = false
        while (index < expression.length) {
            val char = expression[index]
            if (inString) {
                current.append(char)
                if (char == '"') {
                    if (expression.getOrNull(index + 1) == '"') {
                        current.append('"')
                        index += 2
                        continue
                    }
                    inString = false
                }
                index += 1
                continue
            }
            when {
                char == '"' -> {
                    inString = true
                    current.append(char)
                    hasContent = true
                    index += 1
                }
                char == '(' -> {
                    depth += 1
                    current.append(char)
                    hasContent = true
                    index += 1
                }
                char == ')' && depth > 0 -> {
                    depth -= 1
                    current.append(char)
                    hasContent = true
                    index += 1
                }
                char == ')' -> {
                    if (hasContent || current.isNotEmpty()) args += current.toString()
                    index += 1
                    return args
                }
                (char == ';' || char == ',') && depth == 0 -> {
                    args += current.toString()
                    current.clear()
                    hasContent = false
                    index += 1
                }
                else -> {
                    current.append(char)
                    if (!char.isWhitespace()) hasContent = true
                    index += 1
                }
            }
        }
        error("Nedostaje zatvaranje funkcije.")
    }

    private fun consumeComparisonOperator(): String? {
        val two = expression.substring(index, minOf(expression.length, index + 2))
        if (two == "<=" || two == ">=" || two == "<>") {
            index += 2
            return two
        }
        val one = peek()
        if (one == '=' || one == '<' || one == '>') {
            index += 1
            return one.toString()
        }
        return null
    }

    private fun skipWhitespace() {
        while (peek()?.isWhitespace() == true) index += 1
    }

    private fun peek(): Char? = expression.getOrNull(index)

    private fun consume(char: Char): Boolean {
        if (peek() != char) return false
        index += 1
        return true
    }

    private fun requireClosing(char: Char) {
        skipWhitespace()
        if (!consume(char)) error("Nedostaje zatvaranje formule.")
    }
}

private data class MobileFormulaValue(val value: Any?) {
    fun asNumber(): Double = coerceFormulaNumber(value)

    fun asBoolean(): Boolean = when (val source = firstScalarValue()) {
        is Boolean -> source
        is Number -> source.toDouble() != 0.0
        else -> source?.toString()?.trim()?.isNotEmpty() == true
    }

    fun displayText(): String = when (val source = firstScalarValue()) {
        null -> ""
        is String -> source
        is Boolean -> if (source) "TRUE" else "FALSE"
        is Number -> formatMeasurementNumberMobile(source.toDouble())
        else -> source.toString()
    }

    fun flatten(): List<Any?> = when (value) {
        is List<*> -> value.flatMap { row ->
            if (row is List<*>) row else listOf(row)
        }
        else -> listOf(value)
    }

    fun isMatrix(): Boolean = value is List<*> && value.all { it is List<*> }

    fun matrixRows(): List<List<Any?>> =
        if (isMatrix()) {
            @Suppress("UNCHECKED_CAST")
            value as List<List<Any?>>
        } else {
            emptyList()
        }

    private fun firstScalarValue(): Any? =
        if (isMatrix()) matrixRows().firstOrNull()?.firstOrNull() else value

    companion object {
        fun scalar(value: Any?): MobileFormulaValue = MobileFormulaValue(value)
        fun matrix(value: List<List<Any?>>): MobileFormulaValue = MobileFormulaValue(value)
    }
}

private fun coerceFormulaNumber(value: Any?): Double {
    return when (value) {
        null -> 0.0
        is Number -> {
            val number = value.toDouble()
            if (number.isNaN() || number.isInfinite()) error("Brojcana vrijednost nije valjana.")
            number
        }
        is Boolean -> if (value) 1.0 else 0.0
        is List<*> -> coerceFormulaNumber(value.firstOrNull()?.let { row ->
            if (row is List<*>) row.firstOrNull() else row
        })
        else -> {
            val normalized = value.toString().trim().replace(",", ".")
            if (normalized.isBlank()) 0.0 else normalized.toDoubleOrNull() ?: error("Ocekivana je brojcana vrijednost.")
        }
    }
}

private fun normalizeComparableFormulaValue(value: Any?): Any? {
    val scalar = if (value is List<*>) value.firstOrNull()?.let { row ->
        if (row is List<*>) row.firstOrNull() else row
    } else {
        value
    }
    if (scalar is String) {
        val trimmed = scalar.trim()
        val numeric = trimmed.replace(",", ".").toDoubleOrNull()
        return if (trimmed.isNotBlank() && numeric != null) numeric else trimmed.uppercase(Locale.getDefault())
    }
    return scalar
}

private fun compareFormulaValues(left: Any?, right: Any?, operator: String): Boolean {
    val normalizedLeft = normalizeComparableFormulaValue(left)
    val normalizedRight = normalizeComparableFormulaValue(right)
    val comparison = when {
        normalizedLeft is Number && normalizedRight is Number ->
            normalizedLeft.toDouble().compareTo(normalizedRight.toDouble())
        normalizedLeft is Boolean && normalizedRight is Boolean ->
            normalizedLeft.compareTo(normalizedRight)
        else -> String.format(Locale.ROOT, "%s", normalizedLeft ?: "")
            .compareTo(String.format(Locale.ROOT, "%s", normalizedRight ?: ""), ignoreCase = false)
    }
    return when (operator) {
        "=" -> comparison == 0
        "<>" -> comparison != 0
        ">" -> comparison > 0
        "<" -> comparison < 0
        ">=" -> comparison >= 0
        "<=" -> comparison <= 0
        else -> false
    }
}

private fun WorkOrderMeasurementSheet.measurementCellNumeric(
    rowIndex: Int,
    columnIndex: Int,
    stack: Set<String>,
): Double {
    if (rowIndex !in rows.indices || columnIndex !in columns.indices) return 0.0
    val key = "$rowIndex:$columnIndex"
    if (stack.contains(key)) error("Kružna referenca.")
    val column = columns[columnIndex]
    if (column.computed.equals("average", ignoreCase = true)) return measurementAverage(rowIndex) ?: 0.0
    val raw = measurementRaw(rowIndex, columnIndex)
    return if (raw.trim().startsWith("=")) {
        evaluateMeasurementFormulaValueMobile(raw, this, rowIndex, columnIndex, stack + key).asNumber()
    } else {
        parseMeasurementNumberMobile(raw) ?: 0.0
    }
}

private fun WorkOrderMeasurementSheet.measurementCellValue(
    rowIndex: Int,
    columnIndex: Int,
    stack: Set<String>,
): Any? {
    if (rowIndex !in rows.indices || columnIndex !in columns.indices) return ""
    val key = "$rowIndex:$columnIndex"
    if (stack.contains(key)) error("Kružna referenca.")
    val column = columns[columnIndex]
    if (column.computed.equals("average", ignoreCase = true)) return measurementAverage(rowIndex) ?: ""
    val raw = measurementRaw(rowIndex, columnIndex)
    return if (raw.trim().startsWith("=")) {
        evaluateMeasurementFormulaValueMobile(raw, this, rowIndex, columnIndex, stack + key).value
    } else {
        raw
    }
}

private fun evaluateMeasurementFormulaValueMobile(
    rawFormula: String,
    sheet: WorkOrderMeasurementSheet,
    rowIndex: Int,
    columnIndex: Int,
    stack: Set<String>,
): MobileFormulaValue {
    val expression = rawFormula.trim().removePrefix("=")
    if (expression.isBlank()) return MobileFormulaValue.scalar(0.0)
    return MobileMeasurementFormulaParser(expression, sheet, rowIndex, columnIndex, stack).parse()
}

@Composable
private fun DocumentationNumberPreview(
    documentNumber: String,
    serviceName: String,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.52f),
    ) {
        Row(
            modifier = Modifier.padding(13.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.14f)) {
                Text(
                    "#",
                    modifier = Modifier.padding(horizontal = 13.dp, vertical = 8.dp),
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Black,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text("Broj zapisnika", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
                Text(
                    documentNumber.ifBlank { "Automatski kod izrade" },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (serviceName.isNotBlank()) {
                    Text(
                        serviceName,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun DocumentationSummarySection(
    workOrder: WorkOrder,
    flowItems: List<DocumentationServiceFlowItem>,
    additionalRecords: List<DocumentationAdditionalObjectRecord>,
    selectedService: String,
    documentNumber: String,
    objectName: String,
    inspectionDate: String,
    issuedDate: String,
    testingLocation: String,
    selectedEquipmentCount: Int,
    selectedLegalCount: Int,
    selectedRulebookCount: Int,
    signatureMode: String,
    completedBy: String,
    completedByOptions: List<Pair<String, String>>,
    includeHandoverProtocol: Boolean,
    enabled: Boolean,
    onSignatureMode: (String) -> Unit,
    onCompletedByChange: (String) -> Unit,
    onIncludeHandoverProtocol: (Boolean) -> Unit,
) {
    WizardSection(title = "Sažetak", icon = Icons.Rounded.CheckCircle) {
        DocumentationSummaryRow("RN", workOrder.displayNumber)
        DocumentationSummaryRow("Broj zapisnika", documentNumber.ifBlank { "Automatski kod izrade" })
        DocumentationSummaryRow("Usluga", selectedService.ifBlank { "Nije odabrano" })
        if (additionalRecords.isNotEmpty()) {
            DocumentationSummaryRow(
                "Dodatni zapisnici",
                additionalRecords.joinToString(", ") { record ->
                    "${record.serviceCode.ifBlank { record.serviceName }} - ${record.objectName.ifBlank { "drugi objekt" }}"
                },
            )
        }
        DocumentationSummaryRow("Objekt", objectName.ifBlank { "Samo lokacija" })
        DocumentationSummaryRow("Datum ispitivanja", formatDatePickerLabel(inspectionDate))
        DocumentationSummaryRow("Datum izdavanja", formatDatePickerLabel(issuedDate))
        DocumentationSummaryRow("Mjesto ispitivanja", testingLocation.ifBlank { "Nije upisano" })
        WorkOrderSelectField(
            label = "Tko je završio radni nalog",
            value = completedBy,
            valueLabel = completedBy.ifBlank { "Odaberi izvršitelja" },
            options = completedByOptions,
            enabled = enabled && completedByOptions.size > 1,
            onSelect = onCompletedByChange,
        )
        DocumentationSummaryRow(
            "Izvori",
            listOf(
                "$selectedEquipmentCount oprema",
                "$selectedLegalCount propisi",
                "$selectedRulebookCount pravilnici",
            ).joinToString(" · "),
        )
        DocumentationSummaryRow(
            "Potpis",
            when (signatureMode) {
                "digital" -> "Digitalni"
                "scan" -> "Sken"
                "manual" -> "Ručni"
                else -> signatureMode.ifBlank { "Digitalni" }
            },
        )
        Text("Način potpisa", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SignatureModeChip("digital", "Digitalni", signatureMode, enabled, onSignatureMode)
            SignatureModeChip("scan", "Sken", signatureMode, enabled, onSignatureMode)
            SignatureModeChip("manual", "Ručni", signatureMode, enabled, onSignatureMode)
        }
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.78f),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Primopredajni zapisnik", fontWeight = FontWeight.Black)
                    Text(
                        "Primopredaja se uvijek generira i sprema u dokumentaciju RN-a.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    )
                }
            }
        }
        if (flowItems.size > 1) {
            Text(
                "Izradit će se zapisnici za ${flowItems.size} usluge.",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun DocumentationSummaryRow(
    label: String,
    value: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            label,
            modifier = Modifier.width(118.dp),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
        )
        Text(
            value,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun DocumentationProcessToolbar(
    flowTabs: List<DocumentationFlowTab>,
    selectedService: String,
    enabled: Boolean,
    onSelectService: (String) -> Unit,
    onLongPressService: (DocumentationServiceFlowItem) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.48f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Rounded.Work, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                Text("Proces izrade", fontWeight = FontWeight.Black)
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                flowTabs.forEach { tab ->
                    DocumentationProcessChip(
                        label = tab.label,
                        selected = tab.key.equals(selectedService, ignoreCase = true),
                        onClick = { onSelectService(tab.key) },
                        onLongClick = tab.serviceItem?.let { item -> { onLongPressService(item) } },
                        enabled = enabled,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun DocumentationProcessChip(
    label: String,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    onLongClick: (() -> Unit)? = null,
) {
    val shape = RoundedCornerShape(12.dp)
    Surface(
        modifier = Modifier.combinedClickable(
            enabled = enabled,
            onClick = onClick,
            onLongClick = onLongClick,
        ),
        shape = shape,
        color = if (selected) {
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.92f)
        } else {
            MaterialTheme.colorScheme.surface.copy(alpha = 0.82f)
        },
        tonalElevation = if (selected) 2.dp else 0.dp,
    ) {
        Text(
            label,
            modifier = Modifier
                .border(
                    width = 1.dp,
                    color = if (selected) {
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.22f)
                    } else {
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.28f)
                    },
                    shape = shape,
                )
                .padding(horizontal = 18.dp, vertical = 10.dp),
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
            fontWeight = if (selected) FontWeight.Black else FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun DocumentationRuntimeActionBar(
    workOrder: WorkOrder,
    flowItems: List<DocumentationServiceFlowItem>,
    selectedService: String,
    templateCount: Int,
    measurementCount: Int,
    equipmentCount: Int,
    legalFrameworkCount: Int,
    rulebookCount: Int,
    signatureMode: String,
    enabled: Boolean,
    onSelectService: (String) -> Unit,
    onSignatureMode: (String) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = Color.Transparent,
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.78f),
                            MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.55f),
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.62f),
                        ),
                    ),
                )
                .padding(12.dp),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary) {
                        Icon(
                            Icons.Rounded.Description,
                            contentDescription = null,
                            modifier = Modifier
                                .size(36.dp)
                                .padding(9.dp),
                            tint = MaterialTheme.colorScheme.onPrimary,
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("RN ${workOrder.displayNumber}", fontWeight = FontWeight.Black)
                        Text(
                            listOf(workOrder.companyName, workOrder.locationName).filter { it.isNotBlank() }.joinToString(" - ")
                                .ifBlank { "Bez tvrtke / lokacije" },
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                if (flowItems.isNotEmpty()) {
                    Text("Usluge i zapisnici", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        flowItems.forEachIndexed { index, item ->
                            val selected = item.serviceName.equals(selectedService, ignoreCase = true)
                            FilterChip(
                                selected = selected,
                                onClick = { onSelectService(item.serviceName) },
                                enabled = enabled,
                                label = {
                                    Text(
                                        "${index + 1}. ${item.serviceName}",
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                },
                            )
                        }
                        AssistChip(onClick = {}, label = { Text("Sažetak") })
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = {}, label = { Text("${templateCount.coerceAtLeast(0)} predložak") })
                    AssistChip(onClick = {}, label = { Text("${measurementCount.coerceAtLeast(0)} Excel") })
                    AssistChip(onClick = {}, label = { Text("${equipmentCount.coerceAtLeast(0)} oprema") })
                    AssistChip(onClick = {}, label = { Text("${legalFrameworkCount.coerceAtLeast(0)} propisi") })
                    AssistChip(onClick = {}, label = { Text("${rulebookCount.coerceAtLeast(0)} pravilnici") })
                    AssistChip(onClick = {}, label = { Text(workOrder.status.ifBlank { "Bez statusa" }) })
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = signatureMode == "scan",
                        onClick = { onSignatureMode("scan") },
                        enabled = enabled,
                        label = { Text("Potpis") },
                    )
                    FilterChip(
                        selected = signatureMode == "digital",
                        onClick = { onSignatureMode("digital") },
                        enabled = enabled,
                        label = { Text("Digitalni") },
                    )
                    FilterChip(
                        selected = signatureMode == "manual",
                        onClick = { onSignatureMode("manual") },
                        enabled = enabled,
                        label = { Text("Ručni") },
                    )
                    AssistChip(onClick = {}, label = { Text("PDF nakon spremanja") })
                }
            }
        }
    }
}

@Composable
private fun MeasurementTableEditor(
    template: WorkOrderDocumentationTemplate,
    table: WorkOrderMeasurementTable,
    sheet: WorkOrderMeasurementSheet,
    enabled: Boolean,
    onSheetChange: (WorkOrderMeasurementSheet) -> Unit,
) {
    val visibleColumns = sheet.columns.take(16)
    val visibleRows = sheet.rows.take(120)
    val initialSelection = remember(table.key, sheet.columns.size, sheet.rows.size) {
        val columnIndex = sheet.columns.indexOfFirst { it.computed.isBlank() && !it.readonly }.takeIf { it >= 0 } ?: 0
        MeasurementCellSelection(0, columnIndex)
    }
    var selectedCell by remember(table.key, sheet.columns.size, sheet.rows.size) { mutableStateOf(initialSelection) }
    val selectedRow = sheet.rows.getOrNull(selectedCell.rowIndex)
    val selectedColumn = sheet.columns.getOrNull(selectedCell.columnIndex)
    val selectedRaw = selectedRow?.cells?.get(selectedColumn?.id.orEmpty()).orEmpty()
    val selectedEditable = selectedColumn != null && selectedColumn.computed.isBlank() && !selectedColumn.readonly
    val selectedDisplay = sheet.measurementCellDisplay(selectedCell.rowIndex, selectedCell.columnIndex)
    val gridLine = MaterialTheme.colorScheme.outline.copy(alpha = 0.34f)
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(table.label, fontWeight = FontWeight.Black)
                Text(
                    listOf(template.title, table.summary).filter { it.isNotBlank() }.joinToString(" - "),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                )
                if (table.helpText.isNotBlank()) {
                    Text(
                        table.helpText,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.54f),
                    )
                }
            }
            if (visibleColumns.isEmpty() || visibleRows.isEmpty()) {
                Text("Excel tablica nema dostupnih ćelija za unos.")
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(
                        modifier = Modifier
                            .width(64.dp)
                            .height(46.dp)
                            .border(1.dp, gridLine, RoundedCornerShape(6.dp)),
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                measurementCellReference(selectedCell.rowIndex, selectedCell.columnIndex),
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }
                    Surface(
                        modifier = Modifier
                            .width(42.dp)
                            .height(46.dp)
                            .border(1.dp, gridLine, RoundedCornerShape(6.dp)),
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("fx", fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    OutlinedTextField(
                        value = selectedRaw,
                        onValueChange = { value ->
                            val row = selectedRow
                            val column = selectedColumn
                            if (row != null && column != null && selectedEditable) {
                                onSheetChange(updateMeasurementSheetCell(sheet, row.id, column.id, value))
                            }
                        },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text(if (selectedDisplay.isNotBlank()) selectedDisplay else "Vrijednost ili formula") },
                        singleLine = true,
                        enabled = enabled && selectedEditable,
                        shape = RoundedCornerShape(6.dp),
                    )
                }
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .border(1.dp, gridLine, RoundedCornerShape(6.dp))
                        .clip(RoundedCornerShape(6.dp)),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        MeasurementHeaderCell("", 46, subtle = true)
                        visibleColumns.forEachIndexed { columnIndex, column ->
                            MeasurementHeaderCell(measurementColumnLabel(columnIndex), column.width)
                        }
                    }
                    visibleRows.forEachIndexed { rowIndex, row ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                modifier = Modifier
                                    .width(46.dp)
                                    .height(44.dp)
                                    .border(0.6.dp, gridLine),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.72f),
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("${rowIndex + 1}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                }
                            }
                            visibleColumns.forEachIndexed { columnIndex, column ->
                                MeasurementGridCell(
                                    column = column,
                                    displayValue = sheet.measurementCellDisplay(rowIndex, columnIndex),
                                    rawValue = row.cells[column.id].orEmpty(),
                                    selected = selectedCell.rowIndex == rowIndex && selectedCell.columnIndex == columnIndex,
                                    enabled = enabled,
                                    onClick = {
                                        selectedCell = MeasurementCellSelection(rowIndex, columnIndex)
                                    },
                                    onChange = { value ->
                                        onSheetChange(updateMeasurementSheetCell(sheet, row.id, column.id, value))
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MeasurementHeaderCell(label: String, width: Int, subtle: Boolean = false) {
    val gridLine = MaterialTheme.colorScheme.outline.copy(alpha = 0.34f)
    Box(
        modifier = Modifier
            .width(width.coerceIn(46, 260).dp)
            .height(34.dp)
            .border(0.6.dp, gridLine)
            .background(
                if (subtle) {
                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f)
                } else {
                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.76f)
                },
            )
            .padding(horizontal = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Black, maxLines = 1)
    }
}

@Composable
private fun MeasurementGridCell(
    column: WorkOrderMeasurementColumn,
    displayValue: String,
    rawValue: String,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    onChange: (String) -> Unit,
) {
    val editable = column.computed.isBlank() && !column.readonly
    val isFormula = rawValue.trim().startsWith("=")
    val value = if (isFormula) displayValue else displayValue.ifBlank { rawValue }
    val hasError = value == "#ERROR"
    val gridLine = MaterialTheme.colorScheme.outline.copy(alpha = 0.34f)
    val cellWidth = column.width.coerceIn(120, 260).dp
    if (selected && editable) {
        OutlinedTextField(
            value = rawValue,
            onValueChange = onChange,
            modifier = Modifier
                .width(cellWidth)
                .height(44.dp),
            singleLine = true,
            enabled = enabled,
            textStyle = MaterialTheme.typography.bodySmall,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            shape = RoundedCornerShape(2.dp),
        )
        return
    }
    Box(
        modifier = Modifier
            .width(cellWidth)
            .height(44.dp)
            .border(if (selected) 2.dp else 0.6.dp, if (selected) MaterialTheme.colorScheme.primary else gridLine)
            .background(
                when {
                    hasError -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.58f)
                    selected -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.52f)
                    !editable -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.46f)
                    else -> MaterialTheme.colorScheme.surface
                },
            )
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.CenterStart,
    ) {
        Text(
            value.ifBlank { if (isFormula) "" else column.placeholder },
            modifier = Modifier.padding(horizontal = 8.dp),
            style = MaterialTheme.typography.bodySmall,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = when {
                hasError -> MaterialTheme.colorScheme.onErrorContainer
                value.isBlank() -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.42f)
                else -> MaterialTheme.colorScheme.onSurface
            },
        )
    }
}

@Composable
private fun TemplateBlockOverview(
    template: WorkOrderDocumentationTemplate,
    values: Map<String, String>,
    standardControls: DocumentationTemplateStandardControls,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    val sections = remember(template.fieldBlocks) {
        buildTemplateBlockSections(template.fieldBlocks)
    }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.88f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(11.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(template.title, fontWeight = FontWeight.Black)
                Text(
                    listOf(
                        template.documentType,
                        "${template.fieldBlocks.size} blokova",
                        "${template.measurementTables.size} Excel",
                    ).filter { it.isNotBlank() }.joinToString(" - "),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                )
            }
            sections.forEach { section ->
                TemplateBlockSectionCard(
                    template = template,
                    section = section,
                    values = values,
                    standardControls = standardControls,
                    onChange = onChange,
                )
            }
        }
    }
}

private data class DocumentationTemplateStandardControls(
    val documentNumber: String,
    val serviceName: String,
    val inspectionDate: String,
    val onInspectionDateChange: (String) -> Unit,
    val issuedDate: String,
    val onIssuedDateChange: (String) -> Unit,
    val inspectionType: String,
    val inspectionOptions: List<Pair<String, String>>,
    val onInspectionTypeChange: (String) -> Unit,
    val testingLocation: String,
    val onTestingLocationChange: (String) -> Unit,
    val measurementEquipmentGroup: String,
    val measurementEquipmentGroupOptions: List<Pair<String, String>>,
    val onMeasurementEquipmentGroupChange: (String) -> Unit,
    val measurementEquipmentOptions: List<WorkOrderDocumentationOption>,
    val selectedEquipmentIds: Set<String>,
    val onSelectedEquipmentIdsChange: (Set<String>) -> Unit,
    val legalFrameworkOptions: List<WorkOrderDocumentationOption>,
    val selectedLegalFrameworkIds: Set<String>,
    val onSelectedLegalFrameworkIdsChange: (Set<String>) -> Unit,
    val rulebookOptions: List<WorkOrderDocumentationOption>,
    val selectedRulebookIds: Set<String>,
    val onSelectedRulebookIdsChange: (Set<String>) -> Unit,
    val measurementSheets: Map<String, WorkOrderMeasurementSheet>,
    val onMeasurementSheetChange: (String, WorkOrderMeasurementSheet) -> Unit,
    val enabled: Boolean,
)

private data class TemplateBlockSection(
    val id: String,
    val title: String,
    val subtitle: String,
    val header: WorkOrderDocumentationTemplateBlock?,
    val blocks: List<WorkOrderDocumentationTemplateBlock>,
)

private fun buildTemplateBlockSections(blocks: List<WorkOrderDocumentationTemplateBlock>): List<TemplateBlockSection> {
    if (blocks.isEmpty()) return emptyList()
    val sections = mutableListOf<TemplateBlockSection>()
    var currentHeader: WorkOrderDocumentationTemplateBlock? = null
    val currentBlocks = mutableListOf<WorkOrderDocumentationTemplateBlock>()

    fun flushSection() {
        if (currentHeader == null && currentBlocks.isEmpty()) return
        val index = sections.size + 1
        val title = currentHeader?.label?.trim().orEmpty()
            .ifBlank { currentBlocks.firstOrNull()?.group?.trim().orEmpty() }
            .ifBlank { "Blok $index" }
        val id = listOf(currentHeader?.id, currentHeader?.key, currentHeader?.tokenKey, title)
            .map { it?.trim().orEmpty() }
            .firstOrNull { it.isNotBlank() }
            ?: "section-$index"
        sections.add(
            TemplateBlockSection(
                id = "$index::$id",
                title = title,
                subtitle = currentHeader?.typeLabel?.ifBlank { currentBlocks.firstOrNull()?.group }.orEmpty(),
                header = currentHeader,
                blocks = currentBlocks.toList(),
            ),
        )
        currentBlocks.clear()
    }

    blocks.forEach { block ->
        if (block.type.equals("chapter", ignoreCase = true)) {
            flushSection()
            currentHeader = block
        } else {
            currentBlocks.add(block)
        }
    }
    flushSection()

    return sections
}

@Composable
private fun TemplateBlockSectionCard(
    template: WorkOrderDocumentationTemplate,
    section: TemplateBlockSection,
    values: Map<String, String>,
    standardControls: DocumentationTemplateStandardControls,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    var expanded by remember(template.id, section.id) { mutableStateOf(isBasicTemplateSection(section)) }
    val includeBasics = isBasicTemplateSection(section)
    val includeEquipment = isEquipmentTemplateSection(section)
    val includeLegal = isLegalTemplateSection(section)
    val includeMeasurements = isMeasurementTemplateSection(section)
    val handledTypes = setOf("equipment_list", "legal_list", "measurement_table")
    val detailBlocks = section.blocks.filterNot { block ->
        handledTypes.contains(block.type.lowercase(Locale.getDefault())) ||
            (includeBasics && isBasicStandardTemplateBlock(block))
    }
    val canExpand = includeBasics ||
        includeEquipment ||
        includeLegal ||
        includeMeasurements ||
        detailBlocks.isNotEmpty() ||
        section.header?.summary?.isNotBlank() == true ||
        section.header?.helpText?.isNotBlank() == true
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(enabled = canExpand) { expanded = !expanded },
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)) {
                    Icon(
                        templateBlockIcon(section.header?.type ?: section.blocks.firstOrNull()?.type.orEmpty()),
                        contentDescription = null,
                        modifier = Modifier
                            .size(38.dp)
                            .padding(9.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        section.title,
                        fontWeight = FontWeight.Black,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        listOf(
                            section.subtitle,
                            if (section.blocks.isNotEmpty()) "${section.blocks.size} polja" else "Nema dodatnih polja",
                        ).filter { it.isNotBlank() }.joinToString(" - "),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    )
                }
            }
            if (expanded) {
                val header = section.header
                if (header?.summary?.isNotBlank() == true) {
                    Text(
                        header.summary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    )
                }
                if (header?.helpText?.isNotBlank() == true) {
                    Text(
                        header.helpText,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.56f),
                    )
                }
                if (section.blocks.isEmpty()) {
                    if (!includeBasics && !includeEquipment && !includeLegal && !includeMeasurements) {
                        Text(
                            "Nema dodatnih polja u ovom poglavlju.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                        )
                    }
                }
                if (includeBasics) {
                    Text(
                        "Osnovni podaci uređuju se u glavnom bloku Osnovno na početku izrade.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    )
                }
                if (includeEquipment) {
                    TemplateEquipmentControls(standardControls)
                }
                if (includeLegal) {
                    TemplateLegalControls(standardControls)
                }
                if (includeMeasurements) {
                    val tables = getMeasurementTablesForSection(template, section)
                    if (tables.isEmpty()) {
                        Text(
                            "Ovaj blok nema povezanu Excel tablicu.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                        )
                    } else {
                        tables.forEach { table ->
                            val stateKey = measurementSheetStateKey(template, table)
                            MeasurementTableEditor(
                                template = template,
                                table = table,
                                sheet = standardControls.measurementSheets[stateKey] ?: table.sheet,
                                enabled = standardControls.enabled,
                                onSheetChange = { nextSheet ->
                                    standardControls.onMeasurementSheetChange(stateKey, nextSheet)
                                },
                            )
                        }
                    }
                }
                if (detailBlocks.isNotEmpty()) {
                    detailBlocks.forEach { block ->
                        val editableField = findTemplateFieldForBlock(template, block)
                        TemplateBlockDetailRow(
                            template = template,
                            block = block,
                            editableField = editableField,
                            value = editableField?.let { values[templateFieldStateKey(template, it)] }.orEmpty(),
                            enabled = standardControls.enabled,
                            onChange = onChange,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentationCoreBasicsLauncherCard(
    documentNumber: String,
    serviceName: String,
    inspectionDate: String,
    issuedDate: String,
    inspectionType: String,
    testingLocation: String,
    measurementEquipmentGroup: String,
    outsideTemperature: String,
    relativeHumidity: String,
    onOpen: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onOpen),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.46f),
    ) {
        Row(
            modifier = Modifier.padding(13.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.13f)) {
                Icon(
                    Icons.Rounded.Description,
                    contentDescription = null,
                    modifier = Modifier
                        .size(40.dp)
                        .padding(9.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text("Osnovno", fontWeight = FontWeight.Black)
                Text(
                    listOf(
                        formatDatePickerLabel(inspectionDate),
                        inspectionType,
                        testingLocation,
                    ).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { "Datumi, ispitivači, oprema i uvjeti" },
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    listOf(
                        "Broj: ${documentNumber.ifBlank { "auto" }}",
                        formatDatePickerLabel(issuedDate).takeIf { it.isNotBlank() }?.let { "Izdano $it" },
                        serviceName.takeIf { it.isNotBlank() },
                        measurementEquipmentGroup.takeIf { it.isNotBlank() }?.let { "Oprema $it" },
                        listOf(outsideTemperature, relativeHumidity).filter { it.isNotBlank() }.joinToString(" / ").takeIf { it.isNotBlank() },
                    ).filterNotNull().joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.56f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            TextButton(onClick = onOpen) {
                Text("Uredi", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun DocumentationExecutorsEditor(
    executorOptions: List<Pair<String, String>>,
    selectedExecutors: List<String>,
    enabled: Boolean,
    onChange: (List<String>) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.82f),
    ) {
    Column(
        modifier = Modifier.padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Rounded.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Text("Izvršitelji RN-a", fontWeight = FontWeight.Black)
        }
        WorkOrderMultiSelectChips(
            options = executorOptions,
            selected = selectedExecutors,
            enabled = enabled,
            emptyText = "Nema dostupnih korisnika za odabir izvršitelja.",
            onToggle = { value -> onChange(selectedExecutors.toggleValue(value)) },
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (selectedExecutors.isEmpty()) "Nije dodijeljeno" else selectedExecutors.joinToString(", "),
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                "Sprema se odmah nakon promjene.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
            )
        }
    }
    }
}

@Composable
private fun DocumentationServiceValiditySection(
    flowItems: List<DocumentationServiceFlowItem>,
    serviceValidityMonths: Map<String, String>,
    onServiceValidityMonthsChange: (String, String) -> Unit,
    enabled: Boolean,
) {
    WizardSection(title = "Rok važenja usluge", icon = Icons.Rounded.CalendarMonth) {
        if (flowItems.isEmpty()) {
            Text(
                "Rok važenja se uzima iz starog zapisnika ili web predloška.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
            )
        } else {
            flowItems.forEach { item ->
                val key = item.serviceValidityKey()
                NumberTextField(
                    "${item.serviceCode} - ${item.serviceName}".trim(' ', '-'),
                    serviceValidityMonths[key].orEmpty(),
                    { value -> onServiceValidityMonthsChange(key, value) },
                    enabled,
                )
            }
        }
    }
}

@Composable
private fun DocumentationServicePeopleSection(
    personRules: List<DocumentationPersonFieldRule>,
    areaOptions: List<WorkOrderDocumentationSignatureAreaOptions>,
    inspectorUserIds: Set<String>,
    onInspectorUserIdsChange: (Set<String>) -> Unit,
    authorizationHolderUserId: String,
    onAuthorizationHolderUserIdChange: (String) -> Unit,
    electricalInspectorUserIds: Set<String>,
    onElectricalInspectorUserIdsChange: (Set<String>) -> Unit,
    electricalAuthorizationHolderUserId: String,
    onElectricalAuthorizationHolderUserIdChange: (String) -> Unit,
    tipkaloInspectorUserIds: Set<String>,
    onTipkaloInspectorUserIdsChange: (Set<String>) -> Unit,
    tipkaloAuthorizationHolderUserId: String,
    onTipkaloAuthorizationHolderUserIdChange: (String) -> Unit,
    enabled: Boolean,
) {
    if (personRules.isEmpty()) {
        return
    }
    val rulesByArea = personRules.groupBy { normalizeDocumentationSignatureAreaKey(it.signatureArea) }

    WizardSection(title = "Osobe i ovlaštenja", icon = Icons.Rounded.CheckCircle) {
        rulesByArea.forEach { (area, rules) ->
            val options = areaOptions.areaOptions(area)
            val inspectorSelection = when (area) {
                "tipkalo", "tzin" -> tipkaloInspectorUserIds
                "elektro" -> electricalInspectorUserIds
                else -> inspectorUserIds
            }
            val authorizationSelection = when (area) {
                "tipkalo", "tzin" -> tipkaloAuthorizationHolderUserId
                "elektro" -> electricalAuthorizationHolderUserId
                else -> authorizationHolderUserId
            }
            val onInspectorChange: (Set<String>) -> Unit = when (area) {
                "tipkalo", "tzin" -> onTipkaloInspectorUserIdsChange
                "elektro" -> onElectricalInspectorUserIdsChange
                else -> onInspectorUserIdsChange
            }
            val onAuthorizationChange: (String) -> Unit = when (area) {
                "tipkalo", "tzin" -> onTipkaloAuthorizationHolderUserIdChange
                "elektro" -> onElectricalAuthorizationHolderUserIdChange
                else -> onAuthorizationHolderUserIdChange
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f),
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(options.label, fontWeight = FontWeight.Black)
                    rules.forEach { rule ->
                        when (rule.role) {
                            "company_responsible" -> {
                                DocumentationPersonRoleCard(
                                    label = if (rule.required) "${rule.label} *" else rule.label,
                                    selectedSummary = "Automatski iz tvrtke/lokacije",
                                    icon = Icons.Rounded.Business,
                                ) {
                                    Text(
                                        "Osoba naručitelja popunjava se iz podataka tvrtke/lokacije.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f),
                                    )
                                }
                            }
                            "authorize" -> {
                                val authorizationOptions = listOf(
                                    WorkOrderDocumentationOption("", "Odaberi odgovornu osobu"),
                                ) + options.authorizationOptions
                                val authorizationLabel = authorizationOptions.firstOrNull { it.id == authorizationSelection }?.label.orEmpty()
                                DocumentationPersonRoleCard(
                                    label = if (rule.required) "${rule.label} *" else rule.label,
                                    selectedSummary = authorizationLabel.ifBlank { "Nije odabrano" },
                                    icon = Icons.Rounded.Person,
                                ) {
                                    WorkOrderSelectField(
                                        label = "Odabir osobe",
                                        value = authorizationSelection,
                                        valueLabel = authorizationLabel.ifBlank { "Odaberi odgovornu osobu" },
                                        options = authorizationOptions.map { it.id to it.label },
                                        enabled = enabled,
                                        onSelect = onAuthorizationChange,
                                    )
                                }
                            }
                            else -> {
                                if (rule.multiple) {
                                    val selectedInspectorLabels = options.inspectorOptions
                                        .filter { it.id in inspectorSelection }
                                        .joinToString(", ") { it.label }
                                    DocumentationPersonRoleCard(
                                        label = if (rule.required) "${rule.label} *" else rule.label,
                                        selectedSummary = selectedInspectorLabels.ifBlank { "Nije odabrano" },
                                        icon = Icons.Rounded.CheckCircle,
                                    ) {
                                        DocumentationMultiSelectField(
                                            label = "Odabir osoba",
                                            options = options.inspectorOptions,
                                            selectedIds = inspectorSelection,
                                            enabled = enabled,
                                            emptyText = "Nema aktivnih ispitivača s ovlaštenjem za ovu uslugu.",
                                            onChange = onInspectorChange,
                                        )
                                    }
                                } else {
                                    val inspectorOptions = listOf(
                                        WorkOrderDocumentationOption("", "Odaberi ispitivača"),
                                    ) + options.inspectorOptions
                                    val selectedInspectorId = inspectorSelection.firstOrNull().orEmpty()
                                    val inspectorLabel = inspectorOptions.firstOrNull { it.id == selectedInspectorId }?.label.orEmpty()
                                    DocumentationPersonRoleCard(
                                        label = if (rule.required) "${rule.label} *" else rule.label,
                                        selectedSummary = inspectorLabel.ifBlank { "Nije odabrano" },
                                        icon = Icons.Rounded.CheckCircle,
                                    ) {
                                        WorkOrderSelectField(
                                            label = "Odabir osobe",
                                            value = selectedInspectorId,
                                            valueLabel = inspectorLabel.ifBlank { "Odaberi ispitivača" },
                                            options = inspectorOptions.map { it.id to it.label },
                                            enabled = enabled,
                                            onSelect = { next -> onInspectorChange(if (next.isBlank()) emptySet() else setOf(next)) },
                                        )
                                    }
                                }
                            }
                        }
                        if (rule.helpText.isNotBlank()) {
                            Text(
                                rule.helpText,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.54f),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentationPersonRoleCard(
    label: String,
    selectedSummary: String,
    icon: ImageVector,
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.72f),
                ) {
                    Icon(
                        icon,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(9.dp)
                            .size(18.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(label, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        selectedSummary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            content()
        }
    }
}

@Composable
private fun DocumentationCoreBasicsContent(
    documentNumber: String,
    serviceName: String,
    showDocumentNumber: Boolean = true,
    inspectionDate: String,
    onInspectionDateChange: (String) -> Unit,
    issuedDate: String,
    onIssuedDateChange: (String) -> Unit,
    testingLocation: String,
    onTestingLocationChange: (String) -> Unit,
    measurementEquipmentGroup: String,
    measurementEquipmentGroupOptions: List<Pair<String, String>>,
    onMeasurementEquipmentGroupChange: (String) -> Unit,
    outsideTemperature: String,
    relativeHumidity: String,
    airflowSpeed: String,
    weather: String,
    groundCondition: String,
    groundResistance: String,
    onOutsideTemperatureChange: (String) -> Unit,
    onRelativeHumidityChange: (String) -> Unit,
    onAirflowSpeedChange: (String) -> Unit,
    onWeatherChange: (String) -> Unit,
    onGroundConditionChange: (String) -> Unit,
    onGroundResistanceChange: (String) -> Unit,
    environmentVisibility: DocumentationEnvironmentVisibility,
    enabled: Boolean,
) {
    if (showDocumentNumber) {
        DocumentationNumberPreview(documentNumber = documentNumber, serviceName = serviceName)
    }
    WorkOrderDatePickerField("Datum ispitivanja", inspectionDate, onInspectionDateChange, enabled)
    WorkOrderDatePickerField("Datum izdavanja", issuedDate, onIssuedDateChange, enabled)
    WorkOrderTextField("Mjesto ispitivanja", testingLocation, onTestingLocationChange, enabled)

    Text("Mjerna oprema", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
    WorkOrderSelectField(
        label = "Grupa mjerne opreme",
        value = measurementEquipmentGroup,
        valueLabel = measurementEquipmentGroup.ifBlank { "Bez odabira" },
        options = measurementEquipmentGroupOptions,
        enabled = enabled,
        onSelect = onMeasurementEquipmentGroupChange,
    )
    if (environmentVisibility.any) {
        Text("Vanjski utjecaji", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
        if (environmentVisibility.outsideTemperature) {
            WorkOrderTextField("Vanjska temperatura", outsideTemperature, onOutsideTemperatureChange, enabled)
        }
        if (environmentVisibility.relativeHumidity) {
            WorkOrderTextField("Relativna vlaga", relativeHumidity, onRelativeHumidityChange, enabled)
        }
        if (environmentVisibility.airflowSpeed) {
            WorkOrderTextField("Strujanje zraka", airflowSpeed, onAirflowSpeedChange, enabled)
        }
        if (environmentVisibility.weather) {
            WorkOrderTextField("Vremenski uvjeti", weather, onWeatherChange, enabled)
        }
        if (environmentVisibility.groundCondition) {
            WorkOrderTextField("Stanje tla", groundCondition, onGroundConditionChange, enabled)
        }
        if (environmentVisibility.groundResistance) {
            WorkOrderTextField("Otpor tla", groundResistance, onGroundResistanceChange, enabled)
        }
    }
}

@Composable
private fun TemplateBasicControls(controls: DocumentationTemplateStandardControls) {
    DocumentationNumberPreview(
        documentNumber = controls.documentNumber,
        serviceName = controls.serviceName,
    )
    WorkOrderDatePickerField(
        "Datum ispitivanja",
        controls.inspectionDate,
        controls.onInspectionDateChange,
        controls.enabled,
    )
    WorkOrderDatePickerField(
        "Datum izdavanja",
        controls.issuedDate,
        controls.onIssuedDateChange,
        controls.enabled,
    )
    WorkOrderSelectField(
        label = "Vrsta ispitivanja",
        value = controls.inspectionType,
        valueLabel = controls.inspectionType.ifBlank {
            if (controls.inspectionOptions.isEmpty()) "Nema opcija u templateu" else "Odaberi vrstu ispitivanja"
        },
        options = controls.inspectionOptions,
        enabled = controls.enabled,
        onSelect = controls.onInspectionTypeChange,
    )
    WorkOrderTextField(
        "Mjesto ispitivanja",
        controls.testingLocation,
        controls.onTestingLocationChange,
        controls.enabled,
    )
}

@Composable
private fun TemplateEquipmentControls(controls: DocumentationTemplateStandardControls) {
    DocumentationMultiSelectField(
        label = "Uređaji za zapisnik",
        options = controls.measurementEquipmentOptions,
        selectedIds = controls.selectedEquipmentIds,
        enabled = controls.enabled,
        emptyText = "Nema upisane mjerne i ispitne opreme za ovu organizaciju.",
        onChange = controls.onSelectedEquipmentIdsChange,
    )
}

@Composable
private fun TemplateLegalControls(controls: DocumentationTemplateStandardControls) {
    DocumentationMultiSelectField(
        label = "Propisi iz web predloška",
        options = controls.legalFrameworkOptions,
        selectedIds = controls.selectedLegalFrameworkIds,
        enabled = controls.enabled,
        emptyText = "Nema propisa povezanih s predlošcima.",
        onChange = controls.onSelectedLegalFrameworkIdsChange,
    )
    DocumentationMultiSelectField(
        label = "Interni pravilnici",
        options = controls.rulebookOptions,
        selectedIds = controls.selectedRulebookIds,
        enabled = controls.enabled,
        emptyText = "Nema pravilnika za ovu organizaciju.",
        onChange = controls.onSelectedRulebookIdsChange,
    )
}

private fun normalizeTemplateSectionLookup(value: String): String =
    value.trim()
        .lowercase(Locale.getDefault())
        .replace("č", "c")
        .replace("ć", "c")
        .replace("ž", "z")
        .replace("š", "s")
        .replace("đ", "d")
        .replace(Regex("\\s+"), " ")

private fun TemplateBlockSection.lookupText(): String =
    normalizeTemplateSectionLookup(
        listOf(
            title,
            subtitle,
            header?.label.orEmpty(),
            header?.summary.orEmpty(),
            blocks.joinToString(" ") { "${it.group} ${it.label} ${it.typeLabel}" },
        ).joinToString(" "),
    )

private fun isBasicTemplateSection(section: TemplateBlockSection): Boolean {
    val lookup = section.lookupText()
    return lookup.contains("osnovn") || lookup.contains("opci podaci")
}

private fun isEquipmentTemplateSection(section: TemplateBlockSection): Boolean {
    val lookup = section.lookupText()
    return section.blocks.any { it.type.equals("equipment_list", ignoreCase = true) } ||
        lookup.contains("mjerna") ||
        lookup.contains("ispitna oprema")
}

private fun isLegalTemplateSection(section: TemplateBlockSection): Boolean {
    val lookup = section.lookupText()
    return section.blocks.any { it.type.equals("legal_list", ignoreCase = true) } ||
        lookup.contains("propis") ||
        lookup.contains("pravilnik")
}

private fun isMeasurementTemplateSection(section: TemplateBlockSection): Boolean {
    val lookup = section.lookupText()
    return section.blocks.any { it.type.equals("measurement_table", ignoreCase = true) } ||
        lookup.contains("rezultat") ||
        lookup.contains("mjerenj") ||
        lookup.contains("excel")
}

private fun isBasicStandardTemplateBlock(block: WorkOrderDocumentationTemplateBlock): Boolean {
    val lookup = normalizeTemplateSectionLookup("${block.label} ${block.key} ${block.tokenKey}")
    return lookup.contains("broj zapisnika") ||
        lookup.contains("datum ispitivanja") ||
        lookup.contains("datum izdavanja") ||
        lookup.contains("vrsta ispitivanja") ||
        lookup.contains("mjesto ispitivanja")
}

private fun getMeasurementTablesForSection(
    template: WorkOrderDocumentationTemplate,
    section: TemplateBlockSection,
): List<WorkOrderMeasurementTable> {
    val measurementBlocks = section.blocks.filter { it.type.equals("measurement_table", ignoreCase = true) }
    if (measurementBlocks.isEmpty()) {
        return if (isMeasurementTemplateSection(section)) template.measurementTables else emptyList()
    }
    val blockKeys = measurementBlocks
        .flatMap { block -> listOf(block.id, block.key, block.tokenKey, block.label) }
        .map(::normalizeTemplateSectionLookup)
        .filter { it.isNotBlank() }
        .toSet()
    return template.measurementTables.filter { table ->
        listOf(table.id, table.key, table.tokenKey, table.label)
            .map(::normalizeTemplateSectionLookup)
            .any { it.isNotBlank() && blockKeys.contains(it) }
    }.ifEmpty { template.measurementTables }
}

@Composable
private fun TemplateBlockDetailRow(
    template: WorkOrderDocumentationTemplate,
    block: WorkOrderDocumentationTemplateBlock,
    editableField: WorkOrderDocumentationField?,
    value: String,
    enabled: Boolean,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Icon(
                    templateBlockIcon(block.type),
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        if (block.required) "${block.label} *" else block.label,
                        fontWeight = FontWeight.Black,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        block.typeLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.56f),
                    )
                }
            }
            if (editableField != null) {
                TemplateFieldInput(
                    field = editableField,
                    value = value,
                    enabled = enabled,
                    onChange = { onChange(editableField, it) },
                )
            } else {
                Text(
                    block.summary.ifBlank {
                        when (block.type.lowercase(Locale.getDefault())) {
                            "measurement_table" -> "Excel tablica se uređuje u bloku Excel / mjerenja."
                            "equipment_list" -> "Oprema se bira u bloku Mjerna i ispitna oprema."
                            "legal_list" -> "Propisi i pravilnici se biraju u bloku Pravilnici i propisi."
                            "qualified_inspectors", "inspector_signature", "authorization_holder_signature", "digital_signature" ->
                                "Osobe i potpis se popunjavaju u bloku Osobe i potpis."
                            "sketch_upload", "image_upload" -> "Prilozi se dodaju kroz dokumentaciju radnog naloga."
                            else -> block.typeLabel
                        }
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                )
            }
            if (block.helpText.isNotBlank()) {
                Text(
                    block.helpText,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.54f),
                    maxLines = 4,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (block.options.isNotEmpty() && editableField == null) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    block.options.take(6).forEach { option ->
                        AssistChip(
                            onClick = {},
                            label = {
                                Text(
                                    option.label.ifBlank { option.value },
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            },
                        )
                    }
                    if (block.options.size > 6) {
                        AssistChip(onClick = {}, label = { Text("+${block.options.size - 6}") })
                    }
                }
            }
        }
    }
}

@Composable
private fun TemplateBlockRow(
    template: WorkOrderDocumentationTemplate,
    block: WorkOrderDocumentationTemplateBlock,
    editableField: WorkOrderDocumentationField?,
    value: String,
    enabled: Boolean,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    var expanded by remember(template.id, block.id, block.key, block.tokenKey) { mutableStateOf(false) }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)) {
                Icon(
                    templateBlockIcon(block.type),
                    contentDescription = null,
                    modifier = Modifier
                        .size(34.dp)
                        .padding(8.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            if (block.required) "${block.label} *" else block.label,
                            fontWeight = FontWeight.Black,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            block.typeLabel,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                        )
                    }
                }
                if (block.summary.isNotBlank() && !expanded) {
                    Text(
                        block.summary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (expanded) {
                    if (editableField != null) {
                        TemplateFieldInput(
                            field = editableField,
                            value = value,
                            enabled = enabled,
                            onChange = { onChange(editableField, it) },
                        )
                    } else {
                        Text(
                            block.summary.ifBlank {
                                when (block.type.lowercase(Locale.getDefault())) {
                                    "measurement_table" -> "Excel tablica se uređuje u bloku Excel / mjerenja."
                                    "equipment_list" -> "Oprema se bira u bloku Mjerna i ispitna oprema."
                                    "legal_list" -> "Propisi i pravilnici se biraju u bloku Pravilnici i propisi."
                                    "qualified_inspectors", "inspector_signature", "authorization_holder_signature", "digital_signature" ->
                                        "Osobe i potpis se popunjavaju u bloku Osobe i potpis."
                                    "sketch_upload", "image_upload" -> "Prilozi se dodaju kroz dokumentaciju radnog naloga."
                                    else -> block.typeLabel
                                }
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                        )
                    }
                }
                if (block.helpText.isNotBlank() && expanded) {
                    Text(
                        block.helpText,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.54f),
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (block.options.isNotEmpty() && expanded && editableField == null) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        block.options.take(5).forEach { option ->
                            AssistChip(
                                onClick = {},
                                label = {
                                    Text(
                                        option.label.ifBlank { option.value },
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                },
                            )
                        }
                        if (block.options.size > 5) {
                            AssistChip(onClick = {}, label = { Text("+${block.options.size - 5}") })
                        }
                    }
                }
            }
        }
    }
}

private fun findTemplateFieldForBlock(
    template: WorkOrderDocumentationTemplate,
    block: WorkOrderDocumentationTemplateBlock,
): WorkOrderDocumentationField? {
    if (!block.editable) return null
    val blockKeys = listOf(block.id, block.key, block.tokenKey, block.label)
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .map { it.lowercase(Locale.getDefault()) }
        .toSet()
    return template.fields.firstOrNull { field ->
        listOf(field.id, field.key, field.tokenKey, field.label)
            .map { it.trim().lowercase(Locale.getDefault()) }
            .any { it.isNotBlank() && blockKeys.contains(it) }
    }
}

private fun templateBlockIcon(type: String): ImageVector =
    when (type.lowercase(Locale.getDefault())) {
        "measurement_table" -> Icons.Rounded.Description
        "equipment_list" -> Icons.Rounded.Work
        "legal_list" -> Icons.Rounded.Lock
        "qualified_inspectors", "inspector_signature", "authorization_holder_signature", "digital_signature" -> Icons.Rounded.Fingerprint
        "sketch_upload" -> Icons.Rounded.PictureAsPdf
        "image_upload" -> Icons.Rounded.Image
        "system_description" -> Icons.Rounded.InsertDriveFile
        else -> Icons.Rounded.Description
    }

@Composable
private fun TemplateFieldGroup(
    template: WorkOrderDocumentationTemplate,
    values: Map<String, String>,
    enabled: Boolean,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(template.title, fontWeight = FontWeight.Black)
                val subtitle = listOf(template.serviceName, template.documentType)
                    .filter { it.isNotBlank() }
                    .distinct()
                    .joinToString(" - ")
                if (subtitle.isNotBlank()) {
                    Text(
                        subtitle,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    )
                }
            }
            template.fields.forEach { field ->
                TemplateFieldInput(
                    field = field,
                    value = values[templateFieldStateKey(template, field)].orEmpty(),
                    enabled = enabled,
                    onChange = { onChange(field, it) },
                )
            }
        }
    }
}

@Composable
private fun TemplateFieldInput(
    field: WorkOrderDocumentationField,
    value: String,
    enabled: Boolean,
    onChange: (String) -> Unit,
) {
    val label = if (field.required) "${field.label} *" else field.label
    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        when (field.type.lowercase(Locale.getDefault())) {
            "dropdown" -> WorkOrderSelectField(
                label = label,
                value = value,
                valueLabel = field.options.firstOrNull { it.value == value }?.label ?: value.ifBlank { "Odaberi" },
                options = listOf("" to "Nije odabrano") + field.options.map { it.value to it.label },
                enabled = enabled,
                onSelect = onChange,
            )
            "checkbox", "toggle" -> {
                val checked = value.equals("true", ignoreCase = true) || value == "1" || value.equals("da", ignoreCase = true)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .clickable(enabled = enabled) { onChange((!checked).toString()) }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Checkbox(
                        checked = checked,
                        onCheckedChange = { onChange(it.toString()) },
                        enabled = enabled,
                    )
                    Column {
                        Text(label, fontWeight = FontWeight.SemiBold)
                        Text(
                            if (checked) "Da" else "Ne",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                        )
                    }
                }
            }
            "longtext" -> OutlinedTextField(
                value = value,
                onValueChange = onChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(label) },
                minLines = 3,
                maxLines = 7,
                enabled = enabled,
                shape = RoundedCornerShape(16.dp),
            )
            "number" -> OutlinedTextField(
                value = value,
                onValueChange = onChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(label) },
                singleLine = true,
                enabled = enabled,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = RoundedCornerShape(16.dp),
            )
            "date" -> WorkOrderDatePickerField(label, value, onChange, enabled)
            else -> WorkOrderTextField(label, value, onChange, enabled)
        }
        if (field.helpText.isNotBlank()) {
            Text(
                field.helpText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
            )
        }
    }
}

@Composable
private fun WizardSection(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
    ) {
        Column(
            modifier = Modifier.padding(13.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                Text(title, fontWeight = FontWeight.Black)
            }
            content()
        }
    }
}

@Composable
private fun NumberTextField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    enabled: Boolean,
) {
    OutlinedTextField(
        value = value,
        onValueChange = { input -> onChange(input.filter { it.isDigit() }.take(3)) },
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        singleLine = true,
        enabled = enabled,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        shape = RoundedCornerShape(16.dp),
    )
}

@Composable
private fun SignatureModeChip(
    value: String,
    label: String,
    selectedValue: String,
    enabled: Boolean,
    onSelect: (String) -> Unit,
) {
    FilterChip(
        selected = selectedValue == value,
        onClick = { onSelect(value) },
        enabled = enabled,
        label = { Text(label) },
    )
}

@Composable
private fun WorkOrderDocumentCategoryDialog(
    selection: PendingDocumentSelection,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (WorkOrderDocumentCategory) -> Unit,
) {
    var selectedCategory by remember(selection) { mutableStateOf(selection.mode.defaultCategory) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Vrsta dokumentacije", fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "${selection.uris.size} ${if (selection.uris.size == 1) "datoteka" else "datoteka"} za RN ${selection.workOrder.displayNumber}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                )
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(330.dp)
                        .verticalScroll(rememberScrollState()),
                ) {
                    WorkOrderDocumentCategory.entries.forEach { category ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .clickable(enabled = !isLoading) { selectedCategory = category }
                                .padding(vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RadioButton(
                                selected = selectedCategory == category,
                                onClick = { selectedCategory = category },
                                enabled = !isLoading,
                            )
                            Text(category.label, fontWeight = if (selectedCategory == category) FontWeight.Black else FontWeight.SemiBold)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(selectedCategory) },
                enabled = !isLoading,
                shape = RoundedCornerShape(14.dp),
            ) {
                Text("Spremi")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Odustani")
            }
        },
    )
}

@Composable
private fun DetailSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            content()
        }
    }
}

@Composable
private fun DetailRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier
                    .size(36.dp)
                    .padding(9.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f))
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun WorkOrderStatusMenu(
    currentStatus: String,
    statusOptions: List<String>,
    enabled: Boolean,
    onStatusSelected: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(
            onClick = { expanded = true },
            enabled = enabled,
            shape = RoundedCornerShape(14.dp),
        ) {
            Icon(Icons.Rounded.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Status")
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            statusOptions.ifEmpty { workOrderStatusOptions }.forEach { status ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = status,
                            fontWeight = if (status == currentStatus) FontWeight.Bold else FontWeight.Normal,
                        )
                    },
                    enabled = enabled && status != currentStatus,
                    onClick = {
                        expanded = false
                        onStatusSelected(status)
                    },
                )
            }
        }
    }
}

@Composable
private fun StatusChip(workOrder: WorkOrder) {
    val color = when {
        workOrder.isOverdue -> Color(0xFFDC2626)
        workOrder.isClosed -> Color(0xFF059669)
        else -> Color(0xFF2563EB)
    }
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = color.copy(alpha = 0.12f),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = if (workOrder.isClosed) Icons.Rounded.CheckCircle else Icons.Rounded.ErrorOutline,
                contentDescription = null,
                modifier = Modifier.size(15.dp),
                tint = color,
            )
            Spacer(Modifier.width(5.dp))
            Text(workOrder.status, color = color, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun InfoPill(icon: ImageVector, text: String) {
    Surface(shape = RoundedCornerShape(999.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(15.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(5.dp))
            Text(text, style = MaterialTheme.typography.labelMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

private fun workOrderDocumentIcon(document: WorkOrderDocument): ImageVector = when {
    document.isPdf -> Icons.Rounded.PictureAsPdf
    document.isImage -> Icons.Rounded.Image
    document.fileName.endsWith(".doc", ignoreCase = true) || document.fileName.endsWith(".docx", ignoreCase = true) -> Icons.Rounded.Description
    else -> Icons.Rounded.InsertDriveFile
}

private fun workOrderDocumentAccent(document: WorkOrderDocument): Color = when {
    document.isPdf -> Color(0xFFDC2626)
    document.isImage -> Color(0xFF0F766E)
    document.documentCategory.equals(WorkOrderDocumentCategory.SingleLineDiagram.value, ignoreCase = true) -> Color(0xFF7C3AED)
    document.documentCategory.equals(WorkOrderDocumentCategory.Project.value, ignoreCase = true) -> Color(0xFF2563EB)
    else -> Color(0xFF475569)
}

private fun formatFileSizeLabel(bytes: Long): String {
    if (bytes <= 0L) return ""
    val megabytes = bytes.toDouble() / (1024.0 * 1024.0)
    if (megabytes >= 1.0) {
        return String.format(Locale.US, if (megabytes >= 10.0) "%.0f MB" else "%.1f MB", megabytes)
    }
    val kilobytes = (bytes + 1023L) / 1024L
    return "$kilobytes KB"
}

@Composable
private fun MessageCard(text: String, isError: Boolean) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = if (isError) Color(0xFFFEE2E2) else Color(0xFFD1FAE5),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(12.dp),
            color = if (isError) Color(0xFF991B1B) else Color(0xFF065F46),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun EmptyWorkOrders() {
    Card(shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(Icons.Rounded.Work, contentDescription = null, modifier = Modifier.size(38.dp), tint = MaterialTheme.colorScheme.primary)
            Text("Nema radnih naloga za ovaj filter", fontWeight = FontWeight.Bold)
            Text(
                "Promijeni filter ili osvježi podatke.",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
            )
        }
    }
}

@Composable
private fun BrandMark() {
    Surface(
        modifier = Modifier.size(62.dp),
        shape = RoundedCornerShape(20.dp),
        color = Color.White.copy(alpha = 0.14f),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text("SN", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        }
    }
}

private fun formatDateLabel(value: String): String {
    val date = parseDateOrNull(value) ?: return ""
    return date.format(DateTimeFormatter.ofPattern("dd.MM.yyyy."))
}

private suspend fun buildWorkOrderDocumentUploadFiles(
    context: Context,
    workOrder: WorkOrder,
    uris: List<Uri>,
    category: WorkOrderDocumentCategory,
    mode: WorkOrderDocumentInputMode,
): List<WorkOrderUploadFile> = withContext(Dispatchers.IO) {
    uris.mapIndexed { index, uri ->
        val bytes = readUriBytes(context, uri)
        if (bytes.size.toLong() > WORK_ORDER_DOCUMENT_MAX_SIZE_BYTES) {
            error("Datoteka ${resolveUriDisplayName(context, uri, index, mode)} mora biti manja od 12 MB.")
        }
        val mimeType = when (mode) {
            WorkOrderDocumentInputMode.Scan -> "application/pdf"
            else -> resolveUriMimeType(context, uri, "")
        }.ifBlank { "application/octet-stream" }
        val fileName = when (mode) {
            WorkOrderDocumentInputMode.Scan -> buildWorkOrderDocumentFileName(workOrder, category, "pdf")
            else -> resolveUriDisplayName(context, uri, index, mode).withFallbackExtension(mimeType)
        }
        WorkOrderUploadFile(
            fileName = fileName,
            fileType = mimeType,
            fileSize = bytes.size.toLong(),
            documentCategory = category.value,
            description = buildWorkOrderDocumentDescription(mode),
            bytes = bytes,
        )
    }
}

private fun readUriBytes(context: Context, uri: Uri): ByteArray =
    context.contentResolver.openInputStream(uri)?.use { input -> input.readBytes() }
        ?: error("Ne mogu učitati odabrani dokument.")

private fun resolveUriDisplayName(
    context: Context,
    uri: Uri,
    index: Int,
    mode: WorkOrderDocumentInputMode,
): String {
    val resolver = context.contentResolver
    val queried = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (cursor.moveToFirst() && nameIndex >= 0) cursor.getString(nameIndex) else ""
    }.orEmpty().trim()
    if (queried.isNotBlank()) return queried

    val fallback = when (mode) {
        WorkOrderDocumentInputMode.Photos -> "fotografija-${index + 1}.jpg"
        WorkOrderDocumentInputMode.Pdf -> "dokument-${index + 1}.pdf"
        WorkOrderDocumentInputMode.Scan -> "sken-${index + 1}.pdf"
        WorkOrderDocumentInputMode.File -> "dokument-${index + 1}"
    }
    return fallback
}

private fun resolveUriMimeType(context: Context, uri: Uri, fallbackName: String): String {
    val resolverType = context.contentResolver.getType(uri).orEmpty().trim()
    if (resolverType.isNotBlank()) return resolverType

    val extension = fallbackName.substringAfterLast('.', "")
        .ifBlank { uri.toString().substringAfterLast('.', "") }
        .lowercase()
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension).orEmpty()
}

private fun String.withFallbackExtension(mimeType: String): String {
    if (contains(".") || mimeType.isBlank()) return this
    val extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType).orEmpty()
    return if (extension.isBlank()) this else "$this.$extension"
}

private fun buildWorkOrderDocumentFileName(
    workOrder: WorkOrder,
    category: WorkOrderDocumentCategory,
    extension: String,
): String {
    val number = workOrder.displayNumber
        .replace(Regex("[^A-Za-z0-9_-]+"), "-")
        .trim('-')
        .ifBlank { "RN" }
    val categorySlug = category.value
        .lowercase()
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')
        .ifBlank { "dokument" }
    val stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
    return "$categorySlug-$number-$stamp.$extension"
}

private fun buildWorkOrderDocumentDescription(mode: WorkOrderDocumentInputMode): String = when (mode) {
    WorkOrderDocumentInputMode.Scan -> "Skenirani dokument iz SafeNexus Android aplikacije."
    WorkOrderDocumentInputMode.Photos -> "Fotografija dodana iz SafeNexus Android aplikacije."
    WorkOrderDocumentInputMode.Pdf -> "PDF dokument dodan iz SafeNexus Android aplikacije."
    WorkOrderDocumentInputMode.File -> "Datoteka dodana iz SafeNexus Android aplikacije."
}

private fun cacheDownloadedDocument(context: Context, document: DownloadedDocument): Uri {
    val directory = File(context.cacheDir, "work-order-documents").apply { mkdirs() }
    val safeName = document.fileName
        .replace(Regex("""[\\/:*?"<>|]+"""), "-")
        .trim()
        .ifBlank { "dokument" }
    val file = File(directory, safeName)
    file.writeBytes(document.bytes)
    return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
}

private fun saveDownloadedDocument(context: Context, document: DownloadedDocument): Uri {
    val safeName = document.fileName
        .replace(Regex("""[\\/:*?"<>|]+"""), "-")
        .trim()
        .ifBlank { "dokument" }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, safeName)
            put(MediaStore.Downloads.MIME_TYPE, document.fileType.ifBlank { "application/octet-stream" })
            put(MediaStore.Downloads.RELATIVE_PATH, "${Environment.DIRECTORY_DOWNLOADS}/SafeNexus")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: error("Ne mogu otvoriti Android Downloads mapu.")
        resolver.openOutputStream(uri)?.use { output -> output.write(document.bytes) }
            ?: error("Ne mogu zapisati dokument.")
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        return uri
    }

    return cacheDownloadedDocument(context, document)
}

private fun openCachedDocument(context: Context, uri: Uri, mimeType: String): Boolean {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, mimeType.ifBlank { "application/octet-stream" })
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return try {
        context.startActivity(Intent.createChooser(intent, "Otvori dokument").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
    } catch (_: ActivityNotFoundException) {
        false
    }
}
