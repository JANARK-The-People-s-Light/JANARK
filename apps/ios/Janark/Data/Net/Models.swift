import Foundation

// MARK: - Flexible decoding helpers

/// Decodes JSON string, number, or null into String?.
@propertyWrapper
struct FlexString: Codable, Hashable, Sendable {
    var wrappedValue: String?

    init(wrappedValue: String? = nil) {
        self.wrappedValue = wrappedValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            wrappedValue = nil
        } else if let s = try? container.decode(String.self) {
            wrappedValue = s
        } else if let i = try? container.decode(Int.self) {
            wrappedValue = String(i)
        } else if let d = try? container.decode(Double.self) {
            wrappedValue = String(d)
        } else if let b = try? container.decode(Bool.self) {
            wrappedValue = b ? "true" : "false"
        } else {
            wrappedValue = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(wrappedValue)
    }
}

extension KeyedDecodingContainer {
    func decode(_ type: FlexString.Type, forKey key: Key) throws -> FlexString {
        if let v = try decodeIfPresent(FlexString.self, forKey: key) {
            return v
        }
        return FlexString(wrappedValue: nil)
    }
}


// MARK: - Lenient keyed decode (missing keys → defaults)

extension KeyedDecodingContainer {
    func decodeDefault<T: Decodable>(_ type: T.Type, forKey key: Key, default defaultValue: T) throws -> T {
        try decodeIfPresent(type, forKey: key) ?? defaultValue
    }
}


// MARK: - Auth / session

struct ErrorBody: Codable, Sendable {
    var error: String?
    var message: String?
}

struct SessionPayload: Codable, Sendable {
    var hint: String?
    var anonId: String?
    @DefaultTrue var anonymous: Bool
    @DefaultFalse var authenticated: Bool
}

struct MeResponse: Codable, Sendable {
    var session: SessionPayload?
    var error: String?
}

struct OtpRequestResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    var hint: String?
    var expiresInSec: Int?
    var message: String?
    var devCode: String?
    var error: String?
}

struct OtpVerifyResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    var session: SessionPayload?
    var message: String?
    var error: String?
}

struct OkResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    var error: String?
    var message: String?
}

// MARK: - Shared bits

struct HashtagDto: Codable, Sendable, Identifiable {
    var id: String { tag }
    var tag: String
    @DefaultZero var count: Int
}

struct LocationsDto: Codable, Sendable {
    @DefaultEmptyArray var countries: [String]
    @DefaultEmptyArray var states: [String]
    @DefaultEmptyArray var districts: [String]
    @DefaultEmptyArray var cities: [String]
}

struct RankingDto: Codable, Sendable {
    var model: String?
    var mode: String?
    var scored: Int?
    var note: String?
}

// MARK: - Feed

struct FeedPostDto: Codable, Sendable, Identifiable {
    var id: String
    var publicId: String?
    var type: String? = "discussion"
    @DefaultEmpty var title: String
    var excerpt: String?
    var body: String?
    var href: String?
    var meta: String?
    @DefaultZero var votes: Int
    @DefaultFalse var hot: Bool
    var author: String?
    var authorAnonId: String?
    @DefaultEmptyArray var tags: [String]
    var refId: String?
    var mediaUrl: String?
    var mediaType: String?
    var locationLevel: String?
    var village: String?
    var town: String?
    var city: String?
    var district: String?
    var state: String?
    var country: String?
    @FlexString var createdAt: String?
    var civicScore: Double?
}

struct FeedResponse: Codable, Sendable {
    var posts: [FeedPostDto]
    var hashtags: [HashtagDto]
    var typeCounts: [String: Int]
    var locations: LocationsDto
    var sort: String?
    var ranking: RankingDto?
    var type: String?
    var tag: String?
    var q: String?
    var error: String?

