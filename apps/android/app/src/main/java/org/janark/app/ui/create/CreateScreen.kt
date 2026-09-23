package org.janark.app.ui.create

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.core.DISCUSSION_KINDS
import org.janark.app.core.ISSUE_CATEGORIES
import org.janark.app.core.LOCATION_LEVELS
import org.janark.app.core.NOTICE_TARGETS
import org.janark.app.core.Outcome
import org.janark.app.core.PETITION_CATEGORIES
import org.janark.app.core.PETITION_TOPIC_CHIPS
import org.janark.app.core.REPORT_TYPES
import org.janark.app.core.VOTE_TYPES
import org.janark.app.domain.searchPetitionActors
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.ChoiceChip
import org.janark.app.ui.components.CivicMedia
import org.janark.app.ui.components.GhostButton
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.PostTermsAccept
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.nav.CreateKind
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun CreateScreen(kindPath: String, onNavigate: (String) -> Unit) {
    val kind = CreateKind.from(kindPath)
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors

    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var ask by remember { mutableStateOf("") }
    var caption by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(ISSUE_CATEGORIES.first()) }
    var reportType by remember { mutableStateOf("problem") }
    var locationLevel by remember { mutableStateOf("city") }
    var city by remember { mutableStateOf("") }
    var district by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("India") }
    var village by remember { mutableStateOf("") }
    var locationLabel by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("government") }
    var targetDetail by remember { mutableStateOf("") }
    var actorQuery by remember { mutableStateOf("") }
    var voteType by remember { mutableStateOf("likert") }
    var optionsText by remember { mutableStateOf("") }
    var discussionKind by remember { mutableStateOf("opinion") }
    var noticeTarget by remember { mutableStateOf("national") }
    var why by remember { mutableStateOf("") }
    var current by remember { mutableStateOf("") }
    var tags by remember { mutableStateOf("") }
    var mediaUrl by remember { mutableStateOf<String?>(null) }
    var mediaType by remember { mutableStateOf<String?>(null) }
    var accepted by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var more by remember { mutableStateOf(false) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            when (val r = app.repository.upload(uri)) {
                is Outcome.Ok -> {
                    mediaUrl = r.value.url
                    mediaType = r.value.mediaType
                    error = r.value.error
                }
                is Outcome.Err -> {
                    if (r.unauthorized) app.auth.require("upload a photo") {}
                    else error = r.message
                }
            }
        }
    }

    fun hashtags() = tags.split(',', ' ', '#').map { it.trim().lowercase() }.filter { it.length >= 2 }.distinct()

    fun publish() {
        if (!session.authenticated) {
            app.auth.require("publish") { publish() }
            return
        }
        if (!accepted) {
            error = "Accept the Civic Posting Terms to publish."
            return
        }
        busy = true
        error = null
        scope.launch {
            app.repository.acceptTerms()
            val result: Outcome<*> = when (kind) {
                CreateKind.Share -> {
                    val url = mediaUrl
                    if (url.isNullOrBlank()) {
                        busy = false
                        error = "Add a photo or video to share"
                        return@launch
                    }
                    app.repository.createShare(caption.ifBlank { title }, url, mediaType, locationLabel.ifBlank { null }, hashtags(), city, district, state)
                }
                CreateKind.Report -> app.repository.createReport(
                    mapOf(
                        "title" to title,
                        "body" to body.ifBlank { title },
                        "type" to reportType,
                        "locationLevel" to locationLevel,
                        "village" to village,
                        "city" to city,
                        "district" to district,
                        "state" to state,
                        "country" to country,
                    ),
                    hashtags(),
                    mediaUrl,
                    mediaType,
                )
                CreateKind.Issue -> app.repository.createIssue(
                    mapOf(
                        "title" to title,
                        "summary" to body.ifBlank { title },
                        "category" to category,
                        "whyItMatters" to why.ifBlank { body },
                        "currentSituation" to current.ifBlank { "Citizen-raised issue." },
                    ),
                    hashtags(),
                    mediaUrl,
                    mediaType,
                )
                CreateKind.Petition -> app.repository.createDemand(
                    mapOf(
                        "title" to title,
                        "ask" to ask.ifBlank { title },
                        "body" to body.ifBlank { ask.ifBlank { title } },
                        "target" to target,
                        "targetDetail" to targetDetail,
                        "category" to category,
                        "locationLevel" to locationLevel,
                        "village" to village,
                        "city" to city,
                        "district" to district,
                        "state" to state,
                        "country" to country,
                    ),
                    hashtags(),
                    mediaUrl,
                    mediaType,
                )
                CreateKind.Vote -> {
                    val options = optionsText.lines().map { it.trim() }.filter { it.isNotBlank() }
                    if (voteType != "likert" && options.size < 2) {
                        busy = false
                        error = "Add at least two options (one per line) for this vote type."
                        return@launch
                    }
                    app.repository.createVote(
                        mapOf(
                            "title" to title,
                            "description" to body.ifBlank { title },
                            "voteType" to voteType,
                            "locationLevel" to locationLevel,
                            "city" to city,
                            "district" to district,
                            "state" to state,
                            "country" to country,
                        ),
                        options,
                        hashtags(),
                        mediaUrl,
                        mediaType,
                    )
                }
                CreateKind.Discussion -> app.repository.createDiscussion(
                    title, body.ifBlank { title }, discussionKind, hashtags(), mediaUrl, mediaType,
                    locationLevel, city, district, state, country,
                )
                CreateKind.Notice -> app.repository.createNotice(
                    mapOf(
                        "title" to title,
                        "description" to body.ifBlank { title },
                        "target" to noticeTarget,
                        "targetDetail" to targetDetail,
                    ),
                    mediaUrl,
                    mediaType,
                )
                CreateKind.Meme -> {
                    val url = mediaUrl
                    if (url.isNullOrBlank()) {
                        busy = false
                        error = "Add an image or GIF for the meme"
                        return@launch
                    }
                    if (hashtags().isEmpty()) {
                        busy = false
                        error = "Add at least one hashtag"
                        return@launch
                    }
                    app.repository.createMeme(title.ifBlank { caption.ifBlank { "Meme" } }, caption.ifBlank { null }, url, hashtags())
                }
            }
            busy = false
            when (result) {
                is Outcome.Ok -> {
                    val dest = when (val v = result.value) {
                        is org.janark.app.data.net.CreateShareResponse -> v.share?.id?.let { Routes.share(it) }
                        is org.janark.app.data.net.CreateReportResponse -> v.report?.id?.let { Routes.report(it) }
                        is org.janark.app.data.net.CreateIssueResponse -> v.issue?.slug?.let { Routes.issue(it) }
                        is org.janark.app.data.net.CreateDemandResponse -> v.demand?.id?.let { Routes.petition(it) }
                        is org.janark.app.data.net.CreateProposalResponse -> v.proposal?.id?.let { Routes.vote(it) }
                        is org.janark.app.data.net.CreateDiscussionResponse ->
                            v.publicId?.let { Routes.publicPost(it) }
                                ?: v.discussion?.publicId?.let { Routes.publicPost(it) }
                                ?: v.discussion?.feedPostId?.let { Routes.discussion(it) }
                                ?: Routes.Discussions
                        is org.janark.app.data.net.CreateNoticeResponse -> v.notice?.id?.let { Routes.notice(it) }
                        is org.janark.app.data.net.CreateMemeResponse -> v.meme?.id?.let { Routes.meme(it) }
                        else -> Routes.Home
                    }
                    onNavigate(dest ?: Routes.Home)
                }
                is Outcome.Err -> {
                    if (result.unauthorized) app.auth.require("publish") { publish() }
                    else error = result.message
                }
            }
        }
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(kind.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
        Text(kind.prompt, color = c.muted.toC())

        when (kind) {
            CreateKind.Share -> {
                JanarkField(caption, { caption = it }, "Caption", singleLine = false, minLines = 3)
                JanarkField(locationLabel, { locationLabel = it }, "Place (optional)")
            }
            CreateKind.Report -> {
                JanarkField(title, { title = it }, "What happened?")
                JanarkField(body, { body = it }, "Details", singleLine = false, minLines = 4)
                SectionLabel("Type")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    REPORT_TYPES.forEach { ChoiceChip(it.replaceFirstChar { ch -> ch.uppercase() }, reportType == it) { reportType = it } }
                }
            }
            CreateKind.Issue -> {
                JanarkField(title, { title = it }, "What’s the issue?")
                JanarkField(body, { body = it }, "Summary", singleLine = false, minLines = 3)
                SectionLabel("Category")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ISSUE_CATEGORIES.forEach { ChoiceChip(it, category == it) { category = it } }
                }
            }
            CreateKind.Petition -> {
                JanarkField(title, { title = it }, "What should change?")
                JanarkField(ask, { ask = it }, "Clear ask")
                JanarkField(body, { body = it }, "Why?", singleLine = false, minLines = 4)
                JanarkField(actorQuery, { actorQuery = it }, "Who should act?")
                searchPetitionActors(actorQuery).forEach { a ->
                    ChoiceChip("${a.name}${a.region?.let { " · $it" } ?: ""}", targetDetail == a.name) {
                        targetDetail = a.name
                        target = a.target
                        actorQuery = a.name
                    }
                }
                SectionLabel("Topic")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PETITION_CATEGORIES.forEach { ChoiceChip(it, category == it) { category = it } }
                }
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PETITION_TOPIC_CHIPS.forEach { chip ->
                        ChoiceChip("#$chip", tags.contains(chip)) {
                            tags = if (tags.contains(chip)) tags.replace(chip, "") else "$tags $chip"
                        }
                    }
                }
            }
            CreateKind.Vote -> {
                JanarkField(title, { title = it }, "What should people vote on?")
                JanarkField(body, { body = it }, "Context", singleLine = false, minLines = 3)
                SectionLabel("Ballot type")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    VOTE_TYPES.forEach { ChoiceChip(it, voteType == it) { voteType = it } }
                }
                if (voteType != "likert") {
                    JanarkField(optionsText, { optionsText = it }, "Options (one per line)", singleLine = false, minLines = 4)
                }
            }
            CreateKind.Discussion -> {
                JanarkField(title, { title = it }, "Topic")
                JanarkField(body, { body = it }, "What would you like to discuss?", singleLine = false, minLines = 5)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DISCUSSION_KINDS.forEach { ChoiceChip(it.replaceFirstChar { ch -> ch.uppercase() }, discussionKind == it) { discussionKind = it } }
                }
            }
            CreateKind.Notice -> {
                JanarkField(title, { title = it }, "Title")
                JanarkField(body, { body = it }, "Notice", singleLine = false, minLines = 4)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    NOTICE_TARGETS.forEach { ChoiceChip(it.replaceFirstChar { ch -> ch.uppercase() }, noticeTarget == it) { noticeTarget = it } }
                }
                JanarkField(targetDetail, { targetDetail = it }, "Target detail (optional)")
            }
            CreateKind.Meme -> {
                JanarkField(title, { title = it }, "Title")
                JanarkField(caption, { caption = it }, "Caption (optional)", singleLine = false, minLines = 3)
                JanarkField(tags, { tags = it }, "Hashtags (#janark #roads)")
            }
        }

        GhostButton(if (mediaUrl == null) "Attach photo or video" else "Replace media") {
            if (!session.authenticated) app.auth.require("upload a photo") {
                picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo))
            } else {
                picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo))
            }
        }
        CivicMedia(mediaUrl, mediaType)

        GhostButton(if (more) "Hide more" else "More") { more = !more }
        if (more) {
            if (kind != CreateKind.Share && kind != CreateKind.Issue && kind != CreateKind.Notice && kind != CreateKind.Meme) {
                SectionLabel("Place")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LOCATION_LEVELS.forEach { ChoiceChip(it, locationLevel == it) { locationLevel = it } }
                }
                JanarkField(village, { village = it }, "Village")
                JanarkField(city, { city = it }, "City")
                JanarkField(district, { district = it }, "District")
                JanarkField(state, { state = it }, "State")
                JanarkField(country, { country = it }, "Country")
            }
            if (kind == CreateKind.Issue) {
                JanarkField(why, { why = it }, "Why it matters", singleLine = false)
                JanarkField(current, { current = it }, "Current situation", singleLine = false)
            }
            JanarkField(tags, { tags = it }, "Topics / hashtags")
        }

        PostTermsAccept(accepted, { accepted = it }) { onNavigate(Routes.Terms) }
        error?.let { Text(it, color = c.danger.toC()) }
        AmberButton(
            if (busy) "Publishing…" else "Publish",
            onClick = { publish() },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
