package org.janark.app.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import org.janark.app.core.TERMS_TITLE
import org.janark.app.core.TERMS_VERSION
import org.janark.app.ui.LocalApp
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun PostTermsAccept(
    accepted: Boolean,
    onAcceptedChange: (Boolean) -> Unit,
    onOpenTerms: () -> Unit,
) {
    val app = LocalApp.current
    val stored by app.session.acceptedTermsVersion.collectAsState(initial = null)
    val c = JanarkTheme.colors
    Column(Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = accepted, onCheckedChange = { checked ->
                onAcceptedChange(checked)
                if (checked) {
                    // persisted locally; API still requires the flag on each publish
                }
            })
            Text(
                "I agree to the $TERMS_TITLE (v$TERMS_VERSION). Janark is not responsible for what I publish.",
                color = c.foreground.toC(),
                fontSize = 13.sp,
                modifier = Modifier.weight(1f),
            )
        }
        TextLink("Read Civic Posting Terms", onOpenTerms)
        if (stored != null && stored != TERMS_VERSION) {
            Text("Terms were updated — please review and accept again.", color = c.danger.toC(), fontSize = 12.sp)
        }
    }
}
