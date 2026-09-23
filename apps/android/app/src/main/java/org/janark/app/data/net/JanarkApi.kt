package org.janark.app.data.net

import kotlinx.serialization.json.JsonObject
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

interface JanarkApi {
    @POST("api/auth/phone/request")
    suspend fun requestOtp(@Body body: JsonObject): Response<OtpRequestResponse>

    @POST("api/auth/phone/verify")
    suspend fun verifyOtp(@Body body: JsonObject): Response<OtpVerifyResponse>

    @GET("api/auth/me")
    suspend fun me(): Response<MeResponse>

    @POST("api/auth/logout")
    suspend fun logout(@Body body: JsonObject = JsonObject(emptyMap())): Response<OkResponse>

    @GET("api/feed")
    suspend fun feed(@QueryMap params: Map<String, String>): Response<FeedResponse>

    @GET("api/feed/{id}")
    suspend fun feedPost(@Path("id") id: String): Response<FeedDetailResponse>

    @POST("api/feed")
    suspend fun createFeed(@Body body: JsonObject): Response<CreateFeedResponse>

    @PATCH("api/feed/{id}")
    suspend fun patchFeed(@Path("id") id: String, @Body body: JsonObject): Response<FeedDetailResponse>

    @DELETE("api/feed/{id}")
    suspend fun deleteFeed(@Path("id") id: String): Response<OkResponse>

    @GET("api/hashtags")
    suspend fun hashtags(@Query("q") q: String? = null): Response<HashtagsResponse>

    @GET("api/demands")
    suspend fun demands(@QueryMap params: Map<String, String>): Response<DemandsResponse>

    @GET("api/demands/{id}")
    suspend fun demand(@Path("id") id: String): Response<DemandDetailResponse>

    @POST("api/demands")
    suspend fun createDemand(@Body body: JsonObject): Response<CreateDemandResponse>

    @POST("api/demands/{id}")
    suspend fun signDemand(@Path("id") id: String, @Body body: JsonObject): Response<DemandSignResponse>

    @PATCH("api/demands/{id}")
    suspend fun patchDemand(@Path("id") id: String, @Body body: JsonObject): Response<DemandDetailResponse>

    @DELETE("api/demands/{id}")
    suspend fun deleteDemand(@Path("id") id: String): Response<OkResponse>

    @GET("api/reports")
    suspend fun reports(@QueryMap params: Map<String, String>): Response<ReportsResponse>

    @GET("api/reports/{id}")
    suspend fun report(@Path("id") id: String): Response<ReportDetailResponse>

    @POST("api/reports")
    suspend fun createReport(@Body body: JsonObject): Response<CreateReportResponse>

    @POST("api/reports/{id}")
    suspend fun reactReport(@Path("id") id: String, @Body body: JsonObject): Response<OkResponse>

    @PATCH("api/reports/{id}")
    suspend fun patchReport(@Path("id") id: String, @Body body: JsonObject): Response<ReportDetailResponse>

    @DELETE("api/reports/{id}")
    suspend fun deleteReport(@Path("id") id: String): Response<OkResponse>

    @GET("api/issues")
    suspend fun issues(@Query("category") category: String? = null): Response<IssuesResponse>

    @GET("api/issues/{slug}")
    suspend fun issue(@Path("slug") slug: String): Response<IssueDetailResponse>

    @POST("api/issues")
    suspend fun createIssue(@Body body: JsonObject): Response<CreateIssueResponse>

    @GET("api/proposals")
    suspend fun proposals(): Response<ProposalsResponse>

    @POST("api/proposals")
    suspend fun createProposal(@Body body: JsonObject): Response<CreateProposalResponse>

    @GET("api/votes/{id}")
    suspend fun proposal(@Path("id") id: String): Response<ProposalDto>

    @POST("api/votes/{id}")
    suspend fun castBallot(@Path("id") id: String, @Body body: JsonObject): Response<CastVoteResponse>

