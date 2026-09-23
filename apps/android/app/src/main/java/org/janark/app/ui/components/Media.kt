package org.janark.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import org.janark.app.core.mediaAbsoluteUrl
import org.janark.app.ui.LocalApp
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

@Composable
fun CivicMedia(url: String?, mediaType: String?, modifier: Modifier = Modifier) {
    if (url.isNullOrBlank()) return
    val app = LocalApp.current
    val base by app.session.apiBaseUrl.collectAsState(initial = "")
    val abs = remember(url, base) { mediaAbsoluteUrl(base, url) } ?: return
    val c = JanarkTheme.colors
    val shape = RoundedCornerShape(12.dp)
    when (mediaType) {
        "video" -> {
            val ctx = LocalContext.current
            Box(
                modifier
                    .fillMaxWidth()
                    .heightIn(min = 160.dp)
                    .clip(shape)
                    .background(c.chrome.toC())
                    .clickable {
                        runCatching {
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(abs))
                            ctx.startActivity(intent)
                        }
                    },
                contentAlignment = Alignment.Center,
            ) {
                Text("Play video", color = c.onChrome.toC())
            }
        }
        else -> {
            AsyncImage(
                model = abs,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = modifier
                    .fillMaxWidth()
                    .heightIn(max = 320.dp)
                    .clip(shape),
            )
        }
    }
}
