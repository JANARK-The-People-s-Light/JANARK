package org.janark.app.ui.shell

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.Campaign
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.HowToVote
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LocalFireDepartment
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Report
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.janark.app.R
import org.janark.app.ui.LocalApp
import org.janark.app.ui.components.SectionLabel
import org.janark.app.ui.nav.CreateKind
import org.janark.app.ui.nav.Routes
import org.janark.app.ui.theme.JanarkTheme
import org.janark.app.ui.theme.toC

data class NavDest(val route: String, val label: String, val icon: ImageVector, val group: String)

private val drawerItems = listOf(
    NavDest(Routes.Home, "Home", Icons.Outlined.Home, "Discover"),
    NavDest(Routes.Activity, "Pulse", Icons.Outlined.Place, "Discover"),
    NavDest(Routes.Issues, "Issues", Icons.Outlined.LocalFireDepartment, "Act"),
    NavDest(Routes.Petitions, "Petitions", Icons.Outlined.Campaign, "Act"),
    NavDest(Routes.Reports, "Reports", Icons.Outlined.Report, "Act"),
    NavDest(Routes.Votes, "Votes", Icons.Outlined.HowToVote, "Act"),
    NavDest(Routes.Discussions, "Discussions", Icons.Outlined.ChatBubbleOutline, "Act"),
    NavDest(Routes.Notices, "Notices", Icons.Outlined.Campaign, "Act"),
    NavDest(Routes.Profile, "Profile", Icons.Outlined.AccountCircle, "You"),
    NavDest(Routes.Settings, "Settings", Icons.Outlined.Settings, "You"),
    NavDest(Routes.About, "About", Icons.Outlined.Info, "You"),
)

private val tabs = listOf(
    NavDest(Routes.Home, "Home", Icons.Outlined.Home, "Discover"),
    NavDest(Routes.Activity, "Pulse", Icons.Outlined.Place, "Discover"),
    NavDest(Routes.Petitions, "Petitions", Icons.Outlined.Campaign, "Act"),
    NavDest(Routes.Profile, "Profile", Icons.Outlined.AccountCircle, "You"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JanarkScaffold(
    currentRoute: String?,
    isCompose: Boolean,
    onNavigate: (String) -> Unit,
    content: @Composable () -> Unit,
) {
    val c = JanarkTheme.colors
    val drawer = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var createOpen by remember { mutableStateOf(false) }
    val app = LocalApp.current
    val session by app.session.uiSession.collectAsState(initial = org.janark.app.data.session.UiSession())

    val selectedTab = tabs.firstOrNull { currentRoute == it.route || currentRoute?.startsWith(it.route) == true }?.route

    ModalNavigationDrawer(
        drawerState = drawer,
        drawerContent = {
            Column(
                Modifier
                    .fillMaxHeight()
                    .width(300.dp)
                    .padding(16.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(painterResource(R.drawable.janark_logo), null, Modifier.size(40.dp))
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Janark", fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 22.sp, color = c.foreground.toC())
                        Text(session.anonId ?: "Browse freely", color = c.muted.toC(), fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(16.dp))
                drawerItems.groupBy { it.group }.forEach { (group, items) ->
                    SectionLabel(group)
                    items.forEach { item ->
                        NavigationDrawerItem(
                            label = { Text(item.label) },
                            selected = currentRoute == item.route,
                            onClick = {
                                onNavigate(item.route)
                                scope.launch { drawer.close() }
                            },
                            icon = { Icon(item.icon, null) },
                        )
                    }
                }
            }
        },
    ) {
        Scaffold(
            containerColor = c.background.toC(),
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Image(painterResource(R.drawable.janark_logo), null, Modifier.size(28.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Janark", fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, color = c.onChrome.toC())
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawer.open() } }) {
                            Icon(Icons.Outlined.Menu, contentDescription = "Menu", tint = c.onChrome.toC())
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = c.chrome.toC(),
                        titleContentColor = c.onChrome.toC(),
                    ),
                )
            },
            bottomBar = {
                if (!isCompose) {
                    NavigationBar(containerColor = c.chrome.toC()) {
                        tabs.forEach { tab ->
                            NavigationBarItem(
                                selected = selectedTab == tab.route,
                                onClick = { onNavigate(tab.route) },
                                icon = { Icon(tab.icon, tab.label) },
                                label = { Text(tab.label) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = c.amber.toC(),
                                    selectedTextColor = c.amber.toC(),
                                    unselectedIconColor = c.onChrome.toC().copy(alpha = 0.7f),
                                    unselectedTextColor = c.onChrome.toC().copy(alpha = 0.7f),
                                    indicatorColor = c.chromeMid.toC(),
                                ),
                            )
                        }
                    }
                }
            },
            floatingActionButton = {
                if (!isCompose) {
                    FloatingActionButton(
                        onClick = { createOpen = true },
                        containerColor = c.amber.toC(),
                        contentColor = c.chrome.toC(),
                    ) { Icon(Icons.Filled.Add, contentDescription = "Create") }
                }
            },
        ) { padding ->
            Column(Modifier.padding(padding).fillMaxSize()) { content() }
        }
    }

    if (createOpen) {
        ModalBottomSheet(onDismissRequest = { createOpen = false }, sheetState = rememberModalBottomSheetState()) {
            Column(Modifier.padding(20.dp)) {
                SectionLabel("Quick")
                CreateKind.Share.let { k ->
                    NavigationDrawerItem(label = { Text("Share with community") }, selected = false, onClick = {
                        createOpen = false
                        if (session.authenticated) onNavigate(Routes.create(k.path))
                        else app.auth.require("share with your community") { onNavigate(Routes.create(k.path)) }
                    })
                }
                CreateKind.Report.let { k ->
                    NavigationDrawerItem(label = { Text("File a report") }, selected = false, onClick = {
                        createOpen = false
                        if (session.authenticated) onNavigate(Routes.create(k.path))
                        else app.auth.require("file a report") { onNavigate(Routes.create(k.path)) }
                    })
                }
                HorizontalDivider(Modifier.padding(vertical = 8.dp))
                SectionLabel("Organize")
                listOf(CreateKind.Issue, CreateKind.Petition, CreateKind.Vote, CreateKind.Discussion, CreateKind.Notice, CreateKind.Meme).forEach { k ->
                    NavigationDrawerItem(label = { Text(k.title) }, selected = false, onClick = {
                        createOpen = false
                        if (session.authenticated) onNavigate(Routes.create(k.path))
                        else app.auth.require(k.title.lowercase()) { onNavigate(Routes.create(k.path)) }
                    })
                }
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}
