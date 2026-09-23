package org.janark.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.core.FLAG_REASONS
import org.janark.app.core.Outcome
import org.janark.app.core.relativeTime
import org.janark.app.data.net.CommentDto
import org.janark.app.ui.LocalApp
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun CommentThread(targetType: String, targetId: String) {
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    var comments by remember { mutableStateOf<List<CommentDto>>(emptyList()) }
    var draft by remember { mutableStateOf("") }
    var gif by remember { mutableStateOf("") }
    var replyTo by remember { mutableStateOf<String?>(null) }
    var editingId by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors

    fun load() {
        scope.launch {
            when (val r = app.repository.comments(targetType, targetId)) {
                is Outcome.Ok -> comments = r.value.comments
                is Outcome.Err -> error = r.message
            }
        }
    }
    LaunchedEffect(targetType, targetId) { load() }

    fun send() {
        val work = suspend {
            val editId = editingId
            val result = if (editId != null) {
                app.repository.editComment(editId, draft)
            } else {
                app.repository.postComment(
                    targetType, targetId, draft,
                    parentId = replyTo,
                    mediaUrl = gif.takeIf { it.isNotBlank() },
                    mediaType = if (gif.isNotBlank()) "gif" else null,
                )
            }
            when (result) {
                is Outcome.Ok -> {
                    comments = result.value.comments
                    draft = ""
                    gif = ""
                    replyTo = null
                    editingId = null
                    error = null
                }
                is Outcome.Err -> {
                    if (result.unauthorized) app.auth.require("comment") { send() }
                    else error = result.message
                }
            }
        }
        if (!session.authenticated) app.auth.require("comment") { scope.launch { work() } }
        else scope.launch { work() }
    }

    fun deleteComment(id: String) {
        val work = suspend {
            when (val r = app.repository.deleteComment(id)) {
                is Outcome.Ok -> load()
                is Outcome.Err -> {
                    if (r.unauthorized) app.auth.require("delete comment") { deleteComment(id) }
                    else error = r.message
                }
            }
        }
        if (!session.authenticated) app.auth.require("delete comment") { scope.launch { work() } }
        else scope.launch { work() }
    }

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Comments", color = c.foreground.toC(), fontSize = 16.sp)
        comments.forEach { cmt ->
            CommentItem(
                comment = cmt,
                onReply = {
                    replyTo = it
                    editingId = null
                    draft = ""
                },
                onEdit = { id, body ->
                    editingId = id
                    replyTo = null
                    draft = body
                    gif = ""
                },
                onDelete = { deleteComment(it) },
                depth = 0,
            )
        }
        replyTo?.let { Text("Replying…", color = c.muted.toC(), fontSize = 12.sp) }
        editingId?.let { Text("Editing your comment…", color = c.muted.toC(), fontSize = 12.sp) }
        JanarkField(
            draft,
            { draft = it },
            when {
                editingId != null -> "Edit comment"
                replyTo != null -> "Reply"
                else -> "Add a comment"
            },
            singleLine = false,
            minLines = 2,
        )
        if (editingId == null) {
            JanarkField(gif, { gif = it }, "GIF link (optional)")
        }
        error?.let { Text(it, color = c.danger.toC(), fontSize = 12.sp) }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AmberButton(
                if (editingId != null) "Save" else "Post comment",
                onClick = { send() },
                enabled = draft.length >= 2 || (editingId == null && gif.isNotBlank()),
            )
            if (replyTo != null || editingId != null) {
                GhostButton("Cancel") {
                    replyTo = null
                    editingId = null
                    draft = ""
                    gif = ""
                }
            }
        }
    }
}

@Composable
private fun CommentItem(
    comment: CommentDto,
    onReply: (String) -> Unit,
    onEdit: (String, String) -> Unit,
    onDelete: (String) -> Unit,
    depth: Int,
) {
    val c = JanarkTheme.colors
    Column(Modifier.padding(start = (depth * 12).dp)) {
        Text(comment.authorLabel ?: comment.authorAnonId ?: "Citizen", color = c.amber.toC(), fontSize = 12.sp)
        Text(comment.body, color = c.foreground.toC(), fontSize = 14.sp)
        CivicMedia(comment.mediaUrl, comment.mediaType)
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(relativeTime(comment.createdAt) ?: "", color = c.muted.toC(), fontSize = 11.sp)
            TextButton(onClick = { onReply(comment.id) }) {
                Text("Reply", color = c.amber.toC(), fontSize = 12.sp)
            }
            if (comment.isMine) {
                TextButton(onClick = { onEdit(comment.id, comment.body) }) {
                    Text("Edit", color = c.muted.toC(), fontSize = 12.sp)
                }
                TextButton(onClick = { onDelete(comment.id) }) {
                    Text("Delete", color = c.danger.toC(), fontSize = 12.sp)
                }
            }
        }
        comment.replies.forEach {
            CommentItem(it, onReply = onReply, onEdit = onEdit, onDelete = onDelete, depth = depth + 1)
        }
    }
}

@Composable
fun FlagSheet(targetType: String, targetId: String, onDismiss: () -> Unit) {
    val app = LocalApp.current
    var reason by remember { mutableStateOf("spam") }
    var detail by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Report content") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Why are you reporting this?", color = c.muted.toC())
                FLAG_REASONS.chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { r ->
                            ChoiceChip(r.replaceFirstChar { it.uppercase() }, reason == r) { reason = r }
                        }
                    }
                }
                JanarkField(detail, { detail = it }, "Details (optional)", singleLine = false)
                msg?.let { Text(it, color = c.foreground.toC(), fontSize = 13.sp) }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                scope.launch {
                    when (val r = app.repository.flag(targetType, targetId, reason, detail)) {
                        is Outcome.Ok -> {
                            msg = r.value.message ?: if (r.value.alreadyReported) "You already reported this" else "Reported"
                        }
                        is Outcome.Err -> {
                            if (r.unauthorized) {
                                onDismiss()
                                app.auth.require("flag this") {}
                            } else msg = r.message
                        }
                    }
                }
            }) { Text("Submit", color = c.amber.toC()) }
        },
        dismissButton = { TextButton(onDismiss) { Text("Close") } },
    )
}
