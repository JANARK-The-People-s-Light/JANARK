package org.janark.app.ui.about

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun AboutScreen() {
    val c = JanarkTheme.colors
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("About Janark", fontFamily = FontFamily.Serif, fontSize = 28.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
        Text(
            "India's first open source social platform.",
            color = c.foreground.toC(),
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
        )
        Text(
            "Independent civic discussion, petitions, reports, and community voting — built in the open.",
            color = c.muted.toC(),
        )
        Text(
            "Public launch 26 January 2027. Until then, use this app against a running Janark server for preview.",
            color = c.muted.toC(),
        )
        Text("Read freely. Participate when you choose. Every report, petition, discussion, vote, and contribution shapes what Janark becomes.", color = c.muted.toC())
        SectionLabel("Participate your way")
        Text("· Browse freely without signing in.", color = c.muted.toC())
        Text("· Verify once by phone when you choose to post, support, vote, or comment.", color = c.muted.toC())
        Text("· Stay anonymous with a public Janark ID — your phone number is never shown.", color = c.muted.toC())
        Text("· Support ideas, not personalities.", color = c.muted.toC())
        SectionLabel("What matters")
        Text("· India's first open source social platform.", color = c.muted.toC())
        Text("· Independent of governments and political parties.", color = c.muted.toC())
        Text("· Community supported and open source.", color = c.muted.toC())
        Text("· Public opinion, not official elections.", color = c.muted.toC())
        Text("· Transparent moderation and vote integrity.", color = c.muted.toC())
        SectionLabel("Contribute")
        Text("Janark is built in the open. The JANARK name and logo are reserved; commercial use and public hosting need written permission.", color = c.muted.toC())
        Text("github.com/JANARK-The-People-s-Light", color = c.amber.toC())
    }
}
