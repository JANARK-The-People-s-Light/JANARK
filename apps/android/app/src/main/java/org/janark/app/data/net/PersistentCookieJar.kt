package org.janark.app.data.net

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("janark_cookies", Context.MODE_PRIVATE)

    @Synchronized
    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val key = hostKey(url)
        val existing = load(url).associateBy { it.name }.toMutableMap()
        for (c in cookies) {
            if (c.expiresAt < System.currentTimeMillis() || c.value.isEmpty()) {
                existing.remove(c.name)
            } else {
                existing[c.name] = c
            }
        }
        persist(key, existing.values.toList())
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        val valid = load(url).filter { it.expiresAt > now && it.matches(url) }
        persist(hostKey(url), valid)
        return valid
    }

    @Synchronized
    fun clear() {
        prefs.edit().clear().apply()
    }

    private fun hostKey(url: HttpUrl) = url.host

    private fun persist(host: String, cookies: List<Cookie>) {
        val encoded = cookies.joinToString("\n") { it.toString() }
        prefs.edit().putString(host, encoded).apply()
    }

    private fun load(url: HttpUrl): List<Cookie> {
        val raw = prefs.getString(hostKey(url), null) ?: return emptyList()
        return raw.lineSequence()
            .filter { it.isNotBlank() }
            .mapNotNull { Cookie.parse(url, it) }
            .toList()
    }
}
