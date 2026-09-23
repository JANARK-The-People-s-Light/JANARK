package org.janark.app.data.repo

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.janark.app.core.Outcome
import org.janark.app.core.TERMS_VERSION
import org.janark.app.data.net.CastVoteResponse
import org.janark.app.data.net.CommentDto
import org.janark.app.data.net.CommentsResponse
import org.janark.app.data.net.CreateDemandResponse
import org.janark.app.data.net.CreateDiscussionResponse
import org.janark.app.data.net.CreateIssueResponse
import org.janark.app.data.net.CreateMemeResponse
import org.janark.app.data.net.CreateNoticeResponse
import org.janark.app.data.net.CreateProposalResponse
import org.janark.app.data.net.CreateReportResponse
import org.janark.app.data.net.CreateShareResponse
import org.janark.app.data.net.DashboardResponse
import org.janark.app.data.net.DemandDetailResponse
import org.janark.app.data.net.DemandSignResponse
import org.janark.app.data.net.DemandsResponse
import org.janark.app.data.net.DiscussionsResponse
import org.janark.app.data.net.EngageCountsDto
import org.janark.app.data.net.FeedDetailResponse
import org.janark.app.data.net.FeedResponse
import org.janark.app.data.net.FlagResponse
import org.janark.app.data.net.FollowResponse
import org.janark.app.data.net.HashtagsResponse
import org.janark.app.data.net.IssueDetailResponse
import org.janark.app.data.net.IssuesResponse
import org.janark.app.data.net.JanarkApi
import org.janark.app.data.net.MeResponse
import org.janark.app.data.net.MemeDetailResponse
import org.janark.app.data.net.MemesResponse
import org.janark.app.data.net.MyVoteResponse
import org.janark.app.data.net.NetworkModule
import org.janark.app.data.net.NoticeDetailResponse
import org.janark.app.data.net.NoticeSignResponse
import org.janark.app.data.net.NoticesResponse
import org.janark.app.data.net.OkResponse
import org.janark.app.data.net.OtpRequestResponse
import org.janark.app.data.net.OtpVerifyResponse
import org.janark.app.data.net.ProfileResponse
import org.janark.app.data.net.ProposalDto
import org.janark.app.data.net.ProposalsResponse
import org.janark.app.data.net.ReportDetailResponse
import org.janark.app.data.net.ReportsResponse
import org.janark.app.data.net.ShareDetailResponse
import org.janark.app.data.net.UploadResponse
import org.janark.app.data.net.parseError
import org.janark.app.data.net.putJson
import org.janark.app.data.net.putIf
import org.janark.app.data.net.putList
import org.janark.app.data.net.toOutcome
import org.janark.app.data.net.writePayload
import org.janark.app.data.session.SessionStore
import org.janark.app.data.session.UiSession
import retrofit2.Response

