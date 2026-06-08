@file:OptIn(ExperimentalLayoutApi::class)

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
import androidx.activity.result.IntentSenderRequest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
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
import com.safenexus.app.data.WorkOrderDocument
import com.safenexus.app.data.WorkOrderLocationOption
import com.safenexus.app.data.WorkOrderServiceOption
import com.safenexus.app.data.WorkOrderUploadFile
import com.safenexus.app.data.WorkOrderUserOption
import com.safenexus.app.data.parseDateOrNull
import com.google.firebase.messaging.FirebaseMessaging
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.LocalDate
import java.time.LocalDateTime
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
    val isLoading: Boolean = false,
    val error: String = "",
    val notice: String = "",
)

class SafeNexusViewModel(application: Application) : AndroidViewModel(application) {
    private val api = SafeNexusApi()
    private val authStore = SafeNexusAuthStore(application)
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
                    state = state.copy(data = data, workOrders = data.workOrders, isLoading = false, error = "")
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

    fun updateWorkOrderStatus(workOrder: WorkOrder, status: String) {
        if (workOrder.id.isBlank() || status.isBlank() || status == workOrder.status) return

        state = state.copy(isLoading = true, error = "", notice = "")
        viewModelScope.launch {
            api.updateWorkOrderStatus(workOrder.id, status)
                .onSuccess {
                    val updatedOrders = state.workOrders.map { item ->
                        if (item.id == workOrder.id) item.copy(status = status) else item
                    }
                    val updatedSelected = state.selectedWorkOrder?.let { selected ->
                        if (selected.id == workOrder.id) selected.copy(status = status) else selected
                    }
                    state = state.copy(
                        data = state.data.copy(workOrders = updatedOrders),
                        workOrders = updatedOrders,
                        selectedWorkOrder = updatedSelected,
                        isLoading = false,
                        notice = "Status RN-a je spremljen.",
                    )
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(
                        isLoading = false,
                        error = error.message ?: "Ne mogu spremiti status RN-a.",
                    )
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
                        onBack = { viewModel.selectRecord(null) },
                    )
                }
            } else {
                WorkOrderDetailScreen(
                    workOrder = selected,
                    isLoading = state.isLoading,
                    error = state.error,
                    notice = state.notice,
                    documents = state.workOrderDocuments,
                    documentsLoading = state.workOrderDocumentsLoading,
                    statusOptions = state.data.workOrderStatuses.map { it.value }.ifEmpty { workOrderStatusOptions },
                    onBack = { viewModel.selectWorkOrder(null) },
                    onStatusChange = viewModel::updateWorkOrderStatus,
                    onAddDocumentation = openDocumentationActions,
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
                        text = "Fokus na RN-ove koje trebaĹˇ danas rijeĹˇiti.",
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
        companyName = "",
        locationName = "",
        coordinates = "",
        region = "",
        serviceLine = "",
        serviceItems = emptyList(),
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
    onBack: () -> Unit,
) {
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrderDetailScreen(
    workOrder: WorkOrder,
    isLoading: Boolean,
    error: String,
    notice: String,
    documents: List<WorkOrderDocument>,
    documentsLoading: Boolean,
    statusOptions: List<String>,
    onBack: () -> Unit,
    onStatusChange: (WorkOrder, String) -> Unit,
    onAddDocumentation: (WorkOrder) -> Unit,
    onOpenDocument: (WorkOrderDocument) -> Unit,
    onDownloadDocument: (WorkOrderDocument) -> Unit,
    onDeleteDocument: (WorkOrderDocument) -> Unit,
    onRefreshDocuments: () -> Unit,
) {
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
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        WorkOrderStatusMenu(
                            currentStatus = workOrder.status,
                            statusOptions = statusOptions,
                            enabled = !isLoading,
                            onStatusSelected = { status -> onStatusChange(workOrder, status) },
                        )
                        OutlinedButton(
                            onClick = { onAddDocumentation(workOrder) },
                            enabled = !isLoading,
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Dokumentacija")
                        }
                    }
                }
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
                onAddDocumentation = { onAddDocumentation(workOrder) },
                onOpenDocument = onOpenDocument,
                onDownloadDocument = onDownloadDocument,
                onDeleteDocument = onDeleteDocument,
                onRefreshDocuments = onRefreshDocuments,
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

            DetailSection("Datumi") {
                DetailRow(Icons.Rounded.CalendarMonth, "Otvoren", formatDateLabel(workOrder.openedDate).ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.CalendarMonth, "Rok", formatDateLabel(workOrder.dueDate).ifBlank { "Nije upisano" })
                DetailRow(Icons.Rounded.CalendarMonth, "IzvrĹˇenje", formatDateLabel(workOrder.executionDate).ifBlank { "Nije upisano" })
            }

            DetailSection("Opis i izvrĹˇitelji") {
                DetailRow(Icons.Rounded.Work, "Prioritet", workOrder.priority)
                Text(
                    text = workOrder.description.ifBlank { "Nema dodatnog opisa." },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.78f),
                )
                if (workOrder.executors.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        workOrder.executors.forEach { executor ->
                            AssistChip(onClick = {}, label = { Text(executor) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkOrderDocumentationSection(
    documents: List<WorkOrderDocument>,
    loading: Boolean,
    isBusy: Boolean,
    onAddDocumentation: () -> Unit,
    onOpenDocument: (WorkOrderDocument) -> Unit,
    onDownloadDocument: (WorkOrderDocument) -> Unit,
    onDeleteDocument: (WorkOrderDocument) -> Unit,
    onRefreshDocuments: () -> Unit,
) {
    DetailSection("Dokumentacija") {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Button(
                onClick = onAddDocumentation,
                modifier = Modifier.weight(1f),
                enabled = !isBusy,
                shape = RoundedCornerShape(16.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Dodaj dokumentaciju", fontWeight = FontWeight.Black)
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
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
    ) {
        Column(
            modifier = Modifier.padding(13.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(14.dp), color = workOrderDocumentAccent(document).copy(alpha = 0.13f)) {
                    Icon(
                        imageVector = workOrderDocumentIcon(document),
                        contentDescription = null,
                        tint = workOrderDocumentAccent(document),
                        modifier = Modifier
                            .size(42.dp)
                            .padding(10.dp),
                    )
                }
                Spacer(Modifier.width(12.dp))
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
            }

            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onOpen, enabled = enabled, shape = RoundedCornerShape(14.dp)) {
                    Icon(Icons.Rounded.Visibility, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Pregled")
                }
                OutlinedButton(onClick = onDownload, enabled = enabled, shape = RoundedCornerShape(14.dp)) {
                    Icon(Icons.Rounded.Download, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Preuzmi")
                }
                OutlinedButton(onClick = onDelete, enabled = enabled, shape = RoundedCornerShape(14.dp)) {
                    Icon(Icons.Rounded.Delete, contentDescription = null, modifier = Modifier.size(17.dp), tint = Color(0xFFDC2626))
                    Spacer(Modifier.width(6.dp))
                    Text("Briši", color = Color(0xFFDC2626))
                }
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
                "Promijeni filter ili osvjeĹľi podatke.",
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
