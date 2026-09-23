import SwiftUI

struct SettingsScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    let onNavigate: (String) -> Void

    @State private var apiDraft = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Settings")
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                    .foregroundStyle(c.foreground)

                if app.session.uiSession.authenticated {
                    Text("Signed in as \(app.session.uiSession.anonId ?? "")")
                        .font(.system(.body, design: .monospaced))
                        .foregroundStyle(c.foreground)
                    Text("Phone hint \(app.session.uiSession.hint ?? "••") — number is never stored on this device.")
                        .font(.footnote)
                        .foregroundStyle(c.muted)
                    AmberButton("Sign out") {
                        Task {
                            _ = await app.repository.logout()
                            onNavigate(Routes.home)
                        }
                    }
                } else {
                    Text("Browsing freely. Sign in only when you post or react.")
                        .foregroundStyle(c.muted)
                    AmberButton("Verify phone") { onNavigate(Routes.login) }
                }

                SectionLabel("Theme")
                ForEach(ThemeId.allCases) { t in
                    Button {
                        app.session.setTheme(t)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(t.label)
                                .font(.headline)
                                .foregroundStyle(c.foreground)
                            Text(t.description)
                                .font(.footnote)
                                .foregroundStyle(c.muted)
                            HStack(spacing: 8) {
                                Circle().fill(Color(hex: t.swatches.0)).frame(width: 18, height: 18)
                                Circle().fill(Color(hex: t.swatches.1)).frame(width: 18, height: 18)
                                Circle().fill(Color(hex: t.swatches.2)).frame(width: 18, height: 18)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(t == app.session.themeId ? c.amber : c.line, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }

                SectionLabel("Server")
                Text("Janark iOS is a thin client of the civic web API. Point this at your running Janark origin.")
                    .font(.footnote)
                    .foregroundStyle(c.muted)
                JanarkField(text: $apiDraft, label: "API base URL")
                GhostButton("Save server URL") {
                    Task {
                        app.session.setApiBase(apiDraft)
                        await app.repository.logoutLocal()
                    }
                }
                GhostButton("About anonymity") { onNavigate(Routes.about) }
                GhostButton("Civic Posting Terms") { onNavigate(Routes.terms) }
            }
            .padding(20)
        }
        .onAppear { apiDraft = app.session.apiBaseURL }
        .onChange(of: app.session.apiBaseURL) { _, url in apiDraft = url }
    }
}
