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
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.material.icons.rounded.EventNote
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
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.text.style.TextAlign
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
import com.safenexus.app.data.FieldInquiryDraft
import com.safenexus.app.data.MobileRecord
import com.safenexus.app.data.SafeNexusApi
import com.safenexus.app.data.SafeNexusAuthStore
import com.safenexus.app.data.SafeNexusUser
import com.safenexus.app.data.WorkOrder
import com.safenexus.app.data.WorkOrderCompanyOption
import com.safenexus.app.data.WorkOrderCreateDraft
import com.safenexus.app.data.WorkOrderDocumentationContext
import com.safenexus.app.data.WorkOrderDocumentationAdditionalRecord
import com.safenexus.app.data.WorkOrderDocumentationAiFile
import com.safenexus.app.data.WorkOrderDocumentationAiField
import com.safenexus.app.data.WorkOrderDocumentationAiMeasurementColumn
import com.safenexus.app.data.WorkOrderDocumentationAiMeasurementSuggestion
import com.safenexus.app.data.WorkOrderDocumentationAiResult
import com.safenexus.app.data.WorkOrderDocumentationDefaults
import com.safenexus.app.data.WorkOrderDocumentationDraft
import com.safenexus.app.data.WorkOrderDocumentationField
import com.safenexus.app.data.WorkOrderDocumentationOption
import com.safenexus.app.data.WorkOrderDocumentationSignatureAreaOptions
import com.safenexus.app.data.WorkOrderDocumentationTemplate
import com.safenexus.app.data.WorkOrderDocumentationTemplateBlock
import com.safenexus.app.data.WorkOrderDocument
import com.safenexus.app.data.WorkOrderLocationCreateDraft
import com.safenexus.app.data.WorkOrderLocationObjectOption
import com.safenexus.app.data.WorkOrderLocationOption
import com.safenexus.app.data.WorkOrderMeasurementColumn
import com.safenexus.app.data.WorkOrderMeasurementMerge
import com.safenexus.app.data.WorkOrderMeasurementRow
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
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Base64
import java.util.Locale

enum class WorkOrderFilter(val label: String) {
    All("SVE"),
    Mine("MOJI RN"),
    Open("OTVORENI"),
    Done("GOTOV"),
    Verified("OVJEREN"),
    Invoiced("FAKTURIRAN"),
    Cancelled("STORNO"),
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
    More("Evidencije"),
}

