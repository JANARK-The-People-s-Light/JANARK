package org.janark.app.data.net

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.janark.app.core.TERMS_VERSION
import retrofit2.Response

typealias JsonObjectBuilder = kotlinx.serialization.json.JsonObjectBuilder

fun writePayload(extra: JsonObjectBuilder.() -> Unit): JsonObject = buildJsonObject {
    put("acceptedTerms", true)
    put("termsVersion", TERMS_VERSION)
    put("website", "")
    extra()
}

fun JsonObjectBuilder.putIf(key: String, value: String?) {
    if (!value.isNullOrBlank()) put(key, value)
}

fun JsonObjectBuilder.putList(key: String, values: List<String>) {
    put(key, JsonArray(values.map { JsonPrimitive(it) }))
}

fun JsonObjectBuilder.putJson(key: String, value: JsonElement) {
    put(key, value)
}

fun parseError(raw: String?, fallback: String): String {
    if (raw.isNullOrBlank()) return fallback
    return runCatching {
        JanarkJson.decodeFromString(ErrorBody.serializer(), raw).error
            ?: JanarkJson.decodeFromString(ErrorBody.serializer(), raw).message
            ?: fallback
    }.getOrDefault(raw.take(180).ifBlank { fallback })
}

fun <T> Response<T>.toOutcome(
    fallback: String = "Request failed",
): org.janark.app.core.Outcome<T> {
    val body = body()
    if (isSuccessful && body != null) {
        return org.janark.app.core.Outcome.Ok(body)
    }
    val err = errorBody()?.string()
    val message = parseError(err, fallback)
    return org.janark.app.core.Outcome.Err(
        message = message,
        unauthorized = code() == 401,
        status = code(),
    )
}

fun myVoteChoice(el: JsonElement?): Any? {
    if (el == null) return null
    return when (el) {
        is JsonPrimitive -> if (el.isString) el.content else el
        is JsonArray -> el.map { (it as? JsonPrimitive)?.content ?: it.toString() }
        is JsonObject -> el
        else -> el.toString()
    }
}