    @GET("api/votes/me")
    suspend fun myBallot(@Query("proposalId") proposalId: String): Response<MyVoteResponse>

    @GET("api/shares")
    suspend fun shares(@Query("q") q: String? = null): Response<SharesResponse>

    @GET("api/shares/{id}")
    suspend fun share(@Path("id") id: String): Response<ShareDetailResponse>

    @POST("api/shares")
    suspend fun createShare(@Body body: JsonObject): Response<CreateShareResponse>

    @PATCH("api/shares/{id}")
    suspend fun patchShare(@Path("id") id: String, @Body body: JsonObject): Response<ShareDetailResponse>

    @DELETE("api/shares/{id}")
    suspend fun deleteShare(@Path("id") id: String): Response<OkResponse>

    @GET("api/notices")
    suspend fun notices(): Response<NoticesResponse>

    @GET("api/notices/{id}")
    suspend fun notice(@Path("id") id: String): Response<NoticeDetailResponse>

    @POST("api/notices")
    suspend fun createNotice(@Body body: JsonObject): Response<CreateNoticeResponse>

    @POST("api/notices/{id}")
    suspend fun signNotice(@Path("id") id: String, @Body body: JsonObject): Response<NoticeSignResponse>

    @GET("api/discussions")
    suspend fun discussions(
        @Query("issueSlug") issueSlug: String? = null,
        @Query("feedPostId") feedPostId: String? = null,
    ): Response<DiscussionsResponse>

    @POST("api/discussions")
    suspend fun createDiscussion(@Body body: JsonObject): Response<CreateDiscussionResponse>

    @GET("api/engage")
    suspend fun engage(
        @Query("targetType") targetType: String,
        @Query("targetId") targetId: String,
    ): Response<EngageCountsDto>

    @POST("api/engage")
    suspend fun voteEngage(@Body body: JsonObject): Response<EngageCountsDto>

    @GET("api/comments")
    suspend fun comments(
        @Query("targetType") targetType: String,
        @Query("targetId") targetId: String,
    ): Response<CommentsResponse>

    @POST("api/comments")
    suspend fun postComment(@Body body: JsonObject): Response<CommentsResponse>

    @PATCH("api/comments/{id}")
    suspend fun patchComment(@Path("id") id: String, @Body body: JsonObject): Response<CommentsResponse>

    @DELETE("api/comments/{id}")
    suspend fun deleteComment(@Path("id") id: String): Response<OkResponse>

    @POST("api/flags")
    suspend fun flag(@Body body: JsonObject): Response<FlagResponse>

    @GET("api/follow")
    suspend fun followStatus(
        @Query("anonId") anonId: String,
        @Query("list") list: String? = null,
    ): Response<FollowResponse>

    @POST("api/follow")
    suspend fun follow(@Body body: JsonObject): Response<FollowResponse>

    @GET("api/profiles/{anonId}")
    suspend fun profile(@Path("anonId") anonId: String): Response<ProfileResponse>

    @GET("api/dashboard")
    suspend fun dashboard(@QueryMap params: Map<String, String>): Response<DashboardResponse>

    @POST("api/social/share")
    suspend fun trackShare(@Body body: JsonObject): Response<OkResponse>

    @POST("api/telemetry/visit")
    suspend fun telemetry(@Body body: JsonObject): Response<OkResponse>

    @Multipart
    @POST("api/upload")
    suspend fun upload(@Part file: MultipartBody.Part): Response<UploadResponse>

    @GET("api/memes")
    suspend fun memes(@QueryMap params: Map<String, String> = emptyMap()): Response<MemesResponse>

    @GET("api/memes/{id}")
    suspend fun meme(@Path("id") id: String): Response<MemeDetailResponse>

    @POST("api/memes")
    suspend fun createMeme(@Body body: JsonObject): Response<CreateMemeResponse>
}
