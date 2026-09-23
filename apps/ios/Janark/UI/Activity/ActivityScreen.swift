import SwiftUI

struct ActivityScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var q = ""
    @State private var kind = "all"
    @State private var data: DashboardResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data == nil {
                LoadingView()
            } else if let error, data == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let d = data {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        Text("Pulse")
                            .font(.system(.largeTitle, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(d.stats.label ?? "National live stats")
                            .foregroundStyle(c.muted)
                        JanarkField(text: $q, label: "Filter activity")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(
                                    [("all", "All"), ("issues", "Issues"), ("reports", "Reports"), ("demands", "Petitions"), ("votes", "Votes")],
                                    id: \.0
                                ) { item in
                                    ChoiceChip(label: item.1, selected: kind == item.0) { kind = item.0 }
                                }
                            }
                            .padding(.vertical, 8)
                        }
                        SectionLabel("Live counts")
                        StatGrid(d)

                        if !d.trends.isEmpty {
                            SectionLabel("Trends")
                            ForEach(Array(d.trends.enumerated()), id: \.offset) { _, t in
                                SurfaceCard(onTap: {
                                    let term = t.term.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
                                    onNavigate("\(Routes.home)?tag=\(term)")
                                }) {
                                    Text(t.term).font(.headline).foregroundStyle(c.foreground)
                                }
                            }
                        }
                        if !d.topDemands.isEmpty {
                            SectionLabel("Petitions")
                            ForEach(Array(d.topDemands.enumerated()), id: \.offset) { _, x in
                                SurfaceCard(onTap: { hrefToRoute(x.href).map(onNavigate) }) {
                                    Text(x.title).font(.headline).foregroundStyle(c.foreground)
                                    Text("\(indianCount(x.supportCount)) signs · \(x.place ?? "")")
                                        .font(.caption)
                                        .foregroundStyle(c.muted)
                                }
                            }
                        }
                        if !d.topReports.isEmpty {
                            SectionLabel("Reports")
                            ForEach(Array(d.topReports.enumerated()), id: \.offset) { _, x in
                                SurfaceCard(onTap: { hrefToRoute(x.href).map(onNavigate) }) {
                                    Text(x.title).font(.headline).foregroundStyle(c.foreground)
                                    Text(x.place ?? "").font(.caption).foregroundStyle(c.muted)
                                }
                            }
                        }
                        if !d.topIssues.isEmpty {
                            SectionLabel("Issues")
                            ForEach(Array(d.topIssues.enumerated()), id: \.offset) { _, x in
                                SurfaceCard(onTap: { x.slug.map { onNavigate(Routes.issue($0)) } }) {
                                    Text(x.title).font(.headline).foregroundStyle(c.foreground)
                                    Text("\(indianCount(x.voteCount)) · \(x.category ?? "")")
                                        .font(.caption)
                                        .foregroundStyle(c.muted)
                                }
                            }
                        }
                        if !d.activity.isEmpty {
                            SectionLabel("Stream")
                            ForEach(Array(d.activity.enumerated()), id: \.offset) { _, a in
                                SurfaceCard(onTap: { hrefToRoute(a.href).map(onNavigate) }) {
                                    Text(a.summary).foregroundStyle(c.foreground)
                                    Text([a.kind, relativeTime(a.createdAt)].compactMap { $0 }.joined(separator: " · "))
                                        .font(.caption)
                                        .foregroundStyle(c.muted)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
                .onChange(of: q) { _, _ in Task { await load() } }
            } else {
                ErrorView(message: "No activity")
            }
        }
        .task(id: kind) { await load() }
    }

    private func load() async {
        loading = true
        switch await app.repository.dashboard(["q": q, "kind": kind]) {
        case .ok(let value):
            data = value
            error = nil
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}

private struct StatGrid: View {
    @Environment(\.janarkColors) private var c
    let d: DashboardResponse

    init(_ d: DashboardResponse) { self.d = d }

    var body: some View {
        let stats: [(String, Int)] = [
            ("Citizens", d.stats.citizens),
            ("Petitions", d.stats.demands),
            ("Reports", d.stats.reports),
            ("Issues", d.stats.issues),
            ("Votes", d.stats.votes),
            ("Discussions", d.stats.discussions),
            ("Notices", d.stats.notices),
            ("Feed", d.stats.feedPosts),
        ]
        VStack(spacing: 6) {
            ForEach(Array(stride(from: 0, to: stats.count, by: 2)), id: \.self) { i in
                HStack(spacing: 12) {
                    ForEach(i..<min(i + 2, stats.count), id: \.self) { j in
                        SurfaceCard {
                            Text(indianCount(stats[j].1))
                                .font(.system(.title, design: .serif))
                                .foregroundStyle(c.foreground)
                            Text(stats[j].0)
                                .font(.caption)
                                .foregroundStyle(c.muted)
                        }
                    }
                }
            }
        }
    }
}
