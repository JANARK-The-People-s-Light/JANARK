import SwiftUI

@main
struct JanarkApp: App {
    @StateObject private var app = AppContainer()

    var body: some Scene {
        WindowGroup {
            JanarkNav()
                .environmentObject(app)
                .janarkTheme(app.session.themeId)
                .task {
                    _ = await app.repository.refreshMe()
                    _ = await app.repository.pingVisit()
                }
        }
    }
}
