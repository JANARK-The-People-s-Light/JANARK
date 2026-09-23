import SwiftUI

struct PetitionDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: DemandDetailResponse?
    @State private var error: String?
    @State private var loading = true
    @State private var name = ""
    @State private var pin = ""
    @State private var phone = ""
    @State private var signMsg: String?

    var body: some View {
        Group {
            if loading && data?.demand == nil {
                LoadingView()
            } else if let error, data?.demand == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let d = data?.demand {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: d.status ?? "open", color: c.success)
                        Text(d.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        if let publicId = d.publicId {
                            Text(publicId)
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(c.muted)
                        }
                        Text("Ask: \(d.ask)").foregroundStyle(c.foreground)
                        Text(d.body).foregroundStyle(c.muted)
                        CivicMedia(url: d.mediaUrl, mediaType: d.mediaType)
                        Text("Who should act: \(d.targetDetail ?? d.target ?? "")").foregroundStyle(c.foreground)
                        Text(d.locationLabel ?? "").font(.subheadline).foregroundStyle(c.muted)
                        if let author = d.authorAnonId {
                            Text(author).foregroundStyle(c.amber)
                        }
                        Text("\(indianCount(d.supportCount)) signatures · \(relativeTime(d.createdAt) ?? "")")
                            .foregroundStyle(c.muted)
                        EngageBar(targetType: "demand", targetId: d.id, sharePath: "/petitions/\(d.id)", shareTitle: d.title, compact: false, showComments: true)
                        if data?.supportedByMe == true {
                            Text("You signed this petition.").foregroundStyle(c.success)
                        } else {
                            SectionLabel("Sign this petition")
                            Text("Uses your verified phone. Name and PIN prove geographic relevance — they are not shown publicly.")
                                .font(.footnote)
                                .foregroundStyle(c.muted)
                            JanarkField(text: $name, label: "Full name")
                            JanarkField(text: $pin, label: "PIN / postal code")
                            JanarkField(text: $phone, label: "Phone (must match OTP number)")
                            if let signMsg { Text(signMsg).foregroundStyle(c.danger) }
                            AmberButton("Sign petition") {
                                gated("sign this petition") { Task { await sign() } }
                            }
                        }
                        if data?.isMine == true {
                            GhostButton("Delete my petition") {
                                Task {
                                    _ = await app.repository.deleteDemand(id: id)
                                    onNavigate(Routes.petitions)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Petition not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadDemand(id: id) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }

    private func gated(_ reason: String, _ block: @escaping () -> Void) {
        if app.session.uiSession.authenticated { block() }
        else { app.auth.require(reason, onSuccess: block) }
    }

    private func sign() async {
        switch await app.repository.signDemand(id: id, fullName: name, postalCode: pin, phone: phone) {
        case .ok(let value):
            signMsg = value.error
            if value.ok { await load() }
        case .err(let message, let unauthorized, _):
            if unauthorized { app.auth.require("sign this petition") {} }
            else { signMsg = message }
        }
    }
}

struct ReportDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: ReportDetailResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data?.report == nil {
                LoadingView()
            } else if let error, data?.report == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let r = data?.report {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: r.type ?? "report", color: c.danger)
                        Text(r.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(r.body).foregroundStyle(c.muted)
                        CivicMedia(url: r.mediaUrl, mediaType: r.mediaType)
                        Text(r.locationLabel ?? "").foregroundStyle(c.muted)
                        if let author = r.authorAnonId { Text(author).foregroundStyle(c.amber) }
                        SectionLabel("How this feels")
                        HStack(spacing: 8) {
                            ForEach(REPORT_REACTIONS, id: \.0) { item in
                                let n = r.reactionCounts[item.0] ?? 0
                                ChoiceChip(label: "\(item.1)\(n > 0 ? " \(n)" : "")", selected: false) {
                                    gated("react") {
                                        Task {
                                            _ = await app.repository.reactReport(id: id, reaction: item.0)
                                            await load()
                                        }
                                    }
                                }
                            }
                        }
                        EngageBar(targetType: "report", targetId: r.id, sharePath: "/reports/\(r.id)", shareTitle: r.title, compact: false, showComments: true)
                        if data?.isMine == true {
                            GhostButton("Delete my report") {
                                Task {
                                    _ = await app.repository.deleteReport(id: id)
                                    onNavigate(Routes.reports)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Report not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadReport(id: id) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }

    private func gated(_ reason: String, _ block: @escaping () -> Void) {
        if app.session.uiSession.authenticated { block() }
        else { app.auth.require(reason, onSuccess: block) }
    }
}

struct IssueDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let slug: String
    let onNavigate: (String) -> Void

    @State private var data: IssueDetailResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data?.issue == nil {
                LoadingView()
            } else if let error, data?.issue == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let issue = data?.issue {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: issue.category ?? "Issue", color: c.amber)
                        Text(issue.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        CivicMedia(url: issue.mediaUrl, mediaType: issue.mediaType)
                        Text(issue.summary).foregroundStyle(c.foreground)
                        SectionLabel("Why it matters")
                        Text(issue.whyItMatters).foregroundStyle(c.muted)
                        SectionLabel("Current situation")
                        Text(issue.currentSituation).foregroundStyle(c.muted)
                        if !issue.pros.isEmpty {
                            SectionLabel("Pros")
                            ForEach(issue.pros, id: \.self) { Text("· \($0)").foregroundStyle(c.foreground) }
                        }
                        if !issue.cons.isEmpty {
                            SectionLabel("Cons")
                            ForEach(issue.cons, id: \.self) { Text("· \($0)").foregroundStyle(c.foreground) }
                        }
                        EngageBar(targetType: "issue", targetId: issue.slug, sharePath: "/issues/\(issue.slug)", shareTitle: issue.title, compact: false, showComments: true)
                        if let proposals = data?.proposals, !proposals.isEmpty {
                            SectionLabel("Related votes")
                            ForEach(proposals, id: \.id) { p in
                                SurfaceCard(onTap: { onNavigate(Routes.vote(p.id)) }) {
                                    Text(p.title).font(.headline).foregroundStyle(c.foreground)
                                }
                            }
                        }
                        if let related = data?.related, !related.isEmpty {
                            SectionLabel("Related issues")
                            ForEach(related, id: \.slug) { item in
                                SurfaceCard(onTap: { onNavigate(Routes.issue(item.slug)) }) {
                                    Text(item.title).font(.headline).foregroundStyle(c.foreground)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Issue not found")
            }
        }
        .task(id: slug) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadIssue(slug: slug) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }
}

struct VoteDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var proposal: ProposalDto?
    @State private var error: String?
    @State private var loading = true
    @State private var likert: String?
    @State private var checks: Set<String> = []
    @State private var pref: [String] = []
    @State private var submitted = false

    private var canSubmit: Bool {
        guard let p = proposal else { return false }
        switch p.voteType ?? "likert" {
        case "checklist": return !checks.isEmpty
        case "preference": return !pref.isEmpty
        default: return likert != nil
        }
    }

    var body: some View {
        Group {
            if loading && proposal == nil {
                LoadingView()
            } else if let error, proposal == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let p = proposal {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: "Non-binding \(p.voteType ?? "likert") vote", color: c.fact)
                        Text(p.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(p.description).foregroundStyle(c.muted)
                        CivicMedia(url: p.mediaUrl, mediaType: p.mediaType)
                        if !p.benefits.isEmpty {
                            SectionLabel("Benefits")
                            ForEach(p.benefits, id: \.self) { Text("· \($0)").foregroundStyle(c.foreground) }
                        }
                        if !p.argumentsFor.isEmpty {
                            SectionLabel("Arguments for")
                            ForEach(p.argumentsFor, id: \.self) { Text("· \($0)").foregroundStyle(c.success) }
                        }
                        if !p.argumentsAgainst.isEmpty {
                            SectionLabel("Arguments against")
                            ForEach(p.argumentsAgainst, id: \.self) { Text("· \($0)").foregroundStyle(c.danger) }
                        }
                        SectionLabel(submitted ? "Your ballot" : "Cast your vote")
                        ballot(for: p)
                        if let results = p.results {
                            ForEach(results.sorted(by: { $0.value > $1.value }), id: \.key) { entry in
                                Text("\(formatVoteLabel(entry.key))  \(Int(entry.value))%")
                                    .font(.caption)
                                    .foregroundStyle(c.muted)
                                ProgressView(value: min(max(entry.value / 100, 0), 1))
                                    .tint(c.amber)
                            }
                        }
                        Text("\(indianCount(p.liveVotes ?? p.totalVotes)) participants")
                            .foregroundStyle(c.muted)
                        AmberButton("Submit vote", enabled: canSubmit) {
                            gated("vote") { Task { await cast(p) } }
                        }
                        EngageBar(targetType: "proposal", targetId: p.id, sharePath: "/vote/\(p.id)", shareTitle: p.title, compact: false, showComments: true)
                        if let slug = p.issueSlug {
                            GhostButton("Open related issue") { onNavigate(Routes.issue(slug)) }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Vote not found")
            }
        }
        .task(id: id) { await load() }
    }

    @ViewBuilder
    private func ballot(for p: ProposalDto) -> some View {
        switch p.voteType ?? "likert" {
        case "checklist":
            ForEach(p.options ?? [], id: \.self) { o in
                ChoiceChip(label: o, selected: checks.contains(o)) {
                    if checks.contains(o) { checks.remove(o) } else { checks.insert(o) }
                }
            }
        case "preference":
            Text("Tap to add to your ranked list.")
                .font(.footnote)
                .foregroundStyle(c.muted)
            ForEach(p.options ?? [], id: \.self) { o in
                let label = pref.contains(o) ? "\((pref.firstIndex(of: o) ?? 0) + 1). \(o)" : o
                ChoiceChip(label: label, selected: pref.contains(o)) {
                    if let idx = pref.firstIndex(of: o) { pref.remove(at: idx) }
                    else { pref.append(o) }
                }
            }
        default:
            ForEach(LIKERT_CHOICES, id: \.0) { item in
                ChoiceChip(label: item.1, selected: likert == item.0) { likert = item.0 }
            }
        }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadProposal(id: id) {
        case .ok(let value):
            proposal = value
            if case .ok(let me) = await app.repository.myBallot(id: id) {
                hydrateBallot(me.vote?.choice, voteType: value.voteType)
            }
        case .err(let message, _, _): error = message
        }
        loading = false
    }

    private func hydrateBallot(_ choice: AnyCodable?, voteType: String?) {
        guard let choice else { return }
        switch choice {
        case .string(let s):
            likert = s
            submitted = true
        case .array(let arr):
            let list = arr.compactMap(\.stringValue)
            switch voteType ?? "likert" {
            case "checklist":
                checks = Set(list)
                submitted = !list.isEmpty
            case "preference":
                pref = list
                submitted = !list.isEmpty
            default:
                likert = list.first
                submitted = likert != nil
            }
        default:
            break
        }
    }

    private func gated(_ reason: String, _ block: @escaping () -> Void) {
        if app.session.uiSession.authenticated { block() }
        else { app.auth.require(reason, onSuccess: block) }
    }

    private func cast(_ p: ProposalDto) async {
        let choice: Any
        switch p.voteType ?? "likert" {
        case "checklist":
            guard !checks.isEmpty else { return }
            choice = Array(checks)
        case "preference":
            guard !pref.isEmpty else { return }
            choice = pref
        default:
            guard let likert else { return }
            choice = likert
        }
        switch await app.repository.castBallot(id: id, choice: choice) {
        case .ok:
            submitted = true
            await load()
        case .err(_, let unauthorized, _):
            if unauthorized { app.auth.require("vote") {} }
        }
    }
}

struct DiscussionDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: FeedDetailResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data?.post == nil {
                LoadingView()
            } else if let error, data?.post == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let p = data?.post {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: p.type ?? "discussion", color: c.muted)
                        if let publicId = p.publicId {
                            Text(publicId).font(.system(.caption, design: .monospaced)).foregroundStyle(c.muted)
                        }
                        Text(p.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(p.body ?? p.excerpt ?? "").foregroundStyle(c.muted)
                        CivicMedia(url: p.mediaUrl, mediaType: p.mediaType)
                        if let author = p.authorAnonId { Text(author).foregroundStyle(c.amber) }
                        EngageBar(
                            targetType: "feed",
                            targetId: p.id,
                            sharePath: p.publicId.map { "/p/\($0)" } ?? "/p/\(p.id)",
                            shareTitle: p.title,
                            compact: false,
                            showComments: true
                        )
                        if data?.isMine == true {
                            GhostButton("Delete") {
                                Task {
                                    _ = await app.repository.deleteFeed(id: id)
                                    onNavigate(Routes.discussions)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Discussion not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadFeedPost(id: id) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }
}

struct ShareDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: ShareDetailResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data?.share == nil {
                LoadingView()
            } else if let error, data?.share == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let s = data?.share {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: "Community Post", color: c.news)
                        CivicMedia(url: s.mediaUrl, mediaType: s.mediaType)
                        Text(s.caption).font(.title3).foregroundStyle(c.foreground)
                        Text(s.locationLabel ?? "").foregroundStyle(c.muted)
                        if let author = s.authorAnonId { Text(author).foregroundStyle(c.amber) }
                        if let feedId = data?.feedPostId {
                            EngageBar(targetType: "feed", targetId: feedId, sharePath: "/share/\(s.id)", shareTitle: s.caption, compact: false, showComments: true)
                        }
                        if data?.isMine == true {
                            GhostButton("Delete") {
                                Task {
                                    _ = await app.repository.deleteShare(id: id)
                                    onNavigate(Routes.home)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Share not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadShare(id: id) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }
}

struct NoticeDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: NoticeDetailResponse?
    @State private var error: String?
    @State private var loading = true
    @State private var msg: String?

    var body: some View {
        Group {
            if loading && data?.notice == nil {
                LoadingView()
            } else if let error, data?.notice == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let n = data?.notice {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: "Notice · \(n.target ?? "national")", color: c.amberBright)
                        Text(n.title)
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(n.description).foregroundStyle(c.muted)
                        CivicMedia(url: n.mediaUrl, mediaType: n.mediaType)
                        Text("\(indianCount(n.signatures)) signatures").foregroundStyle(c.muted)
                        EngageBar(targetType: "notice", targetId: n.id, sharePath: "/notice/\(n.id)", shareTitle: n.title, compact: false, showComments: true)
                        if let msg { Text(msg).foregroundStyle(c.foreground) }
                        AmberButton("Add my signature") {
                            gated("sign this notice") { Task { await sign() } }
                        }
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Notice not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadNotice(id: id) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }

    private func gated(_ reason: String, _ block: @escaping () -> Void) {
        if app.session.uiSession.authenticated { block() }
        else { app.auth.require(reason, onSuccess: block) }
    }

    private func sign() async {
        switch await app.repository.signNotice(id: id) {
        case .ok(let value):
            msg = value.alreadySigned ? "Already signed" : "Signed"
            await load()
        case .err(let message, let unauthorized, _):
            if unauthorized { app.auth.require("sign") {} }
            else { msg = message }
        }
    }
}

struct PublicPostScreen: View {
    @EnvironmentObject private var app: AppContainer
    let publicId: String
    let onNavigate: (String) -> Void

    @State private var mongoId: String?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading {
                LoadingView()
            } else if let mongoId {
                DiscussionDetailScreen(id: mongoId, onNavigate: onNavigate)
            } else {
                ErrorView(message: error ?? "Post not found")
            }
        }
        .task(id: publicId) { await resolve() }
    }

    private func resolve() async {
        loading = true
        if publicId.range(of: "^[a-fA-F0-9]{24}$", options: .regularExpression) != nil {
            mongoId = publicId
            loading = false
            return
        }
        switch await app.repository.loadFeed(params: ["q": publicId, "sort": "new", "limit": "40"]) {
        case .ok(let value):
            let match = (value.posts).first {
                $0.publicId?.caseInsensitiveCompare(publicId) == .orderedSame || $0.id == publicId
            }
            mongoId = match?.id
            if match == nil { error = "Post not found" }
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct MemeDetailScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let id: String
    let onNavigate: (String) -> Void

    @State private var data: MemeDetailResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data?.meme == nil {
                LoadingView()
            } else if let error, data?.meme == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let m = data?.meme {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        KindPill(label: "Meme", color: c.news)
                        CivicMedia(url: m.imageUrl, mediaType: "image")
                        if !m.title.isEmpty {
                            Text(m.title)
                                .font(.system(.title, design: .serif).weight(.semibold))
                                .foregroundStyle(c.foreground)
                        }
                        if let caption = m.caption, !caption.isEmpty {
                            Text(caption).font(.body).foregroundStyle(c.muted)
                        }
                        if let author = m.authorAnonId ?? m.authorLabel {
                            Text(author).foregroundStyle(c.amber)
                        }
                        if !m.tags.isEmpty {
                            Text(m.tags.map { "#\($0)" }.joined(separator: " "))
                                .font(.subheadline)
                                .foregroundStyle(c.muted)
                        }
                        EngageBar(
                            targetType: "meme",
                            targetId: m.id,
                            sharePath: "/memes/\(m.id)",
                            shareTitle: m.title.isEmpty ? (m.caption ?? "Meme") : m.title,
                            compact: false,
                            showComments: true
                        )
                    }
                    .padding(20)
                }
            } else {
                ErrorView(message: "Meme not found")
            }
        }
        .task(id: id) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadMeme(id: id) {
        case .ok(let value):
            data = value
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}
