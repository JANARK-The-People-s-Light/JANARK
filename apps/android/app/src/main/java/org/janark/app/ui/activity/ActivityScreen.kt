package org.janark.app.ui.activity

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
import org.janark.app.core.Outcome
import org.janark.app.core.hrefToRoute
import org.janark.app.core.indianCount
import org.janark.app.core.relativeTime
import org.janark.app.data.net.DashboardResponse
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.ChoiceChip
import org.janark.app.ui.components.ErrorState
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.LoadingBox
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.components.SurfaceCard
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun ActivityScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var q by remember { mutableStateOf("") }
    var kind by remember { mutableStateOf("all") }
    var data by remember { mutableStateOf<DashboardResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.dashboard(
                mapOf("q" to q, "kind" to kind),
            )) {
                is Outcome.Ok -> { data = r.value; error = null }
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(kind) { load() }
    val c = JanarkTheme.colors
    val d = data
    when {
        loading && d == null -> LoadingBox()
        error != null && d == null -> ErrorState(error!!) { load() }
        d == null -> ErrorState("No activity")
        else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text("Pulse", fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
                Text(d.stats.label ?: "National live stats", color = c.muted.toC())
                JanarkField(q, { q = it }, "Filter activity")
                Row(Modifier.horizontalScroll(rememberScrollState()).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("all" to "All", "issues" to "Issues", "reports" to "Reports", "demands" to "Petitions", "votes" to "Votes").forEach { (v, l) ->
                        ChoiceChip(l, kind == v) { kind = v }
                    }
                }
                SectionLabel("Live counts")
                StatGrid(d)
            }
            if (d.trends.isNotEmpty()) {
                item { SectionLabel("Trends") }
                items(d.trends.size) { i ->
                    val t = d.trends[i]
                    SurfaceCard(onClick = { onNavigate("${Routes.Home}?tag=${t.term.removePrefix("#")}") }) {
                        Text(t.term, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            if (d.topDemands.isNotEmpty()) {
                item { SectionLabel("Petitions") }
                items(d.topDemands.size) { i ->
                    val x = d.topDemands[i]
                    SurfaceCard(onClick = { hrefToRoute(x.href)?.let(onNavigate) }) {
                        Text(x.title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                        Text("${indianCount(x.supportCount)} signs · ${x.place ?: ""}", color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
            }
            if (d.topReports.isNotEmpty()) {
                item { SectionLabel("Reports") }
                items(d.topReports.size) { i ->
                    val x = d.topReports[i]
                    SurfaceCard(onClick = { hrefToRoute(x.href)?.let(onNavigate) }) {
                        Text(x.title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                        Text(x.place ?: "", color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
            }
            if (d.topIssues.isNotEmpty()) {
                item { SectionLabel("Issues") }
                items(d.topIssues.size) { i ->
                    val x = d.topIssues[i]
                    SurfaceCard(onClick = { x.slug?.let { onNavigate(Routes.issue(it)) } }) {
                        Text(x.title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                        Text("${indianCount(x.voteCount)} · ${x.category ?: ""}", color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
            }
            if (d.activity.isNotEmpty()) {
                item { SectionLabel("Stream") }
                items(d.activity.size) { i ->
                    val a = d.activity[i]
                    SurfaceCard(onClick = { hrefToRoute(a.href)?.let(onNavigate) }) {
                        Text(a.summary, color = c.foreground.toC())
                        Text(listOfNotNull(a.kind, relativeTime(a.createdAt)).joinToString(" · "), color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatGrid(d: DashboardResponse) {
    val c = JanarkTheme.colors
    val stats = listOf(
        "Citizens" to d.stats.citizens,
        "Petitions" to d.stats.demands,
        "Reports" to d.stats.reports,
        "Issues" to d.stats.issues,
        "Votes" to d.stats.votes,
        "Discussions" to d.stats.discussions,
        "Notices" to d.stats.notices,
        "Feed" to d.stats.feedPosts,
    )
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        stats.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { (l, n) ->
                    SurfaceCard(Modifier.weight(1f)) {
                        Text(indianCount(n), fontFamily = FontFamily.Serif, fontSize = 22.sp, color = c.foreground.toC())
                        Text(l, color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
