import Foundation

enum Routes {
    static let home = "home"
    static let petitions = "petitions"
    static let reports = "reports"
    static let issues = "issues"
    static let votes = "votes"
    static let discussions = "discussions"
    static let memes = "memes"
    static let notices = "notices"
    static let profile = "profile"
    static let activity = "activity"
    static let settings = "settings"
    static let about = "about"
    static let terms = "terms"
    static let login = "login"

    static func petition(_ id: String) -> String { "petition/\(id)" }
    static func report(_ id: String) -> String { "report/\(id)" }
    static func issue(_ slug: String) -> String { "issue/\(slug)" }
    static func vote(_ id: String) -> String { "vote/\(id)" }
    static func discussion(_ id: String) -> String { "discussion/\(id)" }
    static func share(_ id: String) -> String { "share/\(id)" }
    static func notice(_ id: String) -> String { "notice/\(id)" }
    static func meme(_ id: String) -> String { "meme/\(id)" }
    static func publicPost(_ id: String) -> String { "p/\(id)" }
    static func profile(_ anonId: String) -> String { "u/\(anonId)" }
    static func create(_ kind: String) -> String { "create/\(kind)" }
    static func followList(_ anonId: String, _ list: String) -> String { "follow/\(anonId)/\(list)" }
}

enum CreateKind: String, CaseIterable, Identifiable {
    case share
    case report
    case issue
    case petition
    case vote
    case discussion
    case notice
    case meme

    var id: String { rawValue }
    var path: String { rawValue }

    var title: String {
        switch self {
        case .share: return "Share"
        case .report: return "Report"
        case .issue: return "Issue"
        case .petition: return "Petition"
        case .vote: return "Vote"
        case .discussion: return "Discussion"
        case .notice: return "Notice"
        case .meme: return "Meme"
        }
    }

    var prompt: String {
        switch self {
        case .share: return "Share something with your community"
        case .report: return "What happened?"
        case .issue: return "What’s the issue?"
        case .petition: return "What should change?"
        case .vote: return "What question should people vote on?"
        case .discussion: return "What would you like to discuss?"
        case .notice: return "What should people know?"
        case .meme: return "Share a civic meme"
        }
    }

    static func from(_ path: String) -> CreateKind {
        CreateKind(rawValue: path) ?? .discussion
    }
}

/// Typed destinations for `NavigationStack`.
enum AppRoute: Hashable {
    case home
    case petitions
    case reports
    case issues
    case votes
    case discussions
    case memes
    case notices
    case profile
    case activity
    case settings
    case about
    case terms
    case login
    case petition(String)
    case report(String)
    case issue(String)
    case vote(String)
    case discussion(String)
    case share(String)
    case notice(String)
    case meme(String)
    case publicPost(String)
    case profileUser(String)
    case create(String)
    case followList(anonId: String, list: String)

    static func from(path: String) -> AppRoute? {
        if path == Routes.home || path.hasPrefix("home?") { return .home }
        if path == Routes.petitions { return .petitions }
        if path == Routes.reports { return .reports }
        if path == Routes.issues { return .issues }
        if path == Routes.votes { return .votes }
        if path == Routes.discussions { return .discussions }
        if path == Routes.memes { return .memes }
        if path == Routes.notices { return .notices }
        if path == Routes.profile { return .profile }
        if path == Routes.activity { return .activity }
        if path == Routes.settings { return .settings }
        if path == Routes.about { return .about }
        if path == Routes.terms { return .terms }
        if path == Routes.login { return .login }

        let parts = path.split(separator: "/").map(String.init)
        guard let head = parts.first else { return nil }
        switch head {
        case "petition" where parts.count >= 2: return .petition(parts[1])
        case "report" where parts.count >= 2: return .report(parts[1])
        case "issue" where parts.count >= 2: return .issue(parts[1])
        case "vote" where parts.count >= 2: return .vote(parts[1])
        case "discussion" where parts.count >= 2: return .discussion(parts[1])
        case "share" where parts.count >= 2: return .share(parts[1])
        case "notice" where parts.count >= 2: return .notice(parts[1])
        case "meme" where parts.count >= 2: return .meme(parts[1])
        case "p" where parts.count >= 2: return .publicPost(parts[1])
        case "u" where parts.count >= 2: return .profileUser(parts[1])
        case "create" where parts.count >= 2: return .create(parts[1])
        case "follow" where parts.count >= 3: return .followList(anonId: parts[1], list: parts[2])
        default: return nil
        }
    }

    var pathString: String {
        switch self {
        case .home: return Routes.home
        case .petitions: return Routes.petitions
        case .reports: return Routes.reports
        case .issues: return Routes.issues
        case .votes: return Routes.votes
        case .discussions: return Routes.discussions
        case .memes: return Routes.memes
        case .notices: return Routes.notices
        case .profile: return Routes.profile
        case .activity: return Routes.activity
        case .settings: return Routes.settings
        case .about: return Routes.about
        case .terms: return Routes.terms
        case .login: return Routes.login
        case .petition(let id): return Routes.petition(id)
        case .report(let id): return Routes.report(id)
        case .issue(let slug): return Routes.issue(slug)
        case .vote(let id): return Routes.vote(id)
        case .discussion(let id): return Routes.discussion(id)
        case .share(let id): return Routes.share(id)
        case .notice(let id): return Routes.notice(id)
        case .meme(let id): return Routes.meme(id)
        case .publicPost(let id): return Routes.publicPost(id)
        case .profileUser(let id): return Routes.profile(id)
        case .create(let kind): return Routes.create(kind)
        case .followList(let anonId, let list): return Routes.followList(anonId, list)
        }
    }

    var isCompose: Bool {
        if case .create = self { return true }
        return false
    }

    var tabRoot: String? {
        switch self {
        case .home: return Routes.home
        case .petitions: return Routes.petitions
        case .profile, .profileUser: return Routes.profile
        case .activity: return Routes.activity
        default: return nil
        }
    }
}
