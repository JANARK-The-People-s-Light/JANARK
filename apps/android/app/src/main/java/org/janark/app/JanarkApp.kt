package org.janark.app

import android.app.Application
import org.janark.app.data.net.NetworkModule
import org.janark.app.data.net.PersistentCookieJar
import org.janark.app.data.repo.JanarkRepository
import org.janark.app.data.session.SessionStore
import org.janark.app.ui.auth.AuthController

class JanarkApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

class AppContainer(app: Application) {
    val session = SessionStore(app)
    val cookies = PersistentCookieJar(app)
    val network = NetworkModule(app, cookies)
    val repository = JanarkRepository(app, session, network)
    val auth = AuthController()
}
