package org.janark.app.ui

import androidx.compose.runtime.staticCompositionLocalOf
import org.janark.app.AppContainer

val LocalApp = staticCompositionLocalOf<AppContainer> {
    error("AppContainer not provided")
}
