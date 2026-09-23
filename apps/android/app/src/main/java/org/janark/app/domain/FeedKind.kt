package org.janark.app.domain

enum class FeedKind {
    Vote, Petition, Report, Discussion, Issue, Notice, Share, Other
}

data class FeedKindMeta(
    val kind: FeedKind,
    val label: String,
    val metric: Metric,
) {
    enum class Metric { Support, Participants, Momentum }
}

fun resolveFeedKind(
    type: String?,
    title: String? = null,
    href: String? = null,
    tags: List<String> = emptyList(),
): FeedKindMeta {
    val t = type.orEmpty().lowercase()
    val ttl = title.orEmpty().lowercase()
    val h = href.orEmpty()
    val tg = tags.map { it.lowercase() }

    val isPetition = t == "petition" || t == "demand" ||
        tg.contains("petition") || tg.contains("demand") ||
        ttl.startsWith("[demand]") || ttl.startsWith("[petition]") ||
        h.contains("/petitions/") || h.contains("/demands/")

    if (isPetition) {
        return FeedKindMeta(FeedKind.Petition, "Petition", FeedKindMeta.Metric.Support)
    }
    if (t == "proposal" || t == "vote") {
        return FeedKindMeta(FeedKind.Vote, "Open vote", FeedKindMeta.Metric.Participants)
    }
    if (t == "report" || h.contains("/reports/") ||
        Regex("^\\[(issue|crime|problem|other)\\]").containsMatchIn(ttl)
    ) {
        return FeedKindMeta(FeedKind.Report, "Report", FeedKindMeta.Metric.Support)
    }
    if (t == "issue" || h.contains("/issues/")) {
        return FeedKindMeta(FeedKind.Issue, "Issue", FeedKindMeta.Metric.Momentum)
    }
    if (t == "notice" || h.contains("/notice/")) {
        return FeedKindMeta(FeedKind.Notice, "Notice", FeedKindMeta.Metric.Momentum)
    }
    if (t == "share" || h.contains("/share/") || tg.contains("share")) {
        return FeedKindMeta(FeedKind.Share, "Community Post", FeedKindMeta.Metric.Support)
    }
    return FeedKindMeta(FeedKind.Discussion, "Discussion", FeedKindMeta.Metric.Support)
}

fun metricLabel(metric: FeedKindMeta.Metric, n: Int): Pair<String, String> {
    val value = org.janark.app.core.indianCount(n)
    return when (metric) {
        FeedKindMeta.Metric.Participants -> value to "participants"
        FeedKindMeta.Metric.Momentum -> value to "momentum"
        FeedKindMeta.Metric.Support -> value to if (n == 1) "support" else "supports"
    }
}

data class EngageTarget(val targetType: String, val targetId: String)

fun engageTargetForFeedPost(
    id: String,
    type: String?,
    refId: String?,
    title: String?,
    tags: List<String>,
    href: String?,
): EngageTarget {
    val t = type.orEmpty().lowercase()
    val ref = refId?.trim().orEmpty()
    val tg = tags.map { it.lowercase() }
    val looksLikeDemand = t == "demand" || tg.contains("petition") || tg.contains("demand") ||
        title.orEmpty().lowercase().startsWith("[petition]") ||
        title.orEmpty().lowercase().startsWith("[demand]") ||
        href.orEmpty().contains("/petitions/") ||
        href.orEmpty().contains("/demands/")
    if (ref.isNotEmpty()) {
        if (looksLikeDemand) return EngageTarget("demand", ref)
        if (t == "meme") return EngageTarget("meme", ref)
        if (t == "report" || href.orEmpty().contains("/reports/")) return EngageTarget("report", ref)
        if (t == "notice") return EngageTarget("notice", ref)
        if (t == "issue") return EngageTarget("issue", ref)
        if (t == "proposal" || t == "vote" || href.orEmpty().contains("/vote/")) {
            return EngageTarget("proposal", ref)
        }
    }
    return EngageTarget("feed", id)
}

fun sharePathForPost(
    publicId: String?,
    href: String?,
    id: String,
    targetType: String,
    refId: String?,
): String {
    publicId?.takeIf { it.isNotBlank() }?.let { return "/p/$it" }
    val h = href?.trim().orEmpty()
    if (h.isNotEmpty() && !h.startsWith("/feed")) return h
    return when {
        targetType == "report" && !refId.isNullOrBlank() -> "/reports/$refId"
        targetType == "demand" && !refId.isNullOrBlank() -> "/petitions/$refId"
        targetType == "notice" && !refId.isNullOrBlank() -> "/notice/$refId"
        targetType == "issue" && !refId.isNullOrBlank() -> "/issues/$refId"
        targetType == "proposal" && !refId.isNullOrBlank() -> "/vote/$refId"
        else -> "/p/$id"
    }
}
