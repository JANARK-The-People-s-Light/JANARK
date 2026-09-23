import Foundation
import Combine

@MainActor
final class AppContainer: ObservableObject {
    let session: SessionStore
    let api: APIClient
    let repository: JanarkRepository
    let auth: AuthController

    private var bag = Set<AnyCancellable>()

    init(
        session: SessionStore? = nil,
        api: APIClient? = nil
    ) {
        let sessionStore = session ?? SessionStore()
        let client = api ?? APIClient(baseURL: sessionStore.currentApiBase())
        self.session = sessionStore
        self.api = client
        self.repository = JanarkRepository(session: sessionStore, api: client)
        self.auth = AuthController()

        sessionStore.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &bag)
        auth.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &bag)
    }
}