    enum CodingKeys: String, CodingKey {
        case posts, hashtags, typeCounts, locations, sort, ranking, type, tag, q, error
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        posts = try c.decodeIfPresent([FeedPostDto].self, forKey: .posts) ?? []
        hashtags = try c.decodeIfPresent([HashtagDto].self, forKey: .hashtags) ?? []
        typeCounts = try c.decodeIfPresent([String: Int].self, forKey: .typeCounts) ?? [:]
        locations = try c.decodeIfPresent(LocationsDto.self, forKey: .locations) ?? LocationsDto()
        sort = try c.decodeIfPresent(String.self, forKey: .sort)
        ranking = try c.decodeIfPresent(RankingDto.self, forKey: .ranking)
        type = try c.decodeIfPresent(String.self, forKey: .type)
        tag = try c.decodeIfPresent(String.self, forKey: .tag)
        q = try c.decodeIfPresent(String.self, forKey: .q)
        error = try c.decodeIfPresent(String.self, forKey: .error)
    }
}

struct FeedDetailResponse: Codable, Sendable {
    var post: FeedPostDto?
    @DefaultFalse var isMine: Bool
    var error: String?
}

struct HashtagsResponse: Codable, Sendable {
    @DefaultEmptyArray var hashtags: [HashtagDto]
}

struct CreateFeedResponse: Codable, Sendable {
    var post: FeedPostDto?
    var error: String?
}

// MARK: - Demands / petitions

struct DemandDto: Codable, Sendable, Identifiable {
    var id: String
    var publicId: String?
    @DefaultEmpty var title: String
    @DefaultEmpty var body: String
    @DefaultEmpty var ask: String
    var target: String? = "government"
    var targetDetail: String?
    var category: String?
    var status: String? = "open"
    var locationLevel: String?
    var village: String?
    var town: String?
    var city: String?
    var block: String?
    var district: String?
    var state: String?
    var country: String?
    var authorLabel: String?
    var authorAnonId: String?
    var mediaUrl: String?
    var mediaType: String?
    @DefaultZero var supportCount: Int
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var commentCount: Int
    var locationLabel: String?
    @FlexString var createdAt: String?
}

struct DemandsResponse: Codable, Sendable {
    @DefaultEmptyArray var demands: [DemandDto]
    var error: String?
}

struct DemandDetailResponse: Codable, Sendable {
    var demand: DemandDto?
    @DefaultFalse var supportedByMe: Bool
    @DefaultFalse var isMine: Bool
    var error: String?
}

struct DemandSignResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    @DefaultFalse var alreadySupported: Bool
    var demand: DemandDto?
    var error: String?
}

struct CreateDemandResponse: Codable, Sendable {
    var demand: DemandDto?
    var error: String?
}

// MARK: - Reports

struct ReportDto: Codable, Sendable, Identifiable {
    var id: String
    var publicId: String?
    var type: String? = "problem"
    @DefaultEmpty var title: String
    @DefaultEmpty var body: String
    var locationLevel: String?
    var village: String?
    var town: String?
    var city: String?
    var block: String?
    var district: String?
    var state: String?
    var country: String?
    var authorLabel: String?
    var authorAnonId: String?
    var mediaUrl: String?
    var mediaType: String?
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var commentCount: Int
    @DefaultZero var shareCount: Int
    var locationLabel: String?
    @DefaultEmptyDict var reactionCounts: [String: Int]
    @DefaultZero var voteCount: Int
    @DefaultZero var reactionTotal: Int
    @FlexString var createdAt: String?
}

struct ReportsResponse: Codable, Sendable {
    @DefaultEmptyArray var reports: [ReportDto]
    var error: String?
}

struct ReportDetailResponse: Codable, Sendable {
    var report: ReportDto?
    @DefaultFalse var isMine: Bool
    var error: String?
}

struct CreateReportResponse: Codable, Sendable {
    var report: ReportDto?
    var error: String?
}

// MARK: - Issues

struct SourceDto: Codable, Sendable {
    @DefaultEmpty var label: String
    @DefaultEmpty var url: String
}

