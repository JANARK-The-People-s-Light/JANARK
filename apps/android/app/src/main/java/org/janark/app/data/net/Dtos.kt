package org.janark.app.data.net

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

object FlexStringSerializer : KSerializer<String?> {
    override val descriptor: SerialDescriptor = String.serializer().nullable.descriptor
    override fun serialize(encoder: Encoder, value: String?) {
        encoder.encodeNullableSerializableValue(String.serializer(), value)
    }
    override fun deserialize(decoder: Decoder): String? {
        val json = decoder as? JsonDecoder ?: return decoder.decodeString()
        return when (val el = json.decodeJsonElement()) {
            is JsonNull -> null
            is JsonPrimitive -> el.contentOrNull
            else -> el.toString()
        }
    }
}

object StringListSerializer : KSerializer<List<String>> {
    override val descriptor = ListSerializer(String.serializer()).descriptor
    override fun serialize(encoder: Encoder, value: List<String>) {
        encoder.encodeSerializableValue(ListSerializer(String.serializer()), value)
    }
    override fun deserialize(decoder: Decoder): List<String> {
        val json = decoder as? JsonDecoder ?: return emptyList()
        return when (val el = json.decodeJsonElement()) {
            is JsonArray -> el.mapNotNull { (it as? JsonPrimitive)?.contentOrNull }
            is JsonPrimitive -> listOfNotNull(el.contentOrNull)
            else -> emptyList()
        }
    }
}

@Serializable
data class ErrorBody(val error: String? = null, val message: String? = null)

@Serializable
data class SessionPayload(
    val hint: String? = null,
    val anonId: String? = null,
    val anonymous: Boolean = true,
    val authenticated: Boolean = false,
)

@Serializable
data class MeResponse(val session: SessionPayload? = null, val error: String? = null)

@Serializable
data class OtpRequestResponse(
    val ok: Boolean = false,
    val hint: String? = null,
    val expiresInSec: Int? = null,
    val message: String? = null,
    val devCode: String? = null,
    val error: String? = null,
)

@Serializable
data class OtpVerifyResponse(
    val ok: Boolean = false,
    val session: SessionPayload? = null,
    val message: String? = null,
    val error: String? = null,
)

@Serializable
data class OkResponse(val ok: Boolean = false, val error: String? = null, val message: String? = null)

@Serializable
data class HashtagDto(val tag: String, val count: Int = 0)

@Serializable
data class LocationsDto(
    val countries: List<String> = emptyList(),
    val states: List<String> = emptyList(),
    val districts: List<String> = emptyList(),
    val cities: List<String> = emptyList(),
)

@Serializable
data class RankingDto(
    val model: String? = null,
    val mode: String? = null,
    val scored: Int? = null,
    val note: String? = null,
)

@Serializable
data class FeedPostDto(
    val id: String,
    val publicId: String? = null,
    val type: String = "discussion",
    val title: String = "",
    val excerpt: String? = null,
    val body: String? = null,
    val href: String? = null,
    val meta: String? = null,
    val votes: Int? = 0,
    val hot: Boolean? = false,
    val author: String? = null,
    val authorAnonId: String? = null,
    val tags: List<String> = emptyList(),
    val refId: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val locationLevel: String? = null,
    val village: String? = null,
    val town: String? = null,
    val city: String? = null,
    val district: String? = null,
    val state: String? = null,
    val country: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
    val civicScore: Double? = null,
)

@Serializable
data class FeedResponse(
    val posts: List<FeedPostDto> = emptyList(),
    val hashtags: List<HashtagDto> = emptyList(),
    val typeCounts: Map<String, Int> = emptyMap(),
    val locations: LocationsDto = LocationsDto(),
    val sort: String? = null,
    val ranking: RankingDto? = null,
    val type: String? = null,
    val tag: String? = null,
    val q: String? = null,
    val error: String? = null,
)

@Serializable
data class FeedDetailResponse(
    val post: FeedPostDto? = null,
    val isMine: Boolean = false,
    val error: String? = null,
)

@Serializable
data class HashtagsResponse(val hashtags: List<HashtagDto> = emptyList())

