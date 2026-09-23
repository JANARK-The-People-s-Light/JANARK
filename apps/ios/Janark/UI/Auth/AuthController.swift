import Foundation
import Combine

struct AuthPrompt {
    let reason: String
    let onSuccess: () -> Void
}

@MainActor
final class AuthController: ObservableObject {
    @Published private(set) var prompt: AuthPrompt?

    func require(_ reason: String, onSuccess: @escaping () -> Void = {}) {
        prompt = AuthPrompt(reason: reason, onSuccess: onSuccess)
    }

    func dismiss() {
        prompt = nil
    }

    func consumeSuccess() {
        let p = prompt
        prompt = nil
        p?.onSuccess()
    }
}
