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
    val coordinates: String,
    val region: String,
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

    val hasCoordinates: Boolean
        get() = parseCoordinatePoint(coordinates) != null

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

data class CoordinatePoint(
    val latitude: Double,
    val longitude: Double,
)

private val coordinateNumberPattern = Regex("""[-+]?\d{1,3}(?:[.,]\d+)?""")

fun parseCoordinatePoint(value: String): CoordinatePoint? {
    val numbers = coordinateNumberPattern.findAll(value)
        .mapNotNull { match -> match.value.replace(',', '.').toDoubleOrNull() }
        .toList()

    if (numbers.size < 2) return null

    val latitude = numbers[0]
    val longitude = numbers[1]

    if (latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
        return null
    }

    return CoordinatePoint(latitude, longitude)
}