struct IssueDto: Codable, Sendable, Identifiable {
    var id: String { slug }
    var slug: String
    @DefaultEmpty var title: String
    @DefaultEmpty var category: String
    @DefaultEmpty var summary: String
    @DefaultEmpty var whyItMatters: String
    @DefaultEmpty var currentSituation: String
    @DefaultEmptyArray var pros: [String]
    @DefaultEmptyArray var cons: [String]
    @DefaultEmptyArray var sources: [SourceDto]
    @DefaultEmptyArray var relatedSlugs: [String]
    @DefaultZero var voteCount: Int
    @DefaultZeroDouble var rating: Double
    var trendingRank: Int?
    var mediaUrl: String?
    var mediaType: String?
    var publicId: String?
}

struct IssuesResponse: Codable, Sendable {
    @DefaultEmptyArray var issues: [IssueDto]
    var error: String?
}

struct IssueDiscussionDto: Codable, Sendable, Identifiable {
    var id: String
    var author: String?
    @DefaultEmpty var body: String
    @DefaultZero var upvotes: Int
    var kind: String? = "opinion"
    var createdAt: String?
    var source: String?
}

struct IssueDetailResponse: Codable, Sendable {
    var issue: IssueDto?
    @DefaultEmptyArray var discussions: [IssueDiscussionDto]
    @DefaultEmptyArray var proposals: [ProposalDto]
    @DefaultEmptyArray var related: [IssueDto]
    var error: String?
}

struct CreateIssueResponse: Codable, Sendable {
    var issue: IssueDto?
    var error: String?
}

// MARK: - Proposals / votes

struct ProposalDto: Codable, Sendable, Identifiable {
    var id: String
    @DefaultEmpty var title: String
    @DefaultEmpty var description: String
    @DefaultEmptyArray var benefits: [String]
    @DefaultEmptyArray var argumentsFor: [String]
    @DefaultEmptyArray var argumentsAgainst: [String]
    var voteType: String? = "likert"
    var options: [String]?
    var results: [String: Double]?
    @DefaultZero var totalVotes: Int
    var liveVotes: Int?
    var issueSlug: String?
    var mediaUrl: String?
    var mediaType: String?
    var publicId: String?
    var locationLevel: String?
    var town: String?
    var city: String?
    var district: String?
    var state: String?
    var country: String?
}

struct ProposalsResponse: Codable, Sendable {
    @DefaultEmptyArray var proposals: [ProposalDto]
    var error: String?
}

struct MyVoteDto: Codable, Sendable {
    var id: String?
    /// Flexible choice payload (string, array, or object) — kept as raw JSON string when complex.
    var choice: AnyCodable?
}

struct MyVoteResponse: Codable, Sendable {
    var vote: MyVoteDto?
    var error: String?
}

struct CastVoteResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    @DefaultZero var liveVotes: Int
    var results: [String: Double]?
    var error: String?
}

struct CreateProposalResponse: Codable, Sendable {
    var proposal: ProposalDto?
    var error: String?
}

// MARK: - Shares

struct ShareDto: Codable, Sendable, Identifiable {
    var id: String
    var publicId: String?
    @DefaultEmpty var caption: String
    @DefaultEmpty var mediaUrl: String
    var mediaType: String?
    var locationLabel: String?
    var city: String?
    var district: String?
    var state: String?
    var country: String?
    var issueSlug: String?
    var petitionId: String?
    var authorLabel: String?
    var authorAnonId: String?
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var commentCount: Int
    @FlexString var createdAt: String?
}

struct SharesResponse: Codable, Sendable {
    @DefaultEmptyArray var shares: [ShareDto]
}

struct ShareDetailResponse: Codable, Sendable {
    var share: ShareDto?
    var feedPostId: String?
    @DefaultFalse var isMine: Bool
    var error: String?
}

struct CreateShareResponse: Codable, Sendable {
    var share: ShareDto?
    var error: String?
}

// MARK: - Notices

struct NoticeDto: Codable, Sendable, Identifiable {
    var id: String
    var publicId: String?
    @DefaultEmpty var title: String
    @DefaultEmpty var description: String
    var target: String? = "national"
    var targetDetail: String?
    var author: String?
    var authorAnonId: String?
    var category: String?
    @DefaultZero var signatures: Int
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var commentCount: Int
    var mediaUrl: String?
    var mediaType: String?
    @FlexString var createdAt: String?
}

