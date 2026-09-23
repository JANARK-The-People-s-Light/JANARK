package org.janark.app.ui.terms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import org.janark.app.core.TERMS_TITLE
import org.janark.app.core.TERMS_VERSION
import org.janark.app.domain.CIVIC_POST_TERMS_FAQS
import org.janark.app.domain.CIVIC_POST_TERMS_SECTIONS
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun TermsScreen() {
    val app = LocalApp.current
    val scope = rememberCoroutineScope()
    var acceptedNote by remember { mutableStateOf<String?>(null) }
    val c = JanarkTheme.colors
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text(TERMS_TITLE, fontFamily = FontFamily.Serif, fontSize = 26.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
        Text("Version $TERMS_VERSION", color = c.muted.toC(), fontFamily = FontFamily.Monospace, fontSize = 12.sp)
        CIVIC_POST_TERMS_SECTIONS.forEach { section ->
            Text(section.heading, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
            section.paragraphs.forEach { Text(it, color = c.muted.toC()) }
            section.bullets.forEach { Text("· $it", color = c.foreground.toC()) }
        }
        SectionLabel("Plain-language FAQs")
        CIVIC_POST_TERMS_FAQS.forEach { faq ->
            Text(faq.question, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold)
            faq.answer.forEach { Text(it, color = c.muted.toC()) }
        }
        AmberButton("I have read these terms", onClick = {
            scope.launch {
                app.repository.acceptTerms()
                acceptedNote = "Saved on this device. You still confirm acceptance each time you publish."
            }
        })
        acceptedNote?.let { Text(it, color = c.success.toC()) }
    }
}
