import SwiftUI

struct JanarkNav: View {
    @EnvironmentObject private var app: AppContainer

    @State private var path = NavigationPath()
    @State private var root: AppRoute = .home
    @State private var activeRoute: AppRoute = .home

    var body: some View {
        JanarkScaffold(
            currentRoute: activeRoute.tabRoot
                ?? activeRoute.pathString.split(separator: "/").first.map(String.init),
            isCompose: activeRoute.isCompose,
            onNavigate: go
        ) {
            NavigationStack(path: $path) {
                rootView(for: root)
                    .navigationDestination(for: AppRoute.self) { route in
                        destination(for: route)
                            .onAppear { activeRoute = route }
                    }
            }
        }
        .sheet(isPresented: Binding(
            get: { app.auth.prompt != nil },
            set: { if !$0 { app.auth.dismiss() } }
        )) {
            NavigationStack {
                LoginScreen(
                    reason: app.auth.prompt?.reason ?? "continue",
                    onSuccess: { app.auth.consumeSuccess() },
                    onClose: { app.auth.dismiss() }
                )
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") { app.auth.dismiss() }
                    }
                }
            }
            .presentationDetents([.large])
        }
        .onAppear { activeRoute = root }
    }

    private func go(_ dest: String) {
        guard let route = AppRoute.from(path: dest) else { return }
        switch route {
        case .home, .petitions, .profile, .activity,
             .reports, .issues, .votes, .discussions, .settings, .about, .terms:
            path = NavigationPath()
            root = route
            activeRoute = route
        default:
            path.append(route)
            activeRoute = route
        }
    }

    @ViewBuilder
    private func rootView(for route: AppRoute) -> some View {
        destination(for: route)
            .onAppear { activeRoute = route }
    }

    @ViewBuilder
    private func destination(for route: AppRoute) -> some View {
        switch route {
        case .home:
            HomeScreen(onNavigate: go)
        case .petitions:
            PetitionsScreen(onNavigate: go)
        case .reports:
            ReportsScreen(onNavigate: go)
        case .issues:
            IssuesScreen(onNavigate: go)
        case .votes:
            VotesScreen(onNavigate: go)
        case .discussions:
            DiscussionsScreen(onNavigate: go)
        case .memes:
            MemesScreen(onNavigate: go)
        case .notices:
            NoticesScreen(onNavigate: go)
        case .profile:
            ProfileGate(anonId: nil, onNavigate: go)
        case .activity:
            ActivityScreen(onNavigate: go)
        case .settings:
            SettingsScreen(onNavigate: go)
        case .about:
            AboutScreen()
        case .terms:
            TermsScreen()
        case .login:
            LoginScreen(
                onSuccess: {
                    app.auth.consumeSuccess()
                    if !path.isEmpty { path.removeLast() }
                },
                onClose: {
                    if !path.isEmpty { path.removeLast() }
                }
            )
        case .petition(let id):
            PetitionDetailScreen(id: id, onNavigate: go)
        case .report(let id):
            ReportDetailScreen(id: id, onNavigate: go)
        case .issue(let slug):
            IssueDetailScreen(slug: slug, onNavigate: go)
        case .vote(let id):
            VoteDetailScreen(id: id, onNavigate: go)
        case .discussion(let id):
            DiscussionDetailScreen(id: id, onNavigate: go)
        case .share(let id):
            ShareDetailScreen(id: id, onNavigate: go)
        case .notice(let id):
            NoticeDetailScreen(id: id, onNavigate: go)
        case .meme(let id):
            MemeDetailScreen(id: id, onNavigate: go)
        case .publicPost(let id):
            PublicPostScreen(publicId: id, onNavigate: go)
        case .profileUser(let anonId):
            ProfileGate(anonId: anonId, onNavigate: go)
        case .create(let kind):
            CreateScreen(kindPath: kind, onNavigate: go)
        case .followList(let anonId, let list):
            FollowListScreen(anonId: anonId, list: list, onNavigate: go)
        }
    }
}