struct NoticesResponse: Codable, Sendable {
    @DefaultEmptyArray var notices: [NoticeDto]
}

struct NoticeDetailResponse: Codable, Sendable {
    var notice: NoticeDto?
    var error: String?
}

struct NoticeSignResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    var notice: NoticeDto?
    @DefaultFalse var alreadySigned: Bool
    var error: String?
}

struct CreateNoticeResponse: Codable, Sendable {
    var notice: NoticeDto?
    var error: String?
}

// MARK: - Discussions

struct DiscussionDto: Codable, Sendable, Identifiable {
    var id: String
    var issueSlug: String?
    var feedPostId: String?
    var author: String?
    var authorAnonId: String?
    @DefaultEmpty var body: String
    var kind: String? = "opinion"
    @DefaultZero var upvotes: Int
    var mediaUrl: String?
    var mediaType: String?
    var publicId: String?
    var href: String?
    @FlexString var createdAt: String?
}

struct DiscussionsResponse: Codable, Sendable {
    @DefaultEmptyArray var discussions: [DiscussionDto]
}

struct CreateDiscussionResponse: Codable, Sendable {
    var discussion: DiscussionDto?
    var publicId: String?
    var href: String?
    var error: String?
}

// MARK: - Engage / comments / flags

struct EngageCountsDto: Codable, Sendable {
    @DefaultFalse var ok: Bool
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var commentCount: Int
    @DefaultZero var score: Int
    var myVote: Int?
    var targetType: String?
    var targetId: String?
    var error: String?
}

struct CommentDto: Codable, Sendable, Identifiable {
    var id: String
    @DefaultEmpty var body: String
    var authorLabel: String?
    var authorAnonId: String?
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var score: Int
    var myVote: Int?
    @DefaultFalse var isMine: Bool
    @FlexString var createdAt: String?
    var updatedAt: String?
    var parentId: String?
    var mediaUrl: String?
    var mediaType: String?
    @DefaultEmptyArray var replies: [CommentDto]
}

struct CommentsResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    @DefaultEmptyArray var comments: [CommentDto]
    var comment: CommentDto?
    var error: String?
}

struct FlagResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    @DefaultFalse var alreadyReported: Bool
    var message: String?
    var error: String?
}

// MARK: - Follow / profile

struct FollowPersonDto: Codable, Sendable, Identifiable {
    var id: String { anonId }
    var anonId: String
    var label: String?
}

struct FollowResponse: Codable, Sendable {
    var anonId: String?
    @DefaultZero var followers: Int
    @DefaultZero var followingCount: Int
    @DefaultFalse var viewerFollows: Bool
    @DefaultFalse var isSelf: Bool
    var viewerAnonId: String?
    @DefaultEmptyArray var people: [FollowPersonDto]
    var list: String?
    var following: Bool?
    @DefaultFalse var ok: Bool
    var error: String?
}

struct ProfilePostItem: Codable, Sendable {
    var id: String?
    var title: String?
    var body: String?
    var ask: String?
    var caption: String?
    var href: String?
    var type: String?
    var kind: String?
    var authorLabel: String?
    var authorAnonId: String?
    var upvotes: Int?
    var supportCount: Int?
    var signatures: Int?
    var issueSlug: String?
    var feedPostId: String?
    @FlexString var createdAt: String?

    var stableId: String { id ?? href ?? title ?? UUID().uuidString }
}

struct ProfilePostsDto: Codable, Sendable {
    @DefaultEmptyArray var memes: [ProfilePostItem]
    @DefaultEmptyArray var reports: [ProfilePostItem]
    @DefaultEmptyArray var demands: [ProfilePostItem]
    @DefaultEmptyArray var notices: [ProfilePostItem]
    @DefaultEmptyArray var discussions: [ProfilePostItem]
    @DefaultEmptyArray var shares: [ProfilePostItem]
}

