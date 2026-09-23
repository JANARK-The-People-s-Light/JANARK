package org.janark.app.core

import org.janark.app.ui.nav.Routes

/** Map a web href (/petitions/x, /unreleased/vote/y, …) to an in-app route. */
fun hrefToRoute(href: String?, fallback: String? = null): String? {
    val raw = href?.trim().orEmpty()
    if (raw.isEmpty()) return fallback
    var path = raw
    if (path.startsWith("http://") || path.startsWith("https://")) {
        path = runCatching { java.net.URI(path).path }.getOrDefault(path)
    }
    path = path.substringBefore("?").substringBefore("#")
    if (path.startsWith("/unreleased")) {
        path = path.removePrefix("/unreleased").ifEmpty { "/" }
    }
    val parts = path.trim('/').split('/').filter { it.isNotBlank() }
    if (parts.isEmpty()) return Routes.Home
    return when (parts[0]) {
        "petitions", "demands" -> parts.getOrNull(1)?.let { Routes.petition(it) } ?: Routes.Petitions
        "reports" -> parts.getOrNull(1)?.let { Routes.report(it) } ?: Routes.Reports
        "issues" -> parts.getOrNull(1)?.let { Routes.issue(it) } ?: Routes.Issues
        "vote" -> parts.getOrNull(1)?.let { Routes.vote(it) } ?: Routes.Votes
        "share" -> parts.getOrNull(1)?.let { Routes.share(it) } ?: Routes.Home
        "notice" -> parts.getOrNull(1)?.let { Routes.notice(it) } ?: Routes.Notices
        "memes", "meme" -> parts.getOrNull(1)?.let { Routes.meme(it) } ?: Routes.Memes
        "p" -> parts.getOrNull(1)?.let { Routes.publicPost(it) } ?: Routes.Home
        "u" -> parts.getOrNull(1)?.let { Routes.profile(it) } ?: Routes.Profile
        "feed" -> parts.getOrNull(1)?.let { Routes.discussion(it) } ?: Routes.Discussions
        "dashboard" -> Routes.Activity
        "settings" -> Routes.Settings
        "about" -> Routes.About
        "terms" -> Routes.Terms
        "login" -> Routes.Login
        else -> fallback
    }
}

fun mediaAbsoluteUrl(baseUrl: String, url: String?): String? {
    if (url.isNullOrBlank()) return null
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url
    val root = baseUrl.trimEnd('/')
    return if (url.startsWith("/")) "$root$url" else "$root/$url"
}
