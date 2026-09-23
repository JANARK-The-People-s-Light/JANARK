package org.janark.app.ui.auth

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class AuthPrompt(
    val reason: String,
    val onSuccess: () -> Unit,
)

class AuthController {
    private val _prompt = MutableStateFlow<AuthPrompt?>(null)
    val prompt: StateFlow<AuthPrompt?> = _prompt.asStateFlow()

    fun require(reason: String, onSuccess: () -> Unit = {}) {
        _prompt.value = AuthPrompt(reason, onSuccess)
    }

    fun dismiss() {
        _prompt.value = null
    }

    fun consumeSuccess() {
        val p = _prompt.value
        _prompt.value = null
        p?.onSuccess?.invoke()
    }
}
