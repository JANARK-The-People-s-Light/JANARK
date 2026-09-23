import Foundation

/// Map a web href (`/petitions/x`, `/unreleased/vote/y`, …) to an in-app route.
func hrefToRoute(_ href: String?, fallback: String? = nil) -> String? {
    let raw = href?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if raw.isEmpty { return fallback }

    var path = raw
    if path.hasPrefix("http://") || path.hasPrefix("https://") {
        if let url = URL(string: path) {
            path = url.path
        }
    }
    if let q = path.firstIndex(of: "?") {
        path = String(path[..<q])
    }
    if let h = path.firstIndex(of: "#") {
        path = String(path[..<h])
    }
    if path.hasPrefix("/unreleased") {
        path = String(path.dropFirst("/unreleased".count))
        if path.isEmpty { path = "/" }
    }

    let parts = path
        .split(separator: "/")
        .map(String.init)
        .filter { !$0.isEmpty }

    if parts.isEmpty { return Routes.home }

    switch parts[0] {
    case "petitions", "demands":
        return parts.count > 1 ? Routes.petition(parts[1]) : Routes.petitions
    case "reports":
        return parts.count > 1 ? Routes.report(parts[1]) : Routes.reports
    case "issues":
        return parts.count > 1 ? Routes.issue(parts[1]) : Routes.issues
    case "vote":
        return parts.count > 1 ? Routes.vote(parts[1]) : Routes.votes
    case "share":
        return parts.count > 1 ? Routes.share(parts[1]) : Routes.home
    case "notice":
        return parts.count > 1 ? Routes.notice(parts[1]) : Routes.notices
    case "memes", "meme":
        return parts.count > 1 ? Routes.meme(parts[1]) : Routes.memes
    case "p":
        return parts.count > 1 ? Routes.publicPost(parts[1]) : Routes.home
    case "u":
        return parts.count > 1 ? Routes.profile(parts[1]) : Routes.profile
    case "feed":
        return parts.count > 1 ? Routes.discussion(parts[1]) : Routes.discussions
    case "dashboard":
        return Routes.activity
    case "settings":
        return Routes.settings
    case "about":
        return Routes.about
    case "terms":
        return Routes.terms
    case "login":
        return Routes.login
    default:
        return fallback
    }
}

func mediaAbsoluteURL(base: String, url: String?) -> URL? {
    guard let url, !url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
    if url.hasPrefix("http://") || url.hasPrefix("https://") || url.hasPrefix("data:") {
        return URL(string: url)
    }
    var root = base.trimmingCharacters(in: .whitespacesAndNewlines)
    while root.hasSuffix("/") { root = String(root.dropLast()) }
    let absolute = url.hasPrefix("/") ? "\(root)\(url)" : "\(root)/\(url)"
    return URL(string: absolute)
}