class JanarkRepository(
    private val context: Context,
    private val session: SessionStore,
    private val network: NetworkModule,
) {
    private suspend fun api(): JanarkApi {
        val base = session.currentApiBase()
        return network.rebuild(base)
    }

    private suspend fun <T> call(
        fallback: String,
        block: suspend JanarkApi.() -> Response<T>,
    ): Outcome<T> = withContext(Dispatchers.IO) {
        runCatching { api().block().toOutcome(fallback) }
            .getOrElse { Outcome.Err(it.message ?: fallback) }
    }

    suspend fun requestOtp(phone: String): Outcome<OtpRequestResponse> {
        val body = writePayload {
            put("phone", phone)
        }
        return when (val r = call("Could not send OTP") { requestOtp(body) }) {
            is Outcome.Ok -> if (r.value.ok) r else Outcome.Err(r.value.error ?: "Could not send OTP")
            is Outcome.Err -> r
        }
    }

    suspend fun verifyOtp(phone: String, code: String): Outcome<UiSession> {
        val visitor = session.visitorId()
        val body = writePayload {
            put("phone", phone)
            put("code", code)
            put("visitorId", visitor)
        }
        return when (val r = call("Invalid OTP") { verifyOtp(body) }) {
            is Outcome.Ok -> {
                val s = r.value.session
                if (r.value.ok && s != null) {
                    session.setSession(s.anonId, s.hint, true)
                    Outcome.Ok(UiSession(true, s.anonId, s.hint))
                } else Outcome.Err(r.value.error ?: "Invalid OTP")
            }
            is Outcome.Err -> r
        }
    }

    suspend fun refreshMe(): Outcome<MeResponse> {
        val r = call("Not signed in") { me() }
        if (r is Outcome.Ok && r.value.session != null) {
            val s = r.value.session
            session.setSession(s.anonId, s.hint, s.authenticated)
        } else if (r is Outcome.Err && r.unauthorized) {
            session.clearSession()
        }
        return r
    }

    suspend fun logout(): Outcome<OkResponse> {
        val r = call("Could not sign out") { this.logout() }
        network.clearCookies()
        session.clearSession()
        return r
    }

    suspend fun loadFeed(params: Map<String, String>): Outcome<FeedResponse> =
        call("Could not load feed") { feed(params.filterValues { it.isNotBlank() }) }

    suspend fun loadFeedPost(id: String): Outcome<FeedDetailResponse> =
        call("Post not found") { feedPost(id) }

    suspend fun loadHashtags(q: String? = null): Outcome<HashtagsResponse> =
        call("Could not load topics") { hashtags(q) }

    suspend fun loadDemands(params: Map<String, String>): Outcome<DemandsResponse> =
        call("Could not load petitions") { demands(params.filterValues { it.isNotBlank() }) }

    suspend fun loadDemand(id: String): Outcome<DemandDetailResponse> =
        call("Petition not found") { demand(id) }

    suspend fun signDemand(id: String, fullName: String, postalCode: String, phone: String) =
        call<DemandSignResponse>("Could not sign") {
            signDemand(
                id,
                writePayload {
                    put("fullName", fullName)
                    put("postalCode", postalCode)
                    put("phone", phone)
                },
            )
        }

    suspend fun loadReports(params: Map<String, String>): Outcome<ReportsResponse> =
        call("Could not load reports") { reports(params.filterValues { it.isNotBlank() }) }

    suspend fun loadReport(id: String): Outcome<ReportDetailResponse> =
        call("Report not found") { report(id) }

    suspend fun reactReport(id: String, reaction: String) =
        call<org.janark.app.data.net.OkResponse>("Could not react") {
            reactReport(
                id,
                writePayload {
                    put("action", "react")
                    put("reaction", reaction)
                },
            )
        }

    suspend fun loadIssues(category: String? = null): Outcome<IssuesResponse> =
        call("Could not load issues") { issues(category) }

    suspend fun loadIssue(slug: String): Outcome<IssueDetailResponse> =
        call("Issue not found") { issue(slug) }

    suspend fun loadProposals(): Outcome<ProposalsResponse> =
        call("Could not load votes") { proposals() }

    suspend fun loadProposal(id: String): Outcome<ProposalDto> =
        call("Vote not found") { proposal(id) }

    suspend fun myBallot(id: String): Outcome<MyVoteResponse> =
        call("Could not load your vote") { myBallot(id) }

    suspend fun castBallot(id: String, choice: kotlinx.serialization.json.JsonElement): Outcome<CastVoteResponse> =
        call("Could not cast vote") {
            castBallot(id, writePayload { putJson("choice", choice) })
        }

    suspend fun loadShare(id: String): Outcome<ShareDetailResponse> =
        call("Share not found") { share(id) }

    suspend fun loadMeme(id: String): Outcome<MemeDetailResponse> =
        call("Meme not found") { meme(id) }

    suspend fun loadMemes(params: Map<String, String> = emptyMap()): Outcome<MemesResponse> =
        call("Could not load memes") { memes(params) }

    suspend fun createMeme(
        title: String,
        caption: String?,
        imageUrl: String,
        tags: List<String>,
    ): Outcome<CreateMemeResponse> = call("Could not post meme") {
        createMeme(
            writePayload {
                put("title", title)
                putIf("caption", caption)
                put("imageUrl", imageUrl)
                putList("tags", tags)
            },
        )
    }

    suspend fun loadNotice(id: String): Outcome<NoticeDetailResponse> =
        call("Notice not found") { notice(id) }

    suspend fun loadNotices(): Outcome<NoticesResponse> =
        call("Could not load notices") { notices() }

    suspend fun signNotice(id: String): Outcome<NoticeSignResponse> =
        call("Could not sign") { signNotice(id, writePayload {}) }

    suspend fun loadDiscussions(feedPostId: String? = null, issueSlug: String? = null): Outcome<DiscussionsResponse> =
        call("Could not load discussions") { discussions(issueSlug, feedPostId) }

    suspend fun engage(targetType: String, targetId: String): Outcome<EngageCountsDto> =
        call("Could not load reactions") { engage(targetType, targetId) }

    suspend fun voteEngage(targetType: String, targetId: String, choice: String): Outcome<EngageCountsDto> =
        call("Could not vote") {
            voteEngage(
                writePayload {
                    put("targetType", targetType)
                    put("targetId", targetId)
                    put("choice", choice)
                },
            )
        }

    suspend fun comments(targetType: String, targetId: String): Outcome<CommentsResponse> =
        call("Could not load comments") { comments(targetType, targetId) }

    suspend fun postComment(
        targetType: String,
        targetId: String,
        body: String,
        parentId: String? = null,
        mediaUrl: String? = null,
        mediaType: String? = null,
    ): Outcome<CommentsResponse> = call("Could not comment") {
        postComment(
            writePayload {
                put("targetType", targetType)
                put("targetId", targetId)
                put("body", body)
                putIf("parentId", parentId)
                putIf("mediaUrl", mediaUrl)
                putIf("mediaType", mediaType)
            },
        )
    }

    suspend fun editComment(id: String, body: String): Outcome<CommentsResponse> =
        call("Could not edit") { patchComment(id, writePayload { put("body", body) }) }

    suspend fun deleteComment(id: String): Outcome<OkResponse> =
        call("Could not delete") { deleteComment(id) }

    suspend fun flag(targetType: String, targetId: String, reason: String, detail: String?): Outcome<FlagResponse> =
        call("Could not report") {
            flag(
                writePayload {
                    put("targetType", targetType)
                    put("targetId", targetId)
                    put("reason", reason)
                    putIf("detail", detail)
                },
            )
        }

    suspend fun followStatus(anonId: String, list: String? = null): Outcome<FollowResponse> =
        call("Could not load follow") { followStatus(anonId, list) }

    suspend fun toggleFollow(anonId: String, action: String = "toggle"): Outcome<FollowResponse> =
        call("Could not follow") {
            follow(writePayload {
                put("anonId", anonId)
                put("action", action)
            })
        }

    suspend fun profile(anonId: String): Outcome<ProfileResponse> =
        call("Profile not found") { profile(anonId) }

    suspend fun dashboard(params: Map<String, String>): Outcome<DashboardResponse> =
        call("Could not load activity") { dashboard(params.filterValues { it.isNotBlank() }) }

    suspend fun trackShare(platform: String, path: String, title: String?): Outcome<OkResponse> =
        call("Could not share") {
            trackShare(
                writePayload {
                    put("platform", platform)
                    put("path", path)
                    putIf("title", title)
                },
            )
        }

    suspend fun pingVisit() {
        runCatching {
            val body = writePayload {
                put("visitorId", session.visitorId())
                put("path", "/android")
            }
            api().telemetry(body)
        }
    }

    suspend fun upload(uri: Uri): Outcome<UploadResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val cr = context.contentResolver
            var mime = cr.getType(uri) ?: "image/jpeg"
            var name = queryName(uri) ?: "upload.bin"
            var bytes = cr.openInputStream(uri)?.use { it.readBytes() }
                ?: return@withContext Outcome.Err("Could not read file")
            if (bytes.size > 8 * 1024 * 1024) return@withContext Outcome.Err("File must be under 8 MB")
            // HEIC/HEIF is common on Android but not accepted by /api/upload — re-encode JPEG
            val lower = mime.lowercase()
            if (lower.contains("heic") || lower.contains("heif") || name.lowercase().endsWith(".heic") || name.lowercase().endsWith(".heif")) {
                val bitmap = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    ?: return@withContext Outcome.Err("Could not decode HEIC image")
                val out = java.io.ByteArrayOutputStream()
                if (!bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, out)) {
                    return@withContext Outcome.Err("Could not convert HEIC to JPEG")
                }
                bytes = out.toByteArray()
                mime = "image/jpeg"
                name = name.substringBeforeLast('.') + ".jpg"
            }
            val part = MultipartBody.Part.createFormData(
                "file",
                name,
                bytes.toRequestBody(mime.toMediaType()),
            )
            api().upload(part).toOutcome("Upload failed")
        }.getOrElse { Outcome.Err(it.message ?: "Upload failed") }
    }

    suspend fun createShare(
        caption: String,
        mediaUrl: String,
        mediaType: String?,
        locationLabel: String?,
        hashtags: List<String>,
        city: String? = null,
        district: String? = null,
        state: String? = null,
        issueSlug: String? = null,
        petitionId: String? = null,
    ): Outcome<CreateShareResponse> = call("Could not share") {
        createShare(
            writePayload {
                put("caption", caption)
                put("mediaUrl", mediaUrl)
                putIf("mediaType", mediaType)
                putIf("locationLabel", locationLabel)
                putIf("city", city)
                putIf("district", district)
                putIf("state", state)
                putIf("issueSlug", issueSlug)
                putIf("petitionId", petitionId)
                putList("hashtags", hashtags)
            },
        )
    }

    suspend fun createReport(fields: Map<String, String>, hashtags: List<String>, mediaUrl: String?, mediaType: String?) =
        call<CreateReportResponse>("Could not publish report") {
            createReport(
                writePayload {
                    fields.forEach { (k, v) -> putIf(k, v) }
                    putIf("mediaUrl", mediaUrl)
                    putIf("mediaType", mediaType)
                    putList("hashtags", hashtags)
                },
            )
        }

    suspend fun createIssue(fields: Map<String, String>, hashtags: List<String>, mediaUrl: String?, mediaType: String?) =
        call<CreateIssueResponse>("Could not raise issue") {
            createIssue(
                writePayload {
                    fields.forEach { (k, v) -> putIf(k, v) }
                    putIf("mediaUrl", mediaUrl)
                    putIf("mediaType", mediaType)
                    putList("hashtags", hashtags)
                },
            )
        }

    suspend fun createDemand(fields: Map<String, String>, hashtags: List<String>, mediaUrl: String?, mediaType: String?) =
        call<CreateDemandResponse>("Could not launch petition") {
            createDemand(
                writePayload {
                    fields.forEach { (k, v) -> putIf(k, v) }
                    putIf("mediaUrl", mediaUrl)
                    putIf("mediaType", mediaType)
                    putList("hashtags", hashtags)
                },
            )
        }

    suspend fun createVote(
        fields: Map<String, String>,
        options: List<String>,
        hashtags: List<String>,
        mediaUrl: String?,
        mediaType: String?,
    ) = call<CreateProposalResponse>("Could not create vote") {
        createProposal(
            writePayload {
                fields.forEach { (k, v) -> putIf(k, v) }
                if (options.isNotEmpty()) putList("options", options)
                putIf("mediaUrl", mediaUrl)
                putIf("mediaType", mediaType)
                putList("hashtags", hashtags)
            },
        )
    }

    suspend fun createDiscussion(
        title: String,
        body: String,
        kind: String,
        hashtags: List<String>,
        mediaUrl: String?,
        mediaType: String?,
        locationLevel: String?,
        city: String?,
        district: String?,
        state: String?,
        country: String?,
    ) = call<CreateDiscussionResponse>("Could not start discussion") {
        createDiscussion(
            writePayload {
                put("title", title)
                put("body", body)
                put("kind", kind)
                putIf("mediaUrl", mediaUrl)
                putIf("mediaType", mediaType)
                putIf("locationLevel", locationLevel)
                putIf("city", city)
                putIf("district", district)
                putIf("state", state)
                putIf("country", country)
                putList("hashtags", hashtags)
            },
        )
    }

    suspend fun createNotice(fields: Map<String, String>, mediaUrl: String?, mediaType: String?) =
        call<CreateNoticeResponse>("Could not publish notice") {
            createNotice(
                writePayload {
                    fields.forEach { (k, v) -> putIf(k, v) }
                    putIf("mediaUrl", mediaUrl)
                    putIf("mediaType", mediaType)
                },
            )
        }

    suspend fun deleteDemand(id: String) = call<OkResponse>("Could not delete") { deleteDemand(id) }
    suspend fun deleteReport(id: String) = call<OkResponse>("Could not delete") { deleteReport(id) }
    suspend fun deleteShare(id: String) = call<OkResponse>("Could not delete") { deleteShare(id) }
    suspend fun deleteFeed(id: String) = call<OkResponse>("Could not delete") { deleteFeed(id) }

    suspend fun patchDemand(id: String, fields: Map<String, String>) =
        call<DemandDetailResponse>("Could not save") {
            patchDemand(id, writePayload { fields.forEach { (k, v) -> putIf(k, v) } })
        }

    suspend fun patchReport(id: String, fields: Map<String, String>) =
        call<ReportDetailResponse>("Could not save") {
            patchReport(id, writePayload { fields.forEach { (k, v) -> putIf(k, v) } })
        }

    suspend fun patchShare(id: String, caption: String) =
        call<ShareDetailResponse>("Could not save") {
            patchShare(id, writePayload { put("caption", caption) })
        }

    suspend fun patchFeed(id: String, title: String, body: String) =
        call<FeedDetailResponse>("Could not save") {
            patchFeed(id, writePayload {
                put("title", title)
                put("excerpt", body)
                put("body", body)
            })
        }

    suspend fun acceptTerms() = session.acceptTerms(TERMS_VERSION)

    private fun queryName(uri: Uri): String? {
        val cursor = context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
        return cursor?.use {
            if (it.moveToFirst()) it.getString(0) else null
        }
    }
}
