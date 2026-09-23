import SwiftUI

struct NavDest: Identifiable {
    let route: String
    let label: String
    let systemImage: String
    let group: String
    var id: String { route }
}

private let drawerItems: [NavDest] = [
    NavDest(route: Routes.home, label: "Home", systemImage: "house", group: "Discover"),
    NavDest(route: Routes.activity, label: "Pulse", systemImage: "chart.bar", group: "Discover"),
    NavDest(route: Routes.issues, label: "Issues", systemImage: "flame", group: "Act"),
    NavDest(route: Routes.petitions, label: "Petitions", systemImage: "megaphone", group: "Act"),
    NavDest(route: Routes.reports, label: "Reports", systemImage: "exclamationmark.bubble", group: "Act"),
    NavDest(route: Routes.votes, label: "Votes", systemImage: "checkmark.seal", group: "Act"),
    NavDest(route: Routes.discussions, label: "Discussions", systemImage: "bubble.left.and.bubble.right", group: "Act"),
    NavDest(route: Routes.notices, label: "Notices", systemImage: "megaphone", group: "Act"),
    NavDest(route: Routes.profile, label: "Profile", systemImage: "person.circle", group: "You"),
    NavDest(route: Routes.settings, label: "Settings", systemImage: "gearshape", group: "You"),
    NavDest(route: Routes.about, label: "About", systemImage: "info.circle", group: "You"),
]

private let tabs: [NavDest] = [
    NavDest(route: Routes.home, label: "Home", systemImage: "house", group: "Discover"),
    NavDest(route: Routes.activity, label: "Pulse", systemImage: "chart.bar", group: "Discover"),
    NavDest(route: Routes.petitions, label: "Petitions", systemImage: "megaphone", group: "Act"),
    NavDest(route: Routes.profile, label: "Profile", systemImage: "person.circle", group: "You"),
]

struct JanarkScaffold<Content: View>: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let currentRoute: String?
    let isCompose: Bool
    let onNavigate: (String) -> Void
    @ViewBuilder let content: Content

    @State private var showMenu = false
    @State private var showCreate = false

    private var selectedTab: String? {
        tabs.first(where: { currentRoute == $0.route || (currentRoute?.hasPrefix($0.route) ?? false) })?.route
    }

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                topBar
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                if !isCompose {
                    bottomBar
                }
            }
            .background(c.background)

            if !isCompose {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button {
                            showCreate = true
                        } label: {
                            Image(systemName: "plus")
                                .font(.title2.weight(.semibold))
                                .foregroundStyle(c.chrome)
                                .frame(width: 56, height: 56)
                                .background(c.amber, in: Circle())
                                .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                        }
                        .padding(.trailing, 20)
                        .padding(.bottom, 72)
                    }
                }
            }

            if showMenu {
                drawerOverlay
            }
        }
        .sheet(isPresented: $showCreate) {
            createSheet
                .presentationDetents([.medium, .large])
        }
    }

    private var topBar: some View {
        HStack(spacing: 10) {
            Button { showMenu = true } label: {
                Image(systemName: "line.3.horizontal")
                    .foregroundStyle(c.onChrome)
                    .frame(width: 36, height: 36)
            }
            Image("JanarkLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 28, height: 28)
            Text("Janark")
                .font(.system(.title3, design: .serif).weight(.semibold))
                .foregroundStyle(c.onChrome)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(c.chrome)
    }

    private var bottomBar: some View {
        HStack {
            ForEach(tabs) { tab in
                Button {
                    onNavigate(tab.route)
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.systemImage)
                        Text(tab.label)
                            .font(.caption2)
                    }
                    .foregroundStyle(selectedTab == tab.route ? c.amber : c.onChrome.opacity(0.7))
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.top, 10)
        .padding(.bottom, 8)
        .background(c.chrome)
    }

    private var drawerOverlay: some View {
        ZStack(alignment: .leading) {
            Color.black.opacity(0.35)
                .ignoresSafeArea()
                .onTapGesture { showMenu = false }

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 10) {
                    Image("JanarkLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Janark")
                            .font(.system(.title2, design: .serif).weight(.semibold))
                            .foregroundStyle(c.foreground)
                        Text(app.session.uiSession.anonId ?? "Browse freely")
                            .font(.caption)
                            .foregroundStyle(c.muted)
                    }
                }
                .padding(16)

                ScrollView {
                    let groups = Dictionary(grouping: drawerItems, by: \.group)
                    ForEach(["Discover", "Act", "You"], id: \.self) { group in
                        if let items = groups[group] {
                            SectionLabel(group)
                                .padding(.horizontal, 16)
                            ForEach(items) { item in
                                Button {
                                    onNavigate(item.route)
                                    showMenu = false
                                } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: item.systemImage)
                                        Text(item.label)
                                        Spacer()
                                    }
                                    .foregroundStyle(currentRoute == item.route ? c.amber : c.foreground)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 12)
                                    .background(currentRoute == item.route ? c.amber.opacity(0.12) : Color.clear)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(width: 300)
            .frame(maxHeight: .infinity)
            .background(c.surface)
            .transition(.move(edge: .leading))
        }
    }

    private var createSheet: some View {
        NavigationStack {
            List {
                Section {
                    createRow(CreateKind.share, title: "Share with community", reason: "share with your community")
                    createRow(CreateKind.report, title: "File a report", reason: "file a report")
                } header: {
                    Text("Quick")
                }
                Section {
                    ForEach([CreateKind.issue, .petition, .vote, .discussion, .notice, .meme]) { kind in
                        createRow(kind, title: kind.title, reason: kind.title.lowercased())
                    }
                } header: {
                    Text("Organize")
                }
            }
            .navigationTitle("Create")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { showCreate = false }
                }
            }
        }
    }

    private func createRow(_ kind: CreateKind, title: String, reason: String) -> some View {
        Button(title) {
            showCreate = false
            let dest = Routes.create(kind.path)
            if app.session.uiSession.authenticated {
                onNavigate(dest)
            } else {
                app.auth.require(reason) { onNavigate(dest) }
            }
        }
    }
}
