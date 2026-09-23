package org.janark.app.core

const val TERMS_VERSION = "2026-07-21.3"
const val TERMS_TITLE = "Janark Civic Posting Terms & Conditions"
const val SESSION_COOKIE = "janark_sid"

val ISSUE_CATEGORIES = listOf(
    "Education",
    "Employment",
    "Healthcare",
    "Corruption",
    "Judiciary",
    "Women",
    "Agriculture",
    "Environment",
    "Infrastructure",
    "Police",
    "Cybersecurity",
    "Voting Reform",
)

val REPORT_TYPES = listOf("problem", "issue", "crime", "other")

val LOCATION_LEVELS = listOf(
    "village",
    "town",
    "city",
    "block",
    "district",
    "state",
    "national",
    "country",
)

val NOTICE_TARGETS = listOf("national", "state", "district", "institution")

val FLAG_REASONS = listOf(
    "spam",
    "harassment",
    "misinformation",
    "doxxing",
    "illegal",
    "unrelated",
    "other",
)

val LIKERT_CHOICES = listOf(
    "strongly_support" to "Strongly support",
    "support" to "Support",
    "neutral" to "Neutral",
    "oppose" to "Oppose",
    "strongly_oppose" to "Strongly oppose",
)

/** Humanize API result keys like strongly_support → Strongly support */
fun formatVoteLabel(key: String): String =
    LIKERT_CHOICES.firstOrNull { it.first == key }?.second
        ?: key.replace('_', ' ').split(' ').joinToString(" ") { w ->
            w.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }

val PETITION_STATUSES = listOf("open", "gathering", "delivered", "won", "closed")

val PETITION_CATEGORIES = listOf(
    "Infrastructure",
    "Environment",
    "Transport",
    "Water",
    "Education",
    "Health",
    "Sanitation",
    "Governance",
    "Justice",
    "Other",
)

val PETITION_TOPIC_CHIPS = listOf(
    "roads",
    "environment",
    "transport",
    "water",
    "education",
    "health",
    "sanitation",
    "safety",
)

val FEED_TABS = listOf(
    "all" to "All",
    "petition" to "Petitions",
    "report" to "Reports",
    "proposal" to "Votes",
    "discussion" to "Discussions",
)

val FEED_EXTRA_TYPES = listOf(
    "share" to "Community posts",
    "issue" to "Issues",
    "notice" to "Notices",
    "meme" to "Memes",
)

val FEED_SORTS = listOf(
    "trending" to "Trending",
    "momentum" to "Momentum",
    "hot" to "Hot",
    "new" to "Newest",
)

val DISCUSSION_KINDS = listOf("opinion", "evidence", "news")

val VOTE_TYPES = listOf("likert", "checklist", "preference")

val REPORT_REACTIONS = listOf(
    "support" to "Support",
    "concerned" to "Concerned",
    "angry" to "Angry",
    "sad" to "Sad",
    "important" to "Important",
)
