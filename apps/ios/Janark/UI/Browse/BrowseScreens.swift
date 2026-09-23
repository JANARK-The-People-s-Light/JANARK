import SwiftUI

struct PetitionsScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var q = ""
    @State private var status = ""
    @State private var loading = true
    @State private var error: String?
    @State private var items: [DemandDto] = []

    var body: some View {
        VStack(spacing: 0) {
            JanarkField(text: $q, label: "Search petitions")
                .padding(16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ChoiceChip(label: "All", selected: status.isEmpty) { status = "" }
                    ForEach(PETITION_STATUSES, id: \.self) { s in
                        ChoiceChip(label: s.capitalized, selected: status == s) { status = s }
                    }
                }
                .padding(.horizontal, 16)
            }
            listBody
        }
        .task(id: status) { await load() }
    }

    @ViewBuilder
    private var listBody: some View {
        if loading {
            LoadingView()
        } else if let error {
            ErrorView(message: error) { Task { await load() } }
        } else if items.isEmpty {
            EmptyStateView(title: "No petitions yet", bodyText: "Launch one that names who should act.")
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(items, id: \.id) { d in
                        SurfaceCard(onTap: { onNavigate(Routes.petition(d.id)) }) {
                            KindPill(label: d.status ?? "open", color: c.success)
                            Text(d.title)
                                .font(.system(.title3, design: .serif).weight(.semibold))
                                .foregroundStyle(c.foreground)
                                .padding(.top, 8)
                            Text(d.ask)
                                .foregroundStyle(c.muted)
                                .padding(.top, 4)
                            Text("\(indianCount(d.supportCount)) signs · \(d.locationLabel ?? d.state ?? "India") · \(relativeTime(d.createdAt) ?? "")")
                                .font(.caption)
                                .foregroundStyle(c.muted)
                                .padding(.top, 8)
                        }
                    }
                }
                .padding(16)
            }
            .safeAreaInset(edge: .bottom) {
                Color.clear.frame(height: 0)
                    .onAppear { /* search button via onSubmit not needed */ }
            }
            .onSubmit { Task { await load() } }
            .onChange(of: q) { _, _ in
                Task { await load() }
            }
        }
    }

    private func load() async {
        loading = true
        var params: [String: String] = [:]
        if !q.isEmpty { params["q"] = q }
        if !status.isEmpty { params["status"] = status }
        switch await app.repository.loadDemands(params) {
        case .ok(let value):
            items = value.demands
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct ReportsScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var q = ""
    @State private var type = ""
    @State private var loading = true
    @State private var error: String?
    @State private var items: [ReportDto] = []

    var body: some View {
        VStack(spacing: 0) {
            JanarkField(text: $q, label: "Search reports")
                .padding(16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ChoiceChip(label: "All", selected: type.isEmpty) { type = "" }
                    ForEach(REPORT_TYPES, id: \.self) { t in
                        ChoiceChip(label: t.capitalized, selected: type == t) { type = t }
                    }
                }
                .padding(.horizontal, 16)
            }
            if loading {
                LoadingView()
            } else if let error {
                ErrorView(message: error) { Task { await load() } }
            } else if items.isEmpty {
                EmptyStateView(title: "No reports yet", bodyText: "Photo-first civic reports belong here.")
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(items, id: \.id) { r in
                            SurfaceCard(onTap: { onNavigate(Routes.report(r.id)) }) {
                                KindPill(label: r.type ?? "report", color: c.danger)
                                Text(r.title)
                                    .font(.system(.title3, design: .serif).weight(.semibold))
                                    .foregroundStyle(c.foreground)
                                    .padding(.top, 8)
                                CivicMedia(url: r.mediaUrl, mediaType: r.mediaType)
                                Text("\(indianCount(r.upvotes)) support · \(r.locationLabel ?? "") · \(relativeTime(r.createdAt) ?? "")")
                                    .font(.caption)
                                    .foregroundStyle(c.muted)
                                    .padding(.top, 8)
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task(id: type) { await load() }
        .onChange(of: q) { _, _ in Task { await load() } }
    }

    private func load() async {
        loading = true
        var params: [String: String] = [:]
        if !q.isEmpty { params["q"] = q }
        if !type.isEmpty { params["type"] = type }
        switch await app.repository.loadReports(params) {
        case .ok(let value):
            items = value.reports
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct IssuesScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var category: String?
    @State private var loading = true
    @State private var error: String?
    @State private var items: [IssueDto] = []

    var body: some View {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ChoiceChip(label: "All", selected: category == nil) { category = nil }
                    ForEach(ISSUE_CATEGORIES, id: \.self) { cat in
                        ChoiceChip(label: cat, selected: category == cat) { category = cat }
                    }
                }
                .padding(16)
            }
            if loading {
                LoadingView()
            } else if let error {
                ErrorView(message: error) { Task { await load() } }
            } else if items.isEmpty {
                EmptyStateView(title: "No issues yet")
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(items, id: \.slug) { issue in
                            SurfaceCard(onTap: { onNavigate(Routes.issue(issue.slug)) }) {
                                KindPill(label: issue.category ?? "Issue", color: c.amber)
                                Text(issue.title)
                                    .font(.system(.title3, design: .serif).weight(.semibold))
                                    .foregroundStyle(c.foreground)
                                    .padding(.top, 8)
                                Text(issue.summary)
                                    .foregroundStyle(c.muted)
                                    .padding(.top, 4)
                                Text("\(indianCount(issue.voteCount)) momentum")
                                    .font(.caption)
                                    .foregroundStyle(c.muted)
                                    .padding(.top, 8)
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task(id: category ?? "") { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadIssues(category: category) {
        case .ok(let value):
            items = value.issues
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct VotesScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var loading = true
    @State private var error: String?
    @State private var items: [ProposalDto] = []

    var body: some View {
        Group {
            if loading {
                LoadingView()
            } else if let error {
                ErrorView(message: error) { Task { await load() } }
            } else if items.isEmpty {
                EmptyStateView(title: "No open votes")
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(items, id: \.id) { p in
                            SurfaceCard(onTap: { onNavigate(Routes.vote(p.id)) }) {
                                KindPill(label: "Open vote · \(p.voteType ?? "likert")", color: c.fact)
                                Text(p.title)
                                    .font(.system(.title3, design: .serif).weight(.semibold))
                                    .foregroundStyle(c.foreground)
                                    .padding(.top, 8)
                                Text(p.description)
                                    .foregroundStyle(c.muted)
                                    .lineLimit(3)
                                    .padding(.top, 4)
                                Text("\(indianCount(p.totalVotes)) participants · non-binding")
                                    .font(.caption)
                                    .foregroundStyle(c.muted)
                                    .padding(.top, 8)
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadProposals() {
        case .ok(let value):
            items = value.proposals
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct DiscussionsScreen: View {
    @EnvironmentObject private var app: AppContainer
    let onNavigate: (String) -> Void

    @State private var loading = true
    @State private var error: String?
    @State private var posts: [FeedPostDto] = []

    var body: some View {
        Group {
            if loading {
                LoadingView()
            } else if let error {
                ErrorView(message: error) { Task { await load() } }
            } else if posts.isEmpty {
                EmptyStateView(title: "No discussions yet")
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(posts, id: \.id) { post in
                            HomePost(post: post, onNavigate: onNavigate)
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadFeed(params: ["type": "discussion", "sort": "new"]) {
        case .ok(let value):
            posts = value.posts
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct MemesScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var q = ""
    @State private var loading = true
    @State private var error: String?
    @State private var items: [MemeDto] = []

    var body: some View {
        Group {
            if loading && items.isEmpty {
                LoadingView()
            } else if let error, items.isEmpty {
                ErrorView(message: error) { Task { await load() } }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        JanarkField(text: $q, label: "Search memes")
                        AmberButton("Post a meme") { onNavigate(Routes.create("meme")) }
                        if items.isEmpty {
                            EmptyStateView(title: "No memes yet", bodyText: "Share civic humor that sparks awareness.")
                        } else {
                            ForEach(items, id: \.id) { m in
                                Button { onNavigate(Routes.meme(m.id)) } label: {
                                    SurfaceCard {
                                        CivicMedia(url: m.imageUrl, mediaType: nil)
                                        Text(m.title)
                                            .font(.system(.title3, design: .serif).weight(.semibold))
                                            .foregroundStyle(c.foreground)
                                            .padding(.top, 8)
                                        if let caption = m.caption, !caption.isEmpty {
                                            Text(caption).foregroundStyle(c.muted).lineLimit(3).padding(.top, 4)
                                        }
                                        Text("\(indianCount(m.upvotes)) up · \(indianCount(m.shareCount)) shares")
                                            .font(.caption)
                                            .foregroundStyle(c.muted)
                                            .padding(.top, 8)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        var params = ["sort": "hot"]
        let trimmed = q.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { params["q"] = trimmed }
        switch await app.repository.loadMemes(params: params) {
        case .ok(let value):
            items = value.memes.isEmpty ? value.items : value.memes
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

struct NoticesScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var loading = true
    @State private var error: String?
    @State private var items: [NoticeDto] = []

    var body: some View {
        Group {
            if loading && items.isEmpty {
                LoadingView()
            } else if let error, items.isEmpty {
                ErrorView(message: error) { Task { await load() } }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        AmberButton("Raise a notice") { onNavigate(Routes.create("notice")) }
                        if items.isEmpty {
                            EmptyStateView(title: "No notices yet")
                        } else {
                            ForEach(items, id: \.id) { n in
                                Button { onNavigate(Routes.notice(n.id)) } label: {
                                    SurfaceCard {
                                        KindPill(label: n.target, color: c.fact)
                                        Text(n.title)
                                            .font(.system(.title3, design: .serif).weight(.semibold))
                                            .foregroundStyle(c.foreground)
                                            .padding(.top, 8)
                                        if !n.description.isEmpty {
                                            Text(n.description).foregroundStyle(c.muted).lineLimit(3).padding(.top, 4)
                                        }
                                        Text("\(indianCount(n.signatures)) signatures")
                                            .font(.caption)
                                            .foregroundStyle(c.muted)
                                            .padding(.top, 8)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.loadNotices() {
        case .ok(let value):
            items = value.notices
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}
