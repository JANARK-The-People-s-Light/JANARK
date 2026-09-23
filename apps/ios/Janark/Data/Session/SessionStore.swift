import Foundation
import Combine

struct UiSession: Equatable, Sendable {
    var authenticated: Bool = false
    var anonId: String? = nil
    var hint: String? = nil
}

@MainActor
final class SessionStore: ObservableObject {
    private let defaults: UserDefaults
    private enum Keys {
        static let apiBase = "api_base_url"
        static let theme = "theme_id"
        static let anonId = "anon_id"
        static let hint = "phone_hint"
        static let authenticated = "authenticated"
        static let termsVersion = "accepted_terms_version"
        static let visitorId = "visitor_id"
    }

    static let defaultAPIBaseURL = "http://127.0.0.1:3000"

    @Published var apiBaseURL: String
    @Published var themeId: ThemeId
    @Published var uiSession: UiSession
    @Published var acceptedTermsVersion: String?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let storedBase = defaults.string(forKey: Keys.apiBase)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        var base = (storedBase?.isEmpty == false) ? storedBase! : Self.defaultAPIBaseURL
        while base.hasSuffix("/") { base = String(base.dropLast()) }
        self.apiBaseURL = base
        self.themeId = ThemeId.from(defaults.string(forKey: Keys.theme))
        self.uiSession = UiSession(
            authenticated: defaults.bool(forKey: Keys.authenticated),
            anonId: defaults.string(forKey: Keys.anonId),
            hint: defaults.string(forKey: Keys.hint)
        )
        self.acceptedTermsVersion = defaults.string(forKey: Keys.termsVersion)
    }

    func currentApiBase() -> String {
        var cleaned = apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        while cleaned.hasSuffix("/") { cleaned = String(cleaned.dropLast()) }
        return cleaned
    }

    func setApiBase(_ url: String) {
        var cleaned = url.trimmingCharacters(in: .whitespacesAndNewlines)
        while cleaned.hasSuffix("/") { cleaned = String(cleaned.dropLast()) }
        defaults.set(cleaned, forKey: Keys.apiBase)
        apiBaseURL = cleaned
    }

    func setTheme(_ id: ThemeId) {
        defaults.set(id.rawValue, forKey: Keys.theme)
        themeId = id
    }

    func setSession(anonId: String?, hint: String?, authenticated: Bool) {
        if let anonId { defaults.set(anonId, forKey: Keys.anonId) }
        else { defaults.removeObject(forKey: Keys.anonId) }
        if let hint { defaults.set(hint, forKey: Keys.hint) }
        else { defaults.removeObject(forKey: Keys.hint) }
        defaults.set(authenticated, forKey: Keys.authenticated)
        uiSession = UiSession(authenticated: authenticated, anonId: anonId, hint: hint)
    }

    func clearSession() {
        defaults.removeObject(forKey: Keys.anonId)
        defaults.removeObject(forKey: Keys.hint)
        defaults.set(false, forKey: Keys.authenticated)
        uiSession = UiSession()
    }

    func acceptTerms(_ version: String) {
        defaults.set(version, forKey: Keys.termsVersion)
        acceptedTermsVersion = version
    }

    @discardableResult
    func visitorId() -> String {
        if let existing = defaults.string(forKey: Keys.visitorId), !existing.isEmpty {
            return existing
        }
        let uuid = UUID().uuidString.replacingOccurrences(of: "-", with: "")
        let id = "vis_" + String(uuid.prefix(24))
        defaults.set(id, forKey: Keys.visitorId)
        return id
    }
}