struct ProfileReactionItem: Codable, Sendable {
    var id: String?
    var title: String?
    var href: String?
    var choice: String?
    var reaction: String?
    var ask: String?
    var type: String?
    @FlexString var createdAt: String?

    var stableId: String { id ?? href ?? title ?? UUID().uuidString }
}

struct ProfileReactionsDto: Codable, Sendable {
    @DefaultEmptyArray var memeVotes: [ProfileReactionItem]
    @DefaultEmptyArray var reportReactions: [ProfileReactionItem]
    @DefaultEmptyArray var reportVotes: [ProfileReactionItem]
    @DefaultEmptyArray var demandSupports: [ProfileReactionItem]
    @DefaultEmptyArray var proposalVotes: [ProfileReactionItem]
    @DefaultEmptyArray var noticeSignatures: [ProfileReactionItem]
}

struct ProfileCountsDto: Codable, Sendable {
    @DefaultZero var posts: Int
    @DefaultZero var reactions: Int
    @DefaultZero var followers: Int
    @DefaultZero var following: Int
    @FlexString var memberSince: String?
}

struct ProfileHeadDto: Codable, Sendable {
    var anonId: String?
    var label: String?
    @FlexString var memberSince: String?
}

struct ProfileFollowDto: Codable, Sendable {
    @DefaultFalse var viewerFollows: Bool
    @DefaultFalse var isSelf: Bool
}

struct ProfileResponse: Codable, Sendable {
    var profile: ProfileHeadDto?
    var counts: ProfileCountsDto
    var follow: ProfileFollowDto
    var posts: ProfilePostsDto
    var reactions: ProfileReactionsDto
    var error: String?

    enum CodingKeys: String, CodingKey {
        case profile, counts, follow, posts, reactions, error
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        profile = try c.decodeIfPresent(ProfileHeadDto.self, forKey: .profile)
        counts = try c.decodeIfPresent(ProfileCountsDto.self, forKey: .counts) ?? ProfileCountsDto()
        follow = try c.decodeIfPresent(ProfileFollowDto.self, forKey: .follow) ?? ProfileFollowDto()
        posts = try c.decodeIfPresent(ProfilePostsDto.self, forKey: .posts) ?? ProfilePostsDto()
        reactions = try c.decodeIfPresent(ProfileReactionsDto.self, forKey: .reactions) ?? ProfileReactionsDto()
        error = try c.decodeIfPresent(String.self, forKey: .error)
    }
}

// MARK: - Dashboard

struct DashboardStatsDto: Codable, Sendable {
    @DefaultZero var citizens: Int
    @DefaultZero var activeProposals: Int
    @DefaultZero var votes: Int
    @DefaultZero var notices: Int
    @DefaultZero var issues: Int
    @DefaultZero var reports: Int
    @DefaultZero var demands: Int
    @DefaultZero var memes: Int
    @DefaultZero var discussions: Int
    @DefaultZero var feedPosts: Int
    @DefaultZero var engagement: Int
    var label: String?
}

struct DashIssueDto: Codable, Sendable, Identifiable {
    var id: String { slug ?? title ?? "" }
    var slug: String?
    @DefaultEmpty var title: String
    var category: String?
    @DefaultZero var voteCount: Int
    @DefaultZeroDouble var rating: Double
}

struct DashLinkDto: Codable, Sendable {
    var id: String?
    @DefaultEmpty var title: String
    var href: String?
    var place: String?
    var type: String?
    @DefaultZero var upvotes: Int
    @DefaultZero var supportCount: Int

    var stableId: String { id ?? href ?? title ?? "" }
}

struct DashTrendDto: Codable, Sendable, Identifiable {
    var id: String { term ?? "" }
    @DefaultEmpty var term: String
    @DefaultZeroDouble var score: Double
    var category: String?
}

struct DashActivityDto: Codable, Sendable {
    var id: String?
    var kind: String?
    @DefaultEmpty var summary: String
    var href: String?
    @FlexString var createdAt: String?

    var stableId: String { id ?? href ?? summary ?? "" }
}

