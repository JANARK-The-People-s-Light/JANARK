package org.janark.app.core

sealed class Outcome<out T> {
    data class Ok<T>(val value: T) : Outcome<T>()
    data class Err(val message: String, val unauthorized: Boolean = false, val status: Int? = null) :
        Outcome<Nothing>()
}

inline fun <T> Outcome<T>.getOrNull(): T? = (this as? Outcome.Ok)?.value

inline fun <T, R> Outcome<T>.map(transform: (T) -> R): Outcome<R> = when (this) {
    is Outcome.Ok -> Outcome.Ok(transform(value))
    is Outcome.Err -> this
}
