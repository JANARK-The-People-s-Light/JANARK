package org.janark.app.data.net

import android.content.Context
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import org.janark.app.BuildConfig
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

val JanarkJson = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
    isLenient = true
    encodeDefaults = true
    explicitNulls = false
}

class NetworkModule(
    context: Context,
    private val cookieJar: PersistentCookieJar,
) {
    private var retrofit: Retrofit? = null
    private var currentBase: String? = null
    var api: JanarkApi = build(BuildConfig.DEFAULT_API_BASE_URL)
        private set

    @Synchronized
    fun rebuild(baseUrl: String): JanarkApi {
        val normalized = normalizeBase(baseUrl)
        if (normalized == currentBase && retrofit != null) return api
        api = build(normalized)
        return api
    }

    fun clearCookies() = cookieJar.clear()

    private fun build(baseUrl: String): JanarkApi {
        val origin = normalizeBase(baseUrl)
        currentBase = origin
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
            else HttpLoggingInterceptor.Level.NONE
        }
        val originInterceptor = Interceptor { chain ->
            // Emulator reaches the host via 10.0.2.2 but the server allowlists localhost.
            val headerOrigin = canonicalOriginForHeaders(origin)
            val req = chain.request().newBuilder()
                .header("Origin", headerOrigin)
                .header("Referer", "$headerOrigin/")
                .header("Accept", "application/json")
                .header("User-Agent", "Janark-Android/${BuildConfig.VERSION_NAME}")
                .build()
            chain.proceed(req)
        }
        val client = OkHttpClient.Builder()
            .cookieJar(cookieJar)
            .addInterceptor(originInterceptor)
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
        val contentType = "application/json".toMediaType()
        retrofit = Retrofit.Builder()
            .baseUrl(ensureSlash(origin))
            .client(client)
            .addConverterFactory(JanarkJson.asConverterFactory(contentType))
            .build()
        api = retrofit!!.create(JanarkApi::class.java)
        return api
    }

    companion object {
        fun normalizeBase(url: String): String = url.trim().trimEnd('/')
        fun ensureSlash(url: String): String = if (url.endsWith("/")) url else "$url/"
        fun isValidBase(url: String): Boolean = runCatching { url.toHttpUrl() }.isSuccess

        /** Map emulator host loopback aliases to localhost for Origin checks. */
        fun canonicalOriginForHeaders(baseUrl: String): String {
            val normalized = normalizeBase(baseUrl)
            return runCatching {
                val u = normalized.toHttpUrl()
                val host = when (u.host) {
                    "10.0.2.2", "10.0.3.2" -> "localhost"
                    else -> u.host
                }
                val portPart =
                    if (u.port != -1 && u.port != u.scheme.defaultPort()) ":${u.port}" else ""
                "${u.scheme}://$host$portPart"
            }.getOrDefault(normalized)
        }

        private fun String.defaultPort(): Int = when (this) {
            "https" -> 443
            "http" -> 80
            else -> -1
        }
    }
}
