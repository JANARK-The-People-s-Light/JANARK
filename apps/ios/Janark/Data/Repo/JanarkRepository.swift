import Foundation

@MainActor
final class JanarkRepository {
    private let session: SessionStore
    private let api: APIClient

    init(session: SessionStore, api: APIClient) {
        self.session = session
        self.api = api
    }

    private func syncBase() async {
        await api.rebuild(baseURL: session.currentApiBase())
    }

    // MARK: - Auth

    func requestOtp(phone: String) async -> Outcome<OtpRequestResponse> {
        await syncBase()
        let body = JSONPayload.write { $0["phone"] = phone }
        let r: Outcome<OtpRequestResponse> = await api.requestOtp(body: body)
        switch r {
        case .ok(let value):
            return (value.ok == true) ? .ok(value) : .err(value.error ?? "Could not send OTP")
        case .err(let message, let unauthorized, let status):
            return .err(message, unauthorized: unauthorized, status: status)
        }
    }

    func verifyOtp(phone: String, code: String) async -> Outcome<UiSession> {
        await syncBase()
        let visitor = session.visitorId()
        let body = JSONPayload.write {
            $0["phone"] = phone
            $0["code"] = code
            $0["visitorId"] = visitor
        }
        let r = await api.verifyOtp(body: body)
        switch r {
        case .ok(let value):
            if value.ok == true, let s = value.session {
                session.setSession(anonId: s.anonId, hint: s.hint, authenticated: true)
                return .ok(UiSession(authenticated: true, anonId: s.anonId, hint: s.hint))
            }
            return .err(value.error ?? "Invalid OTP")
        case .err(let message, let unauthorized, let status):
            return .err(message, unauthorized: unauthorized, status: status)
        }
    }

    func refreshMe() async -> Outcome<MeResponse> {
        await syncBase()
        let r = await api.me()
        switch r {
        case .ok(let value):
            if let s = value.session {
                session.setSession(anonId: s.anonId, hint: s.hint, authenticated: s.authenticated == true)
            }
        case .err(_, let unauthorized, _) where unauthorized:
            session.clearSession()
        default:
            break
        }
        return r
    }

    func logout() async -> Outcome<OkResponse> {
        await syncBase()
        let r = await api.logout()
        await api.clearCookies()
        session.clearSession()
        return r
    }

    /// Drop local session + cookies without hitting the old host (e.g. after API base change).
    func logoutLocal() async {
        await api.clearCookies()
        session.clearSession()
    }

    // MARK: - Feed

    func loadFeed(_ params: [String: String] = [:]) async -> Outcome<FeedResponse> {
        await syncBase()
        return await api.feed(params: params.filter { !$0.value.isEmpty })
    }

    func loadFeed(params: [String: String]) async -> Outcome<FeedResponse> {
        await loadFeed(params)
    }

    func loadFeedPost(id: String) async -> Outcome<FeedDetailResponse> {
        await syncBase()
        return await api.feedPost(id: id)
    }

    func loadHashtags(q: String? = nil) async -> Outcome<HashtagsResponse> {
        await syncBase()
        return await api.hashtags(q: q)
    }

    // MARK: - Demands

    func loadDemands(_ params: [String: String] = [:]) async -> Outcome<DemandsResponse> {
        await syncBase()
        return await api.demands(params: params.filter { !$0.value.isEmpty })
    }

    func loadDemand(id: String) async -> Outcome<DemandDetailResponse> {
        await syncBase()
        return await api.demand(id: id)
    }

    func signDemand(id: String, name: String, pin: String, phone: String) async -> Outcome<DemandSignResponse> {
        await syncBase()
        let body = JSONPayload.write {
            $0["fullName"] = name
            $0["postalCode"] = pin
            $0["phone"] = phone
        }
        return await api.signDemand(id: id, body: body)
    }

