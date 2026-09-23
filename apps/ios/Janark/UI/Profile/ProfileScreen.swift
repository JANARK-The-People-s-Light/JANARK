import SwiftUI

struct ProfileGate: View {
    @EnvironmentObject private var app: AppContainer
    let anonId: String?
    let onNavigate: (String) -> Void

    var body: some View {
        let id = anonId ?? app.session.uiSession.anonId
        if let id, !id.isEmpty {
            ProfileScreen(anonId: id, onNavigate: onNavigate)
        } else {
            LoginScreen(reason: "see your profile", onSuccess: {
                if let anon = app.session.uiSession.anonId {
                    onNavigate(Routes.profile(anon))
                }
            })
        }
    }
}

struct ProfileScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let anonId: String
    let onNavigate: (String) -> Void

    @State private var data: ProfileResponse?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading && data == nil {
                LoadingView()
            } else if let error, data == nil {
                ErrorView(message: error) { Task { await load() } }
            } else if let p = data {
                profileBody(p)
            } else {
                EmptyStateView(title: "Profile not found")
            }
        }
        .task(id: anonId) { await load() }
    }

    private func profileBody(_ p: ProfileResponse) -> some View {
        let items: [(ProfilePostItem, String)] =
            p.posts.demands.map { ($0, "Petition") }
            + p.posts.reports.map { ($0, "Report") }
            + p.posts.discussions.map { ($0, "Discussion") }
            + p.posts.notices.map { ($0, "Notice") }
            + p.posts.shares.map { ($0, "Share") }
            + p.posts.memes.map { ($0, "Post") }

        return ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text(p.profile?.label ?? anonId)
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                    .foregroundStyle(c.foreground)
                Text(anonId)
                    .font(.system(.body, design: .monospaced))
                    .foregroundStyle(c.muted)
                Text("Member since \(formatDate(p.counts.memberSince ?? p.profile?.memberSince))")
                    .font(.subheadline)
                    .foregroundStyle(c.muted)
                Text("\(indianCount(p.counts.followers)) followers · \(indianCount(p.counts.following)) following · \(indianCount(p.counts.posts)) posts")
                    .foregroundStyle(c.foreground)

                HStack(spacing: 8) {
                    GhostButton("Followers") { onNavigate(Routes.followList(anonId, "followers")) }
                    GhostButton("Following") { onNavigate(Routes.followList(anonId, "following")) }
                }

                followControls(p)

                SectionLabel("Posts")
                if items.isEmpty {
                    Text("No public posts yet.").foregroundStyle(c.muted)
                } else {
                    ForEach(Array(items.enumerated()), id: \.offset) { _, pair in
                        profileRow(pair.0, kind: pair.1)
                    }
                }

                SectionLabel("Activity")
                let acts = p.reactions.demandSupports
                    + p.reactions.proposalVotes
                    + p.reactions.reportVotes
                    + p.reactions.noticeSignatures
                if acts.isEmpty {
                    Text("No public reactions listed.").foregroundStyle(c.muted)
                } else {
                    ForEach(Array(acts.prefix(20).enumerated()), id: \.offset) { _, a in
                        SurfaceCard(onTap: { hrefToRoute(a.href).map(onNavigate) }) {
                            Text(a.title ?? "Activity").foregroundStyle(c.foreground)
                            Text([a.choice, a.reaction, a.ask].compactMap { $0 }.joined(separator: " · "))
                                .font(.caption)
                                .foregroundStyle(c.muted)
                        }
                    }
                }
            }
            .padding(20)
        }
    }

    @ViewBuilder
    private func followControls(_ p: ProfileResponse) -> some View {
                if p.follow.isSelf {
                    Text("This is you. Your phone number is never shown.")
                        .font(.footnote)
                        .foregroundStyle(c.muted)
                } else if app.session.uiSession.authenticated {
            AmberButton(p.follow.viewerFollows ? "Unfollow" : "Follow") {
                Task {
                    _ = await app.repository.toggleFollow(
                        anonId: anonId,
                        action: p.follow.viewerFollows ? "unfollow" : "follow"
                    )
                    await load()
                }
            }
        } else {
            AmberButton("Follow") {
                app.auth.require("follow") {
                    Task {
                        _ = await app.repository.toggleFollow(anonId: anonId, action: "follow")
                        await load()
                    }
                }
            }
        }
    }

    private func profileRow(_ item: ProfilePostItem, kind: String) -> some View {
        SurfaceCard(onTap: { hrefToRoute(item.href).map(onNavigate) }) {
            KindPill(label: kind, color: c.amber)
            Text(item.title ?? item.body ?? item.ask ?? item.caption ?? "Post")
                .font(.headline)
                .foregroundStyle(c.foreground)
                .padding(.top, 6)
        }
    }

    private func load() async {
        loading = true
        switch await app.repository.profile(anonId: anonId) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }
}

struct FollowListScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let anonId: String
    let list: String
    let onNavigate: (String) -> Void

    @State private var names: [FollowPersonDto] = []
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text(list.capitalized)
                    .font(.system(.title, design: .serif))
                    .foregroundStyle(c.foreground)
                if let error {
                    Text(error).foregroundStyle(c.danger)
                }
                ForEach(names, id: \.anonId) { p in
                    SurfaceCard(onTap: { onNavigate(Routes.profile(p.anonId)) }) {
                        Text(p.label ?? p.anonId)
                            .font(.headline)
                            .foregroundStyle(c.foreground)
                        Text(p.anonId)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundStyle(c.muted)
                    }
                }
            }
            .padding(20)
        }
        .task(id: "\(anonId)-\(list)") {
            switch await app.repository.followStatus(anonId: anonId, list: list) {
            case .ok(let value): names = value.people
            case .err(let message, _, _): error = message
            }
        }
    }
}
