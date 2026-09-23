package org.janark.app.data.session

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.janark.app.BuildConfig
import org.janark.app.ui.theme.ThemeId
import java.util.UUID

private val Context.dataStore by preferencesDataStore("janark_prefs")

data class UiSession(
    val authenticated: Boolean = false,
    val anonId: String? = null,
    val hint: String? = null,
)

class SessionStore(private val context: Context) {
    private object Keys {
        val apiBase = stringPreferencesKey("api_base_url")
        val theme = stringPreferencesKey("theme_id")
        val anonId = stringPreferencesKey("anon_id")
        val hint = stringPreferencesKey("phone_hint")
        val authenticated = booleanPreferencesKey("authenticated")
        val termsVersion = stringPreferencesKey("accepted_terms_version")
        val visitorId = stringPreferencesKey("visitor_id")
    }

    val apiBaseUrl: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[Keys.apiBase]?.trim()?.trimEnd('/')
            ?.takeIf { it.isNotBlank() }
            ?: BuildConfig.DEFAULT_API_BASE_URL.trimEnd('/')
    }

    val themeId: Flow<ThemeId> = context.dataStore.data.map { prefs ->
        ThemeId.from(prefs[Keys.theme])
    }

    val uiSession: Flow<UiSession> = context.dataStore.data.map { prefs ->
        UiSession(
            authenticated = prefs[Keys.authenticated] == true,
            anonId = prefs[Keys.anonId],
            hint = prefs[Keys.hint],
        )
    }

    val acceptedTermsVersion: Flow<String?> = context.dataStore.data.map { it[Keys.termsVersion] }

    suspend fun currentApiBase(): String = apiBaseUrl.first()

    suspend fun setApiBase(url: String) {
        val cleaned = url.trim().trimEnd('/')
        context.dataStore.edit { it[Keys.apiBase] = cleaned }
    }

    suspend fun setTheme(id: ThemeId) {
        context.dataStore.edit { it[Keys.theme] = id.id }
    }

    suspend fun setSession(anonId: String?, hint: String?, authenticated: Boolean) {
        context.dataStore.edit {
            if (anonId != null) it[Keys.anonId] = anonId else it.remove(Keys.anonId)
            if (hint != null) it[Keys.hint] = hint else it.remove(Keys.hint)
            it[Keys.authenticated] = authenticated
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit {
            it.remove(Keys.anonId)
            it.remove(Keys.hint)
            it[Keys.authenticated] = false
        }
    }

    suspend fun acceptTerms(version: String) {
        context.dataStore.edit { it[Keys.termsVersion] = version }
    }

    suspend fun visitorId(): String {
        val existing = context.dataStore.data.first()[Keys.visitorId]
        if (!existing.isNullOrBlank()) return existing
        val id = "vis_${UUID.randomUUID().toString().replace("-", "").take(24)}"
        context.dataStore.edit { it[Keys.visitorId] = id }
        return id
    }
}
