import Foundation

enum Civic {
    static let termsVersion = "2026-07-21.3"
    static let termsTitle = "Janark Civic Posting Terms & Conditions"
    static let sessionCookie = "janark_sid"

    static let issueCategories: [String] = [
        "Education",
        "Employment",
        "Healthcare",
        "Corruption",
        "Judiciary",
        "Women",
        "Agriculture",
        "Environment",
        "Infrastructure",
        "Police",
        "Cybersecurity",
        "Voting Reform",
    ]

    static let reportTypes: [String] = ["problem", "issue", "crime", "other"]

    static let locationLevels: [String] = [
        "village",
        "town",
        "city",
        "block",
        "district",
        "state",
        "national",
        "country",
    ]

    static let noticeTargets: [String] = ["national", "state", "district", "institution"]

    static let flagReasons: [String] = [
        "spam",
        "harassment",
        "misinformation",
        "doxxing",
        "illegal",
        "unrelated",
        "other",
    ]

    /// (value, label)
    static let likertChoices: [(String, String)] = [
        ("strongly_support", "Strongly support"),
        ("support", "Support"),
        ("neutral", "Neutral"),
        ("oppose", "Oppose"),
        ("strongly_oppose", "Strongly oppose"),
    ]

    static let petitionStatuses: [String] = ["open", "gathering", "delivered", "won", "closed"]

    static let petitionCategories: [String] = [
        "Infrastructure",
        "Environment",
        "Transport",
        "Water",
        "Education",
        "Health",
        "Sanitation",
        "Governance",
        "Justice",
        "Other",
    ]

    static let petitionTopicChips: [String] = [
        "roads",
        "environment",
        "transport",
        "water",
        "education",
        "health",
        "sanitation",
        "safety",
    ]

    /// (value, label)
    static let feedTabs: [(String, String)] = [
        ("all", "All"),
        ("petition", "Petitions"),
        ("report", "Reports"),
        ("proposal", "Votes"),
        ("discussion", "Discussions"),
    ]

    /// (value, label)
    static let feedExtraTypes: [(String, String)] = [
        ("share", "Community posts"),
        ("issue", "Issues"),
        ("notice", "Notices"),
        ("meme", "Memes"),
    ]

    /// (value, label)
    static let feedSorts: [(String, String)] = [
        ("trending", "Trending"),
        ("momentum", "Momentum"),
        ("hot", "Hot"),
        ("new", "Newest"),
    ]

    static let discussionKinds: [String] = ["opinion", "evidence", "news"]

    static let voteTypes: [String] = ["likert", "checklist", "preference"]

    /// (value, label)
    static let reportReactions: [(String, String)] = [
        ("support", "Support"),
        ("concerned", "Concerned"),
        ("angry", "Angry"),
        ("sad", "Sad"),
        ("important", "Important"),
    ]
}

// MARK: - Convenience aliases matching Android top-level names

let TERMS_VERSION = Civic.termsVersion
let SESSION_COOKIE = Civic.sessionCookie
let ISSUE_CATEGORIES = Civic.issueCategories
let REPORT_TYPES = Civic.reportTypes
let LOCATION_LEVELS = Civic.locationLevels
let NOTICE_TARGETS = Civic.noticeTargets
let FLAG_REASONS = Civic.flagReasons
let LIKERT_CHOICES = Civic.likertChoices
let PETITION_STATUSES = Civic.petitionStatuses
let PETITION_CATEGORIES = Civic.petitionCategories
let PETITION_TOPIC_CHIPS = Civic.petitionTopicChips
let FEED_TABS = Civic.feedTabs
let FEED_EXTRA_TYPES = Civic.feedExtraTypes
let FEED_SORTS = Civic.feedSorts
let REPORT_REACTIONS = Civic.reportReactions

func formatVoteLabel(_ key: String) -> String {
    if let match = LIKERT_CHOICES.first(where: { $0.0 == key }) {
        return match.1
    }
    return key
        .replacingOccurrences(of: "_", with: " ")
        .split(separator: " ")
        .map { $0.prefix(1).uppercased() + $0.dropFirst() }
        .joined(separator: " ")
}
