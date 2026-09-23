package org.janark.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import org.janark.app.core.Outcome
import org.janark.app.core.formatDate
import org.janark.app.core.hrefToRoute
import org.janark.app.core.indianCount
import org.janark.app.data.net.ProfilePostItem
import org.janark.app.data.net.ProfileResponse
import org.janark.app.ui.LocalApp
import org.janark.app.ui.auth.LoginScreen
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.EmptyState
import org.janark.app.ui.components.ErrorState
import org.janark.app.ui.components.GhostButton
import org.janark.app.ui.components.KindPill
import org.janark.app.ui.components.LoadingBox
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.components.SurfaceCard
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun ProfileGate(anonId: String?, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    val id = anonId ?: session.anonId
    if (id.isNullOrBlank()) {
        LoginScreen(reason = "see your profile", onSuccess = {
            session.anonId?.let { onNavigate(Routes.profile(it)) }
        })
    } else {
        ProfileScreen(id, onNavigate)
    }
}

@Composable
fun ProfileScreen(anonId: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var data by remember { mutableStateOf<ProfileResponse?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    fun load() {
        loading = true
        scope.launch {
            when (val r = app.repository.profile(anonId)) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }
    LaunchedEffect(anonId) { load() }
    when {
        loading && data == null -> LoadingBox()
        error != null && data == null -> ErrorState(error!!) { load() }
        data == null -> EmptyState("Profile not found")
        else -> {
            val p = data!!
            val items = buildList {
                addAll(p.posts.demands.map { it to "Petition" })
                addAll(p.posts.reports.map { it to "Report" })
                addAll(p.posts.discussions.map { it to "Discussion" })
                addAll(p.posts.notices.map { it to "Notice" })
                addAll(p.posts.shares.map { it to "Share" })
                addAll(p.posts.memes.map { it to "Post" })
            }
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(p.profile?.label ?: anonId, fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
                        Text(anonId, fontFamily = FontFamily.Monospace, color = c.muted.toC())
                        Text("Member since ${formatDate(p.counts.memberSince ?: p.profile?.memberSince)}", color = c.muted.toC(), fontSize = 13.sp)
                        Text(
                            "${indianCount(p.counts.followers)} followers · ${indianCount(p.counts.following)} following · ${indianCount(p.counts.posts)} posts",
                            color = c.foreground.toC(),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            GhostButton("Followers") { onNavigate(Routes.followList(anonId, "followers")) }
                            GhostButton("Following") { onNavigate(Routes.followList(anonId, "following")) }
                        }
                        when {
                            p.follow.isSelf -> Text("This is you. Your phone number is never shown.", color = c.muted.toC(), fontSize = 13.sp)
                            session.authenticated -> AmberButton(if (p.follow.viewerFollows) "Unfollow" else "Follow", onClick = {
                                scope.launch {
                                    app.repository.toggleFollow(anonId, if (p.follow.viewerFollows) "unfollow" else "follow")
                                    load()
                                }
                            })
                            else -> AmberButton("Follow", onClick = {
                                app.auth.require("follow") {
                                    scope.launch {
                                        app.repository.toggleFollow(anonId, "follow")
                                        load()
                                    }
                                }
                            })
                        }
                        SectionLabel("Posts")
                    }
                }
                if (items.isEmpty()) {
                    item { Text("No public posts yet.", color = c.muted.toC()) }
                }
                items(items, key = { (item, kind) -> "${kind}-${item.id}-${item.href}" }) { (item, kind) ->
                    ProfileRow(item, kind, onNavigate)
                }
                item {
                    SectionLabel("Activity")
                    val acts = p.reactions.demandSupports + p.reactions.proposalVotes + p.reactions.reportVotes + p.reactions.noticeSignatures
                    if (acts.isEmpty()) Text("No public reactions listed.", color = c.muted.toC())
                    acts.take(20).forEach { a ->
                        SurfaceCard(onClick = { hrefToRoute(a.href)?.let(onNavigate) }) {
                            Text(a.title ?: "Activity", color = c.foreground.toC())
                            Text(listOfNotNull(a.choice, a.reaction, a.ask).joinToString(" · "), color = c.muted.toC(), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileRow(item: ProfilePostItem, kind: String, onNavigate: (String) -> Unit) {
    val c = JanarkTheme.colors
    SurfaceCard(onClick = { hrefToRoute(item.href)?.let(onNavigate) }) {
        KindPill(kind, c.amber)
        Text(item.title ?: item.body ?: item.ask ?: item.caption ?: "Post", color = c.foreground.toC(), fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 6.dp))
    }
}

@Composable
fun FollowListScreen(anonId: String, list: String, onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var names by remember { mutableStateOf(listOf<org.janark.app.data.net.FollowPersonDto>()) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(anonId, list) {
        when (val r = app.repository.followStatus(anonId, list)) {
            is Outcome.Ok -> names = r.value.people
            is Outcome.Err -> error = r.message
        }
    }
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(list.replaceFirstChar { it.uppercase() }, fontFamily = FontFamily.Serif, fontSize = 24.sp, color = c.foreground.toC())
        error?.let { Text(it, color = c.danger.toC()) }
        names.forEach { p ->
            SurfaceCard(onClick = { onNavigate(Routes.profile(p.anonId)) }) {
                Text(p.label ?: p.anonId, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                Text(p.anonId, fontFamily = FontFamily.Monospace, color = c.muted.toC(), fontSize = 12.sp)
            }
        }
    }
}
