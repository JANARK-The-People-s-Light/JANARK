import Foundation

/// Thin URLSession client mirroring Android `JanarkApi` + `NetworkModule`.
actor APIClient {
    static let sharedDecoder: JSONDecoder = {
        let d = JSONDecoder()
        // Unknown keys ignored via try/catch fallbacks; Codable structs use decodeIfPresent where needed.
        return d
    }()

    static let sharedEncoder: JSONEncoder = {
        let e = JSONEncoder()
        return e
    }()

    private var baseURL: String
    private let session: URLSession

    init(baseURL: String = SessionStore.defaultAPIBaseURL, session: URLSession? = nil) {
        self.baseURL = Self.normalizeBase(baseURL)
        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.default
            config.httpCookieStorage = HTTPCookieStorage.shared
            config.httpCookieAcceptPolicy = .always
            config.httpShouldSetCookies = true
            config.timeoutIntervalForRequest = 30
            config.timeoutIntervalForResource = 60
            self.session = URLSession(configuration: config)
        }
    }

    func rebuild(baseURL: String) {
        self.baseURL = Self.normalizeBase(baseURL)
    }

    func currentBase() -> String { baseURL }

    func clearCookies() {
        guard let url = URL(string: baseURL), let host = url.host else {
            HTTPCookieStorage.shared.cookies?.forEach { HTTPCookieStorage.shared.deleteCookie($0) }
            return
        }
        let cookies = HTTPCookieStorage.shared.cookies(for: url)
            ?? HTTPCookieStorage.shared.cookies?.filter { $0.domain.contains(host) }
            ?? []
        cookies.forEach { HTTPCookieStorage.shared.deleteCookie($0) }
    }

    // MARK: - Auth

    func requestOtp(body: [String: Any]) async -> Outcome<OtpRequestResponse> {
        await post("api/auth/phone/request", body: body, fallback: "Could not send OTP")
    }

    func verifyOtp(body: [String: Any]) async -> Outcome<OtpVerifyResponse> {
        await post("api/auth/phone/verify", body: body, fallback: "Invalid OTP")
    }

    func me() async -> Outcome<MeResponse> {
        await get("api/auth/me", fallback: "Not signed in")
    }

    func logout(body: [String: Any] = [:]) async -> Outcome<OkResponse> {
        await post("api/auth/logout", body: body, fallback: "Could not sign out")
    }

    // MARK: - Feed

    func feed(params: [String: String] = [:]) async -> Outcome<FeedResponse> {
        await get("api/feed", query: params, fallback: "Could not load feed")
    }

    func feedPost(id: String) async -> Outcome<FeedDetailResponse> {
        await get("api/feed/\(id)", fallback: "Post not found")
    }

    func createFeed(body: [String: Any]) async -> Outcome<CreateFeedResponse> {
        await post("api/feed", body: body, fallback: "Could not create post")
    }

    func patchFeed(id: String, body: [String: Any]) async -> Outcome<FeedDetailResponse> {
        await patch("api/feed/\(id)", body: body, fallback: "Could not save")
    }

    func deleteFeed(id: String) async -> Outcome<OkResponse> {
        await delete("api/feed/\(id)", fallback: "Could not delete")
    }

    func hashtags(q: String? = nil) async -> Outcome<HashtagsResponse> {
        var query: [String: String] = [:]
        if let q, !q.isEmpty { query["q"] = q }
        return await get("api/hashtags", query: query, fallback: "Could not load topics")
    }

    // MARK: - Demands

    func demands(params: [String: String] = [:]) async -> Outcome<DemandsResponse> {
        await get("api/demands", query: params, fallback: "Could not load petitions")
    }

    func demand(id: String) async -> Outcome<DemandDetailResponse> {
        await get("api/demands/\(id)", fallback: "Petition not found")
    }

    func createDemand(body: [String: Any]) async -> Outcome<CreateDemandResponse> {
        await post("api/demands", body: body, fallback: "Could not launch petition")
    }

    func signDemand(id: String, body: [String: Any]) async -> Outcome<DemandSignResponse> {
        await post("api/demands/\(id)", body: body, fallback: "Could not sign")
    }

    func patchDemand(id: String, body: [String: Any]) async -> Outcome<DemandDetailResponse> {
        await patch("api/demands/\(id)", body: body, fallback: "Could not save")
    }

    func deleteDemand(id: String) async -> Outcome<OkResponse> {
        await delete("api/demands/\(id)", fallback: "Could not delete")
    }

    // MARK: - Reports

    func reports(params: [String: String] = [:]) async -> Outcome<ReportsResponse> {
        await get("api/reports", query: params, fallback: "Could not load reports")
    }

    func report(id: String) async -> Outcome<ReportDetailResponse> {
        await get("api/reports/\(id)", fallback: "Report not found")
    }

    func createReport(body: [String: Any]) async -> Outcome<CreateReportResponse> {
        await post("api/reports", body: body, fallback: "Could not publish report")
    }

    func reactReport(id: String, body: [String: Any]) async -> Outcome<OkResponse> {
        await post("api/reports/\(id)", body: body, fallback: "Could not react")
    }

    func patchReport(id: String, body: [String: Any]) async -> Outcome<ReportDetailResponse> {
        await patch("api/reports/\(id)", body: body, fallback: "Could not save")
    }

    func deleteReport(id: String) async -> Outcome<OkResponse> {
        await delete("api/reports/\(id)", fallback: "Could not delete")
    }

    // MARK: - Issues

    func issues(category: String? = nil) async -> Outcome<IssuesResponse> {
        var query: [String: String] = [:]
        if let category, !category.isEmpty { query["category"] = category }
        return await get("api/issues", query: query, fallback: "Could not load issues")
    }

    func issue(slug: String) async -> Outcome<IssueDetailResponse> {
        await get("api/issues/\(slug)", fallback: "Issue not found")
    }

    func createIssue(body: [String: Any]) async -> Outcome<CreateIssueResponse> {
        await post("api/issues", body: body, fallback: "Could not raise issue")
    }

    // MARK: - Proposals / votes

    func proposals() async -> Outcome<ProposalsResponse> {
        await get("api/proposals", fallback: "Could not load votes")
    }

    func createProposal(body: [String: Any]) async -> Outcome<CreateProposalResponse> {
        await post("api/proposals", body: body, fallback: "Could not create vote")
    }

    func proposal(id: String) async -> Outcome<ProposalDto> {
        await get("api/votes/\(id)", fallback: "Vote not found")
    }

    func castBallot(id: String, body: [String: Any]) async -> Outcome<CastVoteResponse> {
        await post("api/votes/\(id)", body: body, fallback: "Could not cast vote")
    }

    func myBallot(proposalId: String) async -> Outcome<MyVoteResponse> {
        await get("api/votes/me", query: ["proposalId": proposalId], fallback: "Could not load your vote")
    }

    // MARK: - Shares

    func shares(q: String? = nil) async -> Outcome<SharesResponse> {
        var query: [String: String] = [:]
        if let q, !q.isEmpty { query["q"] = q }
        return await get("api/shares", query: query, fallback: "Could not load shares")
    }

    func share(id: String) async -> Outcome<ShareDetailResponse> {
        await get("api/shares/\(id)", fallback: "Share not found")
    }

    func createShare(body: [String: Any]) async -> Outcome<CreateShareResponse> {
        await post("api/shares", body: body, fallback: "Could not share")
    }

    func patchShare(id: String, body: [String: Any]) async -> Outcome<ShareDetailResponse> {
        await patch("api/shares/\(id)", body: body, fallback: "Could not save")
    }

    func deleteShare(id: String) async -> Outcome<OkResponse> {
        await delete("api/shares/\(id)", fallback: "Could not delete")
    }

    // MARK: - Notices

    func notices() async -> Outcome<NoticesResponse> {
        await get("api/notices", fallback: "Could not load notices")
    }

    func notice(id: String) async -> Outcome<NoticeDetailResponse> {
        await get("api/notices/\(id)", fallback: "Notice not found")
    }

    func createNotice(body: [String: Any]) async -> Outcome<CreateNoticeResponse> {
        await post("api/notices", body: body, fallback: "Could not publish notice")
    }

    func signNotice(id: String, body: [String: Any] = [:]) async -> Outcome<NoticeSignResponse> {
        await post("api/notices/\(id)", body: body, fallback: "Could not sign")
    }

    // MARK: - Discussions

    func discussions(issueSlug: String? = nil, feedPostId: String? = nil) async -> Outcome<DiscussionsResponse> {
        var query: [String: String] = [:]
        if let issueSlug, !issueSlug.isEmpty { query["issueSlug"] = issueSlug }
        if let feedPostId, !feedPostId.isEmpty { query["feedPostId"] = feedPostId }
        return await get("api/discussions", query: query, fallback: "Could not load discussions")
    }

    func createDiscussion(body: [String: Any]) async -> Outcome<CreateDiscussionResponse> {
        await post("api/discussions", body: body, fallback: "Could not start discussion")
    }

    // MARK: - Engage / comments / flags

    func engage(targetType: String, targetId: String) async -> Outcome<EngageCountsDto> {
        await get(
            "api/engage",
            query: ["targetType": targetType, "targetId": targetId],
            fallback: "Could not load reactions"
        )
    }

    func voteEngage(body: [String: Any]) async -> Outcome<EngageCountsDto> {
        await post("api/engage", body: body, fallback: "Could not vote")
    }

    func comments(targetType: String, targetId: String) async -> Outcome<CommentsResponse> {
        await get(
            "api/comments",
            query: ["targetType": targetType, "targetId": targetId],
            fallback: "Could not load comments"
        )
    }

    func postComment(body: [String: Any]) async -> Outcome<CommentsResponse> {
        await post("api/comments", body: body, fallback: "Could not comment")
    }

    func patchComment(id: String, body: [String: Any]) async -> Outcome<CommentsResponse> {
        await patch("api/comments/\(id)", body: body, fallback: "Could not edit")
    }

    func deleteComment(id: String) async -> Outcome<OkResponse> {
        await delete("api/comments/\(id)", fallback: "Could not delete")
    }

    func flag(body: [String: Any]) async -> Outcome<FlagResponse> {
        await post("api/flags", body: body, fallback: "Could not report")
    }

    // MARK: - Follow / profile / dashboard

    func followStatus(anonId: String, list: String? = nil) async -> Outcome<FollowResponse> {
        var query: [String: String] = ["anonId": anonId]
        if let list, !list.isEmpty { query["list"] = list }
        return await get("api/follow", query: query, fallback: "Could not load follow")
    }

    func follow(body: [String: Any]) async -> Outcome<FollowResponse> {
        await post("api/follow", body: body, fallback: "Could not follow")
    }

    func profile(anonId: String) async -> Outcome<ProfileResponse> {
        await get("api/profiles/\(anonId)", fallback: "Profile not found")
    }

    func dashboard(params: [String: String] = [:]) async -> Outcome<DashboardResponse> {
        await get("api/dashboard", query: params, fallback: "Could not load activity")
    }

    // MARK: - Social / telemetry / upload / memes

    func trackShare(body: [String: Any]) async -> Outcome<OkResponse> {
        await post("api/social/share", body: body, fallback: "Could not share")
    }

    func telemetry(body: [String: Any]) async -> Outcome<OkResponse> {
        await post("api/telemetry/visit", body: body, fallback: "Telemetry failed")
    }

    func upload(data: Data, filename: String, mime: String) async -> Outcome<UploadResponse> {
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mime)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        guard var request = makeRequest(path: "api/upload", method: "POST", query: [:]) else {
            return .err("Invalid URL")
        }
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        return await perform(request, fallback: "Upload failed")
    }

    func memes(params: [String: String] = [:]) async -> Outcome<MemesResponse> {
        await get("api/memes", query: params, fallback: "Could not load memes")
    }

    func meme(id: String) async -> Outcome<MemeDetailResponse> {
        await get("api/memes/\(id)", fallback: "Meme not found")
    }

    func createMeme(body: [String: Any]) async -> Outcome<CreateMemeResponse> {
        await post("api/memes", body: body, fallback: "Could not create meme")
    }

    // MARK: - Generic helpers

    func get<T: Decodable>(
        _ path: String,
        query: [String: String] = [:],
        fallback: String
    ) async -> Outcome<T> {
        guard let request = makeRequest(path: path, method: "GET", query: query) else {
            return .err("Invalid URL")
        }
        return await perform(request, fallback: fallback)
    }

    func post<T: Decodable>(
        _ path: String,
        body: [String: Any],
        fallback: String
    ) async -> Outcome<T> {
        guard var request = makeRequest(path: path, method: "POST", query: [:]) else {
            return .err("Invalid URL")
        }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            return .err(error.localizedDescription)
        }
        return await perform(request, fallback: fallback)
    }

    func patch<T: Decodable>(
        _ path: String,
        body: [String: Any],
        fallback: String
    ) async -> Outcome<T> {
        guard var request = makeRequest(path: path, method: "PATCH", query: [:]) else {
            return .err("Invalid URL")
        }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            return .err(error.localizedDescription)
        }
        return await perform(request, fallback: fallback)
    }

    func delete<T: Decodable>(
        _ path: String,
        fallback: String
    ) async -> Outcome<T> {
        guard let request = makeRequest(path: path, method: "DELETE", query: [:]) else {
            return .err("Invalid URL")
        }
        return await perform(request, fallback: fallback)
    }

    // MARK: - Internals

    private func makeRequest(path: String, method: String, query: [String: String]) -> URLRequest? {
        let root = baseURL.hasSuffix("/") ? String(baseURL.dropLast()) : baseURL
        let cleanedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        var components = URLComponents(string: "\(root)/\(cleanedPath)")
        let filtered = query.filter { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if !filtered.isEmpty {
            components?.queryItems = filtered.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components?.url else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = method
        let origin = Self.canonicalOriginForHeaders(baseURL)
        request.setValue(origin, forHTTPHeaderField: "Origin")
        request.setValue("\(origin)/", forHTTPHeaderField: "Referer")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Janark-iOS/1.0", forHTTPHeaderField: "User-Agent")
        return request
    }

    private func perform<T: Decodable>(_ request: URLRequest, fallback: String) async -> Outcome<T> {
        do {
            let (data, response) = try await session.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if (200..<300).contains(status) {
                do {
                    let decoded = try Self.decode(T.self, from: data)
                    return .ok(decoded)
                } catch {
                    return .err(error.localizedDescription, unauthorized: false, status: status)
                }
            }
            let message = Self.parseError(data, fallback: fallback)
            return .err(message, unauthorized: status == 401, status: status)
        } catch {
            return .err(error.localizedDescription)
        }
    }

    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try sharedDecoder.decode(T.self, from: data)
        } catch {
            // Retry after stripping unknown-null quirks: empty body → empty object
            if data.isEmpty || String(data: data, encoding: .utf8) == "null" {
                return try sharedDecoder.decode(T.self, from: Data("{}".utf8))
            }
            throw error
        }
    }

    static func parseError(_ data: Data, fallback: String) -> String {
        if data.isEmpty { return fallback }
        if let body = try? sharedDecoder.decode(ErrorBody.self, from: data) {
            if let e = body.error, !e.isEmpty { return e }
            if let m = body.message, !m.isEmpty { return m }
        }
        let raw = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if raw.isEmpty { return fallback }
        return String(raw.prefix(180))
    }

    static func normalizeBase(_ url: String) -> String {
        var cleaned = url.trimmingCharacters(in: .whitespacesAndNewlines)
        while cleaned.hasSuffix("/") { cleaned = String(cleaned.dropLast()) }
        return cleaned
    }

    /// Map emulator / alternate loopback hosts to localhost for Origin allowlists.
    static func canonicalOriginForHeaders(_ baseUrl: String) -> String {
        let normalized = normalizeBase(baseUrl)
        guard var components = URLComponents(string: normalized) else { return normalized }
        let host = components.host ?? ""
        if host == "10.0.2.2" || host == "10.0.3.2" {
            components.host = "localhost"
        }
        if let port = components.port {
            let scheme = components.scheme ?? "http"
            let defaultPort = scheme == "https" ? 443 : 80
            if port == defaultPort {
                components.port = nil
            }
        }
        return components.string ?? normalized
    }
}

// MARK: - Payload helpers (mirror Android JsonBody.kt)

enum JSONPayload {
    static func write(_ extra: (inout [String: Any]) -> Void = { _ in }) -> [String: Any] {
        var body: [String: Any] = [
            "acceptedTerms": true,
            "termsVersion": TERMS_VERSION,
            "website": "",
        ]
        extra(&body)
        return body
    }

    static func putIf(_ body: inout [String: Any], _ key: String, _ value: String?) {
        if let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body[key] = value
        }
    }

    static func putList(_ body: inout [String: Any], _ key: String, _ values: [String]) {
        body[key] = values
    }
}
