package org.janark.app.ui.browse

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import org.janark.app.core.ISSUE_CATEGORIES
import org.janark.app.core.Outcome
import org.janark.app.core.PETITION_STATUSES
import org.janark.app.core.REPORT_TYPES
import org.janark.app.core.indianCount
import org.janark.app.core.relativeTime
import org.janark.app.data.net.DemandDto
import org.janark.app.data.net.IssueDto
import org.janark.app.data.net.ProposalDto
import org.janark.app.data.net.ReportDto
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.ChoiceChip
import org.janark.app.ui.components.CivicMedia
import org.janark.app.ui.components.EmptyState
import org.janark.app.ui.components.ErrorState
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.KindPill
import org.janark.app.ui.components.LoadingBox
import org.janark.app.ui.components.SurfaceCard
import org.janark.app.ui.home.HomePost
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun PetitionsScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var q by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<DemandDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            val params = buildMap {
                if (q.isNotBlank()) put("q", q)
                if (status.isNotBlank()) put("status", status)
            }
            when (val r = app.repository.loadDemands(params)) {
                is Outcome.Ok -> { items = r.value.demands; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(status) { load() }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize()) {
        JanarkField(q, { q = it }, "Search petitions", modifier = Modifier.padding(16.dp))
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ChoiceChip("All", status.isBlank()) { status = "" }
            PETITION_STATUSES.forEach { ChoiceChip(it.replaceFirstChar { ch -> ch.uppercase() }, status == it) { status = it } }
        }
        when {
            loading -> LoadingBox()
            error != null -> ErrorState(error!!) { load() }
            items.isEmpty() -> EmptyState("No petitions yet", "Launch one that names who should act.")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(items, key = { it.id }) { d ->
                    SurfaceCard(onClick = { onNavigate(Routes.petition(d.id)) }) {
                        KindPill(d.status, c.success)
                        Text(d.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                        Text(d.ask, color = c.muted.toC(), modifier = Modifier.padding(top = 4.dp))
                        Text(
                            "${indianCount(d.supportCount)} signs · ${d.locationLabel ?: d.state ?: "India"} · ${relativeTime(d.createdAt) ?: ""}",
                            color = c.muted.toC(),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ReportsScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var q by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<ReportDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            val params = buildMap {
                if (q.isNotBlank()) put("q", q)
                if (type.isNotBlank()) put("type", type)
            }
            when (val r = app.repository.loadReports(params)) {
                is Outcome.Ok -> { items = r.value.reports; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(type) { load() }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize()) {
        JanarkField(q, { q = it }, "Search reports", modifier = Modifier.padding(16.dp))
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ChoiceChip("All", type.isBlank()) { type = "" }
            REPORT_TYPES.forEach { ChoiceChip(it.replaceFirstChar { ch -> ch.uppercase() }, type == it) { type = it } }
        }
        when {
            loading -> LoadingBox()
            error != null -> ErrorState(error!!) { load() }
            items.isEmpty() -> EmptyState("No reports yet", "Photo-first civic reports belong here.")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(items, key = { it.id }) { r ->
                    SurfaceCard(onClick = { onNavigate(Routes.report(r.id)) }) {
                        KindPill(r.type, c.danger)
                        Text(r.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                        CivicMedia(r.mediaUrl, r.mediaType)
                        Text(
                            "${indianCount(r.upvotes)} support · ${r.locationLabel ?: ""} · ${relativeTime(r.createdAt) ?: ""}",
                            color = c.muted.toC(),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun IssuesScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var category by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<IssueDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadIssues(category)) {
                is Outcome.Ok -> { items = r.value.issues; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(category) { load() }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ChoiceChip("All", category == null) { category = null }
            ISSUE_CATEGORIES.forEach { ChoiceChip(it, category == it) { category = it } }
        }
        when {
            loading -> LoadingBox()
            error != null -> ErrorState(error!!) { load() }
            items.isEmpty() -> EmptyState("No issues yet")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(items, key = { it.slug }) { issue ->
                    SurfaceCard(onClick = { onNavigate(Routes.issue(issue.slug)) }) {
                        KindPill(issue.category, c.amber)
                        Text(issue.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                        Text(issue.summary, color = c.muted.toC(), modifier = Modifier.padding(top = 4.dp))
                        Text("${indianCount(issue.voteCount)} momentum", color = c.muted.toC(), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun VotesScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<ProposalDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadProposals()) {
                is Outcome.Ok -> { items = r.value.proposals; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(Unit) { load() }
    val c = JanarkTheme.colors
    when {
        loading -> LoadingBox()
        error != null -> ErrorState(error!!) { load() }
        items.isEmpty() -> EmptyState("No open votes")
        else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(items, key = { it.id }) { p ->
                SurfaceCard(onClick = { onNavigate(Routes.vote(p.id)) }) {
                    KindPill("Open vote · ${p.voteType}", c.fact)
                    Text(p.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                    Text(p.description, color = c.muted.toC(), modifier = Modifier.padding(top = 4.dp), maxLines = 3)
                    Text("${indianCount(p.totalVotes)} participants · non-binding", color = c.muted.toC(), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }
            }
        }
    }
}

@Composable
fun DiscussionsScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var posts by remember { mutableStateOf(emptyList<org.janark.app.data.net.FeedPostDto>()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadFeed(mapOf("type" to "discussion", "sort" to "new"))) {
                is Outcome.Ok -> { posts = r.value.posts; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(Unit) { load() }
    when {
        loading -> LoadingBox()
        error != null -> ErrorState(error!!) { load() }
        posts.isEmpty() -> EmptyState("No discussions yet")
        else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(posts, key = { it.id }) { HomePost(it, onNavigate) }
        }
    }
}

@Composable
fun MemesScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var q by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<org.janark.app.data.net.MemeDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            val params = buildMap {
                put("sort", "hot")
                if (q.isNotBlank()) put("q", q)
            }
            when (val r = app.repository.loadMemes(params)) {
                is Outcome.Ok -> {
                    items = r.value.memes.ifEmpty { r.value.items }
                    error = null
                }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(Unit) { load() }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize()) {
        JanarkField(q, { q = it }, "Search memes", modifier = Modifier.padding(16.dp))
        AmberButton("Post a meme", onClick = { onNavigate(Routes.create("meme")) }, modifier = Modifier.padding(horizontal = 16.dp))
        when {
            loading -> LoadingBox()
            error != null -> ErrorState(error!!) { load() }
            items.isEmpty() -> EmptyState("No memes yet", "Share civic humor that sparks awareness.")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(items, key = { it.id }) { m ->
                    SurfaceCard(onClick = { onNavigate(Routes.meme(m.id)) }) {
                        CivicMedia(m.imageUrl, null)
                        Text(m.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                        m.caption?.takeIf { it.isNotBlank() }?.let {
                            Text(it, color = c.muted.toC(), modifier = Modifier.padding(top = 4.dp), maxLines = 3)
                        }
                        Text(
                            "${indianCount(m.upvotes)} up · ${indianCount(m.shareCount)} shares · ${relativeTime(m.createdAt) ?: ""}",
                            color = c.muted.toC(),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NoticesScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var items by remember { mutableStateOf<List<org.janark.app.data.net.NoticeDto>>(emptyList()) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.loadNotices()) {
                is Outcome.Ok -> { items = r.value.notices; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(Unit) { load() }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize()) {
        AmberButton("Raise a notice", onClick = { onNavigate(Routes.create("notice")) }, modifier = Modifier.padding(16.dp))
        when {
            loading -> LoadingBox()
            error != null -> ErrorState(error!!) { load() }
            items.isEmpty() -> EmptyState("No notices yet")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(items, key = { it.id }) { n ->
                    SurfaceCard(onClick = { onNavigate(Routes.notice(n.id)) }) {
                        KindPill(n.target ?: "notice", c.fact)
                        Text(n.title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, color = c.foreground.toC(), modifier = Modifier.padding(top = 8.dp))
                        n.description?.takeIf { it.isNotBlank() }?.let {
                            Text(it, color = c.muted.toC(), modifier = Modifier.padding(top = 4.dp), maxLines = 3)
                        }
                        Text(
                            "${indianCount(n.signatures)} signatures · ${relativeTime(n.createdAt) ?: ""}",
                            color = c.muted.toC(),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                }
            }
        }
    }
}
