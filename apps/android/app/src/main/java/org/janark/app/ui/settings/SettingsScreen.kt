package org.janark.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.GhostButton
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.ThemeId
import org.janark.app.ui.theme.toC

@Composable
fun SettingsScreen(onNavigate: (String) -> Unit) {
    val app = LocalApp.current
    val theme by app.session.themeId.collectAsState(initial = ThemeId.BrandDay)
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())
    val api by app.session.apiBaseUrl.collectAsState(initial = "")
    var apiDraft by remember(api) { mutableStateOf(api) }
    val scope = rememberCoroutineScope()
    val c = JanarkTheme.colors

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Settings", fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
        if (session.authenticated) {
            Text("Signed in as ${session.anonId}", fontFamily = FontFamily.Monospace, color = c.foreground.toC())
            Text("Phone hint ${session.hint ?: "••"} — number is never stored on this device.", color = c.muted.toC(), fontSize = 13.sp)
            AmberButton("Sign out", onClick = {
                scope.launch {
                    app.repository.logout()
                    onNavigate(Routes.Home)
                }
            })
        } else {
            Text("Browsing freely. Sign in only when you post or react.", color = c.muted.toC())
            AmberButton("Verify phone", onClick = { onNavigate(Routes.Login) })
        }
        SectionLabel("Theme")
        ThemeId.entries.forEach { t ->
            Column(
                Modifier
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                    .border(1.dp, if (t == theme) c.amber.toC() else c.line.toC(), androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                    .clickable { scope.launch { app.session.setTheme(t) } }
                    .padding(12.dp),
            ) {
                Text(t.label, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
                Text(t.description, color = c.muted.toC(), fontSize = 13.sp)
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(t.swatches.first, t.swatches.second, t.swatches.third).forEach { color ->
                        Box(Modifier.size(18.dp).clip(CircleShape).background(color.toC()))
                    }
                }
            }
        }
        SectionLabel("Server")
        Text("Janark Android is a thin client of the civic web API. Point this at your running Janark origin.", color = c.muted.toC(), fontSize = 13.sp)
        JanarkField(apiDraft, { apiDraft = it }, "API base URL")
        GhostButton("Save server URL") {
            scope.launch {
                app.session.setApiBase(apiDraft)
                app.network.clearCookies()
                app.session.clearSession()
            }
        }
        GhostButton("About anonymity") { onNavigate(Routes.About) }
        GhostButton("Civic Posting Terms") { onNavigate(Routes.Terms) }
    }
}