@Serializable
data class DemandDto(
    val id: String,
    val publicId: String? = null,
    val title: String = "",
    val body: String = "",
    val ask: String = "",
    val target: String = "government",
    val targetDetail: String? = null,
    val category: String? = null,
    val status: String = "open",
    val locationLevel: String? = null,
    val village: String? = null,
    val town: String? = null,
    val city: String? = null,
    val block: String? = null,
    val district: String? = null,
    val state: String? = null,
    val country: String? = null,
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val supportCount: Int = 0,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val commentCount: Int = 0,
    val locationLabel: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class DemandsResponse(val demands: List<DemandDto> = emptyList(), val error: String? = null)

@Serializable
data class DemandDetailResponse(
    val demand: DemandDto? = null,
    val supportedByMe: Boolean = false,
    val isMine: Boolean = false,
    val error: String? = null,
)

@Serializable
data class DemandSignResponse(
    val ok: Boolean = false,
    val alreadySupported: Boolean = false,
    val demand: DemandDto? = null,
    val error: String? = null,
)

@Serializable
data class ReportDto(
    val id: String,
    val publicId: String? = null,
    val type: String = "problem",
    val title: String = "",
    val body: String = "",
    val locationLevel: String? = null,
    val village: String? = null,
    val town: String? = null,
    val city: String? = null,
    val block: String? = null,
    val district: String? = null,
    val state: String? = null,
    val country: String? = null,
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val commentCount: Int = 0,
    val shareCount: Int = 0,
    val locationLabel: String? = null,
    val reactionCounts: Map<String, Int> = emptyMap(),
    val voteCount: Int = 0,
    val reactionTotal: Int = 0,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class ReportsResponse(val reports: List<ReportDto> = emptyList(), val error: String? = null)

@Serializable
data class ReportDetailResponse(
    val report: ReportDto? = null,
    val isMine: Boolean = false,
    val error: String? = null,
)

@Serializable
data class SourceDto(val label: String = "", val url: String = "")

@Serializable
data class IssueDto(
    val slug: String,
    val title: String = "",
    val category: String = "",
    val summary: String = "",
    val whyItMatters: String = "",
    val currentSituation: String = "",
    val pros: List<String> = emptyList(),
    val cons: List<String> = emptyList(),
    val sources: List<SourceDto> = emptyList(),
    val relatedSlugs: List<String> = emptyList(),
    val voteCount: Int = 0,
    val rating: Double = 0.0,
    val trendingRank: Int? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val publicId: String? = null,
)

@Serializable
data class IssuesResponse(val issues: List<IssueDto> = emptyList(), val error: String? = null)

@Serializable
data class IssueDiscussionDto(
    val id: String,
    val author: String? = null,
    val body: String = "",
    val upvotes: Int = 0,
    val kind: String = "opinion",
    val createdAt: String? = null,
    val source: String? = null,
)

@Serializable
data class IssueDetailResponse(
    val issue: IssueDto? = null,
    val discussions: List<IssueDiscussionDto> = emptyList(),
    val proposals: List<ProposalDto> = emptyList(),
    val related: List<IssueDto> = emptyList(),
    val error: String? = null,
)

@Serializable
data class ProposalDto(
    val id: String,
    val title: String = "",
    val description: String = "",
    val benefits: List<String> = emptyList(),
    val argumentsFor: List<String> = emptyList(),
    val argumentsAgainst: List<String> = emptyList(),
    val voteType: String = "likert",
    val options: List<String>? = null,
    val results: Map<String, Double>? = null,
    val totalVotes: Int = 0,
    val liveVotes: Int? = null,
    val issueSlug: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val publicId: String? = null,
    val locationLevel: String? = null,
    val town: String? = null,
    val city: String? = null,
    val district: String? = null,
    val state: String? = null,
    val country: String? = null,
)

@Serializable
data class ProposalsResponse(val proposals: List<ProposalDto> = emptyList(), val error: String? = null)

@Serializable
data class MyVoteResponse(val vote: MyVoteDto? = null, val error: String? = null)

@Serializable
data class MyVoteDto(
    val id: String? = null,
    val choice: JsonElement? = null,
)

@Serializable
data class CastVoteResponse(
    val ok: Boolean = false,
    val liveVotes: Int = 0,
    val results: Map<String, Double>? = null,
    val error: String? = null,
)

@Serializable
data class ShareDto(
    val id: String,
    val publicId: String? = null,
    val caption: String = "",
    val mediaUrl: String = "",
    val mediaType: String? = null,
    val locationLabel: String? = null,
    val city: String? = null,
    val district: String? = null,
    val state: String? = null,
    val country: String? = null,
    val issueSlug: String? = null,
    val petitionId: String? = null,
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val commentCount: Int = 0,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class SharesResponse(val shares: List<ShareDto> = emptyList())

@Serializable
data class ShareDetailResponse(
    val share: ShareDto? = null,
    val feedPostId: String? = null,
    val isMine: Boolean = false,
    val error: String? = null,
)

@Serializable
data class NoticeDto(
    val id: String,
    val publicId: String? = null,
    val title: String = "",
    val description: String = "",
    val target: String = "national",
    val targetDetail: String? = null,
    val author: String? = null,
    val authorAnonId: String? = null,
    val category: String? = null,
    val signatures: Int = 0,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val commentCount: Int = 0,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class NoticesResponse(val notices: List<NoticeDto> = emptyList())

@Serializable
data class NoticeDetailResponse(val notice: NoticeDto? = null, val error: String? = null)

@Serializable
data class NoticeSignResponse(
    val ok: Boolean = false,
    val notice: NoticeDto? = null,
    val alreadySigned: Boolean = false,
    val error: String? = null,
)

@Serializable
data class DiscussionDto(
    val id: String,
    val issueSlug: String? = null,
    val feedPostId: String? = null,
    val author: String? = null,
    val authorAnonId: String? = null,
    val body: String = "",
    val kind: String = "opinion",
    val upvotes: Int = 0,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val publicId: String? = null,
    val href: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class DiscussionsResponse(val discussions: List<DiscussionDto> = emptyList())

@Serializable
data class EngageCountsDto(
    val ok: Boolean = false,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val commentCount: Int = 0,
    val score: Int = 0,
    val myVote: Int? = null,
    val targetType: String? = null,
    val targetId: String? = null,
    val error: String? = null,
)

@Serializable
data class CommentDto(
    val id: String,
    val body: String = "",
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val score: Int = 0,
    val myVote: Int? = null,
    val isMine: Boolean = false,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
    val updatedAt: String? = null,
    val parentId: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val replies: List<CommentDto> = emptyList(),
)

@Serializable
data class CommentsResponse(
    val ok: Boolean = false,
    val comments: List<CommentDto> = emptyList(),
    val comment: CommentDto? = null,
    val error: String? = null,
)

@Serializable
data class FlagResponse(
    val ok: Boolean = false,
    val alreadyReported: Boolean = false,
    val message: String? = null,
    val error: String? = null,
)

@Serializable
data class FollowResponse(
    val anonId: String? = null,
    val followers: Int = 0,
    @SerialName("followingCount") val followingCount: Int = 0,
    val viewerFollows: Boolean = false,
    val isSelf: Boolean = false,
    val viewerAnonId: String? = null,
    val people: List<FollowPersonDto> = emptyList(),
    val list: String? = null,
    val following: Boolean? = null,
    val ok: Boolean = false,
    val error: String? = null,
)

@Serializable
data class FollowPersonDto(val anonId: String, val label: String? = null)

@Serializable
data class UploadResponse(
    val ok: Boolean = false,
    val url: String? = null,
    val mediaType: String? = null,
    val size: Long? = null,
    val error: String? = null,
)

@Serializable
data class ProfilePostItem(
    val id: String? = null,
    val title: String? = null,
    val body: String? = null,
    val ask: String? = null,
    val caption: String? = null,
    val href: String? = null,
    val type: String? = null,
    val kind: String? = null,
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val upvotes: Int? = null,
    val supportCount: Int? = null,
    val signatures: Int? = null,
    val issueSlug: String? = null,
    val feedPostId: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class ProfilePostsDto(
    val memes: List<ProfilePostItem> = emptyList(),
    val reports: List<ProfilePostItem> = emptyList(),
    val demands: List<ProfilePostItem> = emptyList(),
    val notices: List<ProfilePostItem> = emptyList(),
    val discussions: List<ProfilePostItem> = emptyList(),
    val shares: List<ProfilePostItem> = emptyList(),
)

@Serializable
data class ProfileReactionItem(
    val id: String? = null,
    val title: String? = null,
    val href: String? = null,
    val choice: String? = null,
    val reaction: String? = null,
    val ask: String? = null,
    val type: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class ProfileReactionsDto(
    val memeVotes: List<ProfileReactionItem> = emptyList(),
    val reportReactions: List<ProfileReactionItem> = emptyList(),
    val reportVotes: List<ProfileReactionItem> = emptyList(),
    val demandSupports: List<ProfileReactionItem> = emptyList(),
    val proposalVotes: List<ProfileReactionItem> = emptyList(),
    val noticeSignatures: List<ProfileReactionItem> = emptyList(),
)

@Serializable
data class ProfileCountsDto(
    val posts: Int = 0,
    val reactions: Int = 0,
    val followers: Int = 0,
    val following: Int = 0,
    @Serializable(with = FlexStringSerializer::class) val memberSince: String? = null,
)

@Serializable
data class ProfileHeadDto(
    val anonId: String? = null,
    val label: String? = null,
    @Serializable(with = FlexStringSerializer::class) val memberSince: String? = null,
)

@Serializable
data class ProfileFollowDto(
    val viewerFollows: Boolean = false,
    val isSelf: Boolean = false,
)

@Serializable
data class ProfileResponse(
    val profile: ProfileHeadDto? = null,
    val counts: ProfileCountsDto = ProfileCountsDto(),
    val follow: ProfileFollowDto = ProfileFollowDto(),
    val posts: ProfilePostsDto = ProfilePostsDto(),
    val reactions: ProfileReactionsDto = ProfileReactionsDto(),
    val error: String? = null,
)

@Serializable
data class DashboardStatsDto(
    val citizens: Int = 0,
    val activeProposals: Int = 0,
    val votes: Int = 0,
    val notices: Int = 0,
    val issues: Int = 0,
    val reports: Int = 0,
    val demands: Int = 0,
    val memes: Int = 0,
    val discussions: Int = 0,
    val feedPosts: Int = 0,
    val engagement: Int = 0,
    val label: String? = null,
)

@Serializable
data class DashIssueDto(
    val slug: String? = null,
    val title: String = "",
    val category: String? = null,
    val voteCount: Int = 0,
    val rating: Double = 0.0,
)

@Serializable
data class DashLinkDto(
    val id: String? = null,
    val title: String = "",
    val href: String? = null,
    val place: String? = null,
    val type: String? = null,
    val upvotes: Int = 0,
    val supportCount: Int = 0,
)

@Serializable
data class DashTrendDto(
    val term: String = "",
    val score: Double = 0.0,
    val category: String? = null,
)

@Serializable
data class DashActivityDto(
    val id: String? = null,
    val kind: String? = null,
    val summary: String = "",
    val href: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class DashStateDto(
    val state: String = "",
    val topIssue: String? = null,
    val rating: Double = 0.0,
    val voteWeight: Int = 0,
)

@Serializable
data class DashboardResponse(
    val stats: DashboardStatsDto = DashboardStatsDto(),
    val filtersApplied: Boolean = false,
    val topIssues: List<DashIssueDto> = emptyList(),
    val topReports: List<DashLinkDto> = emptyList(),
    val topDemands: List<DashLinkDto> = emptyList(),
    val trends: List<DashTrendDto> = emptyList(),
    val states: List<DashStateDto> = emptyList(),
    val activity: List<DashActivityDto> = emptyList(),
    val hotFeed: List<FeedPostDto> = emptyList(),
    val hashtags: List<HashtagDto> = emptyList(),
    val locations: LocationsDto = LocationsDto(),
    val error: String? = null,
)

@Serializable
data class CreateIssueResponse(val issue: IssueDto? = null, val error: String? = null)

@Serializable
data class CreateProposalResponse(val proposal: ProposalDto? = null, val error: String? = null)

@Serializable
data class CreateDemandResponse(val demand: DemandDto? = null, val error: String? = null)

@Serializable
data class CreateReportResponse(val report: ReportDto? = null, val error: String? = null)

@Serializable
data class CreateShareResponse(val share: ShareDto? = null, val error: String? = null)

@Serializable
data class CreateNoticeResponse(val notice: NoticeDto? = null, val error: String? = null)

@Serializable
data class CreateDiscussionResponse(
    val discussion: DiscussionDto? = null,
    val publicId: String? = null,
    val href: String? = null,
    val error: String? = null,
)

@Serializable
data class CreateFeedResponse(
    val post: FeedPostDto? = null,
    val error: String? = null,
)

@Serializable
data class MemeDto(
    val id: String,
    val title: String = "",
    val caption: String? = null,
    val imageUrl: String = "",
    val sourceUrl: String? = null,
    val authorLabel: String? = null,
    val authorAnonId: String? = null,
    val upvotes: Int = 0,
    val downvotes: Int = 0,
    val shareCount: Int = 0,
    val score: Int = 0,
    val myVote: Int? = null,
    val tags: List<String> = emptyList(),
    val publicId: String? = null,
    @Serializable(with = FlexStringSerializer::class) val createdAt: String? = null,
)

@Serializable
data class MemesResponse(
    val memes: List<MemeDto> = emptyList(),
    val items: List<MemeDto> = emptyList(),
    val error: String? = null,
)

@Serializable
data class MemeDetailResponse(
    val meme: MemeDto? = null,
    val error: String? = null,
)

@Serializable
data class CreateMemeResponse(
    val meme: MemeDto? = null,
    val error: String? = null,
)
