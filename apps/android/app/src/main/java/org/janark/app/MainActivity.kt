package org.janark.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import org.janark.app.ui.LocalApp
import org.janark.app.ui.nav.JanarkNav
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.ThemeId
import org.janark.app.ui.theme.toC

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as JanarkApp
        setContent {
            val theme by app.container.session.themeId.collectAsState(initial = ThemeId.BrandDay)
            CompositionLocalProvider(LocalApp provides app.container) {
                JanarkTheme(theme) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = org.janark.app.ui.theme.colorsFor(theme).background.toC(),
                    ) {
                        JanarkNav()
                    }
                }
            }
        }
    }
}
