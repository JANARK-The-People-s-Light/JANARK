package org.janark.app.ui.components

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.IosShare
import androidx.compose.material.icons.outlined.ThumbDown
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.core.Outcome
import org.janark.app.core.indianCount
import org.janark.app.data.net.EngageCountsDto
import org.janark.app.ui.LocalApp
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun EngageBar(
    targetType: String,
    targetId: String,
    sharePath: String,
    shareTitle: String?,
    compact: Boolean = true,
    onOpenComments: (() -> Unit)? = null,
    showComments: Boolean = !compact,
) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(
        initial = org.janark.app.data.session.UiSession(),
    )
    var counts by remember(targetType, targetId) { mutableStateOf<EngageCountsDto?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var flagOpen by remember { mutableStateOf(false) }
    var commentsOpen by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val ctx = LocalContext.current
    val c = JanarkTheme.colors

    fun load() {
        scope.launch {
            when (val r = app.repository.engage(targetType, targetId)) {
                is Outcome.Ok -> counts = r.value
                is Outcome.Err -> error = r.message
            }
        }
    }

    LaunchedEffect(targetType, targetId) { load() }

    fun gated(reason: String, block: suspend () -> Unit) {
        if (!session.authenticated) {
            app.auth.require(reason) { scope.launch { block() } }
        } else {
            scope.launch { block() }
        }
    }

    fun vote(choice: String) {
        gated("vote") {
            when (val r = app.repository.voteEngage(targetType, targetId, choice)) {
                is Outcome.Ok -> counts = r.value
                is Outcome.Err -> {
                    if (r.unauthorized) app.auth.require("vote") { vote(choice) }
                    else error = r.message
                }
            }
        }
    }

    Column(Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { vote("upvote") }) {
                    Icon(
                        if (counts?.myVote == 1) Icons.Filled.ThumbUp else Icons.Outlined.ThumbUp,
                        contentDescription = "Upvote",
                        tint = if (counts?.myVote == 1) c.amber.toC() else c.muted.toC(),
                    )
                }
                Text(indianCount(counts?.upvotes ?: 0), color = c.foreground.toC(), fontSize = 13.sp)
                IconButton(onClick = { vote("downvote") }) {
                    Icon(
                        if (counts?.myVote == -1) Icons.Filled.ThumbDown else Icons.Outlined.ThumbDown,
                        contentDescription = "Downvote",
                        tint = if (counts?.myVote == -1) c.danger.toC() else c.muted.toC(),
                    )
                }
                IconButton(onClick = {
                    if (onOpenComments != null) onOpenComments.invoke()
                    else commentsOpen = !commentsOpen
                }) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "Comments", tint = c.muted.toC())
                }
                Text(indianCount(counts?.commentCount ?: 0), color = c.muted.toC(), fontSize = 13.sp)
            }
            Row {
                IconButton(onClick = {
                    gated("share") {
                        app.repository.trackShare("native", sharePath, shareTitle)
                        val base = app.session.currentApiBase()
                        val absolute = when {
                            sharePath.startsWith("http://") || sharePath.startsWith("https://") -> sharePath
                            sharePath.startsWith("/") -> "$base$sharePath"
                            else -> "$base/$sharePath"
                        }
                        val body = listOfNotNull(shareTitle, absolute)
                            .filter { it.isNotBlank() }
                            .joinToString("\n")
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, shareTitle ?: "Janark")
                            putExtra(Intent.EXTRA_TEXT, body.ifBlank { "Janark" })
                        }
                        ctx.startActivity(Intent.createChooser(send, "Share"))
                    }
                }) {
                    Icon(Icons.Outlined.IosShare, contentDescription = "Share", tint = c.muted.toC())
                }
                IconButton(onClick = {
                    gated("flag this") { flagOpen = true }
                }) {
                    Icon(Icons.Outlined.Flag, contentDescription = "Report", tint = c.muted.toC())
                }
            }
        }
        error?.let { Text(it, color = c.danger.toC(), fontSize = 12.sp) }
        if (showComments || commentsOpen) {
            CommentThread(targetType, targetId)
        }
        if (flagOpen) {
            FlagSheet(targetType, targetId, onDismiss = { flagOpen = false })
        }
    }
}