struct DashStateDto: Codable, Sendable, Identifiable {
    var id: String { state ?? "" }
    @DefaultEmpty var state: String
    var topIssue: String?
    @DefaultZeroDouble var rating: Double
    @DefaultZero var voteWeight: Int
}

struct DashboardResponse: Codable, Sendable {
    var stats: DashboardStatsDto
    var filtersApplied: Bool
    var topIssues: [DashIssueDto]
    var topReports: [DashLinkDto]
    var topDemands: [DashLinkDto]
    var trends: [DashTrendDto]
    var states: [DashStateDto]
    var activity: [DashActivityDto]
    var hotFeed: [FeedPostDto]
    var hashtags: [HashtagDto]
    var locations: LocationsDto
    var error: String?

    enum CodingKeys: String, CodingKey {
        case stats, filtersApplied, topIssues, topReports, topDemands, trends, states, activity, hotFeed, hashtags, locations, error
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        stats = try c.decodeIfPresent(DashboardStatsDto.self, forKey: .stats) ?? DashboardStatsDto()
        filtersApplied = try c.decodeIfPresent(Bool.self, forKey: .filtersApplied) ?? false
        topIssues = try c.decodeIfPresent([DashIssueDto].self, forKey: .topIssues) ?? []
        topReports = try c.decodeIfPresent([DashLinkDto].self, forKey: .topReports) ?? []
        topDemands = try c.decodeIfPresent([DashLinkDto].self, forKey: .topDemands) ?? []
        trends = try c.decodeIfPresent([DashTrendDto].self, forKey: .trends) ?? []
        states = try c.decodeIfPresent([DashStateDto].self, forKey: .states) ?? []
        activity = try c.decodeIfPresent([DashActivityDto].self, forKey: .activity) ?? []
        hotFeed = try c.decodeIfPresent([FeedPostDto].self, forKey: .hotFeed) ?? []
        hashtags = try c.decodeIfPresent([HashtagDto].self, forKey: .hashtags) ?? []
        locations = try c.decodeIfPresent(LocationsDto.self, forKey: .locations) ?? LocationsDto()
        error = try c.decodeIfPresent(String.self, forKey: .error)
    }
}

// MARK: - Upload / memes

struct UploadResponse: Codable, Sendable {
    @DefaultFalse var ok: Bool
    var url: String?
    var mediaType: String?
    var size: Int64?
    var error: String?
}

struct MemeDto: Codable, Sendable, Identifiable {
    var id: String
    @DefaultEmpty var title: String
    var caption: String?
    @DefaultEmpty var imageUrl: String
    var sourceUrl: String?
    var authorLabel: String?
    var authorAnonId: String?
    @DefaultZero var upvotes: Int
    @DefaultZero var downvotes: Int
    @DefaultZero var shareCount: Int
    @DefaultZero var score: Int
    var myVote: Int?
    @DefaultEmptyArray var tags: [String]
    var publicId: String?
    @FlexString var createdAt: String?
}

struct MemesResponse: Codable, Sendable {
    @DefaultEmptyArray var memes: [MemeDto]
    @DefaultEmptyArray var items: [MemeDto]
    var error: String?

    var all: [MemeDto] {
        let m = memes ?? []
        return m.isEmpty ? (items ?? []) : m
    }
}

struct MemeDetailResponse: Codable, Sendable {
    var meme: MemeDto?
    var error: String?
}

struct CreateMemeResponse: Codable, Sendable {
    var meme: MemeDto?
    var error: String?
}

// MARK: - AnyCodable (flexible JSON values)

enum AnyCodable: Codable, Hashable, Sendable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([AnyCodable])
    case object([String: AnyCodable])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let v = try? c.decode(Bool.self) { self = .bool(v); return }
        if let v = try? c.decode(Int.self) { self = .int(v); return }
        if let v = try? c.decode(Double.self) { self = .double(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        if let v = try? c.decode([AnyCodable].self) { self = .array(v); return }
        if let v = try? c.decode([String: AnyCodable].self) { self = .object(v); return }
        self = .null
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .int(let v): try c.encode(v)
        case .double(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        case .null: try c.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }
}
