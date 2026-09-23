package org.janark.app.ui.nav

object Routes {
    const val Home = "home"
    const val Petitions = "petitions"
    const val Reports = "reports"
    const val Issues = "issues"
    const val Votes = "votes"
    const val Discussions = "discussions"
    const val Memes = "memes"
    const val Notices = "notices"
    const val Profile = "profile"
    const val Activity = "activity"
    const val Settings = "settings"
    const val About = "about"
    const val Terms = "terms"
    const val Login = "login"

    const val PetitionDetail = "petition/{id}"
    const val ReportDetail = "report/{id}"
    const val IssueDetail = "issue/{slug}"
    const val VoteDetail = "vote/{id}"
    const val DiscussionDetail = "discussion/{id}"
    const val ShareDetail = "share/{id}"
    const val NoticeDetail = "notice/{id}"
    const val MemeDetail = "meme/{id}"
    const val PublicPost = "p/{publicId}"
    const val ProfileUser = "u/{anonId}"
    const val Create = "create/{kind}"
    const val FollowList = "follow/{anonId}/{list}"

    fun petition(id: String) = "petition/$id"
    fun report(id: String) = "report/$id"
    fun issue(slug: String) = "issue/$slug"
    fun vote(id: String) = "vote/$id"
    fun discussion(id: String) = "discussion/$id"
    fun share(id: String) = "share/$id"
    fun notice(id: String) = "notice/$id"
    fun meme(id: String) = "meme/$id"
    fun publicPost(id: String) = "p/$id"
    fun profile(anonId: String) = "u/$anonId"
    fun create(kind: String) = "create/$kind"
    fun followList(anonId: String, list: String) = "follow/$anonId/$list"
}

enum class CreateKind(val path: String, val title: String, val prompt: String) {
    Share("share", "Share", "Share something with your community"),
    Report("report", "Report", "What happened?"),
    Issue("issue", "Issue", "What’s the issue?"),
    Petition("petition", "Petition", "What should change?"),
    Vote("vote", "Vote", "What question should people vote on?"),
    Discussion("discussion", "Discussion", "What would you like to discuss?"),
    Notice("notice", "Notice", "What should people know?"),
    Meme("meme", "Meme", "Share a civic meme"),
    ;

    companion object {
        fun from(path: String) = entries.firstOrNull { it.path == path } ?: Discussion
    }
}
