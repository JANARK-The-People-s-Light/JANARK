package org.janark.app.ui.home

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.janark.app.core.FEED_EXTRA_TYPES
import org.janark.app.core.FEED_SORTS
import org.janark.app.core.FEED_TABS
import org.janark.app.core.Outcome
import org.janark.app.core.hrefToRoute
import org.janark.app.data.net.FeedPostDto
import org.janark.app.data.net.FeedResponse
import org.janark.app.data.net.LocationsDto
import org.janark.app.domain.engageTargetForFeedPost
import org.janark.app.domain.sharePathForPost
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.ChoiceChip
import org.janark.app.ui.components.EmptyState
import org.janark.app.ui.components.EngageBar
import org.janark.app.ui.components.ErrorState
import org.janark.app.ui.components.FeedCard
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.LoadingBox
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    var type by remember { mutableStateOf("all") }
    var sort by remember { mutableStateOf("trending") }
    var q by remember { mutableStateOf("") }
    var tag by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("India") }
    var state by remember { mutableStateOf("") }
    var district by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var filtersOpen by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var data by remember { mutableStateOf<FeedResponse?>(null) }
    val scope = rememberCoroutineScope()

    fun params() = buildMap {
        put("type", type)
        put("sort", sort)
        if (q.isNotBlank()) put("q", q)
        if (tag.isNotBlank()) put("tag", tag)
        if (country.isNotBlank()) put("country", country)
        if (state.isNotBlank()) put("state", state)
        if (district.isNotBlank()) put("district", district)
        if (city.isNotBlank()) put("city", city)
        put("limit", "40")
    }

    fun reload() {
        loading = true
        error = null
        scope.launch {
            when (val r = app.repository.loadFeed(params())) {
                is Outcome.Ok -> data = r.value
                is Outcome.Err -> error = r.message
            }
            loading = false
        }
    }

    LaunchedEffect(type, sort, tag, country, state, district, city) { reload() }

    val c = JanarkTheme.colors
    val posts = data?.posts.orEmpty()
    val locations = data?.locations ?: LocationsDto()

    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            JanarkField(q, { q = it }, "Search the square", modifier = Modifier.weight(1f))
            IconButton(onClick = { reload() }) {
                Icon(Icons.Outlined.Search, contentDescription = "Search", tint = c.foreground.toC())
            }
            IconButton(onClick = { filtersOpen = true }) {
                Icon(Icons.Outlined.Tune, contentDescription = "Filters", tint = c.foreground.toC())
            }
        }
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FEED_TABS.forEach { (v, l) -> ChoiceChip(l, type == v) { type = v } }
        }
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FEED_SORTS.forEach { (v, l) -> ChoiceChip(l, sort == v) { sort = v } }
        }
        data?.hashtags?.takeIf { it.isNotEmpty() }?.let { tags ->
            Row(
                Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ChoiceChip("All topics", tag.isBlank()) { tag = "" }
                tags.forEach { h ->
                    ChoiceChip("#${h.tag}", tag == h.tag) { tag = if (tag == h.tag) "" else h.tag }
                }
            }
        }
        data?.ranking?.note?.let {
            Text(it, color = c.muted.toC(), modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
        }
        when {
            loading && data == null -> LoadingBox()
            error != null && data == null -> ErrorState(error!!, onRetry = { reload() })
            posts.isEmpty() -> EmptyState("Nothing here yet", "Be the first to raise a civic post.")
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(posts, key = { it.id }) { post ->
                    HomePost(post, onNavigate)
                }
            }
        }
    }

    if (filtersOpen) {
        ModalBottomSheet(onDismissRequest = { filtersOpen = false }, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionLabel("Content type")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    (FEED_TABS + FEED_EXTRA_TYPES).forEach { (v, l) -> ChoiceChip(l, type == v) { type = v } }
                }
                SectionLabel("Place")
                JanarkField(country, { country = it }, "Country")
                LocationSuggest("State", state, locations.states) { state = it }
                LocationSuggest("District", district, locations.districts) { district = it }
                LocationSuggest("City / town", city, locations.cities) { city = it }
                AmberApply { filtersOpen = false; reload() }
            }
        }
    }
}

@Composable
private fun AmberApply(onClick: () -> Unit) {
    org.janark.app.ui.components.AmberButton("Apply filters", onClick)
}

@Composable
fun LocationSuggest(label: String, value: String, options: List<String>, onChange: (String) -> Unit) {
    JanarkField(value, onChange, label)
    if (value.isNotBlank()) {
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            options.filter { it.contains(value, true) }.take(8).forEach {
                ChoiceChip(it, value.equals(it, true)) { onChange(it) }
            }
        }
    }
}

@Composable
fun HomePost(post: FeedPostDto, onNavigate: (String) -> Unit) {
    val target = engageTargetForFeedPost(post.id, post.type, post.refId, post.title, post.tags, post.href)
    val share = sharePathForPost(post.publicId, post.href, post.id, target.targetType, post.refId)
    FeedCard(
        post = post,
        onOpen = {
            val route = hrefToRoute(post.href)
                ?: post.publicId?.let { org.janark.app.ui.nav.Routes.publicPost(it) }
                ?: org.janark.app.ui.nav.Routes.discussion(post.id)
            onNavigate(route)
        },
        onAuthor = { onNavigate(org.janark.app.ui.nav.Routes.profile(it)) },
        footer = {
            EngageBar(
                targetType = target.targetType,
                targetId = target.targetId,
                sharePath = share,
                shareTitle = post.title,
                compact = true,
                onOpenComments = {
                    val route = hrefToRoute(post.href)
                        ?: org.janark.app.ui.nav.Routes.discussion(post.id)
                    onNavigate(route)
                },
                showComments = false,
            )
        },
    )
}
