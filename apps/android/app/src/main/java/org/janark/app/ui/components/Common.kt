package org.janark.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

@Composable
fun LoadingBox() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = JanarkTheme.colors.amber.toC())
    }
}

@Composable
fun EmptyState(title: String, body: String? = null, action: String? = null, onAction: (() -> Unit)? = null) {
    val c = JanarkTheme.colors
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, color = c.foreground.toC(), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        if (!body.isNullOrBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(body, color = c.muted.toC(), textAlign = TextAlign.Center)
        }
        if (action != null && onAction != null) {
            Spacer(Modifier.height(16.dp))
            AmberButton(action, onAction)
        }
    }
}

@Composable
fun ErrorState(message: String, onRetry: (() -> Unit)? = null) {
    EmptyState("Couldn’t load this", message, if (onRetry != null) "Try again" else null, onRetry)
}

@Composable
fun AmberButton(text: String, onClick: () -> Unit, enabled: Boolean = true, modifier: Modifier = Modifier) {
    val c = JanarkTheme.colors
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = c.amber.toC(),
            contentColor = c.chrome.toC(),
            disabledContainerColor = c.line.toC(),
        ),
        shape = RoundedCornerShape(10.dp),
    ) { Text(text, fontWeight = FontWeight.SemiBold) }
}

@Composable
fun GhostButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val c = JanarkTheme.colors
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = c.foreground.toC()),
    ) { Text(text) }
}

@Composable
fun KindPill(label: String, color: Long) {
    Text(
        text = label.uppercase(),
        color = color.toC(),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.6.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.toC().copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
    )
}

@Composable
fun ChoiceChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val c = JanarkTheme.colors
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = c.amber.toC().copy(alpha = 0.2f),
            selectedLabelColor = c.foreground.toC(),
            labelColor = c.muted.toC(),
            containerColor = c.surface.toC(),
        ),
    )
}

@Composable
fun JanarkField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true,
    minLines: Int = 1,
    placeholder: String? = null,
) {
    val c = JanarkTheme.colors
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        minLines = minLines,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = c.amber.toC(),
            unfocusedBorderColor = c.line.toC(),
            focusedLabelColor = c.amber.toC(),
            cursorColor = c.amber.toC(),
            focusedTextColor = c.foreground.toC(),
            unfocusedTextColor = c.foreground.toC(),
        ),
        shape = RoundedCornerShape(12.dp),
    )
}

@Composable
fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        color = JanarkTheme.colors.muted.toC(),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 1.sp,
        modifier = Modifier.padding(vertical = 8.dp),
    )
}

@Composable
fun TextLink(text: String, onClick: () -> Unit) {
    TextButton(onClick) {
        Text(text, color = JanarkTheme.colors.amber.toC())
    }
}

@Composable
fun SurfaceCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable () -> Unit) {
    val c = JanarkTheme.colors
    val shape = RoundedCornerShape(14.dp)
    Box(
        modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.surface.toC())
            .border(1.dp, c.line.toC(), shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(16.dp),
    ) { content() }
}

@Composable
fun AccentBar(color: Long) {
    Box(
        Modifier
            .width(4.dp)
            .height(48.dp)
            .clip(RoundedCornerShape(2.dp))
            .background(color.toC()),
    )
}

@Composable
fun Spacer8() = Spacer(Modifier.height(8.dp))
@Composable
fun Spacer16() = Spacer(Modifier.height(16.dp))
