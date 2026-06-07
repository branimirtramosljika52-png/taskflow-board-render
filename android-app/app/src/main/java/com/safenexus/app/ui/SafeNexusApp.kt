@file:OptIn(ExperimentalLayoutApi::class)

package com.safenexus.app.ui

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.content.ContextWrapper
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
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
import androidx.compose.material.icons.rounded.Business
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.FilterList
import androidx.compose.material.icons.rounded.Fingerprint
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Work
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
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
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import com.safenexus.app.data.CoordinatePoint
import com.safenexus.app.data.SafeNexusApi
import com.safenexus.app.data.SafeNexusAuthStore
import com.safenexus.app.data.SafeNexusUser
import com.safenexus.app.data.WorkOrder
import com.safenexus.app.data.parseDateOrNull
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.format.DateTimeFormatter

enum class WorkOrderFilter(val label: String) {
    All("Svi"),
    Active("Aktivni"),
    Overdue("Kasne"),
    Closed("Zatvoreni"),
}

enum class WorkOrderViewMode(val label: String) {
    List("Lista"),
    Map("Karta"),
}

private val biometricAuthenticators =
    BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL

data class AppState(
    val user: SafeNexusUser? = null,
    val rememberedUser: SafeNexusUser? = null,
    val workOrders: List<WorkOrder> = emptyList(),
    val selectedWorkOrder: WorkOrder? = null,
    val query: String = "",
    val filter: WorkOrderFilter = WorkOrderFilter.Active,
    val viewMode: WorkOrderViewMode = WorkOrderViewMode.List,
    val isLoading: Boolean = false,
    val error: String = "",
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
                    refresh()
                }
                .onFailure { error ->
                    state = state.copy(isLoading = false, error = error.message ?: "Prijava nije uspjela.")
                }
        }
    }

    fun refresh() {
        state = state.copy(isLoading = true, error = "")
        viewModelScope.launch {
            api.workOrders()
                .onSuccess { data ->
                    if (shouldRememberSession) {
                        state.user?.let { user ->
                            authStore.save(user, api.currentAccessToken(), api.currentAuthCookieHeader())
                        }
                    }
                    state = state.copy(workOrders = data.workOrders, isLoading = false, error = "")
                }
                .onFailure { error ->
                    val message = error.message ?: "Ne mogu ucitati radne naloge."
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

    fun selectWorkOrder(value: WorkOrder?) {
        state = state.copy(selectedWorkOrder = value)
    }
}

@Composable
fun SafeNexusApp(viewModel: SafeNexusViewModel = viewModel()) {
    val state = viewModel.state
    AnimatedContent(targetState = state.user != null, label = "auth") { isSignedIn ->
        if (isSignedIn) {
            val selected = state.selectedWorkOrder
            if (selected == null) {
                WorkOrdersScreen(
                    state = state,
                    onQueryChange = viewModel::updateQuery,
                    onFilterChange = viewModel::updateFilter,
                    onViewModeChange = viewModel::updateViewMode,
                    onRefresh = viewModel::refresh,
                    onLogout = viewModel::logout,
                    onOpenWorkOrder = viewModel::selectWorkOrder,
                )
            } else {
                WorkOrderDetailScreen(
                    workOrder = selected,
                    onBack = { viewModel.selectWorkOrder(null) },
                )
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
                            onBiometricLogin = {
                                biometricError = ""
                                requestBiometricLogin(
                                    context = context,
                                    onSuccess = onUnlockRememberedSession,
                                    onError = { biometricError = it },
                                )
                            },
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
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onOpenWorkOrder: (WorkOrder) -> Unit,
) {
    val normalizedQuery = remember(state.query) { state.query.trim().lowercase() }
    val filtered = remember(state.workOrders, normalizedQuery, state.filter) {
        state.workOrders
            .filter { workOrder ->
                when (state.filter) {
                    WorkOrderFilter.All -> true
                    WorkOrderFilter.Active -> !workOrder.isClosed
                    WorkOrderFilter.Overdue -> workOrder.isOverdue
                    WorkOrderFilter.Closed -> workOrder.isClosed
                }
            }
            .filter { workOrder -> normalizedQuery.isBlank() || workOrder.matchesSearch(normalizedQuery) }
    }
    val mapPoints = remember(filtered) { buildWorkOrderMapPoints(filtered) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Radni nalozi", fontWeight = FontWeight.Bold)
                        Text(
                            text = state.user?.displayName.orEmpty(),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f),
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Rounded.Refresh, contentDescription = "OsvjeĹľi")
                    }
                    TextButton(onClick = onLogout) {
                        Text("Odjava")
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
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                WorkOrderHero(state.workOrders)
            }
            item {
                OutlinedTextField(
                    value = state.query,
                    onValueChange = onQueryChange,
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    label = { Text("Pretraga RN, klijent, lokacija, usluga") },
                    singleLine = true,
                )
            }
            item {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    WorkOrderFilter.entries.forEach { filter ->
                        FilterChip(
                            selected = state.filter == filter,
                            onClick = { onFilterChange(filter) },
                            label = { Text(filter.label) },
                            leadingIcon = if (state.filter == filter) {
                                { Icon(Icons.Rounded.FilterList, contentDescription = null, modifier = Modifier.size(18.dp)) }
                            } else {
                                null
                            },
                        )
                    }
                }
            }
            item {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    WorkOrderViewMode.entries.forEach { mode ->
                        FilterChip(
                            selected = state.viewMode == mode,
                            onClick = { onViewModeChange(mode) },
                            label = { Text(mode.label) },
                            leadingIcon = if (state.viewMode == mode) {
                                {
                                    Icon(
                                        if (mode == WorkOrderViewMode.Map) Icons.Rounded.Map else Icons.Rounded.Work,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp),
                                    )
                                }
                            } else {
                                null
                            },
                        )
                    }
                }
            }
            item {
                AnimatedVisibility(state.isLoading) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                AnimatedVisibility(state.error.isNotBlank()) {
                    MessageCard(text = state.error, isError = true)
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
                            onClick = { onOpenWorkOrder(entry.workOrder) },
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
                        onClick = { onOpenWorkOrder(workOrder) },
                    )
                }
            }
        }
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

@Composable
private fun WorkOrderCard(workOrder: WorkOrder, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(
                        workOrder.displayNumber,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                    )
                    Text(
                        workOrder.companyName.ifBlank { "Bez tvrtke" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                StatusChip(workOrder)
            }
            Text(
                workOrder.displayService,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoPill(Icons.Rounded.LocationOn, workOrder.locationName.ifBlank { "Lokacija nije upisana" })
                InfoPill(Icons.Rounded.CalendarMonth, formatDateLabel(workOrder.dueDate).ifBlank { "Bez roka" })
                if (workOrder.hasCoordinates) {
                    InfoPill(Icons.Rounded.Map, "Na karti")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkOrderDetailScreen(workOrder: WorkOrder, onBack: () -> Unit) {
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
                }
            }

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
