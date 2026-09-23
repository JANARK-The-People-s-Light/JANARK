import Foundation

enum FeedKind: String, Sendable {
    case vote, petition, report, discussion, issue, notice, share, other
}

struct FeedKindMeta: Sendable {
    enum Metric: Sendable {
        case support, participants, momentum
    }

    let kind: FeedKind
    let label: String
    let metric: Metric
}

func resolveFeedKind(
    type: String?,
    title: String? = nil,
    href: String? = nil,
    tags: [String] = []
) -> FeedKindMeta {
    let t = (type ?? "").lowercased()
    let ttl = (title ?? "").lowercased()
    let h = href ?? ""
    let tg = tags.map { $0.lowercased() }

    let isPetition =
        t == "petition" || t == "demand"
        || tg.contains("petition") || tg.contains("demand")
        || ttl.hasPrefix("[demand]") || ttl.hasPrefix("[petition]")
        || h.contains("/petitions/") || h.contains("/demands/")

    if isPetition {
        return FeedKindMeta(kind: .petition, label: "Petition", metric: .support)
    }
    if t == "proposal" || t == "vote" {
        return FeedKindMeta(kind: .vote, label: "Open vote", metric: .participants)
    }
    if t == "report" || h.contains("/reports/")
        || ttl.range(of: #"^\[(issue|crime|problem|other)\]"#, options: .regularExpression) != nil
    {
        return FeedKindMeta(kind: .report, label: "Report", metric: .support)
    }
    if t == "issue" || h.contains("/issues/") {
        return FeedKindMeta(kind: .issue, label: "Issue", metric: .momentum)
    }
    if t == "notice" || h.contains("/notice/") {
        return FeedKindMeta(kind: .notice, label: "Notice", metric: .momentum)
    }
    if t == "share" || h.contains("/share/") || tg.contains("share") {
        return FeedKindMeta(kind: .share, label: "Community Post", metric: .support)
    }
    return FeedKindMeta(kind: .discussion, label: "Discussion", metric: .support)
}

func metricLabel(_ metric: FeedKindMeta.Metric, n: Int) -> (String, String) {
    let value = indianCount(n)
    switch metric {
    case .participants: return (value, "participants")
    case .momentum: return (value, "momentum")
    case .support: return (value, n == 1 ? "support" : "supports")
    }
}

struct EngageTarget: Sendable {
    let targetType: String
    let targetId: String
}

func engageTargetForFeedPost(
    id: String,
    type: String?,
    refId: String?,
    title: String?,
    tags: [String],
    href: String?
) -> EngageTarget {
    let t = (type ?? "").lowercased()
    let ref = refId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let tg = tags.map { $0.lowercased() }
    let titleLower = (title ?? "").lowercased()
    let hrefVal = href ?? ""

    let looksLikeDemand =
        t == "demand"
        || tg.contains("petition") || tg.contains("demand")
        || titleLower.hasPrefix("[petition]") || titleLower.hasPrefix("[demand]")
        || hrefVal.contains("/petitions/") || hrefVal.contains("/demands/")

    if !ref.isEmpty {
        if looksLikeDemand { return EngageTarget(targetType: "demand", targetId: ref) }
        if t == "meme" { return EngageTarget(targetType: "meme", targetId: ref) }
        if t == "report" || hrefVal.contains("/reports/") {
            return EngageTarget(targetType: "report", targetId: ref)
        }
        if t == "notice" { return EngageTarget(targetType: "notice", targetId: ref) }
        if t == "issue" { return EngageTarget(targetType: "issue", targetId: ref) }
        if t == "proposal" || t == "vote" || hrefVal.contains("/vote/") {
            return EngageTarget(targetType: "proposal", targetId: ref)
        }
    }
    return EngageTarget(targetType: "feed", targetId: id)
}

func sharePathForPost(
    publicId: String?,
    href: String?,
    id: String,
    targetType: String,
    refId: String?
) -> String {
    if let publicId, !publicId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        return "/p/\(publicId)"
    }
    let h = href?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if !h.isEmpty && !h.hasPrefix("/feed") { return h }
    if targetType == "report", let refId, !refId.isEmpty { return "/reports/\(refId)" }
    if targetType == "demand", let refId, !refId.isEmpty { return "/petitions/\(refId)" }
    if targetType == "notice", let refId, !refId.isEmpty { return "/notice/\(refId)" }
    if targetType == "issue", let refId, !refId.isEmpty { return "/issues/\(refId)" }
    if targetType == "proposal", let refId, !refId.isEmpty { return "/vote/\(refId)" }
    return "/p/\(id)"
}
