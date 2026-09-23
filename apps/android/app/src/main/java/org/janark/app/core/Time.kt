package org.janark.app.core

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

private val enIn = Locale("en", "IN")
private val shortDate = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(enIn)

fun relativeTime(iso: String?): String? {
    if (iso.isNullOrBlank()) return null
    val t = parseInstant(iso) ?: return iso.take(10)
    val sec = ((System.currentTimeMillis() - t.toEpochMilli()) / 1000.0).toInt()
    if (sec < 60) return "Just now"
    val min = Math.round(sec / 60.0).toInt()
    if (min < 60) return "${min}m ago"
    val hr = Math.round(min / 60.0).toInt()
    if (hr < 48) return "${hr}h ago"
    val day = Math.round(hr / 24.0).toInt()
    if (day < 14) return "${day}d ago"
    return shortDate.format(t.atZone(ZoneId.systemDefault()).toLocalDate())
}

fun formatDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val t = parseInstant(iso) ?: return iso.take(10)
    return shortDate.format(t.atZone(ZoneId.systemDefault()).toLocalDate())
}

fun parseInstant(iso: String): Instant? = runCatching {
    Instant.parse(iso)
}.getOrElse {
    runCatching { Instant.parse(iso.replace(" ", "T") + "Z") }.getOrNull()
}

fun placeLabel(
    city: String? = null,
    district: String? = null,
    state: String? = null,
    country: String? = null,
    extra: String? = null,
): String? {
    val label = listOfNotNull(extra, city, district, state).filter { it.isNotBlank() }.joinToString(", ")
    return label.ifBlank { country?.takeIf { it.isNotBlank() } }
}

fun indianCount(n: Int): String = "%,d".format(enIn, n)