    /// UI-friendly labels matching form fields.
    func signDemand(id: String, fullName: String, postalCode: String, phone: String) async -> Outcome<DemandSignResponse> {
        await signDemand(id: id, name: fullName, pin: postalCode, phone: phone)
    }

    func deleteDemand(id: String) async -> Outcome<OkResponse> {
        await syncBase()
        return await api.deleteDemand(id: id)
    }

    func patchDemand(id: String, fields: [String: String]) async -> Outcome<DemandDetailResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
        }
        return await api.patchDemand(id: id, body: body)
    }

    func createDemand(fields: [String: String], hashtags: [String], mediaUrl: String?, mediaType: String?) async -> Outcome<CreateDemandResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createDemand(body: body)
    }

    // MARK: - Reports

    func loadReports(_ params: [String: String] = [:]) async -> Outcome<ReportsResponse> {
        await syncBase()
        return await api.reports(params: params.filter { !$0.value.isEmpty })
    }

    func loadReport(id: String) async -> Outcome<ReportDetailResponse> {
        await syncBase()
        return await api.report(id: id)
    }

    func reactReport(id: String, reaction: String) async -> Outcome<OkResponse> {
        await syncBase()
        let body = JSONPayload.write {
            $0["action"] = "react"
            $0["reaction"] = reaction
        }
        return await api.reactReport(id: id, body: body)
    }

    func deleteReport(id: String) async -> Outcome<OkResponse> {
        await syncBase()
        return await api.deleteReport(id: id)
    }

    func patchReport(id: String, fields: [String: String]) async -> Outcome<ReportDetailResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
        }
        return await api.patchReport(id: id, body: body)
    }

    func createReport(fields: [String: String], hashtags: [String], mediaUrl: String?, mediaType: String?) async -> Outcome<CreateReportResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createReport(body: body)
    }

    // MARK: - Issues

    func loadIssues(category: String? = nil) async -> Outcome<IssuesResponse> {
        await syncBase()
        return await api.issues(category: category)
    }

    func loadIssue(slug: String) async -> Outcome<IssueDetailResponse> {
        await syncBase()
        return await api.issue(slug: slug)
    }

    func createIssue(fields: [String: String], hashtags: [String], mediaUrl: String?, mediaType: String?) async -> Outcome<CreateIssueResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createIssue(body: body)
    }

    // MARK: - Votes / proposals

    func loadProposals() async -> Outcome<ProposalsResponse> {
        await syncBase()
        return await api.proposals()
    }

    func loadProposal(id: String) async -> Outcome<ProposalDto> {
        await syncBase()
        return await api.proposal(id: id)
    }

    func myBallot(id: String) async -> Outcome<MyVoteResponse> {
        await syncBase()
        return await api.myBallot(proposalId: id)
    }

    func castBallot(id: String, choice: Any) async -> Outcome<CastVoteResponse> {
        await syncBase()
        let body = JSONPayload.write { $0["choice"] = choice }
        return await api.castBallot(id: id, body: body)
    }

    func createVote(
        fields: [String: String],
        options: [String],
        hashtags: [String],
        mediaUrl: String?,
        mediaType: String?
    ) async -> Outcome<CreateProposalResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
            if !options.isEmpty { JSONPayload.putList(&b, "options", options) }
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createProposal(body: body)
    }

    // MARK: - Shares

    func loadShare(id: String) async -> Outcome<ShareDetailResponse> {
        await syncBase()
        return await api.share(id: id)
    }

    func createShare(
        caption: String,
        mediaUrl: String,
        mediaType: String?,
        locationLabel: String?,
        hashtags: [String],
        city: String? = nil,
        district: String? = nil,
        state: String? = nil,
        issueSlug: String? = nil,
        petitionId: String? = nil
    ) async -> Outcome<CreateShareResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            b["caption"] = caption
            b["mediaUrl"] = mediaUrl
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putIf(&b, "locationLabel", locationLabel)
            JSONPayload.putIf(&b, "city", city)
            JSONPayload.putIf(&b, "district", district)
            JSONPayload.putIf(&b, "state", state)
            JSONPayload.putIf(&b, "issueSlug", issueSlug)
            JSONPayload.putIf(&b, "petitionId", petitionId)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createShare(body: body)
    }

    func patchShare(id: String, caption: String) async -> Outcome<ShareDetailResponse> {
        await syncBase()
        let body = JSONPayload.write { $0["caption"] = caption }
        return await api.patchShare(id: id, body: body)
    }

    func deleteShare(id: String) async -> Outcome<OkResponse> {
        await syncBase()
        return await api.deleteShare(id: id)
    }

    // MARK: - Notices / discussions / memes

    func loadNotice(id: String) async -> Outcome<NoticeDetailResponse> {
        await syncBase()
        return await api.notice(id: id)
    }

    func loadNotices() async -> Outcome<NoticesResponse> {
        await syncBase()
        return await api.notices()
    }

    func signNotice(id: String) async -> Outcome<NoticeSignResponse> {
        await syncBase()
        return await api.signNotice(id: id, body: JSONPayload.write())
    }

    func createNotice(fields: [String: String], mediaUrl: String?, mediaType: String?) async -> Outcome<CreateNoticeResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            for (k, v) in fields { JSONPayload.putIf(&b, k, v) }
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
        }
        return await api.createNotice(body: body)
    }

    func loadDiscussions(feedPostId: String? = nil, issueSlug: String? = nil) async -> Outcome<DiscussionsResponse> {
        await syncBase()
        return await api.discussions(issueSlug: issueSlug, feedPostId: feedPostId)
    }

    func createDiscussion(
        title: String,
        body: String,
        kind: String,
        hashtags: [String],
        mediaUrl: String?,
        mediaType: String?,
        locationLevel: String?,
        city: String?,
        district: String?,
        state: String?,
        country: String?
    ) async -> Outcome<CreateDiscussionResponse> {
        await syncBase()
        let payload = JSONPayload.write { b in
            b["title"] = title
            b["body"] = body
            b["kind"] = kind
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
            JSONPayload.putIf(&b, "locationLevel", locationLevel)
            JSONPayload.putIf(&b, "city", city)
            JSONPayload.putIf(&b, "district", district)
            JSONPayload.putIf(&b, "state", state)
            JSONPayload.putIf(&b, "country", country)
            JSONPayload.putList(&b, "hashtags", hashtags)
        }
        return await api.createDiscussion(body: payload)
    }

    func loadMeme(id: String) async -> Outcome<MemeDetailResponse> {
        await syncBase()
        return await api.meme(id: id)
    }

    func loadMemes(params: [String: String] = [:]) async -> Outcome<MemesResponse> {
        await syncBase()
        return await api.memes(params: params)
    }

    func createMeme(title: String, caption: String?, imageUrl: String, tags: [String]) async -> Outcome<CreateMemeResponse> {
        await syncBase()
        let payload = JSONPayload.write { b in
            b["title"] = title
            JSONPayload.putIf(&b, "caption", caption)
            b["imageUrl"] = imageUrl
            JSONPayload.putList(&b, "tags", tags)
        }
        return await api.createMeme(body: payload)
    }

    // MARK: - Engage / comments

    func engage(targetType: String, targetId: String) async -> Outcome<EngageCountsDto> {
        await syncBase()
        return await api.engage(targetType: targetType, targetId: targetId)
    }

    func voteEngage(targetType: String, targetId: String, choice: String) async -> Outcome<EngageCountsDto> {
        await syncBase()
        let body = JSONPayload.write {
            $0["targetType"] = targetType
            $0["targetId"] = targetId
            $0["choice"] = choice
        }
        return await api.voteEngage(body: body)
    }

    func comments(targetType: String, targetId: String) async -> Outcome<CommentsResponse> {
        await syncBase()
        return await api.comments(targetType: targetType, targetId: targetId)
    }

    func postComment(
        targetType: String,
        targetId: String,
        body: String,
        parentId: String? = nil,
        mediaUrl: String? = nil,
        mediaType: String? = nil
    ) async -> Outcome<CommentsResponse> {
        await syncBase()
        let payload = JSONPayload.write { b in
            b["targetType"] = targetType
            b["targetId"] = targetId
            b["body"] = body
            JSONPayload.putIf(&b, "parentId", parentId)
            JSONPayload.putIf(&b, "mediaUrl", mediaUrl)
            JSONPayload.putIf(&b, "mediaType", mediaType)
        }
        return await api.postComment(body: payload)
    }

    func editComment(id: String, body: String) async -> Outcome<CommentsResponse> {
        await syncBase()
        let payload = JSONPayload.write { $0["body"] = body }
        return await api.patchComment(id: id, body: payload)
    }

    func deleteComment(id: String) async -> Outcome<OkResponse> {
        await syncBase()
        return await api.deleteComment(id: id)
    }

    // MARK: - Flags / follow / profile / dashboard

    func flag(targetType: String, targetId: String, reason: String, detail: String?) async -> Outcome<FlagResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            b["targetType"] = targetType
            b["targetId"] = targetId
            b["reason"] = reason
            JSONPayload.putIf(&b, "detail", detail)
        }
        return await api.flag(body: body)
    }

    func followStatus(anonId: String, list: String? = nil) async -> Outcome<FollowResponse> {
        await syncBase()
        return await api.followStatus(anonId: anonId, list: list)
    }

    func toggleFollow(anonId: String, action: String = "toggle") async -> Outcome<FollowResponse> {
        await syncBase()
        let body = JSONPayload.write {
            $0["anonId"] = anonId
            $0["action"] = action
        }
        return await api.follow(body: body)
    }

    func profile(anonId: String) async -> Outcome<ProfileResponse> {
        await syncBase()
        return await api.profile(anonId: anonId)
    }

    func dashboard(_ params: [String: String] = [:]) async -> Outcome<DashboardResponse> {
        await syncBase()
        return await api.dashboard(params: params.filter { !$0.value.isEmpty })
    }

    func trackShare(platform: String, path: String, title: String?) async -> Outcome<OkResponse> {
        await trackShare(channel: platform, path: path, title: title)
    }

    func trackShare(channel: String, path: String, title: String?) async -> Outcome<OkResponse> {
        await syncBase()
        let body = JSONPayload.write { b in
            b["platform"] = channel
            b["path"] = path
            JSONPayload.putIf(&b, "title", title)
        }
        return await api.trackShare(body: body)
    }

    // MARK: - Feed patch/delete

    func patchFeed(id: String, title: String, body: String) async -> Outcome<FeedDetailResponse> {
        await syncBase()
        let payload = JSONPayload.write {
            $0["title"] = title
            $0["excerpt"] = body
            $0["body"] = body
        }
        return await api.patchFeed(id: id, body: payload)
    }

    func deleteFeed(id: String) async -> Outcome<OkResponse> {
        await syncBase()
        return await api.deleteFeed(id: id)
    }

    // MARK: - Upload / telemetry / terms

    func upload(data: Data, filename: String, mimeType: String) async -> Outcome<UploadResponse> {
        await syncBase()
        if data.count > 8 * 1024 * 1024 {
            return .err("File must be under 8 MB")
        }
        return await api.upload(data: data, filename: filename, mime: mimeType)
    }

    func upload(_ data: Data, filename: String, mime: String) async -> Outcome<UploadResponse> {
        await upload(data: data, filename: filename, mimeType: mime)
    }

    func pingVisit() async {
        await syncBase()
        let body = JSONPayload.write {
            $0["visitorId"] = session.visitorId()
            $0["path"] = "/ios"
        }
        _ = await api.telemetry(body: body)
    }

    @discardableResult
    func acceptTerms() async -> Bool {
        session.acceptTerms(TERMS_VERSION)
        return true
    }
}
