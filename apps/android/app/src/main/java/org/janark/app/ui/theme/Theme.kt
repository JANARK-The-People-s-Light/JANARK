package org.janark.app.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val LocalJanarkColors = staticCompositionLocalOf { colorsFor(ThemeId.BrandDay) }
val LocalThemeId = staticCompositionLocalOf { ThemeId.BrandDay }

fun Long.toC() = Color(this)

@Composable
fun JanarkTheme(theme: ThemeId, content: @Composable () -> Unit) {
    val tokens = colorsFor(theme)
    val scheme: ColorScheme = if (theme.dark) {
        darkColorScheme(
            primary = tokens.amber.toC(),
            onPrimary = tokens.chrome.toC(),
            secondary = tokens.amberBright.toC(),
            background = tokens.background.toC(),
            onBackground = tokens.foreground.toC(),
            surface = tokens.surface.toC(),
            onSurface = tokens.foreground.toC(),
            surfaceVariant = tokens.cream.toC(),
            outline = tokens.line.toC(),
            error = tokens.danger.toC(),
        )
    } else {
        lightColorScheme(
            primary = tokens.amber.toC(),
            onPrimary = Color.White,
            secondary = tokens.navy.toC(),
            background = tokens.background.toC(),
            onBackground = tokens.foreground.toC(),
            surface = tokens.surface.toC(),
            onSurface = tokens.foreground.toC(),
            surfaceVariant = tokens.cream.toC(),
            outline = tokens.line.toC(),
            error = tokens.danger.toC(),
        )
    }
    val typography = Typography(
        displayLarge = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 34.sp,
            lineHeight = 40.sp,
            color = tokens.foreground.toC(),
        ),
        headlineMedium = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 24.sp,
            lineHeight = 30.sp,
        ),
        headlineSmall = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 20.sp,
            lineHeight = 26.sp,
        ),
        titleLarge = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 20.sp,
        ),
        titleMedium = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 16.sp,
        ),
        bodyLarge = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontSize = 16.sp,
            lineHeight = 24.sp,
        ),
        bodyMedium = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontSize = 14.sp,
            lineHeight = 20.sp,
        ),
        labelLarge = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium,
            fontSize = 14.sp,
        ),
        labelSmall = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium,
            fontSize = 11.sp,
            letterSpacing = 0.8.sp,
        ),
    )
    CompositionLocalProvider(
        LocalJanarkColors provides tokens,
        LocalThemeId provides theme,
    ) {
        MaterialTheme(colorScheme = scheme, typography = typography, content = content)
    }
}

object JanarkTheme {
    val colors: JanarkColors
        @Composable get() = LocalJanarkColors.current
}