private enum class MoreSectionFocus(val title: String) {
    Overview("Evidencije"),
    Todo("ToDo"),
    FieldInquiries("Plan terena"),
    Offers("Ponude"),
    Companies("Tvrtke"),
    Locations("Lokacije"),
    Periodics("Periodika"),
    Documents("Dokumenti"),
    Services("Service liste"),
    People("People"),
    MeasurementEquipment("Mjerna oprema"),
    Foundation("Pravilnici"),
    Training("Osposobljavanja"),
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
    val moreFocus: MoreSectionFocus? = null,
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
private const val WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILE_BYTES = 8L * 1024L * 1024L
private const val WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILES = 5

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

private val workOrderDocumentationAiMimeTypes = arrayOf(
    "application/pdf",
    "image/*",
    "text/*",
    "application/json",
    "application/xml",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

private val fieldInquiryStatusOptions = listOf(
    "inquiry" to "Upit",
    "tentative" to "Tentativno",
    "confirmed" to "Potvrđeno",
    "rejected" to "Odbijeno",
    "converted" to "Pretvoreno u RN",
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
    val documentationContextObjectId: String = "",
    val documentationContext: WorkOrderDocumentationContext = WorkOrderDocumentationContext(),
    val documentationContextLoading: Boolean = false,
    val isznrMeasurementEquipmentRecords: List<MobileRecord> = emptyList(),
    val isznrMeasurementEquipmentLoading: Boolean = false,
    val isznrMeasurementEquipmentLoaded: Boolean = false,
    val isznrMeasurementEquipmentError: String = "",
    val isznrPeopleRecords: List<MobileRecord> = emptyList(),
    val isznrPeopleLoading: Boolean = false,
    val isznrPeopleLoaded: Boolean = false,
    val isznrPeopleError: String = "",
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

    fun loadIsznrMeasurementEquipment(force: Boolean = false) {
        if (state.isznrMeasurementEquipmentLoading) return
        if (!force && state.isznrMeasurementEquipmentLoaded) return
        state = state.copy(isznrMeasurementEquipmentLoading = true, isznrMeasurementEquipmentError = "")
        viewModelScope.launch {
            api.listIsznrMeasurementEquipment()
                .onSuccess { records ->
                    state = state.copy(
                        isznrMeasurementEquipmentRecords = records,
                        isznrMeasurementEquipmentLoading = false,
                        isznrMeasurementEquipmentLoaded = true,
                        isznrMeasurementEquipmentError = "",
                    )
                }
                .onFailure { error ->
                    state = state.copy(
                        isznrMeasurementEquipmentLoading = false,
                        isznrMeasurementEquipmentLoaded = true,
                        isznrMeasurementEquipmentError = error.message ?: "Ne mogu dohvatiti IS ZNR mjernu opremu.",
                    )
                }
        }
    }

    fun loadIsznrPeople(force: Boolean = false) {
        if (state.isznrPeopleLoading) return
        if (!force && state.isznrPeopleLoaded) return
        state = state.copy(isznrPeopleLoading = true, isznrPeopleError = "")
        viewModelScope.launch {
            api.listIsznrPeople()
                .onSuccess { records ->
                    state = state.copy(
                        isznrPeopleRecords = records,
                        isznrPeopleLoading = false,
                        isznrPeopleLoaded = true,
                        isznrPeopleError = "",
                    )
                }
                .onFailure { error ->
                    state = state.copy(
                        isznrPeopleLoading = false,
                        isznrPeopleLoaded = true,
                        isznrPeopleError = error.message ?: "Ne mogu dohvatiti IS ZNR evidenciju zaposlenih.",
                    )
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
        if (draft.locationId.isBlank()) {
            state = state.copy(error = "Odaberi ili dodaj lokaciju.")
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

    fun createWorkOrderLocation(
        draft: WorkOrderLocationCreateDraft,
        onCreated: (WorkOrderLocationOption) -> Unit,
    ) {
        if (draft.companyId.isBlank()) {
            state = state.copy(error = "Odaberi naručitelja prije dodavanja lokacije.")
            return
        }
        if (draft.name.trim().isBlank()) {
            state = state.copy(error = "Upiši naziv lokacije.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.createWorkOrderLocation(draft)
                .onSuccess { createdLocation ->
                    val nextLocations = (
                        state.data.workOrderLocations.filter { it.id != createdLocation.id } + createdLocation
                    ).sortedWith(
                        compareBy<WorkOrderLocationOption> { it.name.lowercase(Locale.getDefault()) }
                            .thenBy { it.region.lowercase(Locale.getDefault()) },
                    )
                    state = state.copy(
                        data = state.data.copy(workOrderLocations = nextLocations),
                        isLoading = false,
                        notice = "Lokacija je dodana i odabrana.",
                    )
                    onCreated(createdLocation)
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu dodati lokaciju.",
                    )
                }
        }
    }

    fun saveFieldInquiry(draft: FieldInquiryDraft) {
        if (draft.title.trim().isBlank()) {
            state = state.copy(error = "Upiši naziv ili kratki opis upita.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            val result = if (draft.id.isBlank()) {
                api.createFieldInquiry(draft)
            } else {
                api.updateFieldInquiry(draft)
            }
            result
                .onSuccess {
                    state = state.copy(
                        isLoading = false,
                        section = AppSection.More,
                        notice = if (draft.id.isBlank()) "Terenski upit je dodan." else "Terenski upit je spremljen.",
                    )
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu spremiti terenski upit.",
                    )
                }
        }
    }

    fun convertFieldInquiryToWorkOrder(inquiry: MobileRecord) {
        val inquiryId = inquiry.id.removePrefix("field-inquiry:").ifBlank { inquiry.relatedId }
        if (inquiryId.isBlank()) {
            state = state.copy(error = "Ne mogu pronaći ID upita.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.convertFieldInquiryToWorkOrder(inquiryId)
                .onSuccess {
                    state = state.copy(
                        isLoading = false,
                        section = AppSection.WorkOrders,
                        notice = "Iz upita je otvoren radni nalog.",
                    )
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu napraviti RN iz upita.",
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

    private fun markWorkOrderVerifiedAfterApproval(workOrder: WorkOrder, notice: String) {
        val verifiedStatus = "Ovjeren RN"
        if (workOrder.id.isBlank() || workOrder.hasRnStatus(verifiedStatus)) return

        val mutationVersion = beginWorkOrderMutation(workOrder.id)
        val previousWorkOrder = state.workOrders.firstOrNull { it.id == workOrder.id } ?: workOrder
        replaceWorkOrderInState(previousWorkOrder.copy(status = verifiedStatus), notice)
        viewModelScope.launch {
            api.updateWorkOrderStatus(workOrder.id, verifiedStatus)
                .onSuccess { updatedWorkOrder ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(updatedWorkOrder, notice)
                    }
                }
                .onFailure { error ->
                    if (isCurrentWorkOrderMutation(workOrder.id, mutationVersion)) {
                        replaceWorkOrderInState(previousWorkOrder)
                        state = state.copy(
                            notice = notice,
                            error = error.message ?: "Dokument je spremljen, ali status RN-a nije prebačen u Ovjeren RN.",
                        )
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
        val contextObjectId = objectId.trim()
        if (workOrderId.isBlank()) {
            state = state.copy(error = "RN nema ispravan ID za izradu dokumentacije.")
            return
        }

        state = state.copy(
            documentationContextWorkOrderId = workOrderId,
            documentationContextObjectId = contextObjectId,
            documentationContext = WorkOrderDocumentationContext(workOrderId = workOrderId, workOrderNumber = workOrder.displayNumber),
            documentationContextLoading = true,
            error = "",
            notice = "",
        )
        viewModelScope.launch {
            api.workOrderDocumentationContext(workOrderId, contextObjectId)
                .onSuccess { context ->
                    if (
                        state.documentationContextWorkOrderId == workOrderId &&
                        state.documentationContextObjectId == contextObjectId
                    ) {
                        state = state.copy(
                            documentationContext = context,
                            documentationContextLoading = false,
                            error = "",
                        )
                    }
                }
                .onFailure { error ->
                    if (
                        state.documentationContextWorkOrderId == workOrderId &&
                        state.documentationContextObjectId == contextObjectId
                    ) {
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

    fun recordVehicleUsage(
        vehicle: MobileRecord,
        mode: String,
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
    ) {
        if (vehicle.id.isBlank()) {
            state = state.copy(error = "Vozilo nema ispravan ID.")
            return
        }
        if (odometerKm.isBlank()) {
            state = state.copy(error = "Upiši kilometražu vozila.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.recordVehicleUsage(
                vehicleId = vehicle.id,
                mode = mode,
                odometerKm = odometerKm,
                destination = destination,
                reservationId = reservationId,
                linkedWorkOrderId = linkedWorkOrderId,
                linkedWorkOrderNumber = linkedWorkOrderNumber,
                performedBy = performedBy,
                vehicleCondition = vehicleCondition,
                vehicleClean = vehicleClean,
                documentsPresent = documentsPresent,
                fuelOk = fuelOk,
                damageNoted = damageNoted,
                note = note,
            )
                .onSuccess {
                    state = state.copy(
                        isLoading = false,
                        selectedRecord = null,
                        notice = if (mode == "return") "Povrat vozila je evidentiran." else "Preuzimanje vozila je evidentirano.",
                    )
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu evidentirati korištenje vozila.",
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

    fun prepareWorkOrderDocumentationAi(
        workOrder: WorkOrder,
        template: WorkOrderDocumentationTemplate,
        files: List<WorkOrderDocumentationAiFile>,
        modelTier: String,
        onSuccess: (WorkOrderDocumentationAiResult) -> Unit,
        onFailure: (String) -> Unit,
    ) {
        if (workOrder.id.isBlank()) {
            onFailure("RN nema ispravan ID za NexAI pripremu.")
            return
        }
        if (template.id.isBlank()) {
            onFailure("Template nema ispravan ID za NexAI pripremu.")
            return
        }
        if (files.isEmpty()) {
            onFailure("Dodaj PDF, sliku ili tekst za NexAI.")
            return
        }
        viewModelScope.launch {
            api.prepareWorkOrderDocumentationAi(
                workOrderId = workOrder.id,
                workOrderNumber = workOrder.displayNumber,
                template = template,
                files = files,
                modelTier = modelTier,
            )
                .onSuccess(onSuccess)
                .onFailure { error ->
                    val message = error.message ?: "NexAI trenutno nije dostupan."
                    state = state.copy(error = message, notice = "")
                    onFailure(message)
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
                    val successNotice = if (category == WorkOrderDocumentCategory.VerifiedWorkOrder) {
                        "Dokumentacija je spremljena i RN je prebačen u Ovjeren RN."
                    } else {
                        "Dokumentacija je spremljena."
                    }
                    state = state.copy(
                        isLoading = false,
                        notice = successNotice,
                    )
                    loadWorkOrderDocuments(workOrder.id)
                    if (category == WorkOrderDocumentCategory.VerifiedWorkOrder) {
                        markWorkOrderVerifiedAfterApproval(workOrder, successNotice)
                    }
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

    fun downloadPeopleTrainingDocument(context: Context, record: MobileRecord, document: MobileTrainingDocument) {
        if (record.id.isBlank() || document.id.isBlank()) {
            state = state.copy(error = "Dokument osposobljavanja nije moguće preuzeti.")
            return
        }

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.downloadPeopleTrainingDocument(
                recordId = record.id,
                documentId = document.id,
                fallbackFileName = document.fileName,
                fallbackFileType = document.fileType,
            )
                .onSuccess { downloaded ->
                    runCatching { saveDownloadedDocument(context, downloaded) }
                        .onSuccess { uri ->
                            val opened = openCachedDocument(context, uri, downloaded.fileType)
                            state = state.copy(
                                isLoading = false,
                                notice = if (opened) {
                                    "Dokument osposobljavanja je spremljen u Preuzimanja / SafeNexus i otvoren."
                                } else {
                                    "Dokument osposobljavanja je spremljen u Preuzimanja / SafeNexus."
                                },
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje ove vrste dokumenta.",
                            )
                        }
                        .onFailure { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti dokument osposobljavanja.",
                            )
                        }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu preuzeti dokument osposobljavanja.",
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

    fun downloadVehicleEvidencePdf(context: Context, vehicle: MobileRecord) {
        if (vehicle.id.isBlank()) {
            state = state.copy(error = "Vozilo nema ispravan ID za PDF evidenciju.")
            return
        }

        val slug = listOf(vehicle.title, vehicle.subtitle)
            .joinToString("-")
            .replace(Regex("[^A-Za-z0-9_-]+"), "-")
            .trim('-')
            .ifBlank { "vozilo" }
        val fallbackFileName = "evidencija-vozila-$slug.pdf"
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.downloadVehicleEvidencePdf(vehicle.id, fallbackFileName)
                .onSuccess { downloaded ->
                    runCatching { saveDownloadedDocument(context, downloaded) }
                        .onSuccess { uri ->
                            val opened = openCachedDocument(context, uri, downloaded.fileType)
                            state = state.copy(
                                isLoading = false,
                                notice = if (opened) {
                                    "PDF evidencija vozila je spremljena u Preuzimanja / SafeNexus i otvorena."
                                } else {
                                    "PDF evidencija vozila je spremljena u Preuzimanja / SafeNexus."
                                },
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje PDF-a.",
                            )
                        }
                        .onFailure { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti PDF evidenciju vozila.",
                            )
                        }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu preuzeti PDF evidenciju vozila.",
                    )
                }
        }
    }

    fun downloadOfferPdf(context: Context, offer: MobileRecord) {
        if (offer.id.isBlank()) {
            state = state.copy(error = "Ponuda nema ispravan ID za PDF.")
            return
        }

        val number = offer.meta["offerNumber"].orEmpty().ifBlank { offer.title }
        val slug = number
            .replace(Regex("[^A-Za-z0-9_-]+"), "-")
            .trim('-')
            .ifBlank { "ponuda" }
        val fallbackFileName = "$slug.pdf"
        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.downloadOfferPdf(offer.id, fallbackFileName)
                .onSuccess { downloaded ->
                    runCatching { saveDownloadedDocument(context, downloaded) }
                        .onSuccess { uri ->
                            val opened = openCachedDocument(context, uri, downloaded.fileType)
                            state = state.copy(
                                isLoading = false,
                                notice = if (opened) {
                                    "PDF ponude je spremljen u Preuzimanja / SafeNexus i otvoren."
                                } else {
                                    "PDF ponude je spremljen u Preuzimanja / SafeNexus."
                                },
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje PDF-a.",
                            )
                        }
                        .onFailure { error ->
                            state = state.copy(
                                isLoading = false,
                                error = error.message ?: "Ne mogu spremiti PDF ponude.",
                            )
                        }
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu preuzeti PDF ponude.",
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
                            val successNotice = "Potpisani RN je spremljen, dodan u dokumentaciju i status je Ovjeren RN."
                            state = state.copy(
                                isLoading = false,
                                notice = successNotice,
                                error = if (opened) "" else "Na uređaju nema aplikacije za otvaranje PDF-a.",
                            )
                            loadWorkOrderDocuments(workOrder.id)
                            markWorkOrderVerifiedAfterApproval(workOrder, successNotice)
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
            record.kind in setOf("work_order", "todo_task") && (
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
                    onCreateLocation = viewModel::createWorkOrderLocation,
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
                        onSaveFieldInquiry = viewModel::saveFieldInquiry,
                        onConvertFieldInquiry = viewModel::convertFieldInquiryToWorkOrder,
                        onLoadIsznrMeasurementEquipment = viewModel::loadIsznrMeasurementEquipment,
                        onLoadIsznrPeople = viewModel::loadIsznrPeople,
                        onDownloadTrainingDocument = { record, document ->
                            viewModel.downloadPeopleTrainingDocument(context.applicationContext, record, document)
                        },
                    )
                } else {
                    MobileRecordDetailScreen(
                        record = selectedRecord,
                        users = state.data.workOrderUsers,
                        workOrders = state.data.workOrders,
                        currentUserLabel = state.user?.displayName.orEmpty(),
                        isLoading = state.isLoading,
                        onBack = { viewModel.selectRecord(null) },
                        onReserveVehicle = viewModel::createVehicleReservation,
                        onRecordVehicleUsage = viewModel::recordVehicleUsage,
                        onDownloadVehicleEvidencePdf = { vehicle -> viewModel.downloadVehicleEvidencePdf(context.applicationContext, vehicle) },
                        onDownloadOfferPdf = { offer -> viewModel.downloadOfferPdf(context.applicationContext, offer) },
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
            if (state.isLoading) {
                SafeNexusLoadingScreen(rememberedUser = state.rememberedUser)
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
            currentUser = state.user,
            services = state.data.workOrderServices,
            locationObjects = state.data.workOrderLocationObjects,
            selectedObjectId = documentationWizardObjectId,
            context = if (
                state.documentationContextWorkOrderId == workOrder.id &&
                state.documentationContextObjectId == documentationWizardObjectId
            ) {
                state.documentationContext
            } else {
                WorkOrderDocumentationContext(workOrderId = workOrder.id, workOrderNumber = workOrder.displayNumber)
            },
            contextLoading = state.documentationContextLoading &&
                state.documentationContextWorkOrderId == workOrder.id &&
                state.documentationContextObjectId == documentationWizardObjectId,
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
            onRunAi = { template, files, modelTier, onSuccess, onFailure ->
                viewModel.prepareWorkOrderDocumentationAi(
                    workOrder = workOrder,
                    template = template,
                    files = files,
                    modelTier = modelTier,
                    onSuccess = onSuccess,
                    onFailure = onFailure,
                )
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
private fun SafeNexusLoadingScreen(
    rememberedUser: SafeNexusUser?,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF071326), Color(0xFF123B7A), Color(0xFFF3F7FD)),
                    startY = 0f,
                    endY = 1450f,
                ),
            )
            .padding(WindowInsets.safeDrawing.asPaddingValues())
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(30.dp),
            color = Color.White.copy(alpha = 0.96f),
            shadowElevation = 18.dp,
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Surface(
                    modifier = Modifier.size(68.dp),
                    shape = RoundedCornerShape(22.dp),
                    color = Color(0xFFEAF2FF),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("SN", color = Color(0xFF1D4ED8), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                    }
                }
                Text(
                    "Učitavam SafeNexus",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color(0xFF0F172A),
                    fontWeight = FontWeight.Black,
                )
                Text(
                    rememberedUser?.displayName?.ifBlank { rememberedUser.email } ?: "Pripremam mobilni workspace",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = Color(0xFF2563EB), trackColor = Color(0xFFE2E8F0))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    LoadingChip("RN statusi")
                    LoadingChip("Dokumenti")
                    LoadingChip("Periodika")
                }
            }
        }
    }
}

@Composable
private fun LoadingChip(text: String) {
    Surface(shape = RoundedCornerShape(999.dp), color = Color(0xFFEFF6FF)) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            color = Color(0xFF1D4ED8),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
        )
    }
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
    onCreateLocation: (WorkOrderLocationCreateDraft, (WorkOrderLocationOption) -> Unit) -> Unit,
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
    var showNewLocationForm by remember { mutableStateOf(false) }
    var newLocationName by remember { mutableStateOf("") }
    var newLocationRegion by remember { mutableStateOf("") }
    var newLocationCoordinates by remember { mutableStateOf("") }
    var newLocationContactName by remember { mutableStateOf("") }
    var newLocationContactPhone by remember { mutableStateOf("") }
    var newLocationContactEmail by remember { mutableStateOf("") }
    var newLocationNote by remember { mutableStateOf("") }
    val company = data.workOrderCompanies.firstOrNull { it.id == companyId }
    val availableLocations = remember(companyId, data.workOrderLocations) {
        data.workOrderLocations.filter { location -> companyId.isBlank() || location.companyId == companyId }
    }
    val selectedLocation = availableLocations.firstOrNull { it.id == locationId }
    fun applyLocationSelection(location: WorkOrderLocationOption?) {
        locationId = location?.id.orEmpty()
        contactName = location?.contactName1.orEmpty()
        contactPhone = location?.contactPhone1.orEmpty()
        contactEmail = location?.contactEmail1.orEmpty()
    }
    fun clearNewLocationDraft() {
        newLocationName = ""
        newLocationRegion = ""
        newLocationCoordinates = ""
        newLocationContactName = ""
        newLocationContactPhone = ""
        newLocationContactEmail = ""
        newLocationNote = ""
    }

    LaunchedEffect(companyId, availableLocations) {
        if (companyId.isBlank()) return@LaunchedEffect
        if (locationId.isNotBlank() && availableLocations.none { it.id == locationId }) {
            applyLocationSelection(null)
        }
        if (locationId.isBlank() && availableLocations.size == 1) {
            applyLocationSelection(availableLocations.first())
        }
        if (availableLocations.isEmpty()) {
            showNewLocationForm = true
        }
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
                        WorkOrderSearchSelectField(
                            label = "Naručitelj",
                            value = companyId,
                            valueLabel = company?.name.orEmpty(),
                            options = data.workOrderCompanies.map { companyOption ->
                                WorkOrderPickerOption(
                                    value = companyOption.id,
                                    label = companyOption.name,
                                    meta = listOf(
                                        companyOption.headquarters.takeIf { it.isNotBlank() },
                                        companyOption.oib.takeIf { it.isNotBlank() }?.let { "OIB $it" },
                                    ).filterNotNull().joinToString(" · "),
                                    searchText = listOf(companyOption.name, companyOption.headquarters, companyOption.oib)
                                        .filter { it.isNotBlank() }
                                        .joinToString(" "),
                                )
                            },
                            enabled = !isLoading,
                            icon = Icons.Rounded.Business,
                            searchPlaceholder = "Traži tvrtku, sjedište ili OIB",
                            emptyText = "Nema tvrtki za taj pojam.",
                            onSelect = { next ->
                                val nextLocations = data.workOrderLocations.filter { location -> location.companyId == next }
                                companyId = next
                                clearNewLocationDraft()
                                showNewLocationForm = next.isNotBlank() && nextLocations.isEmpty()
                                applyLocationSelection(nextLocations.singleOrNull())
                            },
                        )
                        WorkOrderSearchSelectField(
                            label = "Lokacija",
                            value = locationId,
                            valueLabel = selectedLocation?.name.orEmpty(),
                            options = availableLocations.map { location ->
                                WorkOrderPickerOption(
                                    value = location.id,
                                    label = location.name,
                                    meta = listOf(location.region, location.coordinates).filter { it.isNotBlank() }.joinToString(" · "),
                                    searchText = listOf(
                                        location.name,
                                        location.region,
                                        location.coordinates,
                                        location.contactName1,
                                        location.contactPhone1,
                                        location.contactEmail1,
                                    ).filter { it.isNotBlank() }.joinToString(" "),
                                )
                            },
                            enabled = !isLoading && companyId.isNotBlank(),
                            icon = Icons.Rounded.LocationOn,
                            searchPlaceholder = "Traži lokaciju, regiju ili koordinate",
                            emptyText = if (companyId.isBlank()) "Prvo odaberi naručitelja." else "Nema lokacija za taj pojam.",
                            onSelect = { next ->
                                applyLocationSelection(availableLocations.firstOrNull { it.id == next })
                                showNewLocationForm = false
                            },
                        )
                        if (companyId.isNotBlank()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    if (availableLocations.size == 1 && locationId.isNotBlank()) {
                                        "Jedina lokacija je automatski odabrana."
                                    } else {
                                        "${availableLocations.size} lokacija za naručitelja"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                )
                                TextButton(
                                    onClick = { showNewLocationForm = !showNewLocationForm },
                                    enabled = !isLoading,
                                ) {
                                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(if (showNewLocationForm) "Sakrij" else "Nova lokacija")
                                }
                            }
                        }
                        AnimatedVisibility(companyId.isNotBlank() && (showNewLocationForm || availableLocations.isEmpty())) {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(20.dp),
                                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.78f),
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Rounded.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Spacer(Modifier.width(8.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text("Nova lokacija", fontWeight = FontWeight.Black)
                                            Text(
                                                "Spremi lokaciju i odmah je koristi za ovaj RN.",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                            )
                                        }
                                    }
                                    WorkOrderTextField("Naziv lokacije", newLocationName, { newLocationName = it }, enabled = !isLoading)
                                    WorkOrderSearchSelectField(
                                        label = "Regija",
                                        value = newLocationRegion,
                                        valueLabel = newLocationRegion,
                                        options = workOrderRegionOptions.map { region ->
                                            WorkOrderPickerOption(region, region)
                                        },
                                        enabled = !isLoading,
                                        icon = Icons.Rounded.Map,
                                        searchPlaceholder = "Traži regiju",
                                        emptyText = "Nema regije za taj pojam.",
                                        onSelect = { newLocationRegion = it },
                                    )
                                    WorkOrderTextField("Koordinate", newLocationCoordinates, { newLocationCoordinates = it }, enabled = !isLoading)
                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        OutlinedTextField(
                                            value = newLocationContactName,
                                            onValueChange = { newLocationContactName = it },
                                            modifier = Modifier.weight(1f),
                                            label = { Text("Kontakt") },
                                            singleLine = true,
                                            enabled = !isLoading,
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                        OutlinedTextField(
                                            value = newLocationContactPhone,
                                            onValueChange = { newLocationContactPhone = it },
                                            modifier = Modifier.weight(1f),
                                            label = { Text("Telefon") },
                                            singleLine = true,
                                            enabled = !isLoading,
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                    }
                                    WorkOrderTextField("Kontakt email", newLocationContactEmail, { newLocationContactEmail = it }, enabled = !isLoading)
                                    WorkOrderTextField("Napomena", newLocationNote, { newLocationNote = it }, enabled = !isLoading)
                                    Button(
                                        onClick = {
                                            onCreateLocation(
                                                WorkOrderLocationCreateDraft(
                                                    companyId = companyId,
                                                    name = newLocationName.trim(),
                                                    region = newLocationRegion.trim(),
                                                    coordinates = newLocationCoordinates.trim(),
                                                    contactName = newLocationContactName.trim(),
                                                    contactPhone = newLocationContactPhone.trim(),
                                                    contactEmail = newLocationContactEmail.trim(),
                                                    note = newLocationNote.trim(),
                                                ),
                                            ) { created ->
                                                companyId = created.companyId.ifBlank { companyId }
                                                applyLocationSelection(created)
                                                showNewLocationForm = false
                                                clearNewLocationDraft()
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        enabled = !isLoading && companyId.isNotBlank() && newLocationName.trim().isNotBlank(),
                                        shape = RoundedCornerShape(16.dp),
                                    ) {
                                        Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text("Spremi i odaberi lokaciju", fontWeight = FontWeight.Black)
                                    }
                                }
                            }
                        }
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
                            WorkOrderDatePickerField(
                                label = "Otvaranje",
                                value = openedDate,
                                onChange = { openedDate = it },
                                enabled = !isLoading,
                                modifier = Modifier.weight(1f),
                            )
                            WorkOrderDatePickerField(
                                label = "Rok",
                                value = dueDate,
                                onChange = { dueDate = it },
                                enabled = !isLoading,
                                modifier = Modifier.weight(1f),
                            )
                        }
                        WorkOrderDatePickerField(
                            label = "Izvršenje (plan terena)",
                            value = executionDate,
                            onChange = { executionDate = it },
                            enabled = !isLoading,
                            modifier = Modifier.fillMaxWidth(),
                        )
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
                    enabled = !isLoading && companyId.isNotBlank() && locationId.isNotBlank(),
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
        ?.atStartOfDay(ZoneOffset.UTC)
        ?.toInstant()
        ?.toEpochMilli()

private fun millisToIsoDate(value: Long?): String =
    value?.let {
        Instant.ofEpochMilli(it)
            .atZone(ZoneOffset.UTC)
            .toLocalDate()
            .toString()
    }.orEmpty()

private fun formatDatePickerLabel(value: String): String =
    parseDateOrNull(value)
        ?.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
        ?: value

private val reservationTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val reservationTimeOptions: List<Pair<String, String>> = (0 until 24)
    .flatMap { hour -> (0 until 60 step 15).map { minute -> "%02d:%02d".format(hour, minute) } }
    .map { value -> value to value }

private fun defaultReservationStartTime(): String {
    val now = LocalTime.now()
    val roundedTotalMinutes = ((now.hour * 60 + now.minute + 14) / 15) * 15
    val normalizedTotalMinutes = roundedTotalMinutes % (24 * 60)
    return LocalTime.of(normalizedTotalMinutes / 60, normalizedTotalMinutes % 60)
        .format(reservationTimeFormatter)
}

private fun parseReservationDateTime(date: String, time: String): LocalDateTime? =
    runCatching { LocalDateTime.parse("${date}T${time}:00") }.getOrNull()

private fun formatReservationDateTime(date: String, time: String): String =
    "${date}T${time}:00"

private fun addReservationMinutes(date: String, time: String, minutes: Long): Pair<String, String> {
    val start = parseReservationDateTime(date, time) ?: LocalDate.now().atTime(8, 0)
    val next = start.plusMinutes(minutes)
    return next.toLocalDate().toString() to next.toLocalTime().format(reservationTimeFormatter)
}

private fun isReservationRangeValid(startDate: String, startTime: String, endDate: String, endTime: String): Boolean {
    val start = parseReservationDateTime(startDate, startTime) ?: return false
    val end = parseReservationDateTime(endDate, endTime) ?: return false
    return end.isAfter(start)
}

@Composable
private fun WorkOrderDatePickerField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier,
) {
    var openPicker by remember { mutableStateOf(false) }
    OutlinedButton(
        onClick = { openPicker = true },
        modifier = modifier.fillMaxWidth(),
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
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
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

private data class WorkOrderPickerOption(
    val value: String,
    val label: String,
    val meta: String = "",
    val searchText: String = "",
)

private val workOrderRegionOptions = listOf(
    "Zagreb - Centar",
    "Zagreb - Zapad",
    "Zagreb - Istok",
    "Zagreb - Jug",
    "Istra - Sjever",
    "Istra - Jug",
    "Dalmacija - Sjever",
    "Dalmacija - Središnja",
    "Dalmacija - Jug",
    "Slavonija - Istok",
    "Slavonija - Zapad",
    "Sjeverozapadna Hrvatska",
    "Sjeveroistočna Hrvatska",
    "Središnja Hrvatska",
    "Riječko područje",
)

@Composable
private fun WorkOrderSearchSelectField(
    label: String,
    value: String,
    valueLabel: String,
    options: List<WorkOrderPickerOption>,
    enabled: Boolean,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Rounded.Search,
    searchPlaceholder: String = "Traži",
    emptyText: String = "Nema rezultata.",
) {
    var open by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    val filteredOptions = remember(options, query) {
        val normalizedQuery = query.normalizedPickerText()
        if (normalizedQuery.isBlank()) {
            options
        } else {
            options.filter { option -> option.matchesPickerQuery(normalizedQuery) }
        }
    }
    val visibleOptions = filteredOptions.take(120)

    OutlinedButton(
        onClick = {
            query = ""
            open = true
        },
        modifier = modifier.fillMaxWidth(),
        enabled = enabled && options.isNotEmpty(),
        shape = RoundedCornerShape(16.dp),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 13.dp),
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
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

    if (open) {
        AlertDialog(
            onDismissRequest = { open = false },
            title = { Text(label, fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text(searchPlaceholder) },
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        shape = RoundedCornerShape(16.dp),
                    )
                    if (visibleOptions.isEmpty()) {
                        Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 420.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            items(visibleOptions, key = { option -> option.value }) { option ->
                                val selected = option.value == value
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .clickable {
                                            onSelect(option.value)
                                            open = false
                                        },
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (selected) {
                                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.86f)
                                    } else {
                                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f)
                                    },
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Text(
                                                option.label.ifBlank { "Odaberi" },
                                                fontWeight = if (selected) FontWeight.Black else FontWeight.Bold,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                            )
                                            if (option.meta.isNotBlank()) {
                                                Text(
                                                    option.meta,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                            }
                                        }
                                        if (selected) {
                                            Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        }
                                    }
                                }
                            }
                            if (filteredOptions.size > visibleOptions.size) {
                                item {
                                    Text(
                                        "Prikazano ${visibleOptions.size} od ${filteredOptions.size}; suzi pretragu za ostatak.",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { open = false }) {
                    Text("Zatvori")
                }
            },
        )
    }
}

private fun WorkOrderPickerOption.matchesPickerQuery(normalizedQuery: String): Boolean {
    val haystack = listOf(label, meta, searchText).joinToString(" ").normalizedPickerText()
    return normalizedQuery.split(' ')
        .filter { it.isNotBlank() }
        .all { token -> haystack.contains(token) }
}

private fun String.normalizedPickerText(): String =
    lowercase(Locale.getDefault())
        .replace("š", "s")
        .replace("ž", "z")
        .replace("č", "c")
        .replace("ć", "c")
        .replace("đ", "d")
        .trim()

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

private fun fieldInquiryStatusLabel(status: String): String =
    fieldInquiryStatusOptions.firstOrNull { it.first == status }?.second ?: status.ifBlank { "Upit" }

private fun fieldInquiryId(record: MobileRecord): String =
    record.id.removePrefix("field-inquiry:").ifBlank { record.id }

@Composable
private fun FieldInquiriesContent(
    records: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
    onNewInquiry: () -> Unit,
    onEditInquiry: (MobileRecord) -> Unit,
    onConvertInquiry: (MobileRecord) -> Unit,
) {
    val today = remember { LocalDate.now() }
    val upcoming = remember(records, today) {
        records.count { record ->
            val date = record.parsedDate
            date != null && !date.isBefore(today) && !date.isAfter(today.plusDays(7))
        }
    }
    val sortedRecords = remember(records) {
        records.sortedWith(compareBy<MobileRecord> { it.parsedDate ?: LocalDate.MAX }.thenBy { it.title })
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Plan terena", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                    Text(
                        "${records.size} upita · $upcoming u idućih 7 dana",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
                Button(onClick = onNewInquiry, shape = RoundedCornerShape(16.dp)) {
                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Upit")
                }
            }

            if (sortedRecords.isEmpty()) {
                Text(
                    "Nema upita za teren. Dodaj brzi dogovor i kasnije ga poveži s RN-om.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            } else {
                sortedRecords.forEach { record ->
                    FieldInquiryCard(
                        record = record,
                        onOpenRecord = { onOpenRecord(record) },
                        onEdit = { onEditInquiry(record) },
                        onConvert = { onConvertInquiry(record) },
                    )
                }
            }
        }
    }
}

@Composable
private fun FieldInquiryCard(
    record: MobileRecord,
    onOpenRecord: () -> Unit,
    onEdit: () -> Unit,
    onConvert: () -> Unit,
) {
    val canConvert = record.status != "converted" && record.meta["companyId"].orEmpty().isNotBlank()
    val statusColor = calendarRecordColor("field_inquiry")
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onOpenRecord),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.44f),
    ) {
        Column(modifier = Modifier.padding(13.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(record.title.ifBlank { "Upit za teren" }, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Text(
                        listOf(
                            formatDateLabel(record.date).ifBlank { record.date },
                            listOf(record.meta["timeFrom"].orEmpty(), record.meta["timeTo"].orEmpty()).filter { it.isNotBlank() }.joinToString("-"),
                            record.meta["companyName"].orEmpty().ifBlank { "Bez tvrtke" },
                        ).filter { it.isNotBlank() }.joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = statusColor.copy(alpha = 0.14f),
                ) {
                    Text(
                        fieldInquiryStatusLabel(record.status),
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            val details = listOf(
                "Lokacija" to record.meta["locationName"].orEmpty(),
                "RN" to record.meta["workOrderNumber"].orEmpty(),
                "Ekipa" to record.meta["assignedUserLabels"].orEmpty(),
                "Vozilo" to record.meta["vehicleLabel"].orEmpty(),
                "Kontakt" to listOf(record.meta["contactName"].orEmpty(), record.meta["contactPhone"].orEmpty()).filter { it.isNotBlank() }.joinToString(" · "),
                "Usluga" to record.meta["serviceLine"].orEmpty(),
            ).filter { it.second.isNotBlank() }

            if (details.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    details.forEach { (label, value) ->
                        AssistChip(
                            onClick = {},
                            label = {
                                Text("$label: $value", maxLines = 1, overflow = TextOverflow.Ellipsis)
                            },
                        )
                    }
                }
            }

            record.meta["note"].orEmpty().takeIf { it.isNotBlank() }?.let { note ->
                Text(note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onEdit, shape = RoundedCornerShape(14.dp)) {
                    Text("Uredi")
                }
                OutlinedButton(
                    onClick = onConvert,
                    enabled = canConvert,
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Text("Napravi RN")
                }
            }
        }
    }
}

@Composable
private fun FieldInquiryEditorDialog(
    record: MobileRecord?,
    data: BootstrapData,
    currentUserLabel: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSave: (FieldInquiryDraft) -> Unit,
) {
    val initialAssigneeLabels = remember(record?.id) {
        record?.meta?.get("assignedUserLabels").orEmpty()
            .split(',')
            .map { it.trim() }
            .filter { it.isNotBlank() }
    }
    val initialAssigneeIdsFromMeta = remember(record?.id) {
        record?.meta?.get("assignedUserIds").orEmpty()
            .split(',')
            .map { it.trim() }
            .filter { it.isNotBlank() }
    }
    val userOptions = remember(data.workOrderUsers) {
        data.workOrderUsers.map { user -> user.id to user.label.ifBlank { user.fullName.ifBlank { user.email } } }
    }
    val initialAssigneeIds = remember(record?.id, initialAssigneeLabels, initialAssigneeIdsFromMeta, userOptions, currentUserLabel) {
        val optionIds = userOptions.map { it.first }.toSet()
        val byId = initialAssigneeIdsFromMeta.filter { it in optionIds }
        val byLabel = initialAssigneeLabels.mapNotNull { label ->
            userOptions.firstOrNull { option -> option.second.equals(label, ignoreCase = true) }?.first
        }
        byId.ifEmpty {
            byLabel
        }.ifEmpty {
            userOptions.firstOrNull { option -> option.second.equals(currentUserLabel, ignoreCase = true) }?.let { listOf(it.first) }
                ?: emptyList()
        }
    }

    var title by remember(record?.id) { mutableStateOf(record?.title.orEmpty()) }
    var status by remember(record?.id) { mutableStateOf(record?.status?.ifBlank { "inquiry" } ?: "inquiry") }
    var plannedDate by remember(record?.id) { mutableStateOf(record?.date?.take(10).orEmpty().ifBlank { LocalDate.now().toString() }) }
    var timeFrom by remember(record?.id) { mutableStateOf(record?.meta?.get("timeFrom").orEmpty()) }
    var timeTo by remember(record?.id) { mutableStateOf(record?.meta?.get("timeTo").orEmpty()) }
    var companyId by remember(record?.id) { mutableStateOf(record?.meta?.get("companyId").orEmpty()) }
    var locationId by remember(record?.id) { mutableStateOf(record?.meta?.get("locationId").orEmpty()) }
    var workOrderId by remember(record?.id) { mutableStateOf(record?.meta?.get("workOrderId").orEmpty()) }
    var vehicleId by remember(record?.id) { mutableStateOf(record?.meta?.get("vehicleId").orEmpty()) }
    var contactName by remember(record?.id) { mutableStateOf(record?.meta?.get("contactName").orEmpty()) }
    var contactPhone by remember(record?.id) { mutableStateOf(record?.meta?.get("contactPhone").orEmpty()) }
    var serviceLine by remember(record?.id) { mutableStateOf(record?.meta?.get("serviceLine").orEmpty()) }
    var note by remember(record?.id) { mutableStateOf(record?.meta?.get("note").orEmpty()) }
    var selectedAssigneeIds by remember(record?.id, initialAssigneeIds) { mutableStateOf(initialAssigneeIds) }

    val companyOptions = remember(data.workOrderCompanies) {
        listOf(WorkOrderPickerOption("", "Bez tvrtke", "Slobodni upit")) + data.workOrderCompanies.map { company ->
            WorkOrderPickerOption(
                value = company.id,
                label = company.name,
                meta = listOf(company.headquarters, company.oib.takeIf { it.isNotBlank() }?.let { "OIB $it" }).filterNotNull().filter { it.isNotBlank() }.joinToString(" · "),
                searchText = listOf(company.name, company.oib, company.headquarters).joinToString(" "),
            )
        }
    }
    val locationOptions = remember(data.workOrderLocations, companyId) {
        listOf(WorkOrderPickerOption("", "Bez lokacije")) + data.workOrderLocations
            .filter { companyId.isBlank() || it.companyId == companyId }
            .map { location ->
                WorkOrderPickerOption(
                    value = location.id,
                    label = location.name,
                    meta = listOf(location.region, location.coordinates).filter { it.isNotBlank() }.joinToString(" · "),
                    searchText = listOf(location.name, location.region, location.coordinates).joinToString(" "),
                )
            }
    }
    val workOrderOptions = remember(data.workOrders, companyId) {
        listOf(WorkOrderPickerOption("", "Bez RN-a")) + data.workOrders
            .filter { companyId.isBlank() || it.companyId == companyId }
            .take(250)
            .map { workOrder ->
                WorkOrderPickerOption(
                    value = workOrder.id,
                    label = workOrder.displayNumber,
                    meta = listOf(workOrder.companyName, workOrder.locationName, workOrder.displayService).filter { it.isNotBlank() }.joinToString(" · "),
                    searchText = listOf(workOrder.number, workOrder.companyName, workOrder.locationName, workOrder.serviceLine).joinToString(" "),
                )
            }
    }
    val vehicleOptions = remember(data.vehicles) {
        listOf("" to "Bez vozila") + data.vehicles.map { vehicle ->
            fieldInquiryId(vehicle) to listOf(vehicle.title, vehicle.subtitle).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { vehicle.title }
        }
    }
    val selectedCompanyLabel = companyOptions.firstOrNull { it.value == companyId }?.label ?: "Bez tvrtke"
    val selectedLocationLabel = locationOptions.firstOrNull { it.value == locationId }?.label ?: "Bez lokacije"
    val selectedWorkOrderLabel = workOrderOptions.firstOrNull { it.value == workOrderId }?.label ?: "Bez RN-a"
    val selectedVehicleLabel = vehicleOptions.firstOrNull { it.first == vehicleId }?.second ?: "Bez vozila"

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (record == null) "Novi terenski upit" else "Uredi terenski upit", fontWeight = FontWeight.Black) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 620.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Naziv / opis") },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                )
                WorkOrderSelectField(
                    label = "Status",
                    value = status,
                    valueLabel = fieldInquiryStatusLabel(status),
                    options = fieldInquiryStatusOptions,
                    enabled = !isLoading,
                    onSelect = { status = it },
                )
                WorkOrderDatePickerField("Datum", plannedDate, { plannedDate = it }, !isLoading)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WorkOrderSelectField("Od", timeFrom, timeFrom.ifBlank { "Bez vremena" }, listOf("" to "Bez vremena") + reservationTimeOptions, !isLoading, { timeFrom = it }, Modifier.weight(1f))
                    WorkOrderSelectField("Do", timeTo, timeTo.ifBlank { "Bez vremena" }, listOf("" to "Bez vremena") + reservationTimeOptions, !isLoading, { timeTo = it }, Modifier.weight(1f))
                }
                WorkOrderSearchSelectField(
                    label = "Tvrtka",
                    value = companyId,
                    valueLabel = selectedCompanyLabel,
                    options = companyOptions,
                    enabled = !isLoading,
                    onSelect = {
                        companyId = it
                        locationId = ""
                        workOrderId = ""
                    },
                    icon = Icons.Rounded.Business,
                )
                WorkOrderSearchSelectField(
                    label = "Lokacija",
                    value = locationId,
                    valueLabel = selectedLocationLabel,
                    options = locationOptions,
                    enabled = !isLoading,
                    onSelect = { selected ->
                        locationId = selected
                        data.workOrderLocations.firstOrNull { it.id == selected }?.let { location ->
                            companyId = location.companyId
                        }
                    },
                    icon = Icons.Rounded.LocationOn,
                )
                WorkOrderSearchSelectField(
                    label = "Povezani RN",
                    value = workOrderId,
                    valueLabel = selectedWorkOrderLabel,
                    options = workOrderOptions,
                    enabled = !isLoading,
                    onSelect = { selected ->
                        workOrderId = selected
                        data.workOrders.firstOrNull { it.id == selected }?.let { workOrder ->
                            companyId = workOrder.companyId
                            locationId = workOrder.locationId
                            if (title.isBlank()) title = listOf(workOrder.displayNumber, workOrder.companyName).filter { it.isNotBlank() }.joinToString(" · ")
                            if (serviceLine.isBlank()) serviceLine = workOrder.displayService
                            if (contactName.isBlank()) contactName = workOrder.contactName
                            if (contactPhone.isBlank()) contactPhone = workOrder.contactPhone
                        }
                    },
                    icon = Icons.Rounded.Work,
                )
                WorkOrderSelectField(
                    label = "Vozilo",
                    value = vehicleId,
                    valueLabel = selectedVehicleLabel,
                    options = vehicleOptions,
                    enabled = !isLoading,
                    onSelect = { vehicleId = it },
                )
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ekipa", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                    WorkOrderMultiSelectChips(
                        options = userOptions,
                        selected = selectedAssigneeIds,
                        enabled = !isLoading,
                        emptyText = "Nema dostupnih korisnika.",
                    ) { userId ->
                        selectedAssigneeIds = if (userId in selectedAssigneeIds) {
                            selectedAssigneeIds - userId
                        } else {
                            selectedAssigneeIds + userId
                        }
                    }
                }
                OutlinedTextField(contactName, { contactName = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Kontakt") }, singleLine = true, shape = RoundedCornerShape(16.dp))
                OutlinedTextField(contactPhone, { contactPhone = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Telefon") }, singleLine = true, shape = RoundedCornerShape(16.dp))
                OutlinedTextField(serviceLine, { serviceLine = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Usluga / tema") }, singleLine = true, shape = RoundedCornerShape(16.dp))
                OutlinedTextField(note, { note = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Napomena") }, minLines = 3, maxLines = 5, shape = RoundedCornerShape(16.dp))
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val labelById = userOptions.toMap()
                    onSave(
                        FieldInquiryDraft(
                            id = record?.let(::fieldInquiryId).orEmpty(),
                            title = title.trim(),
                            status = status.ifBlank { "inquiry" },
                            plannedDate = plannedDate,
                            timeFrom = timeFrom,
                            timeTo = timeTo,
                            companyId = companyId,
                            locationId = locationId,
                            workOrderId = workOrderId,
                            vehicleId = vehicleId,
                            contactName = contactName.trim(),
                            contactPhone = contactPhone.trim(),
                            serviceLine = serviceLine.trim(),
                            note = note.trim(),
                            assignedUserIds = selectedAssigneeIds,
                            assignedUserLabels = selectedAssigneeIds.mapNotNull { labelById[it] },
                            syncWorkOrderExecutionDate = true,
                        ),
                    )
                },
                enabled = !isLoading && title.trim().isNotBlank(),
            ) {
                Text("Spremi")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Odustani")
            }
        },
    )
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

@Composable
private fun DocumentationReadOnlyOptionList(
    label: String,
    options: List<WorkOrderDocumentationOption>,
    emptyText: String,
    statusMessage: String = "",
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            if (options.isNotEmpty()) {
                Text(
                    "${options.size} IS ZNR",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
        if (statusMessage.isNotBlank()) {
            Text(
                statusMessage,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
            )
        }
        if (options.isEmpty()) {
            Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
            return
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            options.take(32).forEach { option ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.52f),
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Icon(
                            Icons.Rounded.Work,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = MaterialTheme.colorScheme.primary,
                        )
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(option.label, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            val subtitle = listOf(option.subtitle, option.status)
                                .map { it.trim() }
                                .filter { it.isNotBlank() }
                                .distinct()
                                .joinToString(" · ")
                            if (subtitle.isNotBlank()) {
                                Text(
                                    subtitle,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }
                }
            }
        }
        if (options.size > 32) {
            Text(
                "Prikazano prvih 32 stavki za brzi mobilni pregled.",
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
    onSaveFieldInquiry: (FieldInquiryDraft) -> Unit,
    onConvertFieldInquiry: (MobileRecord) -> Unit,
    onLoadIsznrMeasurementEquipment: (Boolean) -> Unit,
    onLoadIsznrPeople: (Boolean) -> Unit,
    onDownloadTrainingDocument: (MobileRecord, MobileTrainingDocument) -> Unit,
) {
    val normalizedQuery = remember(state.query) { state.query.trim().lowercase() }
    val filtered = remember(state.workOrders, normalizedQuery, state.filter, state.user?.displayName, state.user?.email) {
        state.workOrders
            .filter { workOrder ->
                when (state.filter) {
                    WorkOrderFilter.All -> true
                    WorkOrderFilter.Mine -> workOrder.isAssignedToUser(state.user)
                    WorkOrderFilter.Open -> workOrder.hasRnStatus("Otvoreni RN")
                    WorkOrderFilter.Done -> workOrder.hasRnStatus("Gotov RN")
                    WorkOrderFilter.Verified -> workOrder.hasRnStatus("Ovjeren RN")
                    WorkOrderFilter.Invoiced -> workOrder.hasRnStatus("Fakturiran RN")
                    WorkOrderFilter.Cancelled -> workOrder.isCancelledRnStatus()
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
    val filteredDocuments = remember(state.data.documentRecords, normalizedQuery) {
        state.data.documentRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredTraining = remember(state.data.peopleTrainingRecords, normalizedQuery) {
        state.data.peopleTrainingRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredRulebooks = remember(state.data.rulebooks, normalizedQuery) {
        state.data.rulebooks.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredAssessments = remember(state.data.riskAssessmentRecords, normalizedQuery) {
        state.data.riskAssessmentRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val periodicEntries = remember(state.data, state.workOrders, normalizedQuery) {
        buildPeriodicEntries(state.data, state.workOrders, normalizedQuery)
    }
    val filteredTodoTasks = remember(state.data.todoTasks, normalizedQuery) {
        state.data.todoTasks.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredFieldInquiries = remember(state.data.fieldInquiries, normalizedQuery) {
        state.data.fieldInquiries.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredOffers = remember(state.data.offers, normalizedQuery) {
        state.data.offers.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredMeasurementEquipment = remember(state.data.measurementEquipmentRecords, normalizedQuery) {
        state.data.measurementEquipmentRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredIsznrMeasurementEquipment = remember(state.isznrMeasurementEquipmentRecords, normalizedQuery) {
        state.isznrMeasurementEquipmentRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredIsznrPeople = remember(state.isznrPeopleRecords, normalizedQuery) {
        state.isznrPeopleRecords.filter { record -> record.matchesSearch(normalizedQuery) }
    }
    val filteredPeopleUsers = remember(state.data.workOrderUsers, normalizedQuery) {
        state.data.workOrderUsers.filter { user ->
            normalizedQuery.isBlank() ||
                (listOf(user.label, user.fullName, user.email, user.oib) + user.isznrTags)
                    .any { value -> value.contains(normalizedQuery, ignoreCase = true) }
        }
    }
    var quickActionsExpanded by remember(state.section) { mutableStateOf(false) }
    var mainMenuExpanded by remember { mutableStateOf(false) }
    var moreFocus by remember { mutableStateOf(MoreSectionFocus.Overview) }
    var fieldInquiryDialogRecord by remember { mutableStateOf<MobileRecord?>(null) }
    var fieldInquiryDialogOpen by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val openMenuShortcut: (AppSection, MoreSectionFocus?) -> Unit = { section, focus ->
        mainMenuExpanded = false
        moreFocus = if (section == AppSection.More) focus ?: MoreSectionFocus.Overview else MoreSectionFocus.Overview
        onSectionChange(section)
    }

    LaunchedEffect(state.section, moreFocus) {
        if (state.section == AppSection.More) {
            listState.animateScrollToItem(0)
            if (moreFocus == MoreSectionFocus.MeasurementEquipment) {
                onLoadIsznrMeasurementEquipment(false)
            } else if (moreFocus == MoreSectionFocus.People) {
                onLoadIsznrPeople(false)
            }
        }
    }

    Scaffold(
        topBar = {
            if (state.section == AppSection.WorkOrders) {
                WorkOrdersTopBar(
                    currentSection = state.section,
                    currentMoreFocus = moreFocus,
                    viewMode = state.viewMode,
                    mainMenuExpanded = mainMenuExpanded,
                    onMainMenuExpandedChange = { mainMenuExpanded = it },
                    onSectionChange = openMenuShortcut,
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
                    currentMoreFocus = moreFocus,
                    displayName = state.user?.displayName.orEmpty(),
                    mainMenuExpanded = mainMenuExpanded,
                    onMainMenuExpandedChange = { mainMenuExpanded = it },
                    onSectionChange = openMenuShortcut,
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
                onSectionChange = { section ->
                    moreFocus = if (section == AppSection.More) MoreSectionFocus.Overview else MoreSectionFocus.Overview
                    onSectionChange(section)
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.section == AppSection.Operations) {
                item {
                    OperationsContent(
                        data = state.data,
                        user = state.user,
                        workOrders = state.workOrders,
                        onOpenWorkOrder = onOpenWorkOrder,
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
                    VehicleFleetContent(
                        vehicles = filteredVehicles,
                        onOpenRecord = onOpenRecord,
                    )
                }
            } else if (state.section == AppSection.More) {
                item {
                    ModuleSearchField(
                        query = state.query,
                        onQueryChange = onQueryChange,
                        label = when (moreFocus) {
                            MoreSectionFocus.Todo -> "Pretraga ToDo zadataka, statusa, tvrtke ili RN-a"
                            MoreSectionFocus.FieldInquiries -> "Pretraga upita, termina, tvrtke ili RN-a"
                            MoreSectionFocus.Offers -> "Pretraga ponuda, broja, tvrtke ili statusa"
                            MoreSectionFocus.Companies -> "Pretraga tvrtki, OIB-a i kontakata"
                            MoreSectionFocus.Locations -> "Pretraga lokacija, regija i adresa"
                            MoreSectionFocus.Periodics -> "Pretraga periodike i rokova"
                            MoreSectionFocus.Documents -> "Pretraga dokumenata"
                            MoreSectionFocus.Services -> "Pretraga service lista"
                            MoreSectionFocus.People -> "Pretraga People korisnika, OIB-a ili IS ZNR statusa"
                            MoreSectionFocus.MeasurementEquipment -> "Pretraga mjerne opreme, ISZNR ID-a, serijskog ili inv. broja"
                            MoreSectionFocus.Foundation -> "Pretraga pravilnika i procjena"
                            MoreSectionFocus.Training -> "Pretraga osposobljavanja"
                            MoreSectionFocus.Overview -> "Pretraga evidencija i modula"
                        },
                    )
                }
                when (moreFocus) {
                    MoreSectionFocus.Overview -> {
                        item {
                            MoreOverviewHero(state.data)
                        }
                        item {
                            RecordsContent(
                                title = "ToDo",
                                records = filteredTodoTasks,
                                emptyText = "Nema ToDo zadataka za prikaz.",
                                icon = Icons.Rounded.ListAlt,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            FieldInquiriesContent(
                                records = filteredFieldInquiries,
                                onOpenRecord = onOpenRecord,
                                onNewInquiry = {
                                    fieldInquiryDialogRecord = null
                                    fieldInquiryDialogOpen = true
                                },
                                onEditInquiry = { record ->
                                    fieldInquiryDialogRecord = record
                                    fieldInquiryDialogOpen = true
                                },
                                onConvertInquiry = onConvertFieldInquiry,
                            )
                        }
                        item {
                            RecordsContent(
                                title = "Ponude",
                                records = filteredOffers,
                                emptyText = "Nema ponuda za prikaz.",
                                icon = Icons.Rounded.Description,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            CompanyDirectory(
                                companies = state.data.companies,
                                locations = state.data.locations,
                                query = normalizedQuery,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            LocationDirectory(
                                locations = state.data.locations,
                                query = normalizedQuery,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            PeriodicsPreview(entries = periodicEntries)
                        }
                        item {
                            DocumentRegisterPreview(
                                records = filteredDocuments,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            ServicesCatalogPreview(
                                services = state.data.workOrderServices,
                                query = normalizedQuery,
                            )
                        }
                        item {
                            PeopleDirectoryContent(
                                users = filteredPeopleUsers,
                                isznrRecords = filteredIsznrPeople,
                                totalCount = filteredPeopleUsers.size,
                                isznrLoading = state.isznrPeopleLoading,
                                isznrLoaded = state.isznrPeopleLoaded,
                                isznrError = state.isznrPeopleError,
                                displayLimit = 8,
                                onLoadIsznr = onLoadIsznrPeople,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            MeasurementEquipmentContent(
                                records = filteredMeasurementEquipment,
                                isznrRecords = filteredIsznrMeasurementEquipment,
                                totalCount = filteredMeasurementEquipment.size,
                                isznrTotalCount = state.isznrMeasurementEquipmentRecords.size,
                                isznrLoading = state.isznrMeasurementEquipmentLoading,
                                isznrLoaded = state.isznrMeasurementEquipmentLoaded,
                                isznrError = state.isznrMeasurementEquipmentError,
                                displayLimit = 8,
                                onLoadIsznr = onLoadIsznrMeasurementEquipment,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            FoundationDocumentationPreview(
                                rulebooks = filteredRulebooks,
                                assessments = filteredAssessments,
                                documents = filteredDocuments,
                                onOpenRecord = onOpenRecord,
                            )
                        }
                        item {
                            TrainingContent(
                                records = filteredTraining,
                                totalCount = filteredTraining.size,
                                displayLimit = 8,
                                onOpenRecord = onOpenRecord,
                                onDownloadDocument = onDownloadTrainingDocument,
                            )
                        }
                    }
                    MoreSectionFocus.Todo -> item {
                        RecordsContent(
                            title = "ToDo",
                            records = filteredTodoTasks,
                            emptyText = "Nema ToDo zadataka za prikaz.",
                            icon = Icons.Rounded.ListAlt,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.FieldInquiries -> item {
                        FieldInquiriesContent(
                            records = filteredFieldInquiries,
                            onOpenRecord = onOpenRecord,
                            onNewInquiry = {
                                fieldInquiryDialogRecord = null
                                fieldInquiryDialogOpen = true
                            },
                            onEditInquiry = { record ->
                                fieldInquiryDialogRecord = record
                                fieldInquiryDialogOpen = true
                            },
                            onConvertInquiry = onConvertFieldInquiry,
                        )
                    }
                    MoreSectionFocus.Offers -> item {
                        RecordsContent(
                            title = "Ponude",
                            records = filteredOffers,
                            emptyText = "Nema ponuda za prikaz.",
                            icon = Icons.Rounded.Description,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Companies -> item {
                        CompanyDirectory(
                            companies = state.data.companies,
                            locations = state.data.locations,
                            query = normalizedQuery,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Locations -> item {
                        LocationDirectory(
                            locations = state.data.locations,
                            query = normalizedQuery,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Periodics -> item {
                        PeriodicsPreview(entries = periodicEntries)
                    }
                    MoreSectionFocus.Documents -> item {
                        DocumentRegisterPreview(
                            records = filteredDocuments,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Services -> item {
                        ServicesCatalogPreview(
                            services = state.data.workOrderServices,
                            query = normalizedQuery,
                        )
                    }
                    MoreSectionFocus.People -> item {
                        PeopleDirectoryContent(
                            users = filteredPeopleUsers,
                            isznrRecords = filteredIsznrPeople,
                            totalCount = filteredPeopleUsers.size,
                            isznrLoading = state.isznrPeopleLoading,
                            isznrLoaded = state.isznrPeopleLoaded,
                            isznrError = state.isznrPeopleError,
                            displayLimit = 80,
                            onLoadIsznr = onLoadIsznrPeople,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.MeasurementEquipment -> item {
                        MeasurementEquipmentContent(
                            records = filteredMeasurementEquipment,
                            isznrRecords = filteredIsznrMeasurementEquipment,
                            totalCount = filteredMeasurementEquipment.size,
                            isznrTotalCount = state.isznrMeasurementEquipmentRecords.size,
                            isznrLoading = state.isznrMeasurementEquipmentLoading,
                            isznrLoaded = state.isznrMeasurementEquipmentLoaded,
                            isznrError = state.isznrMeasurementEquipmentError,
                            displayLimit = 80,
                            onLoadIsznr = onLoadIsznrMeasurementEquipment,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Foundation -> item {
                        FoundationDocumentationPreview(
                            rulebooks = filteredRulebooks,
                            assessments = filteredAssessments,
                            documents = filteredDocuments,
                            onOpenRecord = onOpenRecord,
                        )
                    }
                    MoreSectionFocus.Training -> item {
                        TrainingContent(
                            records = filteredTraining,
                            totalCount = filteredTraining.size,
                            displayLimit = 80,
                            onOpenRecord = onOpenRecord,
                            onDownloadDocument = onDownloadTrainingDocument,
                        )
                    }
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

    if (fieldInquiryDialogOpen) {
        FieldInquiryEditorDialog(
            record = fieldInquiryDialogRecord,
            data = state.data,
            currentUserLabel = state.user?.displayName.orEmpty(),
            isLoading = state.isLoading,
            onDismiss = {
                fieldInquiryDialogOpen = false
                fieldInquiryDialogRecord = null
            },
            onSave = { draft ->
                fieldInquiryDialogOpen = false
                fieldInquiryDialogRecord = null
                onSaveFieldInquiry(draft)
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainAppTopBar(
    currentSection: AppSection,
    currentMoreFocus: MoreSectionFocus,
    displayName: String,
    mainMenuExpanded: Boolean,
    onMainMenuExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection, MoreSectionFocus?) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    TopAppBar(
        navigationIcon = {
            MainMenuButton(
                currentSection = currentSection,
                currentMoreFocus = currentMoreFocus,
                expanded = mainMenuExpanded,
                onExpandedChange = onMainMenuExpandedChange,
                onSectionChange = onSectionChange,
                onLogout = onLogout,
            )
        },
        title = {
            Column {
                Text(
                    if (currentSection == AppSection.More) currentMoreFocus.title else currentSection.label,
                    fontWeight = FontWeight.Bold,
                )
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
    currentMoreFocus: MoreSectionFocus,
    viewMode: WorkOrderViewMode,
    mainMenuExpanded: Boolean,
    onMainMenuExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection, MoreSectionFocus?) -> Unit,
    onViewModeChange: (WorkOrderViewMode) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onNewWorkOrder: () -> Unit,
) {
    TopAppBar(
        navigationIcon = {
            MainMenuButton(
                currentSection = currentSection,
                currentMoreFocus = currentMoreFocus,
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
    currentMoreFocus: MoreSectionFocus,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onSectionChange: (AppSection, MoreSectionFocus?) -> Unit,
    onLogout: () -> Unit,
) {
    Box {
        IconButton(onClick = { onExpandedChange(true) }) {
            Icon(Icons.Rounded.Menu, contentDescription = "Glavni izbornik")
        }
        MainMenuDropdown(
            expanded = expanded,
            currentSection = currentSection,
            currentMoreFocus = currentMoreFocus,
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
    currentMoreFocus: MoreSectionFocus,
    onDismiss: () -> Unit,
    onSectionChange: (AppSection, MoreSectionFocus?) -> Unit,
    onLogout: () -> Unit,
) {
    val shortcuts = remember {
        listOf(
            MainMenuShortcut("Operativa", "Pregled terena, rokova i prioriteta", AppSection.Operations, Icons.Rounded.Work),
            MainMenuShortcut("Radni nalozi", "Lista, karta, statusi i skeniranje RN-a", AppSection.WorkOrders, Icons.Rounded.CheckCircle),
            MainMenuShortcut("Kalendar", "Dnevni, tjedni i mjesečni raspored", AppSection.Calendar, Icons.Rounded.CalendarMonth),
            MainMenuShortcut("Vozila", "Pregled vozila, servisa i rezervacija", AppSection.Vehicles, Icons.Rounded.Business),
            MainMenuShortcut("ToDo", "Zadaci, teme i Next Week Job status", AppSection.More, Icons.Rounded.ListAlt, MoreSectionFocus.Todo),
            MainMenuShortcut("Plan terena", "Upiti i dogovori prije RN-a", AppSection.More, Icons.Rounded.EventNote, MoreSectionFocus.FieldInquiries),
            MainMenuShortcut("Ponude", "Pregled poslanih i primljenih ponuda", AppSection.More, Icons.Rounded.Description, MoreSectionFocus.Offers),
            MainMenuShortcut("Tvrtke", "Klijenti, kontakti i povezani podaci", AppSection.More, Icons.Rounded.Business, MoreSectionFocus.Companies),
            MainMenuShortcut("Lokacije", "Lokacije tvrtki i radnih naloga", AppSection.More, Icons.Rounded.LocationOn, MoreSectionFocus.Locations),
            MainMenuShortcut("Dokumenti", "PDF dokumenti, pravilnici i zapisnici", AppSection.More, Icons.Rounded.Description, MoreSectionFocus.Documents),
            MainMenuShortcut("Periodika", "Rokovi, pregledi i isteci", AppSection.More, Icons.Rounded.CalendarMonth, MoreSectionFocus.Periodics),
            MainMenuShortcut("Service liste", "Pravilnici, mjerna oprema i autorizacije", AppSection.More, Icons.Rounded.ListAlt, MoreSectionFocus.Services),
            MainMenuShortcut("People", "Korisnici, OIB i IS ZNR status", AppSection.More, Icons.Rounded.Person, MoreSectionFocus.People),
            MainMenuShortcut("Mjerna oprema", "Popis opreme i ISZNR oznake", AppSection.More, Icons.Rounded.Work, MoreSectionFocus.MeasurementEquipment),
            MainMenuShortcut("Pravilnici", "Temeljna dokumentacija i procjene", AppSection.More, Icons.Rounded.Lock, MoreSectionFocus.Foundation),
            MainMenuShortcut("Osposobljavanja", "ZOS, liječnički pregledi i uvjerenja", AppSection.More, Icons.Rounded.Fingerprint, MoreSectionFocus.Training),
        )
    }

    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismiss,
        modifier = Modifier.width(318.dp),
    ) {
        shortcuts.forEach { shortcut ->
            val selected = if (shortcut.section == AppSection.More) {
                currentSection == AppSection.More && currentMoreFocus == shortcut.moreFocus
            } else {
                currentSection == shortcut.section
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
                    onSectionChange(shortcut.section, shortcut.moreFocus)
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
    val scrollState = rememberScrollState()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        WorkOrderFilter.entries.forEach { filter ->
            val isSelected = selected == filter
            val accent = workOrderFilterAccentColor(filter)
            Surface(
                modifier = Modifier
                    .clickable { onFilterChange(filter) }
                    .heightIn(min = 38.dp),
                shape = RoundedCornerShape(999.dp),
                color = if (isSelected) accent.copy(alpha = 0.16f) else Color(0xFFF8FAFC),
                tonalElevation = if (isSelected) 1.dp else 0.dp,
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                ) {
                    if (filter == WorkOrderFilter.Mine) {
                        Icon(
                            Icons.Rounded.Person,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = if (isSelected) accent else Color(0xFF64748B),
                        )
                    }
                    Text(
                        filter.label,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Black,
                        color = if (isSelected) accent else Color(0xFF475569),
                        maxLines = 1,
                    )
                }
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
                    WorkOrderFilter.entries.forEach { option ->
                        QuickFilterAction(option.label, option, filter, onFilterChange)
                    }
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
        icon = when {
            selected == value -> Icons.Rounded.CheckCircle
            value == WorkOrderFilter.Mine -> Icons.Rounded.Person
            else -> Icons.Rounded.FilterList
        },
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
        AppSection.entries.filter { section -> section != AppSection.More }.forEach { section ->
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
    data: BootstrapData,
    user: SafeNexusUser?,
    workOrders: List<WorkOrder>,
    onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    val myWorkOrders = remember(workOrders, user?.displayName, user?.email) {
        workOrders.filter { workOrder -> workOrder.isAssignedToUser(user) }
    }
    val statusLabels = remember(data.workOrderStatuses, workOrders) {
        buildWorkOrderStatusLabels(data.workOrderStatuses.map { option -> option.value.ifBlank { option.label } }, workOrders)
    }
    val organizationSummary = remember(workOrders, statusLabels) { workOrders.toStatusDashboard(statusLabels) }
    val personalSummary = remember(myWorkOrders, statusLabels) { myWorkOrders.toStatusDashboard(statusLabels) }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        MyPlanSection(
            workOrders = myWorkOrders,
            onOpenWorkOrder = onOpenWorkOrder,
        )
        OperationsStatusCockpit(
            user = user,
            personal = personalSummary,
            organization = organizationSummary,
        )
        OperationsScopeComparison(
            personal = personalSummary,
            organization = organizationSummary,
        )
        DashboardMetricGrid(data.dashboard)
        OperationsRegisterStrip(data)
        PriorityWorkOrders(workOrders)
    }
}

private enum class MyPlanKind(
    val label: String,
    val icon: ImageVector,
    val accent: Color,
) {
    ExecutionOverdue("Teren kasni", Icons.Rounded.ErrorOutline, Color(0xFFDC2626)),
    ExecutionSoon("Teren uskoro", Icons.Rounded.CalendarMonth, Color(0xFF2563EB)),
    DueOverdue("Rok istekao", Icons.Rounded.ErrorOutline, Color(0xFFB91C1C)),
    DueSoon("Rok uskoro", Icons.Rounded.CalendarMonth, Color(0xFFD97706)),
}

private data class MyPlanItem(
    val workOrder: WorkOrder,
    val date: LocalDate,
    val kind: MyPlanKind,
) {
    val urgencyRank: Int
        get() = when (kind) {
            MyPlanKind.ExecutionOverdue -> 0
            MyPlanKind.DueOverdue -> 1
            MyPlanKind.ExecutionSoon -> 2
            MyPlanKind.DueSoon -> 3
        }
}

private fun buildMyPlanItems(
    workOrders: List<WorkOrder>,
    today: LocalDate = LocalDate.now(),
    horizonDays: Long = 7,
): List<MyPlanItem> {
    val horizon = today.plusDays(horizonDays)
    val items = mutableListOf<MyPlanItem>()

    workOrders
        .filter { workOrder -> !workOrder.isClosed }
        .forEach { workOrder ->
            workOrder.parsedExecutionDate?.let { executionDate ->
                when {
                    executionDate.isBefore(today) -> items += MyPlanItem(workOrder, executionDate, MyPlanKind.ExecutionOverdue)
                    !executionDate.isAfter(horizon) -> items += MyPlanItem(workOrder, executionDate, MyPlanKind.ExecutionSoon)
                }
            }
            workOrder.parsedDueDate?.let { dueDate ->
                when {
                    dueDate.isBefore(today) -> items += MyPlanItem(workOrder, dueDate, MyPlanKind.DueOverdue)
                    !dueDate.isAfter(horizon) -> items += MyPlanItem(workOrder, dueDate, MyPlanKind.DueSoon)
                }
            }
        }

    return items
        .sortedWith(compareBy<MyPlanItem> { it.urgencyRank }.thenBy { it.date }.thenBy { it.workOrder.displayNumber })
        .take(8)
}

@Composable
private fun MyPlanSection(
    workOrders: List<WorkOrder>,
    onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    val today = remember { LocalDate.now() }
    val items = remember(workOrders, today) { buildMyPlanItems(workOrders, today) }
    val executionOverdue = items.count { it.kind == MyPlanKind.ExecutionOverdue }
    val executionSoon = items.count { it.kind == MyPlanKind.ExecutionSoon }
    val dueAlerts = items.count { it.kind == MyPlanKind.DueOverdue || it.kind == MyPlanKind.DueSoon }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
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
                    Text("MyPlan", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Text(
                        "Moji RN-ovi po izvršenju i rokovima",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusCountPill("Teren kasni", executionOverdue, Color(0xFFDC2626))
                StatusCountPill("Teren uskoro", executionSoon, Color(0xFF2563EB))
                StatusCountPill("Rokovi", dueAlerts, Color(0xFFD97706))
            }
            if (items.isEmpty()) {
                Text(
                    "Nema mojih RN-ova s izvršenjem ili rokom u sljedećih 7 dana.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                )
            } else {
                items.forEach { item ->
                    MyPlanLine(item = item, onClick = { onOpenWorkOrder(item.workOrder) })
                }
            }
        }
    }
}

@Composable
private fun MyPlanLine(
    item: MyPlanItem,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = item.kind.accent.copy(alpha = 0.09f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(13.dp), color = item.kind.accent.copy(alpha = 0.14f)) {
                Icon(
                    item.kind.icon,
                    contentDescription = null,
                    modifier = Modifier
                        .size(36.dp)
                        .padding(9.dp),
                    tint = item.kind.accent,
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    item.workOrder.displayNumber,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    listOf(item.workOrder.companyName, item.workOrder.locationName).filter { it.isNotBlank() }.joinToString(" - "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(item.kind.label, style = MaterialTheme.typography.labelMedium, color = item.kind.accent, fontWeight = FontWeight.Black)
                Text(formatDateLabel(item.date.toString()), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
            }
        }
    }
}

private data class WorkOrderStatusDashboard(
    val total: Int,
    val overdue: Int,
    val statuses: List<WorkOrderStatusCount>,
)

private data class WorkOrderStatusCount(
    val label: String,
    val count: Int,
)

private fun List<WorkOrder>.toStatusDashboard(statusLabels: List<String>): WorkOrderStatusDashboard =
    WorkOrderStatusDashboard(
        total = size,
        overdue = count { it.isOverdue },
        statuses = buildStatusBreakdown(this, statusLabels),
    )

private fun buildWorkOrderStatusLabels(
    optionLabels: List<String>,
    workOrders: List<WorkOrder>,
): List<String> {
    val fromOptions = optionLabels
        .map { it.trim() }
        .filter { it.isNotBlank() }
    val fallback = workOrderStatusOptions
    val observed = workOrders
        .map { it.status.trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.statusKey() }
    return (fromOptions.ifEmpty { fallback } + observed)
        .distinctBy { it.statusKey() }
}

private fun buildStatusBreakdown(
    workOrders: List<WorkOrder>,
    statusLabels: List<String>,
): List<WorkOrderStatusCount> {
    val counts = workOrders
        .groupingBy { it.status.ifBlank { "Bez statusa" }.statusKey() }
        .eachCount()
    val ordered = statusLabels.map { status -> WorkOrderStatusCount(status, counts[status.statusKey()] ?: 0) }
    val knownKeys = statusLabels.map { it.statusKey() }.toSet()
    val extra = workOrders
        .map { it.status.ifBlank { "Bez statusa" } }
        .distinctBy { it.statusKey() }
        .filter { it.statusKey() !in knownKeys }
        .map { status -> WorkOrderStatusCount(status, counts[status.statusKey()] ?: 0) }
        .sortedBy { it.label.lowercase(Locale.getDefault()) }
    return ordered + extra
}

private fun String.statusKey(): String = trim().lowercase(Locale.getDefault())

private fun WorkOrder.isAssignedToUser(user: SafeNexusUser?): Boolean {
    if (user == null) return false
    val needles = listOf(user.displayName, user.email)
        .map { it.trim().lowercase(Locale.getDefault()) }
        .filter { it.isNotBlank() }
    if (needles.isEmpty()) return false
    val haystack = (executors + completedBy)
        .map { it.trim().lowercase(Locale.getDefault()) }
        .filter { it.isNotBlank() }
    return haystack.any { candidate ->
        needles.any { needle -> candidate == needle || candidate.contains(needle) || needle.contains(candidate) }
    }
}

@Composable
private fun OperationsStatusCockpit(
    user: SafeNexusUser?,
    personal: WorkOrderStatusDashboard,
    organization: WorkOrderStatusDashboard,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF0F2F66), Color(0xFF2563EB), Color(0xFF0F9F9A)),
                    ),
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.16f),
                ) {
                    Icon(Icons.Rounded.Work, contentDescription = null, modifier = Modifier.padding(12.dp), tint = Color.White)
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Operativni pregled",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                    )
                    Text(
                        user?.displayName?.ifBlank { user.email } ?: "SafeNexus organizacija",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFDDEBFF),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatusScopeTile("Moji RN", personal.total.toString(), "dodijeljeni nalozi", Color(0xFFE0F2FE))
                StatusScopeTile("Organizacija", organization.total.toString(), "svi nalozi", Color(0xFFD1FAE5))
            }

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                organization.statuses.forEach { row ->
                    Surface(shape = RoundedCornerShape(999.dp), color = Color.White.copy(alpha = 0.14f)) {
                        Text(
                            "${row.label}: ${row.count}",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RowScope.StatusScopeTile(
    label: String,
    value: String,
    caption: String,
    tint: Color,
) {
    Surface(
        modifier = Modifier.weight(1f),
        shape = RoundedCornerShape(18.dp),
        color = Color.White.copy(alpha = 0.15f),
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = tint)
            Text(label, style = MaterialTheme.typography.labelLarge, color = Color.White, fontWeight = FontWeight.Black)
            Text(caption, style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.74f))
        }
    }
}

@Composable
private fun OperationsScopeComparison(
    personal: WorkOrderStatusDashboard,
    organization: WorkOrderStatusDashboard,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("RN po statusima", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
            StatusComparisonRow("Moji nalozi", personal, Color(0xFF2563EB))
            StatusComparisonRow("Cijela organizacija", organization, Color(0xFF0F766E))
        }
    }
}

@Composable
private fun StatusComparisonRow(
    title: String,
    summary: WorkOrderStatusDashboard,
    accent: Color,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, modifier = Modifier.weight(1f), fontWeight = FontWeight.Black)
            Text("${summary.total} ukupno", style = MaterialTheme.typography.labelMedium, color = accent, fontWeight = FontWeight.Black)
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            summary.statuses.forEach { status ->
                StatusCountPill(status.label, status.count, workOrderStatusAccentColor(status.label, accent))
            }
            StatusCountPill("Kasne po roku", summary.overdue, Color(0xFFDC2626))
        }
    }
}

private fun workOrderStatusAccentColor(status: String, fallback: Color): Color {
    val style = rnStatusStyle(status)
    return if (style.isKnownStatus) style.accent else fallback
}

@Composable
private fun StatusCountPill(
    label: String,
    count: Int,
    accent: Color,
) {
    Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.11f)) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(count.toString(), color = accent, fontWeight = FontWeight.Black)
            Text(label, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.76f), style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun OperationsRegisterStrip(data: BootstrapData) {
    val riskCount = data.dashboard.riskAssessmentsTotal.takeIf { it > 0 } ?: data.riskAssessmentRecords.size
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Registri", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            DashboardMetricTile("Tvrtke", data.companies.size.toString(), Icons.Rounded.Business)
            DashboardMetricTile("Lokacije", data.locations.size.toString(), Icons.Rounded.LocationOn)
            DashboardMetricTile("Procjene", riskCount.toString(), Icons.Rounded.Description)
            DashboardMetricTile("Usluge", data.workOrderServices.size.toString(), Icons.Rounded.ListAlt)
        }
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
            DashboardMetricTile("Procjene rizika", stats.riskAssessmentsTotal.toString(), Icons.Rounded.Description)
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
    "field_inquiry" -> Color(0xFFD97706)
    "todo_task" -> Color(0xFF2563EB)
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

private data class MobileVehicleReservation(
    val id: String,
    val status: String,
    val purpose: String,
    val startAt: String,
    val endAt: String,
    val destination: String,
    val userLabel: String,
)

private data class MobileVehicleTrip(
    val id: String,
    val departureAt: String,
    val returnAt: String,
    val destination: String,
    val drivers: String,
    val startKm: String,
    val endKm: String,
    val condition: String,
    val status: String,
    val reservationId: String,
    val linkedWorkOrderId: String,
    val linkedWorkOrderNumber: String,
    val documentCount: Int,
    val documentLabels: String,
)

private fun vehicleAvailabilityStatus(vehicle: MobileRecord): String =
    vehicle.meta["availabilityStatus"].orEmpty().ifBlank { vehicle.status.ifBlank { "available" } }.lowercase()

private fun vehicleStatusLabel(status: String): String = when (status.lowercase()) {
    "reserved" -> "Zauzeto"
    "checked_out" -> "Na terenu"
    "service", "inactive" -> "Servis"
    else -> "Dostupno"
}

private fun vehicleStatusColor(status: String): Color = when (status.lowercase()) {
    "reserved", "checked_out" -> Color(0xFFB45309)
    "service", "inactive" -> Color(0xFF64748B)
    else -> Color(0xFF059669)
}

private fun parseVehicleReservations(vehicle: MobileRecord): List<MobileVehicleReservation> {
    val raw = vehicle.meta["reservationsJson"].orEmpty()
    if (raw.isBlank()) return emptyList()
    return runCatching {
        val array = JSONArray(raw)
        buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                val labels = item.optJSONArray("reservedForLabels")
                val label = if (labels != null && labels.length() > 0) {
                    (0 until labels.length()).mapNotNull { labels.optString(it).trim().takeIf(String::isNotBlank) }.joinToString(", ")
                } else {
                    item.optString("reservedForLabel").trim()
                }
                add(
                    MobileVehicleReservation(
                        id = item.optString("id").trim(),
                        status = item.optString("status", "reserved").trim(),
                        purpose = item.optString("purpose", "Rezervacija").trim(),
                        startAt = item.optString("startAt").trim(),
                        endAt = item.optString("endAt").trim(),
                        destination = item.optString("destination").trim(),
                        userLabel = label,
                    ),
                )
            }
        }
    }.getOrDefault(emptyList())
}

private fun parseVehicleTrips(vehicle: MobileRecord): List<MobileVehicleTrip> {
    val raw = vehicle.meta["activityItemsJson"].orEmpty()
    if (raw.isBlank()) return emptyList()
    return runCatching {
        val array = JSONArray(raw)
        buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                val activityType = item.optString("activityType").trim().lowercase(Locale.getDefault())
                val hasTripFields = listOf("departureAt", "returnAt", "startKm", "endKm", "tripStatus")
                    .any { key -> item.optString(key).trim().isNotBlank() }
                if (activityType != "vehicle_trip" && !hasTripFields) continue

                val driverLabels = item.optJSONArray("driverLabels")
                val drivers = if (driverLabels != null && driverLabels.length() > 0) {
                    (0 until driverLabels.length())
                        .mapNotNull { driverLabels.optString(it).trim().takeIf(String::isNotBlank) }
                        .joinToString(", ")
                } else {
                    item.optString("performedBy").trim()
                }
                val condition = listOf(
                    item.optString("returnCondition").trim(),
                    item.optString("vehicleCondition").trim(),
                    item.optString("departureCondition").trim(),
                    item.optString("note").trim(),
                ).firstOrNull { it.isNotBlank() }.orEmpty()
                val documents = item.optJSONArray("documents") ?: item.optJSONArray("attachments")
                val documentLabels = if (documents != null && documents.length() > 0) {
                    (0 until documents.length())
                        .mapNotNull { documentIndex ->
                            val documentItem = documents.optJSONObject(documentIndex) ?: return@mapNotNull null
                            val category = documentItem.optString("documentCategory", documentItem.optString("category")).trim()
                            val fileName = documentItem.optString("fileName", documentItem.optString("name")).trim()
                            listOf(category, fileName)
                                .filter { it.isNotBlank() }
                                .joinToString(": ")
                                .takeIf { it.isNotBlank() }
                        }
                        .joinToString(", ")
                } else {
                    ""
                }
                add(
                    MobileVehicleTrip(
                        id = item.optString("id").trim(),
                        departureAt = item.optString("departureAt").trim().ifBlank { item.optString("performedOn").trim() },
                        returnAt = item.optString("returnAt").trim(),
                        destination = item.optString("destination").trim(),
                        drivers = drivers,
                        startKm = item.optString("startKm").trim(),
                        endKm = item.optString("endKm").trim(),
                        condition = condition,
                        status = item.optString("tripStatus").trim(),
                        reservationId = item.optString("reservationId").trim(),
                        linkedWorkOrderId = item.optString("linkedWorkOrderId", item.optString("workOrderId")).trim(),
                        linkedWorkOrderNumber = item.optString("linkedWorkOrderNumber", item.optString("workOrderNumber")).trim(),
                        documentCount = documents?.length() ?: 0,
                        documentLabels = documentLabels,
                    ),
                )
            }
        }.sortedByDescending { trip -> trip.departureAt.ifBlank { trip.id } }
    }.getOrDefault(emptyList())
}

private fun parseVehicleDateTime(value: String): LocalDateTime? {
    val normalized = value.trim()
    if (normalized.isBlank()) return null
    return runCatching { LocalDateTime.parse(normalized.take(19)) }.getOrNull()
        ?: runCatching { Instant.parse(normalized).atZone(ZoneId.systemDefault()).toLocalDateTime() }.getOrNull()
}

private fun formatVehicleTripDatePart(value: String): String {
    val parsed = parseVehicleDateTime(value)
    if (parsed != null) return parsed.format(DateTimeFormatter.ofPattern("dd.MM.yyyy."))
    return formatDateLabel(value).ifBlank { value.take(10) }
}

private fun formatVehicleTripTimePart(value: String): String {
    val parsed = parseVehicleDateTime(value) ?: return value.substringAfter('T', "").take(5)
    return parsed.format(DateTimeFormatter.ofPattern("HH:mm"))
}

private fun vehicleReservationOverlapsHour(reservation: MobileVehicleReservation, date: LocalDate, hour: Int): Boolean {
    val start = parseVehicleDateTime(reservation.startAt) ?: return false
    val end = parseVehicleDateTime(reservation.endAt) ?: return false
    val slotStart = date.atTime(hour, 0)
    val slotEnd = slotStart.plusHours(1)
    return start < slotEnd && end > slotStart
}

@Composable
private fun VehicleFleetContent(
    vehicles: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val today = remember { LocalDate.now() }
    val available = vehicles.count { vehicleAvailabilityStatus(it) == "available" }
    val reserved = vehicles.count { vehicleAvailabilityStatus(it) == "reserved" }
    val service = vehicles.count { vehicleAvailabilityStatus(it) == "service" }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                        Icon(
                            Icons.Rounded.Business,
                            contentDescription = null,
                            modifier = Modifier.size(40.dp).padding(10.dp),
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Status vozila", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                        Text(
                            "${vehicles.size} vozila u floti",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    VehicleStatusMetric("Dostupno", available, Color(0xFF059669), Modifier.weight(1f))
                    VehicleStatusMetric("Zauzeto", reserved, Color(0xFFB45309), Modifier.weight(1f))
                    VehicleStatusMetric("Servis", service, Color(0xFF64748B), Modifier.weight(1f))
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Raspored danas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                if (vehicles.isEmpty()) {
                    Text("Nema vozila za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
                } else {
                    VehicleScheduleGrid(vehicles = vehicles, date = today, onOpenRecord = onOpenRecord)
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Vozila", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                if (vehicles.isEmpty()) {
                    Text("Nema vozila za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
                } else {
                    vehicles.take(80).forEach { vehicle ->
                        VehicleFleetRow(vehicle = vehicle, onClick = { onOpenRecord(vehicle) })
                    }
                }
            }
        }
    }
}

@Composable
private fun VehicleStatusMetric(label: String, count: Int, color: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.height(70.dp),
        shape = RoundedCornerShape(18.dp),
        color = color.copy(alpha = 0.12f),
    ) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.Center) {
            Text(count.toString(), color = color, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color(0xFF334155), maxLines = 1)
        }
    }
}

@Composable
private fun VehicleScheduleGrid(
    vehicles: List<MobileRecord>,
    date: LocalDate,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val hours = remember { (7..18).toList() }
    Column(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
            Spacer(Modifier.width(96.dp))
            hours.forEach { hour ->
                Text(
                    "${hour.toString().padStart(2, '0')}:00",
                    modifier = Modifier.width(42.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    textAlign = TextAlign.Center,
                )
            }
        }
        vehicles.take(12).forEach { vehicle ->
            val reservations = parseVehicleReservations(vehicle)
            Row(
                modifier = Modifier
                    .height(44.dp)
                    .clickable { onOpenRecord(vehicle) },
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.width(96.dp)) {
                    Text(vehicle.title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(vehicleStatusLabel(vehicleAvailabilityStatus(vehicle)), style = MaterialTheme.typography.labelSmall, color = vehicleStatusColor(vehicleAvailabilityStatus(vehicle)))
                }
                hours.forEach { hour ->
                    val busy = reservations.any { vehicleReservationOverlapsHour(it, date, hour) }
                    Surface(
                        modifier = Modifier.size(width = 42.dp, height = 30.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = if (busy) Color(0xFFF59E0B).copy(alpha = 0.28f) else Color(0xFFE2E8F0).copy(alpha = 0.68f),
                        border = if (busy) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF59E0B)) else null,
                    ) {}
                }
            }
        }
    }
}

@Composable
private fun VehicleFleetRow(vehicle: MobileRecord, onClick: () -> Unit) {
    val status = vehicleAvailabilityStatus(vehicle)
    val statusColor = vehicleStatusColor(status)
    val nextPurpose = vehicle.meta["nextReservationPurpose"].orEmpty()
    val nextStart = vehicle.meta["nextReservationStartAt"].orEmpty()
    val nextUser = vehicle.meta["nextReservationUser"].orEmpty()
    val nextText = listOf(
        nextPurpose,
        if (nextStart.isNotBlank()) formatDateTimeLabel(nextStart) else "",
        nextUser,
    ).filter { it.isNotBlank() }.joinToString(" - ")
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = statusColor.copy(alpha = 0.08f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = statusColor.copy(alpha = 0.14f)) {
                Icon(Icons.Rounded.Business, contentDescription = null, modifier = Modifier.size(38.dp).padding(9.dp), tint = statusColor)
            }
            Column(Modifier.weight(1f)) {
                Text(vehicle.title, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOf(vehicle.subtitle, "${vehicle.meta["odometerKm"].orEmpty()} km".takeIf { vehicle.meta["odometerKm"].orEmpty().isNotBlank() }).filterNotNull().joinToString(" - "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (nextText.isNotBlank()) {
                    Text(nextText, style = MaterialTheme.typography.labelSmall, color = statusColor, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            AssistChip(onClick = {}, label = { Text(vehicleStatusLabel(status)) })
        }
    }
}

private fun formatDateTimeLabel(value: String): String {
    val parsed = parseVehicleDateTime(value) ?: return formatDateLabel(value).ifBlank { value.take(16) }
    return parsed.format(DateTimeFormatter.ofPattern("dd.MM. HH:mm"))
}

@Composable
private fun MoreOverviewHero(data: BootstrapData) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                    Icon(
                        Icons.Rounded.Map,
                        contentDescription = null,
                        modifier = Modifier
                            .size(42.dp)
                            .padding(10.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Pregled evidencija", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Text(
                        "Tvrtke, lokacije, ponude, dokumenti, rokovi i temeljna dokumentacija.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusCountPill("Tvrtke", data.companies.size, Color(0xFF2563EB))
                StatusCountPill("Lokacije", data.locations.size, Color(0xFF0F766E))
                StatusCountPill("Ponude", data.offers.size, Color(0xFF1D4ED8))
                StatusCountPill("Oprema", data.measurementEquipmentRecords.size, Color(0xFF0F766E))
                StatusCountPill("Dokumenti", data.documentRecords.size, Color(0xFF7C3AED))
                StatusCountPill("Procjene", data.riskAssessmentRecords.size, Color(0xFFB45309))
            }
        }
    }
}

@Composable
private fun CompanyDirectory(
    companies: List<MobileRecord>,
    locations: List<MobileRecord>,
    query: String,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val filteredCompanies = remember(companies, query) { companies.filter { it.matchesSearch(query) } }
    val locationCountByCompany = remember(locations) {
        locations.groupingBy { record ->
            record.meta["companyName"].orEmpty().ifBlank { record.subtitle.substringBefore(" - ").trim() }
        }.eachCount()
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionHeader(
                title = "Tvrtke",
                subtitle = "${filteredCompanies.size} zapisa",
                icon = Icons.Rounded.Business,
            )

            if (filteredCompanies.isEmpty()) {
                Text("Nema tvrtki za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            } else {
                filteredCompanies.take(14).forEach { company ->
                    DirectoryCompanyLine(
                        company = company,
                        locationCount = locationCountByCompany[company.title].orZero(),
                        onClick = { onOpenRecord(company) },
                    )
                }
                if (filteredCompanies.size > 14) {
                    Text(
                        "Prikazano je prvih 14 tvrtki. Koristi pretragu za sužavanje.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
        }
    }
}

@Composable
private fun LocationDirectory(
    locations: List<MobileRecord>,
    query: String,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val filteredLocations = remember(locations, query) { locations.filter { it.matchesSearch(query) } }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SectionHeader(
                title = "Lokacije",
                subtitle = "${filteredLocations.size} zapisa",
                icon = Icons.Rounded.LocationOn,
            )

            if (filteredLocations.isEmpty()) {
                Text("Nema lokacija za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            } else {
                filteredLocations.take(16).forEach { location ->
                    RecordLine(
                        title = location.title,
                        subtitle = location.subtitle.ifBlank { location.meta["region"].orEmpty() },
                        status = location.status,
                        date = "",
                        icon = Icons.Rounded.LocationOn,
                        onClick = { onOpenRecord(location) },
                    )
                }
                if (filteredLocations.size > 16) {
                    Text(
                        "Prikazano je prvih 16 lokacija. Koristi pretragu za sužavanje.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
        }
    }
}

@Composable
private fun DirectoryCompanyLine(
    company: MobileRecord,
    locationCount: Int,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = Color(0xFFF8FAFC),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = Color(0xFFEAF2FF)) {
                Icon(
                    Icons.Rounded.Business,
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                    tint = Color(0xFF2563EB),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(company.title, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    company.subtitle.ifBlank { company.meta["headquarters"].orEmpty() },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            StatusCountPill("Lok.", locationCount, Color(0xFF0F766E))
        }
    }
}

private data class PeriodicEntry(
    val title: String,
    val subtitle: String,
    val status: String,
    val date: String,
    val kind: String,
    val icon: ImageVector,
) {
    val parsedDate: LocalDate? = parseDateOrNull(date)
}

private fun buildPeriodicEntries(
    data: BootstrapData,
    workOrders: List<WorkOrder>,
    query: String,
): List<PeriodicEntry> {
    val entries = mutableListOf<PeriodicEntry>()
    fun addRecord(record: MobileRecord, fallbackKind: String, icon: ImageVector) {
        if (record.date.isBlank()) return
        if (query.isNotBlank() && !record.matchesSearch(query)) return
        entries += PeriodicEntry(
            title = record.title,
            subtitle = record.subtitle.ifBlank { recordKindLabel(record.kind.ifBlank { fallbackKind }) },
            status = record.status,
            date = record.date,
            kind = record.kind.ifBlank { fallbackKind },
            icon = icon,
        )
    }

    data.documentRecords.forEach { addRecord(it, "document", Icons.Rounded.Description) }
    data.clientPortalRecords.forEach { addRecord(it, "client_portal", Icons.Rounded.Map) }
    data.peopleTrainingRecords.forEach { addRecord(it, "training", Icons.Rounded.Fingerprint) }
    data.rulebooks.forEach { addRecord(it, "rulebook", Icons.Rounded.Lock) }
    data.vehicles.forEach { addRecord(it, "vehicle", Icons.Rounded.Business) }
    workOrders.forEach { workOrder ->
        if (workOrder.dueDate.isBlank()) return@forEach
        val searchText = listOf(
            workOrder.displayNumber,
            workOrder.companyName,
            workOrder.locationName,
            workOrder.status,
            workOrder.displayService,
        ).joinToString(" ")
        if (query.isNotBlank() && !searchText.contains(query, ignoreCase = true)) return@forEach
        entries += PeriodicEntry(
            title = workOrder.displayNumber,
            subtitle = listOf(workOrder.companyName, workOrder.locationName, workOrder.displayService)
                .filter { it.isNotBlank() }
                .joinToString(" - "),
            status = workOrder.status,
            date = workOrder.dueDate,
            kind = "work_order",
            icon = Icons.Rounded.Work,
        )
    }

    return entries
        .distinctBy { "${it.kind}:${it.title}:${it.date}:${it.subtitle}" }
        .sortedWith(compareBy<PeriodicEntry> { it.parsedDate ?: LocalDate.MAX }.thenBy { it.title.lowercase(Locale.getDefault()) })
}

@Composable
private fun PeriodicsPreview(entries: List<PeriodicEntry>) {
    val today = remember { LocalDate.now() }
    val overdue = remember(entries, today) { entries.count { entry -> entry.parsedDate?.isBefore(today) == true } }
    val next30 = remember(entries, today) {
        entries.count { entry ->
            val date = entry.parsedDate ?: return@count false
            !date.isBefore(today) && !date.isAfter(today.plusDays(30))
        }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "Periodika",
                subtitle = "Rokovi po dokumentima, RN-ovima, vozilima i osposobljavanjima",
                icon = Icons.Rounded.CalendarMonth,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PeriodicStatTile("Ukupno", entries.size, Color(0xFF2563EB), Modifier.weight(1f))
                PeriodicStatTile("Kasni", overdue, Color(0xFFDC2626), Modifier.weight(1f))
                PeriodicStatTile("30 dana", next30, Color(0xFFB45309), Modifier.weight(1f))
            }
            if (entries.isEmpty()) {
                Text("Nema periodičkih rokova za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            } else {
                entries.take(8).forEach { entry -> PeriodicLine(entry, today) }
            }
        }
    }
}

@Composable
private fun PeriodicStatTile(
    label: String,
    count: Int,
    accent: Color,
    modifier: Modifier,
) {
    Surface(modifier = modifier, shape = RoundedCornerShape(16.dp), color = accent.copy(alpha = 0.1f)) {
        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(count.toString(), color = accent, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.68f))
        }
    }
}

@Composable
private fun PeriodicLine(entry: PeriodicEntry, today: LocalDate) {
    val parsedDate = entry.parsedDate
    val accent = when {
        parsedDate == null -> Color(0xFF475569)
        parsedDate.isBefore(today) -> Color(0xFFDC2626)
        !parsedDate.isAfter(today.plusDays(30)) -> Color(0xFFB45309)
        else -> Color(0xFF059669)
    }
    val dueText = when {
        parsedDate == null -> entry.date
        parsedDate.isBefore(today) -> "Kasni ${today.toEpochDay() - parsedDate.toEpochDay()} dana"
        parsedDate == today -> "Danas"
        else -> "Za ${parsedDate.toEpochDay() - today.toEpochDay()} dana"
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = accent.copy(alpha = 0.08f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(entry.icon, contentDescription = null, modifier = Modifier.size(22.dp), tint = accent)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(entry.title.ifBlank { recordKindLabel(entry.kind) }, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOf(entry.subtitle, formatDateLabel(entry.date).ifBlank { entry.date.take(10) }).filter { it.isNotBlank() }.joinToString(" - "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.12f)) {
                Text(
                    dueText,
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                    color = accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun DocumentRegisterPreview(
    records: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    RecordsContent(
        title = "Dokumenti i zapisnici",
        records = records,
        emptyText = "Nema dokumenata za prikaz.",
        icon = Icons.Rounded.Description,
        onOpenRecord = onOpenRecord,
    )
}

@Composable
private fun ServicesCatalogPreview(
    services: List<WorkOrderServiceOption>,
    query: String,
) {
    val filtered = remember(services, query) {
        services.filter { service ->
            query.isBlank() ||
                listOf(service.name, service.serviceCode, service.type, service.note).joinToString(" ").contains(query, ignoreCase = true)
        }
    }
    val groups = remember(filtered) { filtered.groupBy { serviceCatalogMobileGroup(it) } }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "Service liste",
                subtitle = "Pravilnici, mjerna oprema, Safety Authorization i ostale usluge",
                icon = Icons.Rounded.ListAlt,
            )
            if (filtered.isEmpty()) {
                Text("Nema usluga za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            }
            listOf("Pravilnici", "Mjerna oprema", "Safety Authorization", "Ostale usluge").forEach { groupTitle ->
                val groupItems = groups[groupTitle].orEmpty()
                ServiceGroupBlock(groupTitle, groupItems)
            }
        }
    }
}

private fun serviceCatalogMobileGroup(service: WorkOrderServiceOption): String {
    val text = listOf(service.name, service.serviceCode, service.type, service.note)
        .joinToString(" ")
        .lowercase(Locale.getDefault())
        .replace("š", "s")
        .replace("ž", "z")
        .replace("č", "c")
        .replace("ć", "c")
    return when {
        text.contains("pravilnik") || text.startsWith("pr-") -> "Pravilnici"
        text.contains("mjer") || text.contains("measurement") || text.contains("oprema") -> "Mjerna oprema"
        text.contains("authorization") || text.contains("ovlast") || text.contains("autoriz") -> "Safety Authorization"
        else -> "Ostale usluge"
    }
}

@Composable
private fun ServiceGroupBlock(
    title: String,
    services: List<WorkOrderServiceOption>,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
            Text("${services.size}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
        }
        if (services.isEmpty()) {
            Text("Nema stavki u ovoj listi.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f))
        } else {
            services.take(8).forEach { service ->
                ServiceCatalogLine(service)
            }
        }
    }
}

@Composable
private fun ServiceCatalogLine(service: WorkOrderServiceOption) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)) {
                Text(
                    service.serviceCode.ifBlank { "SRV" }.take(8),
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 7.dp),
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Black,
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(service.name.ifBlank { service.serviceCode.ifBlank { "Usluga" } }, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(
                    listOf(service.type, service.validityMonths.takeIf { it.isNotBlank() }?.let { "$it mj." }).filterNotNull().filter { it.isNotBlank() }.joinToString(" - "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

data class MobileTrainingDocument(
    val id: String,
    val fileName: String,
    val fileType: String,
    val category: String,
    val createdAt: String,
    val isCertificate: Boolean,
)

private data class MobileTrainingItem(
    val id: String,
    val label: String,
    val shortLabel: String,
    val status: String,
    val passedOn: String,
    val validUntil: String,
    val validForever: Boolean,
    val certificateNumber: String,
    val provider: String,
    val documentId: String,
    val documentName: String,
)

private fun parseTrainingItems(record: MobileRecord): List<MobileTrainingItem> {
    val raw = record.meta["trainingItemsJson"].orEmpty()
    if (raw.isBlank()) return emptyList()
    return runCatching {
        val array = JSONArray(raw)
        buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                add(
                    MobileTrainingItem(
                        id = item.optString("id").trim(),
                        label = item.optString("label").trim().ifBlank { "Osposobljavanje" },
                        shortLabel = item.optString("shortLabel").trim(),
                        status = item.optString("status").trim().ifBlank { "Evidencija" },
                        passedOn = item.optString("passedOn").trim(),
                        validUntil = item.optString("validUntil").trim(),
                        validForever = item.optBoolean("validForever", false) || item.optString("validForever").equals("true", ignoreCase = true),
                        certificateNumber = item.optString("certificateNumber").trim(),
                        provider = item.optString("provider").trim(),
                        documentId = item.optString("documentId").trim(),
                        documentName = item.optString("documentName").trim(),
                    ),
                )
            }
        }
    }.getOrDefault(emptyList())
}

private fun parseTrainingDocuments(record: MobileRecord): List<MobileTrainingDocument> {
    val raw = record.meta["documentsJson"].orEmpty()
    if (raw.isBlank()) return emptyList()
    return runCatching {
        val array = JSONArray(raw)
        buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                val id = item.optString("id").trim()
                val fileName = item.optString("fileName").trim()
                if (id.isBlank() && fileName.isBlank()) continue
                add(
                    MobileTrainingDocument(
                        id = id,
                        fileName = fileName.ifBlank { "Dokument" },
                        fileType = item.optString("fileType").trim().ifBlank { "application/octet-stream" },
                        category = item.optString("documentCategory").trim(),
                        createdAt = item.optString("createdAt").trim(),
                        isCertificate = item.optBoolean("isCertificate", false) || item.optString("isCertificate").equals("true", ignoreCase = true),
                    ),
                )
            }
        }
    }.getOrDefault(emptyList())
}

private fun trainingStatusColor(status: String): Color {
    val normalized = status.lowercase(Locale.getDefault())
    return when {
        normalized.contains("istek") -> Color(0xFFDC2626)
        normalized.contains("uskoro") -> Color(0xFFB45309)
        normalized.contains("nedost") || normalized.contains("gres") || normalized.contains("greš") -> Color(0xFF64748B)
        normalized.contains("trajno") || normalized.contains("vrijed") || normalized.contains("aktiv") || normalized.contains("znr") -> Color(0xFF059669)
        else -> Color(0xFF2563EB)
    }
}

private fun normalizePeopleOib(value: String): String = value.filter { it.isDigit() }.take(11)

private fun parsePeopleIsznrTags(value: String): List<String> {
    val normalized = value.trim()
    if (normalized.isBlank()) return emptyList()
    if (normalized.startsWith("[")) {
        return runCatching {
            val array = JSONArray(normalized)
            buildList {
                for (index in 0 until array.length()) {
                    val tag = array.optString(index).trim()
                    if (tag.isNotBlank()) add(tag)
                }
            }
        }.getOrDefault(emptyList())
    }
    return normalized.split(",", " ", "\n", "\t")
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
}

private fun getPeopleIsznrTags(user: WorkOrderUserOption, record: MobileRecord?): List<String> =
    (user.isznrTags + parsePeopleIsznrTags(record?.meta?.get("isznrTagsJson").orEmpty()) + parsePeopleIsznrTags(record?.meta?.get("isznrTags").orEmpty()))
        .map { it.trim() }
        .filter { it.startsWith("IsZNR") }
        .distinct()

@Composable
private fun PeopleDirectoryContent(
    users: List<WorkOrderUserOption>,
    isznrRecords: List<MobileRecord>,
    totalCount: Int,
    isznrLoading: Boolean,
    isznrLoaded: Boolean,
    isznrError: String,
    displayLimit: Int,
    onLoadIsznr: (Boolean) -> Unit,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val isznrByOib = remember(isznrRecords) {
        isznrRecords
            .mapNotNull { record ->
                val oib = normalizePeopleOib(record.meta["oib"].orEmpty())
                if (oib.isBlank()) null else oib to record
            }
            .toMap()
    }
    val linkedIsznrCount = remember(isznrRecords) {
        isznrRecords.count { record -> record.meta["isznrLinked"].equals("true", ignoreCase = true) }
    }
    val usersWithOib = remember(users) { users.count { user -> normalizePeopleOib(user.oib).isNotBlank() } }
    val visibleUsers = remember(users, displayLimit) { users.take(displayLimit.coerceAtLeast(1)) }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "People",
                subtitle = "$totalCount korisnika · $usersWithOib s OIB-om · $linkedIsznrCount IS ZNR povezano",
                icon = Icons.Rounded.Person,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (isznrLoaded) "IS ZNR oznake su upisane na People osobe." else "Osvježi za provjeru OIB-a i dodjelu IS ZNR oznaka.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    modifier = Modifier.weight(1f),
                )
                IconButton(onClick = { onLoadIsznr(true) }, enabled = !isznrLoading) {
                    Icon(Icons.Rounded.Refresh, contentDescription = "Osvježi IS ZNR oznake")
                }
            }
            AnimatedVisibility(isznrLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            AnimatedVisibility(isznrError.isNotBlank()) {
                MessageCard(text = isznrError, isError = true)
            }
            if (users.isEmpty()) {
                Text(
                    "Nema People korisnika za prikaz.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                )
            } else {
                visibleUsers.forEach { user ->
                    val oib = normalizePeopleOib(user.oib)
                    PeopleUserLine(
                        user = user,
                        isznrRecord = isznrByOib[oib],
                        isznrLoaded = isznrLoaded,
                        onOpenRecord = onOpenRecord,
                    )
                }
                if (users.size > visibleUsers.size) {
                    Text(
                        "Prikazano je prvih ${visibleUsers.size}. Koristi pretragu za sužavanje popisa.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
        }
    }
}

@Composable
private fun PeopleUserLine(
    user: WorkOrderUserOption,
    isznrRecord: MobileRecord?,
    isznrLoaded: Boolean,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val oib = normalizePeopleOib(user.oib)
    val tags = getPeopleIsznrTags(user, isznrRecord)
    val linked = (
        isznrRecord?.meta?.get("isznrLinked").equals("true", ignoreCase = true)
            || tags.isNotEmpty()
    )
    val hasError = isznrRecord?.meta?.get("isznrError").orEmpty().isNotBlank()
    val accent = when {
        oib.isBlank() -> Color(0xFF64748B)
        linked -> Color(0xFF059669)
        hasError -> Color(0xFFDC2626)
        isznrLoaded -> Color(0xFFB45309)
        else -> Color(0xFF2563EB)
    }
    val statusText = when {
        oib.isBlank() -> "Bez OIB-a"
        linked -> tags.firstOrNull() ?: isznrRecord?.status?.ifBlank { "Povezano" } ?: "Povezano"
        hasError -> "Greška IS ZNR"
        isznrLoaded -> "Nije pronađeno"
        else -> "Nije provjereno"
    }
    val rowModifier = Modifier
        .fillMaxWidth()
        .then(if (isznrRecord != null) Modifier.clickable { onOpenRecord(isznrRecord) } else Modifier)

    Surface(
        modifier = rowModifier,
        shape = RoundedCornerShape(18.dp),
        color = accent.copy(alpha = 0.07f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = CircleShape, color = accent.copy(alpha = 0.14f)) {
                Icon(
                    if (linked) Icons.Rounded.CheckCircle else Icons.Rounded.Person,
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                    tint = accent,
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(user.label.ifBlank { user.fullName.ifBlank { user.email.ifBlank { "People korisnik" } } }, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOf(user.email, user.fullName.takeIf { it != user.label }).filterNotNull().filter { it.isNotBlank() }.joinToString(" · ").ifBlank { "People modul" },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    if (oib.isNotBlank()) {
                        TrainingMiniChip("OIB $oib", Color(0xFF64748B))
                    }
                    tags.forEach { tag -> TrainingMiniChip(tag, Color(0xFF059669)) }
                    isznrRecord?.meta?.get("isznrIds")?.takeIf { it.isNotBlank() }?.let { TrainingMiniChip(it, Color(0xFF2563EB)) }
                }
            }
            TrainingMiniChip(statusText, accent)
        }
    }
}

@Composable
private fun TrainingContent(
    records: List<MobileRecord>,
    totalCount: Int,
    displayLimit: Int,
    onOpenRecord: (MobileRecord) -> Unit,
    onDownloadDocument: (MobileRecord, MobileTrainingDocument) -> Unit,
) {
    val visibleRecords = remember(records, displayLimit) { records.take(displayLimit.coerceAtLeast(1)) }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "Osposobljavanja",
                subtitle = "$totalCount dosjea",
                icon = Icons.Rounded.Fingerprint,
            )

            if (records.isEmpty()) {
                Text(
                    "Nema osposobljavanja za prikaz.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                )
            } else {
                visibleRecords.forEach { record ->
                    TrainingRecordLine(
                        record = record,
                        onOpenRecord = onOpenRecord,
                        onDownloadDocument = { document -> onDownloadDocument(record, document) },
                    )
                }
                if (records.size > visibleRecords.size) {
                    Text(
                        "Prikazano je prvih ${visibleRecords.size}. Koristi pretragu za suzavanje popisa.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
        }
    }
}

@Composable
private fun TrainingRecordLine(
    record: MobileRecord,
    onOpenRecord: (MobileRecord) -> Unit,
    onDownloadDocument: (MobileTrainingDocument) -> Unit,
) {
    val items = remember(record.meta["trainingItemsJson"]) { parseTrainingItems(record) }
    val documents = remember(record.meta["documentsJson"]) { parseTrainingDocuments(record) }
    val statusColor = trainingStatusColor(record.status)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenRecord(record) },
        shape = RoundedCornerShape(18.dp),
        color = statusColor.copy(alpha = 0.07f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(shape = CircleShape, color = statusColor.copy(alpha = 0.14f)) {
                    Icon(
                        Icons.Rounded.Fingerprint,
                        contentDescription = null,
                        modifier = Modifier
                            .size(38.dp)
                            .padding(9.dp),
                        tint = statusColor,
                    )
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(record.title, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    if (record.subtitle.isNotBlank()) {
                        Text(
                            record.subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                TrainingMiniChip(record.status.ifBlank { "Evidencija" }, statusColor)
            }

            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                record.meta["oib"]?.takeIf { it.isNotBlank() }?.let { TrainingMiniChip("OIB $it", Color(0xFF64748B)) }
                record.meta["trainingCount"]?.takeIf { it != "0" }?.let { TrainingMiniChip("$it ospos.", Color(0xFF2563EB)) }
                record.meta["documentCount"]?.takeIf { it != "0" }?.let { TrainingMiniChip("$it dok.", Color(0xFF7C3AED)) }
                record.meta["expiredCount"]?.takeIf { it != "0" }?.let { TrainingMiniChip("$it isteklo", Color(0xFFDC2626)) }
                record.meta["expiringCount"]?.takeIf { it != "0" }?.let { TrainingMiniChip("$it uskoro", Color(0xFFB45309)) }
            }

            items.take(4).forEach { item ->
                val itemColor = trainingStatusColor(item.status)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TrainingMiniChip(item.shortLabel.ifBlank { item.status }, itemColor)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item.label, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        val dateText = when {
                            item.validForever -> "Vrijedi trajno"
                            item.validUntil.isNotBlank() -> "Vrijedi do ${formatDateLabel(item.validUntil).ifBlank { item.validUntil }}"
                            item.passedOn.isNotBlank() -> "Datum ${formatDateLabel(item.passedOn).ifBlank { item.passedOn }}"
                            else -> item.provider
                        }
                        if (dateText.isNotBlank()) {
                            Text(
                                dateText,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }

            if (documents.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    documents.take(4).forEach { document ->
                        OutlinedButton(
                            onClick = { onDownloadDocument(document) },
                            enabled = document.id.isNotBlank(),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(12.dp),
                        ) {
                            Icon(Icons.Rounded.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(document.fileName, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PeopleIsznrLine(record: MobileRecord, onOpenRecord: (MobileRecord) -> Unit) {
    val linked = record.meta["isznrLinked"].equals("true", ignoreCase = true)
    val hasError = record.meta["isznrError"].orEmpty().isNotBlank()
    val accent = if (linked) Color(0xFF059669) else if (hasError) Color(0xFFDC2626) else Color(0xFF64748B)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenRecord(record) },
        shape = RoundedCornerShape(18.dp),
        color = accent.copy(alpha = 0.08f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = CircleShape, color = accent.copy(alpha = 0.14f)) {
                Icon(
                    if (linked) Icons.Rounded.CheckCircle else Icons.Rounded.Person,
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                    tint = accent,
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(record.title, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    record.subtitle.ifBlank { "OIB ${record.meta["oib"].orEmpty()}" },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    record.meta["oib"]?.takeIf { it.isNotBlank() }?.let { TrainingMiniChip("OIB $it", Color(0xFF64748B)) }
                    record.meta["isznrRoles"]?.takeIf { it.isNotBlank() }?.let { TrainingMiniChip(it, Color(0xFF059669)) }
                    record.meta["isznrError"]?.takeIf { it.isNotBlank() }?.let { TrainingMiniChip("Greska", Color(0xFFDC2626)) }
                }
            }
            Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.12f)) {
                Text(
                    if (linked) "✓" else "—",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    color = accent,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Black,
                )
            }
        }
    }
}

@Composable
private fun TrainingMiniChip(label: String, accent: Color) {
    Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.1f)) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = accent,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun MeasurementEquipmentContent(
    records: List<MobileRecord>,
    isznrRecords: List<MobileRecord>,
    totalCount: Int,
    isznrTotalCount: Int,
    isznrLoading: Boolean,
    isznrLoaded: Boolean,
    isznrError: String,
    displayLimit: Int,
    onLoadIsznr: (Boolean) -> Unit,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    var selectedTab by remember { mutableStateOf(MeasurementEquipmentTab.All) }
    val localIsznrCount = remember(records) {
        records.count { record -> record.meta["isznrLinked"].equals("true", ignoreCase = true) }
    }
    val isznrAudit = remember(records, isznrRecords) {
        buildMeasurementEquipmentIsznrAudit(records, isznrRecords)
    }
    val tabRecords = remember(records, isznrRecords, selectedTab) {
        when (selectedTab) {
            MeasurementEquipmentTab.All -> records
            MeasurementEquipmentTab.Isznr -> isznrRecords
        }
    }
    val visibleRecords = remember(tabRecords, displayLimit) { tabRecords.take(displayLimit.coerceAtLeast(1)) }

    LaunchedEffect(selectedTab, isznrLoaded, isznrLoading) {
        if (selectedTab == MeasurementEquipmentTab.Isznr && !isznrLoaded && !isznrLoading) {
            onLoadIsznr(false)
        }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "Mjerna oprema",
                subtitle = "$totalCount lokalno · $isznrTotalCount IS ZNR · $localIsznrCount povezano",
                icon = Icons.Rounded.Work,
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MeasurementEquipmentTabChip(
                    label = "Sve",
                    count = totalCount,
                    selected = selectedTab == MeasurementEquipmentTab.All,
                    onClick = { selectedTab = MeasurementEquipmentTab.All },
                )
                MeasurementEquipmentTabChip(
                    label = "IS ZNR",
                    count = isznrTotalCount,
                    selected = selectedTab == MeasurementEquipmentTab.Isznr,
                    onClick = {
                        selectedTab = MeasurementEquipmentTab.Isznr
                        onLoadIsznr(false)
                    },
                )
            }
            if (selectedTab == MeasurementEquipmentTab.Isznr) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        if (isznrLoaded) "Live popis iz IS ZNR-a" else "IS ZNR popis se učitava nakon otvaranja taba.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                        modifier = Modifier.weight(1f),
                    )
                    IconButton(onClick = { onLoadIsznr(true) }, enabled = !isznrLoading) {
                        Icon(Icons.Rounded.Refresh, contentDescription = "Osvježi IS ZNR")
                    }
                }
                AnimatedVisibility(isznrLoading) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                AnimatedVisibility(isznrError.isNotBlank()) {
                    MessageCard(text = isznrError, isError = true)
                }
            }
            if (!isznrLoading && tabRecords.isEmpty()) {
                val emptyText = when (selectedTab) {
                    MeasurementEquipmentTab.All -> "Nema mjerne opreme za prikaz."
                    MeasurementEquipmentTab.Isznr -> "IS ZNR nije vratio mjernu opremu za prikaz."
                }
                Text(emptyText, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            } else if (tabRecords.isNotEmpty()) {
                visibleRecords.forEach { record ->
                    MeasurementEquipmentLine(record = record, onOpenRecord = onOpenRecord)
                }
                if (tabRecords.size > visibleRecords.size) {
                    Text(
                        "Prikazano je prvih ${visibleRecords.size}. Koristi pretragu za sužavanje popisa.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
            }
            if (selectedTab == MeasurementEquipmentTab.All) {
                MeasurementEquipmentIsznrAuditCard(
                    audit = isznrAudit,
                    isznrLoading = isznrLoading,
                    isznrLoaded = isznrLoaded,
                    isznrError = isznrError,
                    onLoadIsznr = { onLoadIsznr(true) },
                )
            }
        }
    }
}

private enum class MeasurementEquipmentTab {
    All,
    Isznr,
}

private data class MeasurementEquipmentIsznrAudit(
    val totalCount: Int,
    val linkedCount: Int,
    val probableCount: Int,
    val missingCount: Int,
) {
    val actionCount: Int
        get() = probableCount + missingCount
}

private data class MeasurementEquipmentIsznrAuditVisual(
    val accent: Color,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
)

private fun buildMeasurementEquipmentIsznrAudit(
    localRecords: List<MobileRecord>,
    isznrRecords: List<MobileRecord>,
): MeasurementEquipmentIsznrAudit {
    val localIds = localRecords
        .mapNotNull { record -> record.measurementEquipmentIsznrId().normalizeMeasurementAuditKey().takeIf { it.isNotBlank() } }
        .toSet()
    val localSerials = localRecords
        .flatMap { record -> listOf(record.meta["serialNumber"].orEmpty(), record.meta["inventoryNumber"].orEmpty()) }
        .map { it.normalizeMeasurementAuditKey() }
        .filter { it.isNotBlank() }
        .toSet()
    val localNames = localRecords
        .map { it.title.normalizeMeasurementAuditKey() }
        .filter { it.isNotBlank() }
        .toSet()

    var linked = 0
    var probable = 0
    var missing = 0
    isznrRecords.forEach { record ->
        val isznrId = record.measurementEquipmentIsznrId().normalizeMeasurementAuditKey()
        val serial = record.meta["serialNumber"].orEmpty().normalizeMeasurementAuditKey()
        val name = record.title.normalizeMeasurementAuditKey()
        when {
            isznrId.isNotBlank() && localIds.contains(isznrId) -> linked += 1
            serial.isNotBlank() && localSerials.contains(serial) -> probable += 1
            name.isNotBlank() && localNames.contains(name) -> probable += 1
            else -> missing += 1
        }
    }
    return MeasurementEquipmentIsznrAudit(
        totalCount = isznrRecords.size,
        linkedCount = linked,
        probableCount = probable,
        missingCount = missing,
    )
}

private fun MobileRecord.measurementEquipmentIsznrId(): String =
    meta["isznrInstrumentId"].orEmpty()
        .ifBlank { meta["isznrId"].orEmpty() }
        .ifBlank { meta["externalIsznrId"].orEmpty() }
        .ifBlank { relatedId }

private fun String.normalizeMeasurementAuditKey(): String =
    trim()
        .lowercase(Locale.getDefault())
        .replace(Regex("\\s+"), " ")

@Composable
private fun MeasurementEquipmentIsznrAuditCard(
    audit: MeasurementEquipmentIsznrAudit,
    isznrLoading: Boolean,
    isznrLoaded: Boolean,
    isznrError: String,
    onLoadIsznr: () -> Unit,
) {
    val visual = when {
        isznrLoading -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFF2563EB),
            title = "Dohvaćam cijeli IS ZNR popis...",
            subtitle = "Provjeravam uređaje iz državnog registra prema lokalnoj mjernoj opremi.",
            icon = Icons.Rounded.Refresh,
        )
        isznrError.isNotBlank() -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFFDC2626),
            title = "IS ZNR provjera nije uspjela",
            subtitle = isznrError,
            icon = Icons.Rounded.ErrorOutline,
        )
        !isznrLoaded -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFF64748B),
            title = "IS ZNR kontrola nije pokrenuta",
            subtitle = "Osvježi IS ZNR opremu za provjeru je li lokalni registar ažuran.",
            icon = Icons.Rounded.Work,
        )
        audit.totalCount == 0 -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFF64748B),
            title = "IS ZNR nije vratio opremu",
            subtitle = "Nema uređaja za usporedbu s lokalnim registrom.",
            icon = Icons.Rounded.Work,
        )
        audit.actionCount == 0 -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFF059669),
            title = "Svi uređaji su ažurirani",
            subtitle = "Povezano ${audit.linkedCount}/${audit.totalCount} uređaja iz IS ZNR-a.",
            icon = Icons.Rounded.CheckCircle,
        )
        else -> MeasurementEquipmentIsznrAuditVisual(
            accent = Color(0xFFB45309),
            title = "Fali ili treba povezati ${audit.actionCount} uređaja",
            subtitle = "${audit.missingCount} nema lokalno · ${audit.probableCount} treba IS ZNR ID · povezano ${audit.linkedCount}/${audit.totalCount}.",
            icon = Icons.Rounded.ErrorOutline,
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = visual.accent.copy(alpha = 0.1f),
        tonalElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = CircleShape, color = visual.accent.copy(alpha = 0.14f)) {
                Icon(
                    visual.icon,
                    contentDescription = null,
                    tint = visual.accent,
                    modifier = Modifier
                        .size(36.dp)
                        .padding(8.dp),
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(visual.title, color = visual.accent, fontWeight = FontWeight.Black)
                Text(
                    visual.subtitle,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            if (!isznrLoading) {
                IconButton(onClick = onLoadIsznr) {
                    Icon(Icons.Rounded.Refresh, contentDescription = "Osvježi IS ZNR opremu", tint = visual.accent)
                }
            }
        }
    }
}

@Composable
private fun MeasurementEquipmentTabChip(
    label: String,
    count: Int,
    selected: Boolean,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = {
            Text("$label ($count)", fontWeight = if (selected) FontWeight.Black else FontWeight.SemiBold)
        },
    )
}

@Composable
private fun MeasurementEquipmentLine(
    record: MobileRecord,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val isIsznr = record.meta["isznrLinked"].equals("true", ignoreCase = true)
    val accent = if (isIsznr) Color(0xFF059669) else Color(0xFF64748B)
    val validUntil = record.meta["validUntil"].orEmpty()
    val serial = record.meta["serialNumber"].orEmpty()
    val inventory = record.meta["inventoryNumber"].orEmpty()
    val isznrId = record.meta["isznrInstrumentId"].orEmpty()
    val secondary = listOf(
        record.subtitle,
        if (validUntil.isNotBlank()) "Vrijedi do ${formatDateLabel(validUntil).ifBlank { validUntil }}" else "",
    ).filter { it.isNotBlank() }.joinToString(" - ")

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenRecord(record) },
        shape = RoundedCornerShape(18.dp),
        color = accent.copy(alpha = 0.08f),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(shape = CircleShape, color = accent.copy(alpha = 0.14f)) {
                Icon(
                    if (isIsznr) Icons.Rounded.CheckCircle else Icons.Rounded.Work,
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .padding(9.dp),
                    tint = accent,
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(record.title, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (secondary.isNotBlank()) {
                    Text(
                        secondary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    if (isznrId.isNotBlank()) MeasurementEquipmentMiniChip("IS ZNR ID $isznrId", accent)
                    if (serial.isNotBlank()) MeasurementEquipmentMiniChip("Ser. $serial", Color(0xFF2563EB))
                    if (inventory.isNotBlank()) MeasurementEquipmentMiniChip("Inv. $inventory", Color(0xFF7C3AED))
                }
            }
            Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.12f)) {
                Text(
                    if (isIsznr) "✓" else "—",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    color = accent,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Black,
                )
            }
        }
    }
}

@Composable
private fun MeasurementEquipmentMiniChip(label: String, accent: Color) {
    Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.1f)) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = accent,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}

@Composable
private fun FoundationDocumentationPreview(
    rulebooks: List<MobileRecord>,
    assessments: List<MobileRecord>,
    documents: List<MobileRecord>,
    onOpenRecord: (MobileRecord) -> Unit,
) {
    val foundationDocuments = remember(documents) {
        documents.filter { record ->
            val text = listOf(record.title, record.subtitle, record.status, record.meta.values.joinToString(" "))
                .joinToString(" ")
                .lowercase(Locale.getDefault())
            text.contains("temelj") || text.contains("procjen") || text.contains("risk")
        }
    }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp,
        shadowElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            SectionHeader(
                title = "Temeljna dokumentacija i procjene",
                subtitle = "${rulebooks.size} pravilnika · ${assessments.size} procjena",
                icon = Icons.Rounded.Lock,
            )
            rulebooks.take(6).forEach { record ->
                RecordLine(record.title, record.subtitle, record.status, record.date, Icons.Rounded.Lock) { onOpenRecord(record) }
            }
            assessments.take(6).forEach { record ->
                RecordLine(record.title, record.subtitle, record.status, record.date, Icons.Rounded.Description) { onOpenRecord(record) }
            }
            foundationDocuments.take(6).forEach { record ->
                RecordLine(record.title, record.subtitle, record.status, record.date, Icons.Rounded.InsertDriveFile) { onOpenRecord(record) }
            }
            if (rulebooks.isEmpty() && assessments.isEmpty() && foundationDocuments.isEmpty()) {
                Text("Nema temeljne dokumentacije za prikaz.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String,
    icon: ImageVector,
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
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

private fun Int?.orZero(): Int = this ?: 0

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
    "field_inquiry" -> Icons.Rounded.EventNote
    "offer" -> Icons.Rounded.Description
    "todo_task" -> Icons.Rounded.ListAlt
    "vehicle", "vehicle_reservation" -> Icons.Rounded.Business
    "document" -> Icons.Rounded.Mail
    "training" -> Icons.Rounded.Fingerprint
    "company" -> Icons.Rounded.Business
    "location" -> Icons.Rounded.LocationOn
    "rulebook" -> Icons.Rounded.Lock
    "risk_assessment" -> Icons.Rounded.Description
    "client_portal" -> Icons.Rounded.Map
    else -> fallback
}

private fun recordKindLabel(kind: String): String = when (kind) {
    "work_order" -> "Radni nalog"
    "field_inquiry" -> "Plan terena"
    "offer" -> "Ponuda"
    "todo_task" -> "ToDo"
    "vehicle" -> "Vozilo"
    "vehicle_reservation" -> "Rezervacija vozila"
    "document" -> "Dokument"
    "training" -> "Osposobljavanje"
    "company" -> "Tvrtka"
    "location" -> "Lokacija"
    "rulebook" -> "Pravilnik"
    "risk_assessment" -> "Procjena rizika"
    "client_portal" -> "Klijentski portal"
    else -> "Zapis"
}

private val offerDetailMetaKeys = setOf(
    "offerNumber",
    "title",
    "companyName",
    "locationName",
    "contactName",
    "contactEmail",
    "contactPhone",
    "serviceLine",
    "offerDate",
    "validUntil",
    "amountWithoutVat",
    "totalWithVat",
    "currency",
)

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

private fun String.normalizedRnStatus(): String =
    lowercase(Locale.getDefault())
        .replace("š", "s")
        .replace("ž", "z")
        .replace("č", "c")
        .replace("ć", "c")
        .trim()

private fun WorkOrder.hasRnStatus(expectedStatus: String): Boolean =
    status.normalizedRnStatus() == expectedStatus.normalizedRnStatus()

private fun WorkOrder.isCancelledRnStatus(): Boolean {
    val normalized = status.normalizedRnStatus()
    return normalized.contains("storno") || normalized.contains("storniran")
}

private fun WorkOrder.isOpenRnStatus(): Boolean {
    return status.normalizedRnStatus().contains("otvoren")
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
    val isKnownStatus: Boolean = true,
)

private fun rnStatusStyle(workOrder: WorkOrder): RnStatusStyle = rnStatusStyle(workOrder.status)

private fun rnStatusStyle(status: String): RnStatusStyle {
    val normalized = status.normalizedRnStatus()
    return when {
        normalized.contains("otvoren") -> RnStatusStyle("OTVORENI", Color(0xFF64748B), Color(0xFFF1F5F9))
        normalized.contains("storno") || normalized.contains("storniran") -> RnStatusStyle("STORNO", Color(0xFF374151), Color(0xFFE5E7EB))
        normalized.contains("ovjeren") -> RnStatusStyle("OVJEREN", Color(0xFFA16207), Color(0xFFFEF3C7))
        normalized.contains("gotov") -> RnStatusStyle("GOTOV", Color(0xFF16A34A), Color(0xFFDCFCE7))
        normalized.contains("faktur") -> RnStatusStyle("FAKTURIRAN", Color(0xFF166534), Color(0xFFBBF7D0))
        else -> RnStatusStyle(status.ifBlank { "STATUS" }.uppercase(Locale.getDefault()), Color(0xFF64748B), Color(0xFFF1F5F9), false)
    }
}

private fun workOrderFilterAccentColor(filter: WorkOrderFilter): Color = when (filter) {
    WorkOrderFilter.All -> Color(0xFF475569)
    WorkOrderFilter.Mine -> Color(0xFF2563EB)
    WorkOrderFilter.Open -> rnStatusStyle("Otvoreni RN").accent
    WorkOrderFilter.Done -> rnStatusStyle("Gotov RN").accent
    WorkOrderFilter.Verified -> rnStatusStyle("Ovjeren RN").accent
    WorkOrderFilter.Invoiced -> rnStatusStyle("Fakturiran RN").accent
    WorkOrderFilter.Cancelled -> rnStatusStyle("Storno RN").accent
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
    val statusStyle = rnStatusStyle(workOrder)
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
                IconButton(
                    onClick = onAddDocumentation,
                    enabled = !isLoading,
                    modifier = Modifier.size(42.dp),
                ) {
                    Icon(
                        Icons.Rounded.Description,
                        contentDescription = "Dodaj dokumentaciju",
                        modifier = Modifier.size(21.dp),
                        tint = if (isLoading) Color(0xFF94A3B8) else statusStyle.accent,
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
                color = statusStyle.background.copy(alpha = 0.82f),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Rounded.Business,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = statusStyle.accent,
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
                    tint = statusStyle.accent,
                    modifier = Modifier.fillMaxWidth(),
                )
                RnInfoBlock(
                    icon = Icons.Rounded.Business,
                    label = "Izvršitelj",
                    value = workOrder.primaryExecutorLabel(),
                    tint = statusStyle.accent,
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
                        Text("•", color = statusStyle.accent, modifier = Modifier.padding(end = 7.dp))
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
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MobileRecordDetailScreen(
    record: MobileRecord,
    users: List<WorkOrderUserOption>,
    workOrders: List<WorkOrder>,
    currentUserLabel: String,
    isLoading: Boolean,
    onBack: () -> Unit,
    onReserveVehicle: (MobileRecord, String, String, String, String, String, String, String) -> Unit,
    onRecordVehicleUsage: (MobileRecord, String, String, String, String, String, String, String, String, Boolean, Boolean, Boolean, Boolean, String) -> Unit,
    onDownloadVehicleEvidencePdf: (MobileRecord) -> Unit,
    onDownloadOfferPdf: (MobileRecord) -> Unit,
) {
    BackHandler(onBack = onBack)
    var reservationDialogOpen by remember(record.id) { mutableStateOf(false) }
    var usageDialogMode by remember(record.id) { mutableStateOf<String?>(null) }
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
    usageDialogMode?.let { mode ->
        VehicleUsageDialog(
            vehicle = record,
            mode = mode,
            workOrders = workOrders,
            currentUserLabel = currentUserLabel,
            isLoading = isLoading,
            onDismiss = { usageDialogMode = null },
            onConfirm = { selectedMode, odometerKm, destination, reservationId, linkedWorkOrderId, linkedWorkOrderNumber, performedBy, vehicleCondition, vehicleClean, documentsPresent, fuelOk, damageNoted, note ->
                usageDialogMode = null
                onRecordVehicleUsage(
                    record,
                    selectedMode,
                    odometerKm,
                    destination,
                    reservationId,
                    linkedWorkOrderId,
                    linkedWorkOrderNumber,
                    performedBy,
                    vehicleCondition,
                    vehicleClean,
                    documentsPresent,
                    fuelOk,
                    damageNoted,
                    note,
                )
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
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { reservationDialogOpen = true },
                                enabled = !isLoading,
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Rounded.CalendarMonth, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Rezerviraj", fontWeight = FontWeight.Black)
                            }
                            OutlinedButton(
                                onClick = { usageDialogMode = "checkout" },
                                enabled = !isLoading && vehicleAvailabilityStatus(record) != "service",
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Rounded.Work, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Preuzmi", fontWeight = FontWeight.Black)
                            }
                            OutlinedButton(
                                onClick = { usageDialogMode = "return" },
                                enabled = !isLoading && vehicleAvailabilityStatus(record) != "service",
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Rounded.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Vrati", fontWeight = FontWeight.Black)
                            }
                            OutlinedButton(
                                onClick = { onDownloadVehicleEvidencePdf(record) },
                                enabled = !isLoading,
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("PDF evidencija", fontWeight = FontWeight.Black)
                            }
                        }
                    }
                    if (record.kind == "offer") {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { onDownloadOfferPdf(record) },
                                enabled = !isLoading,
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Rounded.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Preuzmi PDF", fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            }

            if (record.kind == "vehicle") {
                val reservations = parseVehicleReservations(record)
                val trips = parseVehicleTrips(record)
                DetailSection("Raspored vozila") {
                    if (reservations.isEmpty()) {
                        DetailRow(Icons.Rounded.CalendarMonth, "Rezervacije", "Nema aktivnih rezervacija.")
                    } else {
                        reservations.take(6).forEach { reservation ->
                            DetailRow(
                                Icons.Rounded.CalendarMonth,
                                reservation.purpose.ifBlank { "Rezervacija" },
                                listOf(
                                    "${formatDateTimeLabel(reservation.startAt)} - ${formatDateTimeLabel(reservation.endAt)}",
                                    reservation.userLabel,
                                    reservation.destination,
                                    vehicleStatusLabel(reservation.status),
                                ).filter { it.isNotBlank() }.joinToString("\n"),
                            )
                        }
                    }
                }
                DetailSection("Evidencija putovanja") {
                    if (trips.isEmpty()) {
                        DetailRow(Icons.Rounded.Description, "Putovanja", "Nema evidentiranih putovanja.")
                    } else {
                        trips.take(8).forEach { trip ->
                            DetailRow(
                                Icons.Rounded.Description,
                                trip.destination.ifBlank { "Putovanje vozila" },
                                listOf(
                                    "Polazak: ${formatVehicleTripDatePart(trip.departureAt)} ${formatVehicleTripTimePart(trip.departureAt)}".trim(),
                                    if (trip.returnAt.isNotBlank()) {
                                        "Povratak: ${formatVehicleTripDatePart(trip.returnAt)} ${formatVehicleTripTimePart(trip.returnAt)}".trim()
                                    } else {
                                        "Povratak: otvoreno"
                                    },
                                    trip.drivers.takeIf { it.isNotBlank() }?.let { "Vozači: $it" }.orEmpty(),
                                    trip.linkedWorkOrderNumber.takeIf { it.isNotBlank() }?.let { "RN: $it" }.orEmpty(),
                                    listOf(
                                        trip.startKm.takeIf { it.isNotBlank() }?.let { "Početna $it km" }.orEmpty(),
                                        trip.endKm.takeIf { it.isNotBlank() }?.let { "Krajnja $it km" }.orEmpty(),
                                    ).filter { it.isNotBlank() }.joinToString(" | "),
                                    trip.condition.takeIf { it.isNotBlank() }?.let { "Stanje: $it" }.orEmpty(),
                                    if (trip.documentCount > 0) {
                                        "Prilozi: ${trip.documentLabels.ifBlank { "${trip.documentCount} dok." }}"
                                    } else {
                                        ""
                                    },
                                ).filter { it.isNotBlank() }.joinToString("\n"),
                            )
                        }
                    }
                }
            }

            if (record.kind == "offer") {
                DetailSection("Ponuda") {
                    DetailRow(Icons.Rounded.Description, "Broj ponude", record.meta["offerNumber"].orEmpty().ifBlank { record.title })
                    DetailRow(Icons.Rounded.Business, "Tvrtka", record.meta["companyName"].orEmpty().ifBlank { "Nije upisano" })
                    DetailRow(Icons.Rounded.LocationOn, "Lokacija", record.meta["locationName"].orEmpty().ifBlank { "Sve lokacije / nije upisano" })
                    DetailRow(Icons.Rounded.ListAlt, "Vrsta ponude", record.meta["serviceLine"].orEmpty().ifBlank { "Nije upisano" })
                    DetailRow(Icons.Rounded.CalendarMonth, "Datum ponude", formatDateLabel(record.meta["offerDate"].orEmpty()).ifBlank { record.meta["offerDate"].orEmpty().ifBlank { "Nije upisano" } })
                    DetailRow(Icons.Rounded.CalendarMonth, "Vrijedi do", formatDateLabel(record.meta["validUntil"].orEmpty()).ifBlank { record.meta["validUntil"].orEmpty().ifBlank { "Nije upisano" } })
                    DetailRow(Icons.Rounded.Description, "Bez PDV-a", record.meta["amountWithoutVat"].orEmpty().ifBlank { "0,00 EUR" })
                    DetailRow(Icons.Rounded.CheckCircle, "Ukupno s PDV-om", record.meta["totalWithVat"].orEmpty().ifBlank { "0,00 EUR" })
                }
                val contactLines = listOf(
                    record.meta["contactName"].orEmpty(),
                    record.meta["contactEmail"].orEmpty(),
                    record.meta["contactPhone"].orEmpty(),
                ).filter { it.isNotBlank() }
                if (contactLines.isNotEmpty()) {
                    DetailSection("Kontakt") {
                        DetailRow(Icons.Rounded.Person, "Kontakt osoba", contactLines.joinToString("\n"))
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

            val visibleMeta = if (record.kind == "offer") {
                record.meta.filterKeys { key -> key !in offerDetailMetaKeys }
            } else {
                record.meta
            }
            if (visibleMeta.isNotEmpty()) {
                DetailSection("Podaci") {
                    visibleMeta.entries
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
    val initialStartTime = remember(vehicle.id) { defaultReservationStartTime() }
    val initialEnd = remember(vehicle.id, today, initialStartTime) { addReservationMinutes(today, initialStartTime, 60) }
    var startDate by remember(vehicle.id) { mutableStateOf(today) }
    var startTime by remember(vehicle.id) { mutableStateOf(initialStartTime) }
    var endDate by remember(vehicle.id) { mutableStateOf(initialEnd.first) }
    var endTime by remember(vehicle.id) { mutableStateOf(initialEnd.second) }
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
    var note by remember(vehicle.id) { mutableStateOf("") }
    val reservationRangeValid = remember(startDate, startTime, endDate, endTime) {
        isReservationRangeValid(startDate, startTime, endDate, endTime)
    }

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
                Text("Termin rezervacije", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WorkOrderDatePickerField(
                        label = "Početak",
                        value = startDate,
                        onChange = { startDate = it },
                        enabled = !isLoading,
                        modifier = Modifier.weight(1.28f),
                    )
                    WorkOrderSelectField(
                        label = "Vrijeme",
                        value = startTime,
                        valueLabel = startTime,
                        options = reservationTimeOptions,
                        enabled = !isLoading,
                        onSelect = { nextTime -> startTime = nextTime },
                        modifier = Modifier.weight(0.88f),
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WorkOrderDatePickerField(
                        label = "Kraj",
                        value = endDate,
                        onChange = { endDate = it },
                        enabled = !isLoading,
                        modifier = Modifier.weight(1.28f),
                    )
                    WorkOrderSelectField(
                        label = "Vrijeme",
                        value = endTime,
                        valueLabel = endTime,
                        options = reservationTimeOptions,
                        enabled = !isLoading,
                        onSelect = { nextTime -> endTime = nextTime },
                        modifier = Modifier.weight(0.88f),
                    )
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("1 h" to 60L, "2 h" to 120L, "4 h" to 240L).forEach { (label, minutes) ->
                        FilterChip(
                            selected = false,
                            enabled = !isLoading,
                            onClick = {
                                val next = addReservationMinutes(startDate, startTime, minutes)
                                endDate = next.first
                                endTime = next.second
                            },
                            label = { Text(label, fontWeight = FontWeight.Bold) },
                        )
                    }
                    FilterChip(
                        selected = false,
                        enabled = !isLoading,
                        onClick = {
                            startTime = "08:00"
                            endDate = startDate
                            endTime = "17:00"
                        },
                        label = { Text("Radni dan", fontWeight = FontWeight.Bold) },
                    )
                    AssistChip(
                        onClick = {},
                        enabled = false,
                        label = { Text("Korak 15 min") },
                    )
                }
                AnimatedVisibility(!reservationRangeValid) {
                    Text(
                        "Kraj rezervacije mora biti nakon početka.",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                    )
                }
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
                WorkOrderTextField("Napomena", note, { note = it }, !isLoading)
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(
                        purpose.trim(),
                        formatReservationDateTime(startDate, startTime),
                        formatReservationDateTime(endDate, endTime),
                        destination.trim(),
                        reservedForUserId.trim(),
                        reservedForLabel.trim(),
                        note.trim(),
                    )
                },
                enabled = !isLoading && purpose.isNotBlank() && startDate.isNotBlank() && endDate.isNotBlank() && reservationRangeValid,
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
private fun VehicleUsageDialog(
    vehicle: MobileRecord,
    mode: String,
    workOrders: List<WorkOrder>,
    currentUserLabel: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (String, String, String, String, String, String, String, String, Boolean, Boolean, Boolean, Boolean, String) -> Unit,
) {
    val reservations = remember(vehicle.meta["reservationsJson"], mode) { parseVehicleReservations(vehicle) }
    val trips = remember(vehicle.meta["activityItemsJson"], mode) { parseVehicleTrips(vehicle) }
    val defaultReservation = remember(reservations, mode, vehicle.meta["nextReservationId"]) {
        val preferredStatus = if (mode == "return") "checked_out" else "reserved"
        reservations.firstOrNull { it.status.equals(preferredStatus, ignoreCase = true) }
            ?: reservations.firstOrNull { it.id == vehicle.meta["nextReservationId"] }
            ?: reservations.firstOrNull()
    }
    val openTrip = remember(trips, defaultReservation?.id, mode) {
        if (mode != "return") {
            null
        } else {
            trips.firstOrNull { trip ->
                trip.returnAt.isBlank() &&
                    !trip.status.equals("completed", ignoreCase = true) &&
                    defaultReservation?.id?.let { it.isNotBlank() && trip.reservationId == it } == true
            } ?: trips.firstOrNull { trip ->
                trip.returnAt.isBlank() && !trip.status.equals("completed", ignoreCase = true)
            }
        }
    }
    val destinationSuggestions = remember(vehicle.id, trips, reservations, defaultReservation?.destination, openTrip?.destination) {
        (
            listOf(defaultReservation?.destination.orEmpty(), openTrip?.destination.orEmpty()) +
                reservations.map { it.destination } +
                trips.map { it.destination }
            )
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .take(5)
    }
    val driverSuggestions = remember(vehicle.id, currentUserLabel, trips, defaultReservation?.userLabel, openTrip?.drivers) {
        (
            listOf(defaultReservation?.userLabel.orEmpty(), openTrip?.drivers.orEmpty(), currentUserLabel) +
                trips.map { it.drivers }
            )
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .take(5)
    }
    var odometerKm by remember(vehicle.id, mode) { mutableStateOf(vehicle.meta["odometerKm"].orEmpty()) }
    var destination by remember(vehicle.id, mode, defaultReservation?.destination, openTrip?.destination) {
        mutableStateOf(defaultReservation?.destination.orEmpty().ifBlank { openTrip?.destination.orEmpty() })
    }
    var reservationId by remember(vehicle.id, mode, defaultReservation?.id) { mutableStateOf(defaultReservation?.id.orEmpty()) }
    var linkedWorkOrderId by remember(vehicle.id, mode, openTrip?.linkedWorkOrderId) {
        mutableStateOf(openTrip?.linkedWorkOrderId.orEmpty())
    }
    var performedBy by remember(vehicle.id, mode, currentUserLabel, defaultReservation?.userLabel, openTrip?.drivers) {
        mutableStateOf(defaultReservation?.userLabel.orEmpty().ifBlank { openTrip?.drivers.orEmpty().ifBlank { currentUserLabel } })
    }
    var vehicleCondition by remember(vehicle.id, mode) { mutableStateOf("Uredno") }
    var vehicleClean by remember(vehicle.id, mode) { mutableStateOf(true) }
    var documentsPresent by remember(vehicle.id, mode) { mutableStateOf(true) }
    var fuelOk by remember(vehicle.id, mode) { mutableStateOf(true) }
    var damageNoted by remember(vehicle.id, mode) { mutableStateOf(false) }
    var note by remember(vehicle.id, mode) { mutableStateOf("") }
    val title = if (mode == "return") "Povrat vozila" else "Preuzimanje vozila"
    val reservationOptions = remember(reservations) {
        listOf("" to "Bez vezane rezervacije") + reservations.map { reservation ->
            reservation.id to listOf(
                reservation.purpose.ifBlank { "Rezervacija" },
                formatDateTimeLabel(reservation.startAt),
                reservation.userLabel,
            ).filter { it.isNotBlank() }.joinToString(" - ")
        }
    }
    val workOrderOptions = remember(workOrders, openTrip?.linkedWorkOrderId, openTrip?.linkedWorkOrderNumber) {
        val baseOptions = workOrders
            .take(250)
            .map { workOrder ->
                workOrder.id to listOf(
                    workOrder.displayNumber,
                    workOrder.companyName,
                    workOrder.locationName,
                ).filter { it.isNotBlank() }.joinToString(" - ")
            }
        val existingLinked = openTrip?.linkedWorkOrderId.orEmpty()
        val existingLabel = openTrip?.linkedWorkOrderNumber.orEmpty()
        val merged = if (existingLinked.isNotBlank() && baseOptions.none { it.first == existingLinked }) {
            listOf(existingLinked to existingLabel.ifBlank { "Povezani RN" }) + baseOptions
        } else {
            baseOptions
        }
        listOf("" to "Bez povezanog RN-a") + merged
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth(0.96f),
        properties = DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Column {
                Text(title, fontWeight = FontWeight.Black)
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
                OutlinedTextField(
                    value = odometerKm,
                    onValueChange = { odometerKm = it.filter(Char::isDigit).take(8) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(if (mode == "return") "Krajnja KM" else "Početna KM") },
                    singleLine = true,
                    enabled = !isLoading,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(16.dp),
                )
                WorkOrderTextField("Lokacija gdje se ide", destination, { destination = it }, !isLoading)
                if (destinationSuggestions.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        destinationSuggestions.forEach { suggestion ->
                            FilterChip(
                                selected = destination.equals(suggestion, ignoreCase = true),
                                enabled = !isLoading,
                                onClick = { destination = suggestion },
                                label = { Text(suggestion, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            )
                        }
                    }
                }
                WorkOrderSelectField(
                    label = "Vezana rezervacija",
                    value = reservationId,
                    valueLabel = reservationOptions.firstOrNull { it.first == reservationId }?.second ?: "Bez vezane rezervacije",
                    options = reservationOptions,
                    enabled = !isLoading,
                    onSelect = { reservationId = it },
                )
                WorkOrderSelectField(
                    label = "Povezani RN",
                    value = linkedWorkOrderId,
                    valueLabel = workOrderOptions.firstOrNull { it.first == linkedWorkOrderId }?.second
                        ?: openTrip?.linkedWorkOrderNumber.orEmpty().ifBlank { "Bez povezanog RN-a" },
                    options = workOrderOptions,
                    enabled = !isLoading,
                    onSelect = { linkedWorkOrderId = it },
                )
                WorkOrderTextField("Korisnik vozila", performedBy, { performedBy = it }, !isLoading)
                if (driverSuggestions.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        driverSuggestions.forEach { suggestion ->
                            FilterChip(
                                selected = performedBy.equals(suggestion, ignoreCase = true),
                                enabled = !isLoading,
                                onClick = { performedBy = suggestion },
                                label = { Text(suggestion, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            )
                        }
                    }
                }
                WorkOrderTextField(
                    if (mode == "return") "Stanje vozila pri povratku" else "Stanje vozila pri polasku",
                    vehicleCondition,
                    { vehicleCondition = it },
                    !isLoading,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Uredno", "Gorivo OK", "Dokumenti OK", "Oštećenje").forEach { suggestion ->
                        FilterChip(
                            selected = vehicleCondition.equals(suggestion, ignoreCase = true),
                            enabled = !isLoading,
                            onClick = {
                                vehicleCondition = suggestion
                                if (suggestion == "Oštećenje") {
                                    damageNoted = true
                                }
                                if (suggestion == "Gorivo OK") {
                                    fuelOk = true
                                }
                                if (suggestion == "Dokumenti OK") {
                                    documentsPresent = true
                                }
                            },
                            label = { Text(suggestion, fontWeight = FontWeight.Bold) },
                        )
                    }
                }
                Text("Kontrola vozila", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
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
                    val linkedWorkOrderNumber = workOrders.firstOrNull { it.id == linkedWorkOrderId }?.displayNumber
                        ?: openTrip?.linkedWorkOrderNumber.orEmpty()
                    onConfirm(
                        mode,
                        odometerKm.trim(),
                        destination.trim(),
                        reservationId.trim(),
                        linkedWorkOrderId.trim(),
                        linkedWorkOrderNumber.trim(),
                        performedBy.trim(),
                        vehicleCondition.trim(),
                        vehicleClean,
                        documentsPresent,
                        fuelOk,
                        damageNoted,
                        note.trim(),
                    )
                },
                enabled = !isLoading && odometerKm.isNotBlank() && (mode == "return" || destination.isNotBlank()),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(if (mode == "return") "Spremi povrat" else "Spremi preuzimanje", fontWeight = FontWeight.Black)
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

private fun normalizeDocumentationWorkEquipmentText(value: String): String =
    value.trim()
        .lowercase(Locale.getDefault())
        .replace("č", "c")
        .replace("ć", "c")
        .replace("ž", "z")
        .replace("š", "s")
        .replace("đ", "d")
        .replace(Regex("[^a-z0-9]+"), " ")
        .trim()

private fun isDocumentationWorkEquipmentText(value: String): Boolean {
    val normalized = normalizeDocumentationWorkEquipmentText(value)
    return normalized.contains("radna oprema") ||
        normalized.contains("radne opreme") ||
        normalized == "ro" ||
        normalized.startsWith("ro ")
}

private fun isDocumentationWorkEquipmentService(item: DocumentationServiceFlowItem): Boolean =
    isDocumentationWorkEquipmentText(item.serviceName) ||
        isDocumentationWorkEquipmentText(item.serviceCode) ||
        isDocumentationWorkEquipmentText(item.serviceKey)

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
    fun authorizationValue(): String =
        when (area) {
            "tipkalo", "tzin" -> standard.tipkaloAuthorizationHolderLabel.ifBlank { standard.tipkaloAuthorizationHolderUserId }
            "elektro" -> standard.electricalAuthorizationHolderLabel.ifBlank { standard.electricalAuthorizationHolderUserId }
            else -> standard.authorizationHolderLabel.ifBlank { standard.authorizationHolderUserId }
        }

    fun inspectorValue(): String =
        when (area) {
            "tipkalo", "tzin" -> standard.tipkaloInspectorLabel.ifBlank { standard.tipkaloInspectorUserId }
            "elektro" -> standard.electricalInspectorLabel.ifBlank { standard.electricalInspectorUserId }
            else -> standard.inspectorLabel.ifBlank { standard.inspectorUserId }
        }

    return when (normalizedRole) {
        "authorize" -> authorizationValue()
        "all" -> listOf(inspectorValue(), authorizationValue())
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
            .joinToString(", ")
        else -> inspectorValue()
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
            val matchingAiField = template.aiFields.firstOrNull { aiField ->
                val blockKeys = listOf(block.id, block.key, block.tokenKey, block.label)
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .map { normalizeTemplateFieldLookup(it) }
                    .toSet()
                templateAiFieldCandidateKeys(aiField)
                    .map(::normalizeTemplateFieldLookup)
                    .any { it.isNotBlank() && blockKeys.contains(it) }
            }
            val matchingAiValue = matchingAiField?.let { field -> values[templateAiFieldStateKey(template, field)].orEmpty() }.orEmpty()
            val complete = when (block.type.lowercase(Locale.getDefault())) {
                "equipment_list" -> standard.selectedEquipmentCount > 0
                "legal_list" -> standard.selectedLegalCount > 0
                "measurement_table" -> true
                "chapter" -> true
                "qualified_inspectors", "inspector_signature", "authorization_holder_signature", "digital_signature" ->
                    standardDocumentationSignatureValue(block.signatureArea, block.signatureRole, block.type, standard).isNotBlank()
                else -> matchingValue.isNotBlank() || matchingAiValue.isNotBlank() || standardValue.isNotBlank()
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

private fun WorkOrderDocumentationDefaults.hasReusableDocumentationDefaults(): Boolean =
    fieldValues.isNotEmpty() ||
        fieldSheets.isNotEmpty() ||
        templateFieldValues.values.any { it.isNotEmpty() } ||
        templateFieldSheets.values.any { it.isNotEmpty() } ||
        selectedEquipmentIds.isNotEmpty() ||
        selectedLegalFrameworkIds.isNotEmpty() ||
        listOf(
            inspectionDate,
            issuedDate,
            inspectionType,
            outsideTemperature,
            relativeHumidity,
            airflowSpeed,
            weather,
            groundCondition,
            groundResistance,
            measurementEquipmentGroup,
        ).any { it.isNotBlank() }

@Composable
private fun WorkOrderDocumentationWizardDialog(
    workOrder: WorkOrder,
    users: List<WorkOrderUserOption>,
    currentUser: SafeNexusUser?,
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
    onRunAi: (
        WorkOrderDocumentationTemplate,
        List<WorkOrderDocumentationAiFile>,
        String,
        (WorkOrderDocumentationAiResult) -> Unit,
        (String) -> Unit,
    ) -> Unit,
    onConfirm: (WorkOrderDocumentationDraft) -> Unit,
) {
    val androidContext = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
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
    val defaultHandoverVerifierUserId = remember(users, currentUser?.displayName, currentUser?.email) {
        val currentEmail = currentUser?.email.orEmpty()
        val currentLabel = currentUser?.displayName.orEmpty()
        users.firstOrNull { user ->
            user.email.equals(currentEmail, ignoreCase = true) ||
                listOf(user.label, user.fullName, user.email)
                    .any { value -> value.equals(currentLabel, ignoreCase = true) }
        }?.id.orEmpty()
    }
    var handoverVerifierUserId by remember(workOrder.id, defaultHandoverVerifierUserId) {
        mutableStateOf(defaultHandoverVerifierUserId)
    }
    LaunchedEffect(defaultHandoverVerifierUserId) {
        if (handoverVerifierUserId.isBlank() && defaultHandoverVerifierUserId.isNotBlank()) {
            handoverVerifierUserId = defaultHandoverVerifierUserId
        }
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
    val isWorkEquipmentFlow = remember(serviceFlowItems, workOrder.displayService) {
        serviceFlowItems.any { isDocumentationWorkEquipmentService(it) } ||
            isDocumentationWorkEquipmentText(workOrder.displayService)
    }
    val workEquipmentStatusMessage = context.workEquipmentStatus["message"].orEmpty()
    val showWorkEquipmentFromIsznr = isWorkEquipmentFlow ||
        context.workEquipmentOptions.isNotEmpty() ||
        workEquipmentStatusMessage.isNotBlank()
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
    val reusedDocumentationDefaultsLoaded = remember(defaults) { defaults.hasReusableDocumentationDefaults() }
    var inspectionDate by remember(workOrder.id, selectedObjectId, defaults.inspectionDate) { mutableStateOf(defaults.inspectionDate.ifBlank { today }) }
    var issuedDate by remember(workOrder.id, selectedObjectId, defaults.issuedDate) { mutableStateOf(defaults.issuedDate.ifBlank { inspectionDate.ifBlank { today } }) }
    var testingLocation by remember(workOrder.id, selectedObjectId, defaults.testingLocation) {
        mutableStateOf(defaults.testingLocation.ifBlank { workOrder.locationName })
    }
    val initialInspectionType = remember(defaults.inspectionType, defaultInspectionType, inspectionOptions) {
        chooseInspectionTypeValue(defaults.inspectionType, inspectionOptions, defaultInspectionType)
    }
    var inspectionType by remember(workOrder.id, selectedObjectId, initialInspectionType) {
        mutableStateOf(initialInspectionType)
    }
    LaunchedEffect(selectedFlowService, defaultInspectionType, inspectionOptions) {
        inspectionType = chooseInspectionTypeValue(inspectionType, inspectionOptions, defaultInspectionType)
    }
    var outsideTemperature by remember(workOrder.id, selectedObjectId, defaults.outsideTemperature) { mutableStateOf(defaults.outsideTemperature) }
    var relativeHumidity by remember(workOrder.id, selectedObjectId, defaults.relativeHumidity) { mutableStateOf(defaults.relativeHumidity) }
    var airflowSpeed by remember(workOrder.id, selectedObjectId, defaults.airflowSpeed) { mutableStateOf(defaults.airflowSpeed) }
    var weather by remember(workOrder.id, selectedObjectId, defaults.weather) { mutableStateOf(defaults.weather) }
    var groundCondition by remember(workOrder.id, selectedObjectId, defaults.groundCondition) { mutableStateOf(defaults.groundCondition) }
    var groundResistance by remember(workOrder.id, selectedObjectId, defaults.groundResistance) { mutableStateOf(defaults.groundResistance) }
    var measurementEquipmentGroup by remember(workOrder.id, selectedObjectId, defaults.measurementEquipmentGroup) {
        mutableStateOf(defaults.measurementEquipmentGroup)
    }
    val measurementEquipmentOptionIds = remember(context.measurementEquipmentOptions) {
        context.measurementEquipmentOptions.map { it.id }.toSet()
    }
    val legalFrameworkOptionIds = remember(context.legalFrameworkOptions) {
        context.legalFrameworkOptions.map { it.id }.toSet()
    }
    var selectedEquipmentIds by remember(workOrder.id, selectedObjectId, defaults.selectedEquipmentIds, measurementEquipmentOptionIds) {
        mutableStateOf(defaults.selectedEquipmentIds.filter { measurementEquipmentOptionIds.contains(it) }.toSet())
    }
    var selectedLegalFrameworkIds by remember(workOrder.id, selectedObjectId, defaults.selectedLegalFrameworkIds, legalFrameworkOptionIds) {
        mutableStateOf(defaults.selectedLegalFrameworkIds.filter { legalFrameworkOptionIds.contains(it) }.toSet())
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
    var signatureMode by remember(workOrder.id, selectedObjectId, defaults.signatureMode) { mutableStateOf(defaults.signatureMode.ifBlank { "digital" }) }
    val includeHandoverProtocol = true
    var validityMonths by remember(workOrder.id, selectedObjectId, defaults.validityMonths) { mutableStateOf(defaults.validityMonths.ifBlank { "12" }) }
    var serviceValidityMonths by remember(workOrder.id, selectedObjectId, serviceFlowItems, defaults.serviceValidityMonths) {
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
    var electricalValidityMonths by remember(workOrder.id, selectedObjectId, defaults.electricalValidityMonths) {
        mutableStateOf(defaults.electricalValidityMonths.ifBlank { validityMonths.ifBlank { "12" } })
    }
    var tipkaloValidityMonths by remember(workOrder.id, selectedObjectId, defaults.tipkaloValidityMonths) {
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
    var templateFieldValues by remember(
        workOrder.id,
        selectedObjectId,
        templateDefaultsKey,
        defaults.fieldValues,
        defaults.templateFieldValues,
    ) {
        mutableStateOf(defaultTemplateFieldValues(allPromptTemplates, defaults))
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
    var measurementSheets by remember(
        workOrder.id,
        selectedObjectId,
        measurementDefaultsKey,
        defaults.fieldSheets,
        defaults.templateFieldSheets,
    ) {
        mutableStateOf(defaultMeasurementSheetValues(allMeasurementTemplates, defaults))
    }
    var aiFiles by remember(workOrder.id, selectedObjectId) { mutableStateOf(emptyList<WorkOrderDocumentationAiFile>()) }
    var aiLoading by remember(workOrder.id, selectedObjectId) { mutableStateOf(false) }
    var aiMessage by remember(workOrder.id, selectedObjectId) { mutableStateOf("") }
    var aiModelTier by remember(workOrder.id, selectedObjectId) { mutableStateOf("standard") }
    var selectedAiTemplateId by remember(workOrder.id, selectedObjectId) { mutableStateOf("") }
    val aiCapableTemplates = remember(activeTemplates) {
        activeTemplates.filter { template -> template.aiFields.isNotEmpty() || template.aiMeasurementColumns.isNotEmpty() }
    }
    LaunchedEffect(aiCapableTemplates, selectedAiTemplateId) {
        if (selectedAiTemplateId.isBlank() || aiCapableTemplates.none { it.id == selectedAiTemplateId }) {
            selectedAiTemplateId = aiCapableTemplates.firstOrNull()?.id.orEmpty()
        }
    }
    val selectedAiTemplate = remember(aiCapableTemplates, selectedAiTemplateId) {
        aiCapableTemplates.firstOrNull { it.id == selectedAiTemplateId } ?: aiCapableTemplates.firstOrNull()
    }
    val aiFilePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        if (uris.isEmpty()) return@rememberLauncherForActivityResult
        coroutineScope.launch {
            aiLoading = true
            aiMessage = ""
            runCatching {
                withContext(Dispatchers.IO) {
                    buildWorkOrderDocumentationAiFiles(
                        context = androidContext.applicationContext,
                        uris = uris,
                        existingCount = aiFiles.size,
                    )
                }
            }
                .onSuccess { files ->
                    val nextFiles = (aiFiles + files)
                        .distinctBy { it.id }
                        .take(WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILES)
                    aiFiles = nextFiles
                    aiMessage = if (nextFiles.isEmpty()) {
                        "Nije dodana nijedna datoteka."
                    } else {
                        "${nextFiles.size} datoteka spremno za NexAI."
                    }
                }
                .onFailure { error ->
                    aiMessage = error.message ?: "Ne mogu učitati odabrane datoteke."
                }
            aiLoading = false
        }
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
                    if (reusedDocumentationDefaultsLoaded) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.48f),
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    Icons.Rounded.Refresh,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                )
                                Text(
                                    "Učitane su zadnje vrijednosti za ovu lokaciju i objekt.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.76f),
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                    }
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
                if (aiCapableTemplates.isNotEmpty()) {
                    DocumentationAiAssistantSection(
                        templates = aiCapableTemplates,
                        selectedTemplate = selectedAiTemplate,
                        selectedTemplateId = selectedAiTemplateId,
                        onSelectedTemplateChange = { selectedAiTemplateId = it },
                        files = aiFiles,
                        modelTier = aiModelTier,
                        message = aiMessage,
                        loading = aiLoading,
                        enabled = !formLoading,
                        onModelTierChange = { aiModelTier = it },
                        onPickFiles = { aiFilePicker.launch(workOrderDocumentationAiMimeTypes) },
                        onRemoveFile = { fileId ->
                            val nextFiles = aiFiles.filterNot { it.id == fileId }
                            aiFiles = nextFiles
                            aiMessage = if (nextFiles.isEmpty()) "" else "${nextFiles.size} datoteka spremno za NexAI."
                        },
                        onRun = {
                            val template = selectedAiTemplate
                            when {
                                template == null -> aiMessage = "Nema templatea s NexAI postavkama za ovaj zapisnik."
                                aiFiles.isEmpty() -> aiMessage = "Dodaj PDF, sliku ili tekst prije pokretanja NexAI-ja."
                                else -> {
                                    aiLoading = true
                                    aiMessage = "Šaljem datoteke NexAI-ju..."
                                    onRunAi(
                                        template,
                                        aiFiles,
                                        aiModelTier,
                                        { result ->
                                            val fieldApply = applyDocumentationAiFieldSuggestions(
                                                template = template,
                                                result = result,
                                                values = templateFieldValues,
                                            )
                                            val sheetApply = applyDocumentationAiMeasurementSuggestions(
                                                template = template,
                                                result = result,
                                                sheets = measurementSheets,
                                            )
                                            templateFieldValues = fieldApply.values
                                            measurementSheets = sheetApply.sheets
                                            aiLoading = false
                                            aiMessage = buildDocumentationAiResultMessage(result, fieldApply.count, sheetApply.rowCount)
                                        },
                                        { message ->
                                            aiLoading = false
                                            aiMessage = message
                                        },
                                    )
                                }
                            }
                        },
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
                    measurementSheets = measurementSheets,
                    onMeasurementSheetChange = { key, sheet -> measurementSheets = measurementSheets + (key to sheet) },
                    standardValues = standardValues,
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

                if (showWorkEquipmentFromIsznr) {
                    WizardSection(title = "Radna oprema", icon = Icons.Rounded.Work) {
                        DocumentationReadOnlyOptionList(
                            label = "IS ZNR radna oprema za ovaj RN",
                            options = context.workEquipmentOptions,
                            emptyText = "Nema dohvaćene radne opreme iz IS ZNR-a za OIB tvrtke na ovom RN-u.",
                            statusMessage = workEquipmentStatusMessage,
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

                    WizardSection(title = "Propisi", icon = Icons.Rounded.Lock) {
                        DocumentationMultiSelectField(
                            label = "Propisi iz web predloška",
                            options = context.legalFrameworkOptions,
                            selectedIds = selectedLegalFrameworkIds,
                            enabled = !formLoading,
                            emptyText = "Nema propisa povezanih s predlošcima.",
                            onChange = { selectedLegalFrameworkIds = it },
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
                    signatureMode = signatureMode,
                    completedBy = completedBy,
                    completedByOptions = completedByOptions,
                    handoverVerifierUserId = handoverVerifierUserId,
                    handoverVerifierOptions = userOptions,
                    handoverVerifierLabelById = userLabelById,
                    includeHandoverProtocol = includeHandoverProtocol,
                    enabled = !formLoading,
                    onSignatureMode = { signatureMode = it },
                    onCompletedByChange = { completedBy = it },
                    onHandoverVerifierChange = { handoverVerifierUserId = it },
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
                        selectedRulebookIds = emptyList(),
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
                        handoverVerifierUserId = handoverVerifierUserId,
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

private fun templateAiFieldPayloadKey(field: WorkOrderDocumentationAiField): String =
    field.id.ifBlank { field.key }.trim()

private fun templateFieldStateKey(
    template: WorkOrderDocumentationTemplate,
    field: WorkOrderDocumentationField,
): String = "${template.id}::${templateFieldPayloadKey(field)}"

private fun templateAiFieldStateKey(
    template: WorkOrderDocumentationTemplate,
    field: WorkOrderDocumentationAiField,
): String = "${template.id}::${templateAiFieldPayloadKey(field)}"

private fun normalizedDocumentationMap(values: Map<String, String>): Map<String, String> =
    buildMap {
        values.forEach { (key, value) ->
            val normalizedKey = normalizeTemplateFieldLookup(key)
            if (normalizedKey.isNotBlank() && value.trim().isNotBlank() && !containsKey(normalizedKey)) {
                put(normalizedKey, value)
            }
        }
    }

private fun normalizedMeasurementSheetMap(values: Map<String, WorkOrderMeasurementSheet>): Map<String, WorkOrderMeasurementSheet> =
    buildMap {
        values.forEach { (key, value) ->
            val normalizedKey = normalizeTemplateFieldLookup(key)
            if (normalizedKey.isNotBlank() && value.columns.isNotEmpty() && !containsKey(normalizedKey)) {
                put(normalizedKey, value)
            }
        }
    }

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

private fun templateFieldCandidateKeys(field: WorkOrderDocumentationField): List<String> =
    listOf(templateFieldPayloadKey(field), field.id, field.key, field.tokenKey, field.label)
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.lowercase(Locale.getDefault()) }

private fun templateAiFieldCandidateKeys(field: WorkOrderDocumentationAiField): List<String> =
    listOf(templateAiFieldPayloadKey(field), field.id, field.key, field.label)
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.lowercase(Locale.getDefault()) }

private fun resolveSavedTemplateFieldValue(
    defaults: WorkOrderDocumentationDefaults,
    template: WorkOrderDocumentationTemplate,
    field: WorkOrderDocumentationField,
): String? {
    val candidates = templateFieldCandidateKeys(field)
    val templateValues = defaults.templateFieldValues[template.id].orEmpty()
    for (key in candidates) {
        templateValues[key]?.trim()?.takeIf { it.isNotBlank() }?.let { return it }
    }
    val normalizedTemplateValues = normalizedDocumentationMap(templateValues)
    for (key in candidates) {
        normalizedTemplateValues[normalizeTemplateFieldLookup(key)]?.trim()?.takeIf { it.isNotBlank() }?.let { return it }
    }
    for (key in candidates) {
        defaults.fieldValues[key]?.trim()?.takeIf { it.isNotBlank() }?.let { return it }
    }
    val normalizedFieldValues = normalizedDocumentationMap(defaults.fieldValues)
    for (key in candidates) {
        normalizedFieldValues[normalizeTemplateFieldLookup(key)]?.trim()?.takeIf { it.isNotBlank() }?.let { return it }
    }
    return null
}

private fun defaultTemplateFieldValues(
    templates: List<WorkOrderDocumentationTemplate>,
    defaults: WorkOrderDocumentationDefaults = WorkOrderDocumentationDefaults(),
): Map<String, String> =
    buildMap {
        templates.forEach { template ->
            template.fields.forEach { field ->
                val key = templateFieldStateKey(template, field)
                val savedValue = resolveSavedTemplateFieldValue(defaults, template, field)
                when {
                    savedValue != null -> put(key, savedValue)
                    field.defaultValue.isNotBlank() -> put(key, field.defaultValue)
                    field.type.equals("checkbox", ignoreCase = true) || field.type.equals("toggle", ignoreCase = true) ->
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
        template.aiFields.forEach aiFieldLoop@{ field ->
            val stateKey = templateAiFieldStateKey(template, field)
            val value = values[stateKey]?.trim().orEmpty()
            if (value.isBlank()) return@aiFieldLoop
            val payloadKey = templateAiFieldPayloadKey(field)
            val keys = templateAiFieldCandidateKeys(field)
            keys.forEach { key -> flatValues[key] = value }
            if (payloadKey.isNotBlank()) {
                templateValues.getOrPut(template.id) { mutableMapOf() }[payloadKey] = value
            }
            if (field.key.isNotBlank()) {
                templateValues.getOrPut(template.id) { mutableMapOf() }[field.key] = value
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

private fun measurementTableCandidateKeys(table: WorkOrderMeasurementTable): List<String> =
    listOf(table.key, table.id, table.tokenKey, table.label)
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinctBy { it.lowercase(Locale.getDefault()) }

private fun resolveSavedMeasurementSheet(
    defaults: WorkOrderDocumentationDefaults,
    template: WorkOrderDocumentationTemplate,
    table: WorkOrderMeasurementTable,
): WorkOrderMeasurementSheet? {
    val candidates = measurementTableCandidateKeys(table)
    val templateSheets = defaults.templateFieldSheets[template.id].orEmpty()
    for (key in candidates) {
        templateSheets[key]?.takeIf { it.columns.isNotEmpty() }?.let { return it }
    }
    val normalizedTemplateSheets = normalizedMeasurementSheetMap(templateSheets)
    for (key in candidates) {
        normalizedTemplateSheets[normalizeTemplateFieldLookup(key)]?.takeIf { it.columns.isNotEmpty() }?.let { return it }
    }
    for (key in candidates) {
        defaults.fieldSheets[key]?.takeIf { it.columns.isNotEmpty() }?.let { return it }
    }
    val normalizedFieldSheets = normalizedMeasurementSheetMap(defaults.fieldSheets)
    for (key in candidates) {
        normalizedFieldSheets[normalizeTemplateFieldLookup(key)]?.takeIf { it.columns.isNotEmpty() }?.let { return it }
    }
    return null
}

private fun defaultMeasurementSheetValues(
    templates: List<WorkOrderDocumentationTemplate>,
    defaults: WorkOrderDocumentationDefaults = WorkOrderDocumentationDefaults(),
): Map<String, WorkOrderMeasurementSheet> =
    buildMap {
        templates.forEach { template ->
            template.measurementTables.forEach { table ->
                put(measurementSheetStateKey(template, table), resolveSavedMeasurementSheet(defaults, template, table) ?: table.sheet)
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

private data class DocumentationAiFieldApplyResult(
    val values: Map<String, String>,
    val count: Int,
)

private data class DocumentationAiMeasurementApplyResult(
    val sheets: Map<String, WorkOrderMeasurementSheet>,
    val rowCount: Int,
    val tableCount: Int,
)

private fun aiSuggestionLookupKeys(vararg values: String): Set<String> =
    values
        .flatMap { value ->
            listOf(value.trim(), normalizeTemplateFieldLookup(value))
        }
        .filter { it.isNotBlank() }
        .toSet()

private fun WorkOrderDocumentationField.matchesAiSuggestion(suggestion: com.safenexus.app.data.WorkOrderDocumentationAiFieldSuggestion): Boolean {
    val lookup = aiSuggestionLookupKeys(suggestion.fieldId, suggestion.fieldKey, suggestion.fieldLabel)
    return templateFieldCandidateKeys(this).any { candidate ->
        candidate in lookup || normalizeTemplateFieldLookup(candidate) in lookup
    }
}

private fun WorkOrderDocumentationAiField.matchesAiSuggestion(suggestion: com.safenexus.app.data.WorkOrderDocumentationAiFieldSuggestion): Boolean {
    val lookup = aiSuggestionLookupKeys(suggestion.fieldId, suggestion.fieldKey, suggestion.fieldLabel)
    return templateAiFieldCandidateKeys(this).any { candidate ->
        candidate in lookup || normalizeTemplateFieldLookup(candidate) in lookup
    }
}

private fun aiSuggestionValueForField(
    suggestion: com.safenexus.app.data.WorkOrderDocumentationAiFieldSuggestion,
    type: String,
): String {
    val normalizedType = type.trim().lowercase(Locale.getDefault())
    return if (normalizedType == "system_description" || suggestion.rawValueJson.trim().startsWith("{")) {
        suggestion.rawValueJson.ifBlank { suggestion.valueText }
    } else {
        suggestion.valueText.ifBlank { suggestion.rawValueJson }
    }.trim()
}

private fun applyDocumentationAiFieldSuggestions(
    template: WorkOrderDocumentationTemplate,
    result: WorkOrderDocumentationAiResult,
    values: Map<String, String>,
): DocumentationAiFieldApplyResult {
    var applied = 0
    val nextValues = values.toMutableMap()
    result.fieldSuggestions.forEach { suggestion ->
        val field = template.fields.firstOrNull { it.matchesAiSuggestion(suggestion) }
        if (field != null) {
            val value = aiSuggestionValueForField(suggestion, field.type)
            if (value.isNotBlank()) {
                nextValues[templateFieldStateKey(template, field)] = value
                applied += 1
            }
            return@forEach
        }
        val aiField = template.aiFields.firstOrNull { it.matchesAiSuggestion(suggestion) }
        if (aiField != null) {
            val value = aiSuggestionValueForField(suggestion, aiField.type)
            if (value.isNotBlank()) {
                nextValues[templateAiFieldStateKey(template, aiField)] = value
                applied += 1
            }
        }
    }
    return DocumentationAiFieldApplyResult(nextValues.toMap(), applied)
}

private fun WorkOrderMeasurementTable.matchesAiMeasurementSuggestion(suggestion: WorkOrderDocumentationAiMeasurementSuggestion): Boolean {
    val lookup = aiSuggestionLookupKeys(suggestion.fieldId, suggestion.fieldKey, suggestion.fieldLabel)
    return measurementTableCandidateKeys(this).any { candidate ->
        candidate in lookup || normalizeTemplateFieldLookup(candidate) in lookup
    }
}

private fun WorkOrderDocumentationAiMeasurementColumn.matchesField(table: WorkOrderMeasurementTable): Boolean {
    val lookup = measurementTableCandidateKeys(table)
        .flatMap { listOf(it, normalizeTemplateFieldLookup(it)) }
        .filter { it.isNotBlank() }
        .toSet()
    return listOf(fieldId, fieldKey, fieldLabel)
        .any { value -> value.isNotBlank() && (value in lookup || normalizeTemplateFieldLookup(value) in lookup) }
}

private fun WorkOrderDocumentationAiMeasurementColumn.matchesColumnKey(key: String, sheetColumn: WorkOrderMeasurementColumn? = null): Boolean {
    val lookup = aiSuggestionLookupKeys(key)
    return listOf(
        columnId,
        this.key,
        label,
        columnLetter,
        sheetColumn?.id.orEmpty(),
        sheetColumn?.label.orEmpty(),
        sheetColumn?.placeholder.orEmpty(),
    ).any { candidate ->
        candidate.isNotBlank() && (candidate in lookup || normalizeTemplateFieldLookup(candidate) in lookup)
    }
}

private fun buildDocumentationAiMeasurementCells(
    sheet: WorkOrderMeasurementSheet,
    aiColumns: List<WorkOrderDocumentationAiMeasurementColumn>,
    row: com.safenexus.app.data.WorkOrderDocumentationAiMeasurementRowSuggestion,
): Map<String, String> {
    val cells = mutableMapOf<String, String>()
    val writableAiColumns = aiColumns
        .filter { aiColumn ->
            val sheetColumn = sheet.columns.firstOrNull { it.id == aiColumn.columnId }
            sheetColumn != null && !sheetColumn.readonly && sheetColumn.computed.isBlank()
        }
        .sortedWith(compareBy<WorkOrderDocumentationAiMeasurementColumn> { it.columnIndex }.thenBy { it.columnId })

    row.values.forEach { (key, value) ->
        val trimmedValue = value.trim()
        if (trimmedValue.isBlank()) return@forEach
        val aiColumn = writableAiColumns.firstOrNull { candidate ->
            val sheetColumn = sheet.columns.firstOrNull { it.id == candidate.columnId }
            candidate.matchesColumnKey(key, sheetColumn)
        }
        val directColumn = sheet.columns.firstOrNull { column ->
            !column.readonly &&
                column.computed.isBlank() &&
                (column.id.equals(key, ignoreCase = true) || normalizeTemplateFieldLookup(column.label) == normalizeTemplateFieldLookup(key))
        }
        val columnId = aiColumn?.columnId ?: directColumn?.id
        if (!columnId.isNullOrBlank()) {
            cells[columnId] = trimmedValue
        }
    }

    row.orderedValues.forEachIndexed { index, value ->
        val trimmedValue = value.trim()
        if (trimmedValue.isBlank()) return@forEachIndexed
        val columnId = writableAiColumns.getOrNull(index)?.columnId.orEmpty()
        if (columnId.isNotBlank() && !cells.containsKey(columnId)) {
            cells[columnId] = trimmedValue
        }
    }

    return cells.toMap()
}

private fun mergeDocumentationAiRowsIntoSheet(
    sheet: WorkOrderMeasurementSheet,
    aiRows: List<Map<String, String>>,
): WorkOrderMeasurementSheet {
    if (aiRows.isEmpty()) return sheet
    val writableColumns = sheet.columns.filter { !it.readonly && it.computed.isBlank() }
    val nextRows = sheet.rows.toMutableList()

    aiRows.forEach { aiCells ->
        val rowIndex = nextRows.indexOfFirst { row ->
            writableColumns.all { column -> row.cells[column.id].orEmpty().trim().isBlank() }
        }
        if (rowIndex >= 0) {
            val current = nextRows[rowIndex]
            nextRows[rowIndex] = current.copy(cells = current.cells + aiCells)
        } else {
            val rowId = "ai-row-${nextRows.size + 1}"
            nextRows.add(
                WorkOrderMeasurementRow(
                    id = rowId,
                    cells = sheet.columns.associate { column -> column.id to aiCells[column.id].orEmpty() },
                    formats = emptyMap(),
                ),
            )
        }
    }

    return sheet.copy(rows = nextRows)
}

private fun applyDocumentationAiMeasurementSuggestions(
    template: WorkOrderDocumentationTemplate,
    result: WorkOrderDocumentationAiResult,
    sheets: Map<String, WorkOrderMeasurementSheet>,
): DocumentationAiMeasurementApplyResult {
    val nextSheets = sheets.toMutableMap()
    var rowCount = 0
    var tableCount = 0

    result.measurementSuggestions.forEach { suggestion ->
        val table = template.measurementTables.firstOrNull { it.matchesAiMeasurementSuggestion(suggestion) } ?: return@forEach
        val stateKey = measurementSheetStateKey(template, table)
        val sheet = nextSheets[stateKey] ?: table.sheet
        val aiColumns = template.aiMeasurementColumns.filter { it.matchesField(table) }
        if (aiColumns.isEmpty()) return@forEach
        val aiRows = suggestion.rows
            .map { row -> buildDocumentationAiMeasurementCells(sheet, aiColumns, row) }
            .filter { it.isNotEmpty() }
        if (aiRows.isEmpty()) return@forEach
        nextSheets[stateKey] = mergeDocumentationAiRowsIntoSheet(sheet, aiRows)
        rowCount += aiRows.size
        tableCount += 1
    }

    return DocumentationAiMeasurementApplyResult(nextSheets.toMap(), rowCount, tableCount)
}

private fun buildDocumentationAiResultMessage(
    result: WorkOrderDocumentationAiResult,
    fieldCount: Int,
    measurementRowCount: Int,
): String {
    if (result.dryRun) {
        return result.message.ifBlank { "NexAI dry-run je prošao, ali live pozivi nisu uključeni na serveru." }
    }
    val warnings = result.warnings.take(2).joinToString(" ")
    val applied = listOf(
        if (fieldCount > 0) "$fieldCount polja" else "",
        if (measurementRowCount > 0) "$measurementRowCount redaka mjerenja" else "",
    ).filter { it.isNotBlank() }.joinToString(" i ")
    return listOf(
        if (applied.isNotBlank()) "NexAI je popunio $applied." else "NexAI je vratio odgovor, ali nema sigurnih upisa za ovaj template.",
        result.message,
        warnings.takeIf { it.isNotBlank() }?.let { "Provjeri: $it" },
    ).filterNotNull().filter { it.isNotBlank() }.joinToString(" ")
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

private data class MeasurementQuickFillDraft(
    val floor: String,
    val room: String,
    val itemsText: String,
    val defaultCount: Int,
    val columnModes: Map<String, String>,
    val customValues: Map<String, String>,
)

private data class MeasurementQuickItemDraft(
    val name: String,
    val count: Int,
)

private data class MeasurementCellSelection(
    val rowIndex: Int,
    val columnIndex: Int,
)

private fun WorkOrderMeasurementColumn.isEditableMeasurementColumn(): Boolean =
    computed.isBlank() && !readonly

private fun JSONObject?.measurementFormatString(key: String): String {
    val value = this?.optString(key, "").orEmpty().trim()
    return if (value.equals("null", ignoreCase = true)) "" else value
}

private fun JSONObject?.measurementFormatBoolean(key: String): Boolean =
    this?.optBoolean(key, false) == true

private fun JSONObject?.measurementFormatInt(key: String, defaultValue: Int): Int =
    this?.optInt(key, defaultValue) ?: defaultValue

private fun normalizeMeasurementColorValueMobile(value: String): String {
    val normalized = value.trim().lowercase(Locale.getDefault())
    if (normalized.isBlank()) return ""
    if (Regex("^#[0-9a-f]{3}$").matches(normalized)) {
        return "#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}"
    }
    return if (Regex("^#[0-9a-f]{6}$").matches(normalized)) normalized else ""
}

private fun parseMeasurementColorMobile(value: String): Color? {
    val normalized = normalizeMeasurementColorValueMobile(value)
    if (normalized.isBlank()) return null
    return runCatching { Color(AndroidColor.parseColor(normalized)) }.getOrNull()
}

private fun JSONObject?.measurementBorderCustomized(): Boolean {
    val border = this?.optJSONObject("border") ?: return false
    return border.optBoolean("top", false) ||
        border.optBoolean("right", false) ||
        border.optBoolean("bottom", false) ||
        border.optBoolean("left", false)
}

private fun JSONObject?.measurementConditionalCustomized(): Boolean {
    val conditional = this?.optJSONObject("conditional") ?: return false
    return conditional.optBoolean("filled", false) &&
        (
            normalizeMeasurementColorValueMobile(conditional.optString("fillColor", "")).isNotBlank() ||
                conditional.measurementBorderCustomized() ||
                conditional.optBoolean("bold", false) ||
                conditional.optBoolean("italic", false) ||
                conditional.optBoolean("underline", false)
            )
}

private fun JSONObject?.isMeasurementFormatCustomizedMobile(): Boolean {
    val format = this ?: return false
    return format.measurementFormatString("type").let { it.isNotBlank() && it != "general" } ||
        format.measurementFormatInt("decimals", 2) != 2 ||
        format.measurementFormatString("align").let { it.isNotBlank() && it != "auto" } ||
        format.measurementFormatString("verticalAlign").let { it.isNotBlank() && it != "middle" } ||
        format.measurementFormatString("fontFamily").let { it.isNotBlank() && it != "default" } ||
        format.measurementFormatInt("fontSize", 14) != 14 ||
        format.measurementFormatBoolean("bold") ||
        format.measurementFormatBoolean("italic") ||
        format.measurementFormatBoolean("underline") ||
        normalizeMeasurementColorValueMobile(format.measurementFormatString("fillColor")).isNotBlank() ||
        format.measurementBorderCustomized() ||
        format.measurementConditionalCustomized()
}

private fun WorkOrderMeasurementRow.isMeasurementRowMeaningful(columns: List<WorkOrderMeasurementColumn>): Boolean =
    columns
        .filter { it.isEditableMeasurementColumn() }
        .any { column ->
            cells[column.id].orEmpty().trim().isNotBlank() ||
                formats[column.id].isMeasurementFormatCustomizedMobile()
        }

private fun WorkOrderMeasurementSheet.lastMeaningfulMeasurementRowIndex(): Int =
    rows.indexOfLast { row -> row.isMeasurementRowMeaningful(columns) || headerRows.contains(row.id) }

private fun WorkOrderMeasurementSheet.nextMeasurementInsertionIndex(): Int =
    (lastMeaningfulMeasurementRowIndex() + 1).coerceIn(0, rows.size)

private fun measurementRowIdFactory(rows: List<WorkOrderMeasurementRow>): () -> String {
    val used = rows.map { it.id }.filter { it.isNotBlank() }.toMutableSet()
    var counter = rows.maxOfOrNull { row ->
        Regex("^measurement-row-(\\d+)$").matchEntire(row.id)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0
    } ?: 0
    return {
        var candidate: String
        do {
            counter += 1
            candidate = "measurement-row-$counter"
        } while (used.contains(candidate))
        used.add(candidate)
        candidate
    }
}

private fun createBlankMeasurementRow(
    sheet: WorkOrderMeasurementSheet,
    id: String,
    cells: Map<String, String> = emptyMap(),
    formats: Map<String, JSONObject> = emptyMap(),
): WorkOrderMeasurementRow =
    WorkOrderMeasurementRow(
        id = id,
        cells = sheet.columns.associate { column -> column.id to cells[column.id].orEmpty() },
        formats = formats,
    )

private fun cloneMeasurementFormat(format: JSONObject?): JSONObject =
    format?.let { runCatching { JSONObject(it.toString()) }.getOrDefault(JSONObject()) } ?: JSONObject()

private fun appendBlankMeasurementRows(
    sheet: WorkOrderMeasurementSheet,
    count: Int,
): WorkOrderMeasurementSheet {
    val safeCount = count.coerceIn(1, 50)
    val nextId = measurementRowIdFactory(sheet.rows)
    val insertionIndex = sheet.nextMeasurementInsertionIndex()
    val nextRows = sheet.rows.toMutableList()
    nextRows.addAll(
        insertionIndex,
        List(safeCount) { createBlankMeasurementRow(sheet, nextId()) },
    )
    return sheet.copy(rows = nextRows)
}

private fun duplicateLastMeasurementRow(sheet: WorkOrderMeasurementSheet): WorkOrderMeasurementSheet {
    val source = sheet.rows
        .take(sheet.nextMeasurementInsertionIndex())
        .lastOrNull { row -> row.id !in sheet.headerRows && row.isMeasurementRowMeaningful(sheet.columns) }
        ?: return appendBlankMeasurementRows(sheet, 1)
    val nextId = measurementRowIdFactory(sheet.rows)
    val nextRows = sheet.rows.toMutableList()
    nextRows.add(
        sheet.nextMeasurementInsertionIndex(),
        createBlankMeasurementRow(
            sheet = sheet,
            id = nextId(),
            cells = source.cells,
            formats = source.formats.mapValues { (_, value) -> cloneMeasurementFormat(value) },
        ),
    )
    return sheet.copy(rows = nextRows)
}

private fun normalizeMeasurementQuickLookup(value: String): String =
    value.trim()
        .lowercase(Locale.getDefault())
        .replace("č", "c")
        .replace("ć", "c")
        .replace("š", "s")
        .replace("ž", "z")
        .replace("đ", "d")
        .replace("_", " ")
        .replace("-", " ")
        .replace(Regex("\\s+"), " ")

private fun defaultMeasurementQuickFillColumnModeMobile(column: WorkOrderMeasurementColumn): String {
    val label = normalizeMeasurementQuickLookup("${column.label} ${column.id}")
    return when {
        label.contains("mjerno mjesto") -> "itemIndex"
        label.contains("redni") || label == "broj" || label.contains(" r br") || label.contains(" r.br") -> "itemIndex"
        label.contains("etaza") || label.contains("kat") -> "floor"
        label.contains("prostorija") || label.contains("lokacija") || label.contains("mjesto ispit") -> "room"
        label.contains("opis") ||
            label.contains("naziv") ||
            label.contains("pozicija") ||
            label.contains("element") ||
            label.contains("oznaka") ||
            label.contains("uredaj") ||
            label.contains("tipkalo") ||
            label.contains("svjetilj") -> "item"
        label.contains("kolicina") || label.contains("kom") || label.contains("broj mjernih") -> "quantity"
        else -> "custom"
    }
}

private fun parseMeasurementQuickItems(text: String, defaultCount: Int): List<MeasurementQuickItemDraft> {
    val fallbackCount = defaultCount.coerceIn(1, 500)
    return text
        .lines()
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .map { line ->
            val parts = line.split('\t', ';').map { it.trim() }
            val name = parts.firstOrNull().orEmpty().ifBlank { line }
            val count = parts.drop(1).firstNotNullOfOrNull { it.toIntOrNull() } ?: fallbackCount
            MeasurementQuickItemDraft(name = name, count = count.coerceIn(1, 500))
        }
}

private fun normalizeMeasurementQuickFormula(value: String): String {
    val trimmed = value.trim().ifBlank { "=RANDBETWEEN(1;100)" }
    return if (trimmed.startsWith("=")) trimmed else "=$trimmed"
}

private fun measurementQuickCellValue(
    mode: String,
    customValue: String,
    floor: String,
    room: String,
    item: MeasurementQuickItemDraft,
    itemIndex: Int,
): String =
    when (mode) {
        "itemIndex" -> (itemIndex + 1).toString()
        "floor" -> floor
        "room" -> room
        "item" -> item.name
        "quantity" -> item.count.toString()
        "formula" -> normalizeMeasurementQuickFormula(customValue)
        "custom" -> customValue
        else -> ""
    }

private fun applyMeasurementQuickFill(
    sheet: WorkOrderMeasurementSheet,
    draft: MeasurementQuickFillDraft,
): WorkOrderMeasurementSheet {
    val editableColumns = sheet.columns.filter { it.isEditableMeasurementColumn() }
    if (editableColumns.isEmpty()) return sheet

    val floor = draft.floor.trim()
    val room = draft.room.trim()
    val items = parseMeasurementQuickItems(draft.itemsText, draft.defaultCount)
    if (items.isEmpty() && floor.isBlank() && room.isBlank()) return sheet

    val nextId = measurementRowIdFactory(sheet.rows)
    val rowsToInsert = mutableListOf<WorkOrderMeasurementRow>()
    val headerRowsToAdd = mutableListOf<String>()
    val mergesToAdd = mutableListOf<WorkOrderMeasurementMerge>()
    val firstEditable = editableColumns.first()
    val firstEditableIndex = sheet.columns.indexOfFirst { it.id == firstEditable.id }
    val lastEditableIndex = sheet.columns.indexOfLast { it.isEditableMeasurementColumn() }

    fun addHeader(label: String, fillColor: String) {
        val rowId = nextId()
        rowsToInsert.add(
            createBlankMeasurementRow(
                sheet = sheet,
                id = rowId,
                cells = mapOf(firstEditable.id to label),
                formats = mapOf(
                    firstEditable.id to JSONObject()
                        .put("bold", true)
                        .put("fillColor", fillColor)
                        .put("align", "left"),
                ),
            ),
        )
        headerRowsToAdd.add(rowId)
        if (firstEditableIndex >= 0 && lastEditableIndex > firstEditableIndex) {
            mergesToAdd.add(
                WorkOrderMeasurementMerge(
                    rowId = rowId,
                    columnId = firstEditable.id,
                    rowSpan = 1,
                    colSpan = lastEditableIndex - firstEditableIndex + 1,
                ),
            )
        }
    }

    if (floor.isNotBlank()) addHeader("Etaža: $floor", "#eef7ff")
    if (room.isNotBlank()) addHeader("Prostorija: $room", "#f0fbf4")

    val rowsFromItems = if (items.isNotEmpty()) items else listOf(MeasurementQuickItemDraft(name = "", count = draft.defaultCount))
    rowsFromItems.forEach { item ->
        repeat(item.count.coerceIn(1, 500)) { index ->
            val cells = sheet.columns.associate { column ->
                val mode = draft.columnModes[column.id] ?: defaultMeasurementQuickFillColumnModeMobile(column)
                val customValue = draft.customValues[column.id].orEmpty()
                column.id to if (column.isEditableMeasurementColumn()) {
                    measurementQuickCellValue(mode, customValue, floor, room, item, index)
                } else {
                    ""
                }
            }
            rowsToInsert.add(createBlankMeasurementRow(sheet, nextId(), cells))
        }
    }

    if (rowsToInsert.isEmpty()) return sheet
    val insertionIndex = sheet.nextMeasurementInsertionIndex()
    val nextRows = sheet.rows.toMutableList()
    nextRows.addAll(insertionIndex, rowsToInsert)
    return sheet.copy(
        rows = nextRows,
        merges = sheet.merges + mergesToAdd,
        headerRows = (sheet.headerRows + headerRowsToAdd).distinct(),
    )
}

private fun fillMeasurementRowNumbers(sheet: WorkOrderMeasurementSheet): WorkOrderMeasurementSheet {
    val targetColumn = sheet.columns.firstOrNull { column ->
        val label = normalizeMeasurementQuickLookup("${column.label} ${column.id}")
        column.isEditableMeasurementColumn() &&
            (label.contains("redni") || label.contains("r br") || label.contains("r.br") || label.contains("mjerno mjesto") || label == "broj")
    } ?: sheet.columns.firstOrNull { it.isEditableMeasurementColumn() } ?: return sheet
    val lastMeaningfulIndex = sheet.lastMeaningfulMeasurementRowIndex()
    var counter = 1
    val nextRows = sheet.rows.mapIndexed { index, row ->
        val inTargetRange = if (lastMeaningfulIndex >= 0) index <= lastMeaningfulIndex else index < 10
        if (!inTargetRange || row.id in sheet.headerRows) {
            row
        } else {
            val hasContent = row.isMeasurementRowMeaningful(sheet.columns)
            if (hasContent || lastMeaningfulIndex < 0) {
                row.copy(cells = row.cells + (targetColumn.id to (counter++).toString()))
            } else {
                row
            }
        }
    }
    return sheet.copy(rows = nextRows)
}

private fun appendMeasurementColumn(sheet: WorkOrderMeasurementSheet): WorkOrderMeasurementSheet {
    val usedIds = sheet.columns.map { it.id }.toMutableSet()
    var index = sheet.columns.size + 1
    var columnId: String
    do {
        columnId = "measurement-column-$index"
        index += 1
    } while (usedIds.contains(columnId))
    val label = "Kolona ${sheet.columns.size + 1}"
    val column = WorkOrderMeasurementColumn(
        id = columnId,
        label = label,
        placeholder = "",
        width = 140,
        computed = "",
        readonly = false,
    )
    return sheet.copy(
        columns = sheet.columns + column,
        rows = sheet.rows.map { row -> row.copy(cells = row.cells + (columnId to "")) },
    )
}

private fun updateMeasurementCellFormat(
    sheet: WorkOrderMeasurementSheet,
    rowId: String,
    columnId: String,
    patch: Map<String, Any?>,
): WorkOrderMeasurementSheet =
    sheet.copy(
        rows = sheet.rows.map { row ->
            if (row.id != rowId) return@map row
            val nextFormats = row.formats.toMutableMap()
            val format = cloneMeasurementFormat(nextFormats[columnId])
            patch.forEach { (key, value) ->
                if (value == null) {
                    format.remove(key)
                } else {
                    format.put(key, value)
                }
            }
            if (format.isMeasurementFormatCustomizedMobile()) {
                nextFormats[columnId] = format
            } else {
                nextFormats.remove(columnId)
            }
            row.copy(formats = nextFormats.toMap())
        },
    )

private fun updateMeasurementCellFill(
    sheet: WorkOrderMeasurementSheet,
    rowId: String,
    columnId: String,
    fillColor: String?,
): WorkOrderMeasurementSheet =
    updateMeasurementCellFormat(sheet, rowId, columnId, mapOf("fillColor" to fillColor))

private fun formatMeasurementNumberWithDecimalsMobile(value: Double, decimals: Int): String {
    val safeDecimals = decimals.coerceIn(0, 6)
    val formatter = NumberFormat.getNumberInstance(Locale("hr", "HR"))
    formatter.minimumFractionDigits = safeDecimals
    formatter.maximumFractionDigits = safeDecimals
    return formatter.format(value)
}

private fun formatMeasurementCellDisplayMobile(
    displayValue: String,
    rawValue: String,
    format: JSONObject?,
): String {
    val value = if (rawValue.trim().startsWith("=")) displayValue else displayValue.ifBlank { rawValue }
    if (value.isBlank() || value == "#ERROR") return value
    val type = format.measurementFormatString("type").ifBlank { "general" }
    if (type == "general" || type == "text") return value
    val numeric = parseMeasurementNumberMobile(value) ?: return value
    val decimals = format.measurementFormatInt("decimals", 2)
    return when (type) {
        "integer" -> formatMeasurementNumberWithDecimalsMobile(kotlin.math.round(numeric), 0)
        "percent" -> "${formatMeasurementNumberWithDecimalsMobile(numeric * 100.0, decimals)}%"
        "number" -> formatMeasurementNumberWithDecimalsMobile(numeric, decimals)
        else -> value
    }
}

private fun measurementFormatFillColor(format: JSONObject?, value: String): Color? {
    val conditional = format?.optJSONObject("conditional")
    if (value.isNotBlank() && conditional?.optBoolean("filled", false) == true) {
        parseMeasurementColorMobile(conditional.optString("fillColor", ""))?.let { return it }
    }
    return parseMeasurementColorMobile(format.measurementFormatString("fillColor"))
}

private fun measurementFormatTextColor(format: JSONObject?): Color? =
    parseMeasurementColorMobile(
        listOf(
            format.measurementFormatString("textColor"),
            format.measurementFormatString("fontColor"),
            format.measurementFormatString("color"),
        ).firstOrNull { it.isNotBlank() }.orEmpty(),
    )

private fun measurementFormatBold(format: JSONObject?, value: String): Boolean {
    val conditional = format?.optJSONObject("conditional")
    return format.measurementFormatBoolean("bold") ||
        (value.isNotBlank() && conditional?.optBoolean("filled", false) == true && conditional.optBoolean("bold", false))
}

private fun measurementFormatTextAlign(format: JSONObject?): TextAlign =
    when (format.measurementFormatString("align")) {
        "center" -> TextAlign.Center
        "right" -> TextAlign.Right
        else -> TextAlign.Start
    }

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
    signatureMode: String,
    completedBy: String,
    completedByOptions: List<Pair<String, String>>,
    handoverVerifierUserId: String,
    handoverVerifierOptions: List<Pair<String, String>>,
    handoverVerifierLabelById: Map<String, String>,
    includeHandoverProtocol: Boolean,
    enabled: Boolean,
    onSignatureMode: (String) -> Unit,
    onCompletedByChange: (String) -> Unit,
    onHandoverVerifierChange: (String) -> Unit,
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
        WorkOrderSelectField(
            label = "Ovjerio izvršitelj",
            value = handoverVerifierUserId,
            valueLabel = handoverVerifierLabelById[handoverVerifierUserId].orEmpty().ifBlank { "Odaberi osobu" },
            options = handoverVerifierOptions,
            enabled = enabled && handoverVerifierOptions.size > 1,
            onSelect = onHandoverVerifierChange,
        )
        DocumentationSummaryRow(
            "Izvori",
            listOf(
                "$selectedEquipmentCount oprema",
                "$selectedLegalCount propisi",
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
    val visibleColumns = remember(sheet.columns) { sheet.columns.take(16) }
    val lastMeaningfulRowIndex = remember(sheet.rows, sheet.columns, sheet.headerRows) {
        sheet.lastMeaningfulMeasurementRowIndex()
    }
    var extraRowWindow by remember(table.key, table.id) { mutableStateOf(0) }
    var quickFillOpen by remember(table.key, table.id) { mutableStateOf(false) }
    val baseVisibleRowCount = remember(sheet.rows.size, lastMeaningfulRowIndex) {
        if (sheet.rows.isEmpty()) {
            0
        } else if (lastMeaningfulRowIndex >= 0) {
            maxOf(12, minOf(lastMeaningfulRowIndex + 4, 32)).coerceAtMost(sheet.rows.size)
        } else {
            minOf(12, sheet.rows.size)
        }
    }
    val visibleRowCount = (baseVisibleRowCount + extraRowWindow).coerceAtMost(sheet.rows.size)
    val visibleRows = remember(sheet.rows, visibleRowCount) { sheet.rows.take(visibleRowCount) }
    val initialSelection = remember(table.key, table.id, sheet.columns.size) {
        val columnIndex = sheet.columns.indexOfFirst { it.isEditableMeasurementColumn() }.takeIf { it >= 0 } ?: 0
        MeasurementCellSelection(0, columnIndex)
    }
    var selectedCell by remember(table.key, table.id) { mutableStateOf(initialSelection) }
    LaunchedEffect(sheet.rows.size, sheet.columns.size) {
        val safeRow = selectedCell.rowIndex.coerceIn(0, (sheet.rows.size - 1).coerceAtLeast(0))
        val safeColumn = selectedCell.columnIndex.coerceIn(0, (sheet.columns.size - 1).coerceAtLeast(0))
        if (safeRow != selectedCell.rowIndex || safeColumn != selectedCell.columnIndex) {
            selectedCell = MeasurementCellSelection(safeRow, safeColumn)
        }
    }
    val selectedRow = sheet.rows.getOrNull(selectedCell.rowIndex)
    val selectedColumn = sheet.columns.getOrNull(selectedCell.columnIndex)
    val selectedRaw = selectedRow?.cells?.get(selectedColumn?.id.orEmpty()).orEmpty()
    val selectedEditable = selectedColumn?.isEditableMeasurementColumn() == true
    val selectedDisplay = sheet.measurementCellDisplay(selectedCell.rowIndex, selectedCell.columnIndex)
    val gridLine = MaterialTheme.colorScheme.outline.copy(alpha = 0.34f)
    if (quickFillOpen) {
        MeasurementQuickFillDialog(
            columns = visibleColumns,
            enabled = enabled,
            onDismiss = { quickFillOpen = false },
            onApply = { draft ->
                onSheetChange(applyMeasurementQuickFill(sheet, draft))
                extraRowWindow = extraRowWindow.coerceAtLeast(20)
                quickFillOpen = false
            },
        )
    }
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
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp),
                ) {
                    AssistChip(
                        onClick = { onSheetChange(appendBlankMeasurementRows(sheet, 1)) },
                        enabled = enabled,
                        label = { Text("+ Red") },
                    )
                    AssistChip(
                        onClick = { onSheetChange(appendBlankMeasurementRows(sheet, 5)) },
                        enabled = enabled,
                        label = { Text("+ 5") },
                    )
                    AssistChip(
                        onClick = { quickFillOpen = true },
                        enabled = enabled && visibleColumns.any { it.isEditableMeasurementColumn() },
                        label = { Text("Brzi unos") },
                    )
                    AssistChip(
                        onClick = { onSheetChange(duplicateLastMeasurementRow(sheet)) },
                        enabled = enabled,
                        label = { Text("Kopiraj zadnji") },
                    )
                    AssistChip(
                        onClick = { onSheetChange(fillMeasurementRowNumbers(sheet)) },
                        enabled = enabled,
                        label = { Text("R.br.") },
                    )
                    AssistChip(
                        onClick = { onSheetChange(appendMeasurementColumn(sheet)) },
                        enabled = enabled,
                        label = { Text("+ Kolona") },
                    )
                }
                if (selectedRow != null && selectedColumn != null && selectedEditable) {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(7.dp),
                        verticalArrangement = Arrangement.spacedBy(7.dp),
                    ) {
                        listOf(
                            "Da" to "#d9ead3",
                            "Ne" to "#f4cccc",
                            "-" to "#eeeeee",
                        ).forEach { (value, color) ->
                            AssistChip(
                                onClick = {
                                    onSheetChange(
                                        updateMeasurementCellFill(
                                            updateMeasurementSheetCell(sheet, selectedRow.id, selectedColumn.id, value),
                                            selectedRow.id,
                                            selectedColumn.id,
                                            color,
                                        ),
                                    )
                                },
                                enabled = enabled,
                                label = { Text(value) },
                            )
                        }
                        MeasurementColorChip("Zelena", "#d9ead3", enabled) {
                            onSheetChange(updateMeasurementCellFill(sheet, selectedRow.id, selectedColumn.id, "#d9ead3"))
                        }
                        MeasurementColorChip("Žuta", "#fff2cc", enabled) {
                            onSheetChange(updateMeasurementCellFill(sheet, selectedRow.id, selectedColumn.id, "#fff2cc"))
                        }
                        MeasurementColorChip("Crvena", "#f4cccc", enabled) {
                            onSheetChange(updateMeasurementCellFill(sheet, selectedRow.id, selectedColumn.id, "#f4cccc"))
                        }
                        MeasurementColorChip("Siva", "#eeeeee", enabled) {
                            onSheetChange(updateMeasurementCellFill(sheet, selectedRow.id, selectedColumn.id, "#eeeeee"))
                        }
                        MeasurementColorChip("Bez", null, enabled) {
                            onSheetChange(updateMeasurementCellFill(sheet, selectedRow.id, selectedColumn.id, null))
                        }
                    }
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
                                val absoluteColumnIndex = sheet.columns.indexOfFirst { it.id == column.id }.takeIf { it >= 0 } ?: columnIndex
                                MeasurementGridCell(
                                    column = column,
                                    displayValue = sheet.measurementCellDisplay(rowIndex, absoluteColumnIndex),
                                    rawValue = row.cells[column.id].orEmpty(),
                                    cellFormat = row.formats[column.id],
                                    headerRow = sheet.headerRows.contains(row.id),
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
                if (visibleRowCount < sheet.rows.size) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "Prikazano $visibleRowCount/${sheet.rows.size} redova",
                            modifier = Modifier.weight(1f),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                        )
                        OutlinedButton(onClick = { extraRowWindow += 20 }, enabled = enabled) {
                            Text("Još 20")
                        }
                        TextButton(onClick = { extraRowWindow = sheet.rows.size }, enabled = enabled) {
                            Text("Sve")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MeasurementQuickFillDialog(
    columns: List<WorkOrderMeasurementColumn>,
    enabled: Boolean,
    onDismiss: () -> Unit,
    onApply: (MeasurementQuickFillDraft) -> Unit,
) {
    val editableColumns = remember(columns) { columns.filter { it.isEditableMeasurementColumn() } }
    val columnSignature = remember(editableColumns) { editableColumns.joinToString("|") { "${it.id}:${it.label}" } }
    var floor by remember { mutableStateOf("") }
    var room by remember { mutableStateOf("") }
    var itemsText by remember { mutableStateOf("") }
    var defaultCount by remember { mutableStateOf("1") }
    var columnModes by remember(columnSignature) {
        mutableStateOf(editableColumns.associate { it.id to defaultMeasurementQuickFillColumnModeMobile(it) })
    }
    var customValues by remember(columnSignature) { mutableStateOf(emptyMap<String, String>()) }
    val modeOptions = listOf(
        "itemIndex" to "Redni broj",
        "floor" to "Etaža",
        "room" to "Prostorija",
        "item" to "Stavka / naziv",
        "quantity" to "Količina",
        "formula" to "Formula",
        "custom" to "Vrijednost",
        "empty" to "Prazno",
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    onApply(
                        MeasurementQuickFillDraft(
                            floor = floor,
                            room = room,
                            itemsText = itemsText,
                            defaultCount = defaultCount.toIntOrNull()?.coerceIn(1, 500) ?: 1,
                            columnModes = columnModes,
                            customValues = customValues,
                        ),
                    )
                },
                enabled = enabled,
            ) {
                Text("Dodaj")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Odustani")
            }
        },
        title = { Text("Brzi unos stavki") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 540.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    "Svaki red je jedna stavka. Količinu možeš pisati kao: Stavka;3.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
                )
                OutlinedTextField(
                    value = floor,
                    onValueChange = { floor = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Etaža") },
                    singleLine = true,
                    enabled = enabled,
                    shape = RoundedCornerShape(14.dp),
                )
                OutlinedTextField(
                    value = room,
                    onValueChange = { room = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Prostorija") },
                    singleLine = true,
                    enabled = enabled,
                    shape = RoundedCornerShape(14.dp),
                )
                OutlinedTextField(
                    value = itemsText,
                    onValueChange = { itemsText = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Stavke") },
                    minLines = 4,
                    maxLines = 7,
                    enabled = enabled,
                    shape = RoundedCornerShape(14.dp),
                )
                OutlinedTextField(
                    value = defaultCount,
                    onValueChange = { value -> defaultCount = value.filter { it.isDigit() }.take(3) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Količina po stavci") },
                    singleLine = true,
                    enabled = enabled,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(14.dp),
                )
                Text("Vrijednosti po kolonama", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                editableColumns.take(10).forEach { column ->
                    val mode = columnModes[column.id] ?: defaultMeasurementQuickFillColumnModeMobile(column)
                    WorkOrderSelectField(
                        label = column.label.ifBlank { column.id },
                        value = mode,
                        valueLabel = modeOptions.firstOrNull { it.first == mode }?.second ?: mode,
                        options = modeOptions,
                        enabled = enabled,
                        onSelect = { value -> columnModes = columnModes + (column.id to value) },
                    )
                    if (mode == "custom" || mode == "formula") {
                        OutlinedTextField(
                            value = customValues[column.id].orEmpty(),
                            onValueChange = { value -> customValues = customValues + (column.id to value) },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text(if (mode == "formula") "Formula" else "Vrijednost") },
                            singleLine = true,
                            enabled = enabled,
                            shape = RoundedCornerShape(14.dp),
                        )
                    }
                }
                if (editableColumns.size > 10) {
                    Text(
                        "Prikazano je prvih 10 kolona za brzi unos. Ostale možeš urediti direktno u tablici.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                    )
                }
            }
        },
        properties = DialogProperties(usePlatformDefaultWidth = false),
    )
}

@Composable
private fun MeasurementColorChip(
    label: String,
    colorHex: String?,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val chipColor = colorHex?.let(::parseMeasurementColorMobile)
    val shape = RoundedCornerShape(999.dp)
    Surface(
        modifier = Modifier
            .clip(shape)
            .clickable(enabled = enabled) { onClick() },
        shape = shape,
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier
                .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f), shape)
                .padding(horizontal = 9.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                modifier = Modifier.size(13.dp),
                shape = CircleShape,
                color = chipColor ?: Color.Transparent,
                border = if (chipColor == null) {
                    androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))
                } else {
                    null
                },
            ) {}
            Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
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
    cellFormat: JSONObject?,
    headerRow: Boolean,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    onChange: (String) -> Unit,
) {
    val editable = column.isEditableMeasurementColumn()
    val isFormula = rawValue.trim().startsWith("=")
    val value = formatMeasurementCellDisplayMobile(
        displayValue = if (isFormula) displayValue else displayValue.ifBlank { rawValue },
        rawValue = rawValue,
        format = cellFormat,
    )
    val hasError = value == "#ERROR"
    val gridLine = MaterialTheme.colorScheme.outline.copy(alpha = 0.34f)
    val cellWidth = column.width.coerceIn(120, 260).dp
    val fillColor = measurementFormatFillColor(cellFormat, value)
    val textColor = measurementFormatTextColor(cellFormat)
    val textAlign = measurementFormatTextAlign(cellFormat)
    val bold = headerRow || measurementFormatBold(cellFormat, value)
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
                    fillColor != null -> fillColor
                    headerRow -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.28f)
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
            fontWeight = if (selected || bold) FontWeight.Bold else FontWeight.Normal,
            textAlign = textAlign,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = when {
                hasError -> MaterialTheme.colorScheme.onErrorContainer
                value.isBlank() -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.42f)
                textColor != null -> textColor
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
    val sourceTitle = documentationTemplateDataSourceTitle(template)
    val sourceDetails = documentationTemplateDataSourceDetails(template)
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
                Text(sourceTitle, fontWeight = FontWeight.Black)
                Text(
                    listOf(
                        sourceDetails,
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

private fun documentationTemplateDataSourceTitle(template: WorkOrderDocumentationTemplate): String {
    val type = template.dataSourceType.trim().lowercase(Locale.getDefault())
    val sourceTitle = template.dataSourceTitle.ifBlank { template.title.ifBlank { "Zapisnik" } }
    return if (type == "previous_inspection") {
        val dateLabel = formatDatePickerLabel(template.dataSourceDate)
        listOf("Prethodno ispitivanje", dateLabel).filter { it.isNotBlank() }.joinToString(" - ")
    } else {
        "Predložak: $sourceTitle"
    }
}

private fun documentationTemplateDataSourceDetails(template: WorkOrderDocumentationTemplate): String {
    val type = template.dataSourceType.trim().lowercase(Locale.getDefault())
    if (type != "previous_inspection") {
        return ""
    }
    return listOf(
        template.dataSourceTitle.ifBlank { template.title }.takeIf { it.isNotBlank() },
        template.dataSourceWorkOrderNumber.takeIf { it.isNotBlank() }?.let { "RN $it" },
    ).filterNotNull().joinToString(" - ")
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
    val measurementSheets: Map<String, WorkOrderMeasurementSheet>,
    val onMeasurementSheetChange: (String, WorkOrderMeasurementSheet) -> Unit,
    val standardValues: DocumentationStandardValues,
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

private val documentationAiModelTierOptions = listOf(
    "fast" to "Brzi",
    "standard" to "Standard",
    "strong" to "Jaki",
    "max" to "Najjači",
)

@Composable
private fun DocumentationAiAssistantSection(
    templates: List<WorkOrderDocumentationTemplate>,
    selectedTemplate: WorkOrderDocumentationTemplate?,
    selectedTemplateId: String,
    onSelectedTemplateChange: (String) -> Unit,
    files: List<WorkOrderDocumentationAiFile>,
    modelTier: String,
    message: String,
    loading: Boolean,
    enabled: Boolean,
    onModelTierChange: (String) -> Unit,
    onPickFiles: () -> Unit,
    onRemoveFile: (String) -> Unit,
    onRun: () -> Unit,
) {
    WizardSection(title = "NexAI", icon = Icons.Rounded.Fingerprint) {
        Text(
            "Dodaj stari PDF, sliku ili tekst. NexAI popunjava samo polja i Excel kolone označene u Template Developmentu.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.64f),
        )
        if (templates.size > 1) {
            WorkOrderSelectField(
                label = "Template",
                value = selectedTemplateId,
                valueLabel = selectedTemplate?.title ?: "Odaberi template",
                options = templates.map { template ->
                    template.id to listOf(template.serviceCode, template.title)
                        .filter { it.isNotBlank() }
                        .joinToString(" - ")
                },
                enabled = enabled && !loading,
                onSelect = onSelectedTemplateChange,
            )
        }
        val templateMeta = selectedTemplate?.let { template ->
            listOf(
                if (template.aiFields.isNotEmpty()) "${template.aiFields.size} AI polja" else "",
                if (template.aiMeasurementColumns.isNotEmpty()) "${template.aiMeasurementColumns.size} AI Excel kolona" else "",
            ).filter { it.isNotBlank() }.joinToString(" · ")
        }.orEmpty()
        if (templateMeta.isNotBlank()) {
            Text(
                templateMeta,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedButton(
                onClick = onPickFiles,
                enabled = enabled && !loading && files.size < WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILES,
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(Icons.Rounded.Folder, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Dodaj PDF/sliku")
            }
            Button(
                onClick = onRun,
                enabled = enabled && !loading && selectedTemplate != null && files.isNotEmpty(),
                shape = RoundedCornerShape(14.dp),
            ) {
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(6.dp))
                } else {
                    Icon(Icons.Rounded.Fingerprint, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                }
                Text(if (loading) "Čitam..." else "Pokreni NexAI", fontWeight = FontWeight.Bold)
            }
        }
        WorkOrderSelectField(
            label = "Snaga modela",
            value = modelTier,
            valueLabel = documentationAiModelTierOptions.firstOrNull { it.first == modelTier }?.second ?: "Standard",
            options = documentationAiModelTierOptions,
            enabled = enabled && !loading,
            onSelect = onModelTierChange,
        )
        if (files.isEmpty()) {
            Text(
                "Nema dodanih datoteka. Za početak je dovoljan stari PDF zapisnik.",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
            )
        } else {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                files.forEach { file ->
                    AssistChip(
                        onClick = { onRemoveFile(file.id) },
                        label = {
                            Text(
                                listOf(file.name, formatFileSizeLabel(file.size)).filter { it.isNotBlank() }.joinToString(" · "),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        },
                        leadingIcon = {
                            Icon(
                                if (file.type.startsWith("image/", ignoreCase = true)) Icons.Rounded.Image else Icons.Rounded.InsertDriveFile,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                            )
                        },
                    )
                }
            }
        }
        if (message.isNotBlank()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.48f),
            ) {
                Text(
                    message,
                    modifier = Modifier.padding(10.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.78f),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
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
                            standardValues = standardControls.standardValues,
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
    var expanded by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    val selectedLabels = remember(executorOptions, selectedExecutors) {
        val labelByValue = executorOptions.associate { it.first to it.second }
        selectedExecutors
            .map { value -> labelByValue[value] ?: value }
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.getDefault()) }
    }
    val filteredOptions = remember(executorOptions, query) {
        val normalizedQuery = query.trim().lowercase(Locale.getDefault())
        executorOptions
            .filter { option ->
                normalizedQuery.isBlank() ||
                    option.second.lowercase(Locale.getDefault()).contains(normalizedQuery)
            }
            .take(36)
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.82f),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Rounded.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Izvršitelji RN-a", fontWeight = FontWeight.Black)
                    Text(
                        if (selectedLabels.isEmpty()) "Nije dodijeljeno" else "${selectedLabels.size} odabrano",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                    )
                }
                TextButton(onClick = { expanded = !expanded }, enabled = enabled || expanded) {
                    Text(if (expanded) "Zatvori" else "Uredi", fontWeight = FontWeight.Bold)
                }
            }

            if (selectedLabels.isEmpty()) {
                Text(
                    "Nije dodijeljeno",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                )
            } else {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    selectedLabels.take(3).forEach { label ->
                        AssistChip(
                            onClick = { expanded = true },
                            label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                        )
                    }
                    if (selectedLabels.size > 3) {
                        AssistChip(
                            onClick = { expanded = true },
                            label = { Text("+${selectedLabels.size - 3}") },
                        )
                    }
                }
            }

            AnimatedVisibility(expanded) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        enabled = enabled,
                        singleLine = true,
                        label = { Text("Traži izvršitelja") },
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 210.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        WorkOrderMultiSelectChips(
                            options = filteredOptions,
                            selected = selectedExecutors,
                            enabled = enabled,
                            emptyText = "Nema dostupnih korisnika za odabir izvršitelja.",
                            onToggle = { value -> onChange(selectedExecutors.toggleValue(value)) },
                        )
                        if (executorOptions.size > filteredOptions.size) {
                            Text(
                                "Prikazano ${filteredOptions.size} od ${executorOptions.size}.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.58f),
                            )
                        }
                    }
                }
            }

            Text(
                "Sprema se odmah nakon promjene.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
            )
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

private fun documentationSignatureBlockTypeLabel(block: WorkOrderDocumentationTemplateBlock): String {
    if (!isDocumentationSignatureFieldType(block.type)) return ""
    return when (normalizeDocumentationSignatureRole(block.signatureRole, block.type)) {
        "authorize" -> "Ovlaštena osoba"
        "company_responsible" -> "Odgovorna osoba naručitelja"
        "all" -> "Ispitivači i ovlaštena osoba"
        else -> "Ispitivači"
    }
}

private fun documentationSignatureBlockSelectionSummary(
    block: WorkOrderDocumentationTemplateBlock,
    standard: DocumentationStandardValues,
): String? {
    if (!isDocumentationSignatureFieldType(block.type)) return null
    val role = normalizeDocumentationSignatureRole(block.signatureRole, block.type)
    if (role == "company_responsible") {
        return "Automatski iz podataka tvrtke/lokacije."
    }
    return standardDocumentationSignatureValue(block.signatureArea, block.signatureRole, block.type, standard)
        .ifBlank { "Odaberi osobu u bloku Osobe i ovlaštenja." }
}

@Composable
private fun TemplateBlockDetailRow(
    template: WorkOrderDocumentationTemplate,
    block: WorkOrderDocumentationTemplateBlock,
    editableField: WorkOrderDocumentationField?,
    value: String,
    standardValues: DocumentationStandardValues,
    enabled: Boolean,
    onChange: (WorkOrderDocumentationField, String) -> Unit,
) {
    val signatureSummary = remember(block, standardValues) {
        documentationSignatureBlockSelectionSummary(block, standardValues)
    }
    val blockTypeLabel = remember(block) {
        documentationSignatureBlockTypeLabel(block).ifBlank { block.typeLabel }
    }
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
                        blockTypeLabel,
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
                    signatureSummary ?: block.summary.ifBlank {
                        when (block.type.lowercase(Locale.getDefault())) {
                            "measurement_table" -> "Excel tablica se uređuje u bloku Excel / mjerenja."
                            "equipment_list" -> "Oprema se bira u bloku Mjerna i ispitna oprema."
                            "legal_list" -> "Propisi se biraju u bloku Propisi."
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
            if (block.helpText.isNotBlank() && signatureSummary == null) {
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
                                    "legal_list" -> "Propisi se biraju u bloku Propisi."
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

private suspend fun buildWorkOrderDocumentationAiFiles(
    context: Context,
    uris: List<Uri>,
    existingCount: Int,
): List<WorkOrderDocumentationAiFile> = withContext(Dispatchers.IO) {
    val availableSlots = (WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILES - existingCount).coerceAtLeast(0)
    if (availableSlots <= 0) {
        error("Možeš dodati najviše $WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILES datoteka za NexAI.")
    }
    uris.take(availableSlots).mapIndexed { index, uri ->
        val bytes = readUriBytes(context, uri)
        val name = resolveUriDisplayName(context, uri, existingCount + index, WorkOrderDocumentInputMode.File)
        if (bytes.size.toLong() > WORK_ORDER_DOCUMENTATION_AI_MAX_INLINE_FILE_BYTES) {
            error("Datoteka $name mora biti manja od 8 MB za NexAI.")
        }
        val mimeType = resolveUriMimeType(context, uri, name).ifBlank { "application/octet-stream" }
        WorkOrderDocumentationAiFile(
            id = "${System.currentTimeMillis()}-${existingCount + index}-${name.hashCode()}",
            name = name.withFallbackExtension(mimeType),
            type = mimeType,
            size = bytes.size.toLong(),
            contentDataUrl = "data:$mimeType;base64,${Base64.getEncoder().encodeToString(bytes)}",
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
