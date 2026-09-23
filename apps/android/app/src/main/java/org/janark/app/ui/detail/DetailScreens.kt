package org.janark.app.ui.detail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import org.janark.app.core.LIKERT_CHOICES
import org.janark.app.core.Outcome
import org.janark.app.core.REPORT_REACTIONS
import org.janark.app.core.formatVoteLabel
import org.janark.app.core.indianCount
import org.janark.app.core.relativeTime
import org.janark.app.data.net.DemandDetailResponse
import org.janark.app.data.net.FeedDetailResponse
import org.janark.app.data.net.IssueDetailResponse
import org.janark.app.data.net.NoticeDetailResponse
import org.janark.app.data.net.ProposalDto
import org.janark.app.data.net.ReportDetailResponse
import org.janark.app.data.net.MemeDetailResponse
import org.janark.app.data.net.ShareDetailResponse
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.ChoiceChip
import org.janark.app.ui.components.CivicMedia
import org.janark.app.ui.components.EngageBar
import org.janark.app.ui.components.ErrorState
import org.janark.app.ui.components.GhostButton
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.KindPill
import org.janark.app.ui.components.LoadingBox
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.components.SurfaceCard
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun PetitionDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var data by remember { mutableStateOf<DemandDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var name by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var signMsg by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadDemand(id)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val d = data?.demand
    when {
        loading && d == null -> LoadingBox()
        error != null && d == null -> ErrorState(error!!) { load() }
        d == null -> ErrorState("Petition not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill(d.status, c.success)
            Text(d.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            d.publicId?.let { Text(it, fontFamily = FontFamily.Monospace, color = c.muted.toC(), fontSize = 12.sp) }
            Text("Ask: ${d.ask}", color = c.foreground.toC())
            Text(d.body, color = c.muted.toC())
            CivicMedia(d.mediaUrl, d.mediaType)
            Text("Who should act: ${d.targetDetail ?: d.target}", color = c.foreground.toC())
            Text(d.locationLabel ?: "", color = c.muted.toC(), fontSize = 13.sp)
            d.authorAnonId?.let { Text(it, color = c.amber.toC(), modifier = Modifier.padding(top = 4.dp)) }
            Text("${indianCount(d.supportCount)} signatures · ${relativeTime(d.createdAt) ?: ""}", color = c.muted.toC())
            EngageBar("demand", d.id, "/petitions/${d.id}", d.title, compact = false)
            if (data?.supportedByMe == true) {
                Text("You signed this petition.", color = c.success.toC())
            } else {
                SectionLabel("Sign this petition")
                Text("Uses your verified phone. Name and PIN prove geographic relevance — they are not shown publicly.", color = c.muted.toC(), fontSize = 13.sp)
                JanarkField(name, { name = it }, "Full name")
                JanarkField(pin, { pin = it }, "PIN / postal code")
                JanarkField(phone, { phone = it }, "Phone (must match OTP number)")
                signMsg?.let { Text(it, color = c.danger.toC()) }
                AmberButton("Sign petition", onClick = {
                    val work = suspend {
                        when (val r = app.repository.signDemand(id, name, pin, phone)) {
                            is Outcome.Ok -> {
                                if (r.value.ok) data = data?.copy(demand = r.value.demand ?: d, supportedByMe = true)
                                signMsg = r.value.error
                            }
                            is Outcome.Err -> {
                                if (r.unauthorized) app.auth.require("sign this petition") {}
                                else signMsg = r.message
                            }
                        }
                    }
                    if (!session.authenticated) app.auth.require("sign this petition") { scope.launch { work() } }
                    else scope.launch { work() }
                })
            }
            if (data?.isMine == true) {
                GhostButton("Delete my petition") {
                    scope.launch {
                        app.repository.deleteDemand(id)
                        onNavigate(Routes.Petitions)
                    }
                }
            }
        }
    }
}

@Composable
fun ReportDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var data by remember { mutableStateOf<ReportDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadReport(id)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val r = data?.report
    when {
        loading && r == null -> LoadingBox()
        error != null && r == null -> ErrorState(error!!) { load() }
        r == null -> ErrorState("Report not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill(r.type, c.danger)
            Text(r.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            Text(r.body, color = c.muted.toC())
            CivicMedia(r.mediaUrl, r.mediaType)
            Text(r.locationLabel ?: "", color = c.muted.toC())
            r.authorAnonId?.let { Text(it, color = c.amber.toC()) }
            SectionLabel("How this feels")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                REPORT_REACTIONS.forEach { (key, label) ->
                    val n = r.reactionCounts[key] ?: 0
                    ChoiceChip("$label ${if (n > 0) n else ""}".trim(), false) {
                        val work = suspend {
                            app.repository.reactReport(id, key)
                            load()
                        }
                        if (!session.authenticated) app.auth.require("react") { scope.launch { work() } }
                        else scope.launch { work() }
                    }
                }
            }
            EngageBar("report", r.id, "/reports/${r.id}", r.title, compact = false)
            if (data?.isMine == true) GhostButton("Delete my report") {
                scope.launch { app.repository.deleteReport(id); onNavigate(Routes.Reports) }
            }
        }
    }
}

@Composable
fun IssueDetailScreen(slug: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var data by remember { mutableStateOf<IssueDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadIssue(slug)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(slug) { load() }
    val issue = data?.issue
    when {
        loading && issue == null -> LoadingBox()
        error != null && issue == null -> ErrorState(error!!) { load() }
        issue == null -> ErrorState("Issue not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill(issue.category, c.amber)
            Text(issue.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            CivicMedia(issue.mediaUrl, issue.mediaType)
            Text(issue.summary, color = c.foreground.toC())
            SectionLabel("Why it matters")
            Text(issue.whyItMatters, color = c.muted.toC())
            SectionLabel("Current situation")
            Text(issue.currentSituation, color = c.muted.toC())
            if (issue.pros.isNotEmpty()) {
                SectionLabel("Pros")
                issue.pros.forEach { Text("· $it", color = c.foreground.toC()) }
            }
            if (issue.cons.isNotEmpty()) {
                SectionLabel("Cons")
                issue.cons.forEach { Text("· $it", color = c.foreground.toC()) }
            }
            EngageBar("issue", issue.slug, "/issues/${issue.slug}", issue.title, compact = false)
            if (data?.proposals.orEmpty().isNotEmpty()) {
                SectionLabel("Related votes")
                data!!.proposals.forEach {
                    SurfaceCard(onClick = { onNavigate(Routes.vote(it.id)) }) {
                        Text(it.title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            if (data?.related.orEmpty().isNotEmpty()) {
                SectionLabel("Related issues")
                data!!.related.forEach {
                    SurfaceCard(onClick = { onNavigate(Routes.issue(it.slug)) }) {
                        Text(it.title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
fun VoteDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var proposal by remember { mutableStateOf<ProposalDto?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var likert by remember { mutableStateOf<String?>(null) }
    var checks by remember { mutableStateOf(setOf<String>()) }
    var pref by remember { mutableStateOf(listOf<String>()) }
    var submitted by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun hydrateBallot(choice: kotlinx.serialization.json.JsonElement?, voteType: String?) {
        if (choice == null) return
        when (choice) {
            is JsonPrimitive -> {
                likert = choice.contentOrNull
                submitted = true
            }
            is JsonArray -> {
                val list = choice.mapNotNull { (it as? JsonPrimitive)?.contentOrNull }
                when (voteType) {
                    "checklist" -> { checks = list.toSet(); submitted = list.isNotEmpty() }
                    "preference" -> { pref = list; submitted = list.isNotEmpty() }
                    else -> {
                        likert = list.firstOrNull()
                        submitted = likert != null
                    }
                }
            }
            else -> Unit
        }
    }
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadProposal(id)) {
                is Outcome.Ok -> {
                    proposal = r.value
                    when (val me = app.repository.myBallot(id)) {
                        is Outcome.Ok -> hydrateBallot(me.value.vote?.choice, r.value.voteType)
                        is Outcome.Err -> Unit
                    }
                }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val p = proposal
    when {
        loading && p == null -> LoadingBox()
        error != null && p == null -> ErrorState(error!!) { load() }
        p == null -> ErrorState("Vote not found")
        else -> {
            val canSubmit = when (p.voteType) {
                "checklist" -> checks.isNotEmpty()
                "preference" -> pref.isNotEmpty()
                else -> likert != null
            }
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill("Non-binding ${p.voteType} vote", c.fact)
            Text(p.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            Text(p.description, color = c.muted.toC())
            CivicMedia(p.mediaUrl, p.mediaType)
            if (p.benefits.isNotEmpty()) {
                SectionLabel("Benefits")
                p.benefits.forEach { Text("· $it", color = c.foreground.toC()) }
            }
            if (p.argumentsFor.isNotEmpty()) {
                SectionLabel("Arguments for")
                p.argumentsFor.forEach { Text("· $it", color = c.success.toC()) }
            }
            if (p.argumentsAgainst.isNotEmpty()) {
                SectionLabel("Arguments against")
                p.argumentsAgainst.forEach { Text("· $it", color = c.danger.toC()) }
            }
            SectionLabel(if (submitted) "Your ballot" else "Cast your vote")
            when (p.voteType) {
                "checklist" -> {
                    val opts = p.options.orEmpty()
                    opts.forEach { o ->
                        ChoiceChip(o, checks.contains(o)) {
                            checks = if (checks.contains(o)) checks - o else checks + o
                        }
                    }
                }
                "preference" -> {
                    val opts = p.options.orEmpty()
                    Text("Tap to add to your ranked list.", color = c.muted.toC(), fontSize = 13.sp)
                    opts.forEach { o ->
                        ChoiceChip(if (pref.contains(o)) "${pref.indexOf(o) + 1}. $o" else o, pref.contains(o)) {
                            pref = if (pref.contains(o)) pref - o else pref + o
                        }
                    }
                }
                else -> LIKERT_CHOICES.forEach { (k, l) ->
                    ChoiceChip(l, likert == k) { likert = k }
                }
            }
            p.results
                ?.entries
                ?.sortedByDescending { it.value }
                ?.forEach { (k, v) ->
                    Text("${formatVoteLabel(k)}  ${v.toInt()}%", color = c.muted.toC(), fontSize = 12.sp)
                    LinearProgressIndicator(
                        progress = { (v / 100.0).toFloat().coerceIn(0f, 1f) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            Text("${indianCount(p.liveVotes ?: p.totalVotes)} participants", color = c.muted.toC())
            AmberButton("Submit vote", enabled = canSubmit, onClick = {
                val choice = when (p.voteType) {
                    "checklist" -> JsonArray(checks.map { JsonPrimitive(it) })
                    "preference" -> JsonArray(pref.map { JsonPrimitive(it) })
                    else -> JsonPrimitive(likert!!)
                }
                val work = suspend {
                    when (val r = app.repository.castBallot(id, choice)) {
                        is Outcome.Ok -> {
                            proposal = p.copy(liveVotes = r.value.liveVotes, totalVotes = r.value.liveVotes, results = r.value.results)
                            submitted = true
                        }
                        is Outcome.Err -> if (r.unauthorized) app.auth.require("vote") {}
                    }
                }
                if (!session.authenticated) app.auth.require("vote") { scope.launch { work() } }
                else scope.launch { work() }
            })
            EngageBar("proposal", p.id, "/vote/${p.id}", p.title, compact = false)
            p.issueSlug?.let { GhostButton("Open related issue") { onNavigate(Routes.issue(it)) } }
        }
        }
    }
}

@Composable
fun DiscussionDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var data by remember { mutableStateOf<FeedDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadFeedPost(id)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val p = data?.post
    when {
        loading && p == null -> LoadingBox()
        error != null && p == null -> ErrorState(error!!) { load() }
        p == null -> ErrorState("Discussion not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill(p.type, c.muted)
            p.publicId?.let { Text(it, fontFamily = FontFamily.Monospace, color = c.muted.toC(), fontSize = 12.sp) }
            Text(p.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            Text(p.body ?: p.excerpt.orEmpty(), color = c.muted.toC())
            CivicMedia(p.mediaUrl, p.mediaType)
            p.authorAnonId?.let { Text(it, color = c.amber.toC()) }
            EngageBar("feed", p.id, p.publicId?.let { "/p/$it" } ?: "/p/${p.id}", p.title, compact = false)
            if (data?.isMine == true) GhostButton("Delete") {
                scope.launch { app.repository.deleteFeed(id); onNavigate(Routes.Discussions) }
            }
        }
    }
}

@Composable
fun ShareDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var data by remember { mutableStateOf<ShareDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadShare(id)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val s = data?.share
    when {
        loading && s == null -> LoadingBox()
        error != null && s == null -> ErrorState(error!!) { load() }
        s == null -> ErrorState("Share not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill("Community Post", c.news)
            CivicMedia(s.mediaUrl, s.mediaType)
            Text(s.caption, color = c.foreground.toC(), fontSize = 18.sp)
            Text(s.locationLabel ?: "", color = c.muted.toC())
            s.authorAnonId?.let { Text(it, color = c.amber.toC()) }
            val feedId = data?.feedPostId
            if (feedId != null) EngageBar("feed", feedId, "/share/${s.id}", s.caption, compact = false)
            if (data?.isMine == true) GhostButton("Delete") {
                scope.launch { app.repository.deleteShare(id); onNavigate(Routes.Home) }
            }
        }
    }
}

@Composable
fun NoticeDetailScreen(id: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var data by remember { mutableStateOf<NoticeDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var msg by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadNotice(id)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val n = data?.notice
    when {
        loading && n == null -> LoadingBox()
        error != null && n == null -> ErrorState(error!!) { load() }
        n == null -> ErrorState("Notice not found")
        else -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KindPill("Notice · ${n.target}", c.amberBright)
            Text(n.title, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
            Text(n.description, color = c.muted.toC())
            CivicMedia(n.mediaUrl, n.mediaType)
            Text("${indianCount(n.signatures)} signatures", color = c.muted.toC())
            EngageBar("notice", n.id, "/notice/${n.id}", n.title, compact = false)
            msg?.let { Text(it, color = c.foreground.toC()) }
            AmberButton("Add my signature", onClick = {
                val work = suspend {
                    when (val r = app.repository.signNotice(id)) {
                        is Outcome.Ok -> {
                            data = data?.copy(notice = r.value.notice ?: n)
                            msg = if (r.value.alreadySigned) "Already signed" else "Signed"
                        }
                        is Outcome.Err -> if (r.unauthorized) app.auth.require("sign") {} else msg = r.message
                    }
                }
                if (!session.authenticated) app.auth.require("sign this notice") { scope.launch { work() } }
                else scope.launch { work() }
            })
        }
    }
}

@Composable
fun PublicPostScreen(publicId: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var mongoId by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    LaunchedEffect(publicId) {
        loading = true
        if (publicId.matches(Regex("^[a-fA-F0-9]{24}$"))) {
            mongoId = publicId
            loading = false
            return@LaunchedEffect
        }
        when (val r = app.repository.loadFeed(mapOf("q" to publicId, "sort" to "new", "limit" to "40"))) {
            is Outcome.Ok -> {
                val match = r.value.posts.firstOrNull { it.publicId.equals(publicId, true) || it.id == publicId }
                mongoId = match?.id
                if (match == null) error = "Post not found"
            }
            is Outcome.Err -> error = r.message
        }
        loading = false
    }
    when {
        loading -> LoadingBox()
        mongoId != null -> DiscussionDetailScreen(mongoId!!, onNavigate)
        else -> ErrorState(error ?: "Post not found")
    }
}

@Composable
fun MemeDetailScreen(id: String, @Suppress("UNUSED_PARAMETER") onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var data by remember { mutableStateOf<MemeDetailResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadMeme(id)) {
                is Outcome.Ok -> {
                    data = r.value
                    error = null
                }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(id) { load() }
    val m = data?.meme
    when {
        loading && m == null -> LoadingBox()
        error != null && m == null -> ErrorState(error!!) { load() }
        m == null -> ErrorState("Meme not found")
        else -> Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            KindPill("Meme", c.news)
            CivicMedia(m.imageUrl, "image")
            if (m.title.isNotBlank()) {
                Text(
                    m.title,
                    fontFamily = FontFamily.Serif,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.foreground.toC(),
                )
            }
            m.caption?.takeIf { it.isNotBlank() }?.let {
                Text(it, color = c.muted.toC(), fontSize = 15.sp)
            }
            m.authorAnonId?.let { Text(it, color = c.amber.toC()) }
                ?: m.authorLabel?.let { Text(it, color = c.amber.toC()) }
            if (m.tags.isNotEmpty()) {
                Text(m.tags.joinToString(" ") { "#$it" }, color = c.muted.toC(), fontSize = 13.sp)
            }
            EngageBar("meme", m.id, "/memes/${m.id}", m.title.ifBlank { m.caption ?: "Meme" }, compact = false)
        }
    }
}
