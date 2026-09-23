package org.janark.app.ui.nav

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import org.janark.app.ui.LocalApp
import org.janark.app.ui.about.AboutScreen
import org.janark.app.ui.activity.ActivityScreen
import org.janark.app.ui.auth.LoginScreen
import org.janark.app.ui.browse.DiscussionsScreen
import org.janark.app.ui.browse.IssuesScreen
import org.janark.app.ui.browse.MemesScreen
import org.janark.app.ui.browse.NoticesScreen
import org.janark.app.ui.browse.PetitionsScreen
import org.janark.app.ui.browse.ReportsScreen
import org.janark.app.ui.browse.VotesScreen
import org.janark.app.ui.create.CreateScreen
import org.janark.app.ui.detail.DiscussionDetailScreen
import org.janark.app.ui.detail.IssueDetailScreen
import org.janark.app.ui.detail.MemeDetailScreen
import org.janark.app.ui.detail.NoticeDetailScreen
import org.janark.app.ui.detail.PetitionDetailScreen
import org.janark.app.ui.detail.PublicPostScreen
import org.janark.app.ui.detail.ReportDetailScreen
import org.janark.app.ui.detail.ShareDetailScreen
import org.janark.app.ui.detail.VoteDetailScreen
import org.janark.app.ui.home.HomeScreen
import org.janark.app.ui.profile.FollowListScreen
import org.janark.app.ui.profile.ProfileGate
import org.janark.app.ui.settings.SettingsScreen
import org.janark.app.ui.shell.JanarkScaffold
import org.janark.app.ui.terms.TermsScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JanarkNav() {
    val nav = rememberNavController()
    val app = LocalApp.current
    val back by nav.currentBackStackEntryAsState()
    val route = back?.destination?.route
    val isCompose = route?.startsWith("create/") == true
    val prompt by app.auth.prompt.collectAsState()

    LaunchedEffect(Unit) {
        app.repository.refreshMe()
        app.repository.pingVisit()
    }

    fun go(dest: String) {
        if (dest.startsWith("home?")) {
            nav.navigate(Routes.Home) { launchSingleTop = true }
            return
        }
        nav.navigate(dest) {
            if (dest in listOf(Routes.Home, Routes.Petitions, Routes.Profile, Routes.Activity)) {
                popUpTo(Routes.Home) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    JanarkScaffold(currentRoute = route?.substringBefore("/"), isCompose = isCompose, onNavigate = ::go) {
        NavHost(navController = nav, startDestination = Routes.Home, modifier = Modifier.fillMaxSize()) {
            composable(Routes.Home) { HomeScreen(::go) }
            composable(Routes.Petitions) { PetitionsScreen(::go) }
            composable(Routes.Reports) { ReportsScreen(::go) }
            composable(Routes.Issues) { IssuesScreen(::go) }
            composable(Routes.Votes) { VotesScreen(::go) }
            composable(Routes.Discussions) { DiscussionsScreen(::go) }
            composable(Routes.Memes) { MemesScreen(::go) }
            composable(Routes.Notices) { NoticesScreen(::go) }
            composable(Routes.Profile) { ProfileGate(null, ::go) }
            composable(Routes.Activity) { ActivityScreen(::go) }
            composable(Routes.Settings) { SettingsScreen(::go) }
            composable(Routes.About) { AboutScreen() }
            composable(Routes.Terms) { TermsScreen() }
            composable(Routes.Login) {
                LoginScreen(onSuccess = {
                    app.auth.consumeSuccess()
                    nav.popBackStack()
                }, onClose = { nav.popBackStack() })
            }
            composable(Routes.PetitionDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                PetitionDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.ReportDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                ReportDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.IssueDetail, listOf(navArgument("slug") { type = NavType.StringType })) {
                IssueDetailScreen(it.arguments?.getString("slug").orEmpty(), ::go)
            }
            composable(Routes.VoteDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                VoteDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.DiscussionDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                DiscussionDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.ShareDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                ShareDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.MemeDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                MemeDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.NoticeDetail, listOf(navArgument("id") { type = NavType.StringType })) {
                NoticeDetailScreen(it.arguments?.getString("id").orEmpty(), ::go)
            }
            composable(Routes.PublicPost, listOf(navArgument("publicId") { type = NavType.StringType })) {
                PublicPostScreen(it.arguments?.getString("publicId").orEmpty(), ::go)
            }
            composable(Routes.ProfileUser, listOf(navArgument("anonId") { type = NavType.StringType })) {
                ProfileGate(it.arguments?.getString("anonId"), ::go)
            }
            composable(Routes.Create, listOf(navArgument("kind") { type = NavType.StringType })) {
                CreateScreen(it.arguments?.getString("kind").orEmpty(), ::go)
            }
            composable(
                Routes.FollowList,
                listOf(
                    navArgument("anonId") { type = NavType.StringType },
                    navArgument("list") { type = NavType.StringType },
                ),
            ) {
                FollowListScreen(
                    it.arguments?.getString("anonId").orEmpty(),
                    it.arguments?.getString("list").orEmpty(),
                    ::go,
                )
            }
        }
    }

    if (prompt != null) {
        ModalBottomSheet(onDismissRequest = { app.auth.dismiss() }) {
            LoginScreen(
                reason = prompt?.reason ?: "continue",
                onSuccess = { app.auth.consumeSuccess() },
                onClose = { app.auth.dismiss() },
            )
        }
    }
}
