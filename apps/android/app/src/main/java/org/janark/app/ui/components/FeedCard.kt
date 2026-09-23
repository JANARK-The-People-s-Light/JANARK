package org.janark.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.janark.app.core.placeLabel
import org.janark.app.core.relativeTime
import org.janark.app.data.net.FeedPostDto
import org.janark.app.domain.FeedKind
import org.janark.app.domain.metricLabel
import org.janark.app.domain.resolveFeedKind
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun FeedCard(
    post: FeedPostDto,
    onOpen: () -> Unit,
    onAuthor: ((String) -> Unit)? = null,
    footer: @Composable (() -> Unit)? = null,
) {
    val c = JanarkTheme.colors
    val kind = resolveFeedKind(post.type, post.title, post.href, post.tags)
    val bar = when (kind.kind) {
        FeedKind.Petition -> c.success
        FeedKind.Vote -> c.fact
        FeedKind.Report -> c.danger
        FeedKind.Issue -> c.amber
        FeedKind.Notice -> c.amberBright
        FeedKind.Share -> c.news
        FeedKind.Discussion, FeedKind.Other -> c.muted
    }
    val place = placeLabel(post.city, post.district, post.state, post.country)
    val time = relativeTime(post.createdAt)
    val metric = metricLabel(kind.metric, post.votes ?: 0)

    SurfaceCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.Top) {
            AccentBar(bar)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KindPill(kind.label, bar)
                    if (post.hot == true) KindPill("Hot", c.amber)
                    post.publicId?.let {
                        Text(it, fontFamily = FontFamily.Monospace, fontSize = 11.sp, color = c.muted.toC())
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    post.title,
                    color = c.foreground.toC(),
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                val excerpt = post.excerpt?.takeIf { it.isNotBlank() }
                if (excerpt != null) {
                    Spacer(Modifier.height(6.dp))
                    Text(excerpt, color = c.muted.toC(), maxLines = 3, overflow = TextOverflow.Ellipsis, fontSize = 14.sp)
                }
                CivicMedia(post.mediaUrl, post.mediaType, Modifier.padding(top = 10.dp))
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("${metric.first} ${metric.second}", color = c.muted.toC(), fontSize = 12.sp)
                    if (place != null) Text(place, color = c.muted.toC(), fontSize = 12.sp)
                    if (time != null) Text(time, color = c.muted.toC(), fontSize = 12.sp)
                }
                val author = post.authorAnonId ?: post.author
                if (!author.isNullOrBlank()) {
                    Text(
                        author,
                        color = c.amber.toC(),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp).then(
                            if (post.authorAnonId != null && onAuthor != null)
                                Modifier.clickableNoRipple { onAuthor(post.authorAnonId) }
                            else Modifier,
                        ),
                    )
                }
                if (!post.tags.isNullOrEmpty()) {
                    Text(
                        post.tags.take(5).joinToString(" ") { if (it.startsWith("#")) it else "#$it" },
                        color = c.navyMid.toC(),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                }
                footer?.invoke()
            }
        }
    }
}

private fun Modifier.clickableNoRipple(onClick: () -> Unit) =
    androidx.compose.foundation.clickable(onClick = onClick)
