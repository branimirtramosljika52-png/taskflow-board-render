package com.safenexus.app.ui

import com.safenexus.app.data.parseDateOrNull
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

internal fun isoDateToMillis(value: String): Long? =
    parseDateOrNull(value)
        ?.atStartOfDay(ZoneOffset.UTC)
        ?.toInstant()
        ?.toEpochMilli()

internal fun millisToIsoDate(value: Long?): String =
    value?.let {
        Instant.ofEpochMilli(it)
            .atZone(ZoneOffset.UTC)
            .toLocalDate()
            .toString()
    }.orEmpty()

internal fun formatDatePickerLabel(value: String): String =
    parseDateOrNull(value)
        ?.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
        ?: value

private val reservationTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

internal val reservationTimeOptions: List<Pair<String, String>> = (0 until 24)
    .flatMap { hour -> (0 until 60 step 15).map { minute -> "%02d:%02d".format(hour, minute) } }
    .map { value -> value to value }

internal fun defaultReservationStartTime(): String {
    val now = LocalTime.now()
    val roundedTotalMinutes = ((now.hour * 60 + now.minute + 14) / 15) * 15
    val normalizedTotalMinutes = roundedTotalMinutes % (24 * 60)
    return LocalTime.of(normalizedTotalMinutes / 60, normalizedTotalMinutes % 60)
        .format(reservationTimeFormatter)
}

internal fun defaultVehicleUsageTime(): String =
    LocalTime.now().format(reservationTimeFormatter)

internal fun parseReservationDateTime(date: String, time: String): LocalDateTime? =
    runCatching { LocalDateTime.parse("${date}T${time}:00") }.getOrNull()

internal fun formatReservationDateTime(date: String, time: String): String =
    "${date}T${time}:00"

internal fun addReservationMinutes(date: String, time: String, minutes: Long): Pair<String, String> {
    val start = parseReservationDateTime(date, time) ?: LocalDate.now().atTime(8, 0)
    val next = start.plusMinutes(minutes)
    return next.toLocalDate().toString() to next.toLocalTime().format(reservationTimeFormatter)
}

internal fun isReservationRangeValid(startDate: String, startTime: String, endDate: String, endTime: String): Boolean {
    val start = parseReservationDateTime(startDate, startTime) ?: return false
    val end = parseReservationDateTime(endDate, endTime) ?: return false
    return end.isAfter(start)
}

internal fun formatDateLabel(value: String): String {
    val date = parseDateOrNull(value) ?: return ""
    return date.format(DateTimeFormatter.ofPattern("dd.MM.yyyy."))
}
