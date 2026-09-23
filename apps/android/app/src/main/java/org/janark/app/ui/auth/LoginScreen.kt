package org.janark.app.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.R
import org.janark.app.core.Outcome
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.AmberButton
import org.janark.app.ui.components.GhostButton
import org.janark.app.ui.components.JanarkField
import org.janark.app.ui.components.Spacer16
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun LoginScreen(
    reason: String = "participate",
    onSuccess: () -> Unit,
    onClose: (() -> Unit)? = null,
) {
    val app = LocalApp.current
    val scope = rememberCoroutineScope()
    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var hint by remember { mutableStateOf<String?>(null) }
    var devCode by remember { mutableStateOf<String?>(null) }
    var sent by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val c = JanarkTheme.colors

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(painterResource(R.drawable.janark_logo), contentDescription = "Janark", modifier = Modifier.size(88.dp))
        Spacer16()
        Text("Janark", fontFamily = FontFamily.Serif, fontSize = 32.sp, fontWeight = FontWeight.SemiBold, color = c.foreground.toC())
        Text("Verify by phone to $reason", color = c.muted.toC(), modifier = Modifier.padding(top = 8.dp, bottom = 8.dp))
        Text(
            "Your number is never shown. You appear as an anonymity ID (jn-xxxxxxxx).",
            color = c.muted.toC(),
            fontSize = 13.sp,
        )
        Spacer16()
        JanarkField(phone, { phone = it.filter { ch -> ch.isDigit() || ch == '+' }.take(15) }, "Mobile number")
        if (sent) {
            Spacer16()
            JanarkField(code, { code = it.filter { ch -> ch.isDigit() }.take(6) }, "6-digit OTP")
            hint?.let { Text("Sent to $it", color = c.muted.toC(), fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp)) }
            devCode?.let { Text("Dev OTP: $it", color = c.amber.toC(), fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp)) }
        }
        error?.let { Text(it, color = c.danger.toC(), modifier = Modifier.padding(top = 8.dp)) }
        Spacer16()
        if (!sent) {
            AmberButton(
                "Send OTP",
                onClick = {
                loading = true
                error = null
                scope.launch {
                    when (val r = app.repository.requestOtp(phone)) {
                        is Outcome.Ok -> {
                            sent = true
                            hint = r.value.hint
                            devCode = r.value.devCode
                        }
                        is Outcome.Err -> error = r.message
                    }
                    loading = false
                }
            },
                enabled = !loading && phone.length >= 10,
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            AmberButton(
                "Verify",
                onClick = {
                loading = true
                error = null
                scope.launch {
                    when (val r = app.repository.verifyOtp(phone, code)) {
                        is Outcome.Ok -> onSuccess()
                        is Outcome.Err -> error = r.message
                    }
                    loading = false
                }
            },
                enabled = !loading && code.length == 6,
                modifier = Modifier.fillMaxWidth(),
            )
            GhostButton("Use a different number", onClick = {
                sent = false
                code = ""
                devCode = null
            }, modifier = Modifier.fillMaxWidth())
        }
        onClose?.let {
            GhostButton("Not now", onClick = it, modifier = Modifier.fillMaxWidth())
        }
    }
}
