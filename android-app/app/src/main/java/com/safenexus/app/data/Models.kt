package com.safenexus.app.data

import java.time.LocalDate

data class SafeNexusUser(
    val displayName: String,
    val email: String,
)

data class BootstrapData(
    val workOrders: List<WorkOrder>,
)

data class WorkOrder(
    val id: String,
    val number: String,
    val status: String,
    val companyName: String,
    val locationName: String,
    val serviceLine: String,
    val serviceItems: List<String>,
    val openedDate: String,
    val dueDate: String,
    val executionDate: String,
    val priority: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val description: String,
    val executors: List<String>,
) {
    val displayNumber: String
        get() = number.ifBlank { "RN" }

    val displayService: String
        get() = serviceLine.ifBlank { serviceItems.joinToString(" · ") }.ifBlank { "Bez upisane usluge" }

    val isClosed: Boolean
        get() = status.equals("Fakturiran RN", ignoreCase = true) ||
            status.equals("Završen RN", ignoreCase = true) ||
            status.equals("Storniran RN", ignoreCase = true)

    val isOverdue: Boolean
        get() = !isClosed && parseDateOrNull(dueDate)?.isBefore(LocalDate.now()) == true
}

fun parseDateOrNull(value: String): LocalDate? = runCatching {
    if (value.isBlank()) null else LocalDate.parse(value.take(10))
}.getOrNull()
