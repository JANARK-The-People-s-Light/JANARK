import PhotosUI
import SwiftUI
import UIKit

struct CreateScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let kindPath: String
    let onNavigate: (String) -> Void

    private var kind: CreateKind { CreateKind.from(kindPath) }

    @State private var title = ""
    @State private var bodyText = ""
    @State private var ask = ""
    @State private var caption = ""
    @State private var category = ISSUE_CATEGORIES.first ?? "Education"
    @State private var reportType = "problem"
    @State private var locationLevel = "city"
    @State private var city = ""
    @State private var district = ""
    @State private var state = ""
    @State private var country = "India"
    @State private var village = ""
    @State private var locationLabel = ""
    @State private var target = "government"
    @State private var targetDetail = ""
    @State private var actorQuery = ""
    @State private var voteType = "likert"
    @State private var optionsText = ""
    @State private var discussionKind = "opinion"
    @State private var noticeTarget = "national"
    @State private var why = ""
    @State private var current = ""
    @State private var tags = ""
    @State private var mediaUrl: String?
    @State private var mediaType: String?
    @State private var accepted = false
    @State private var error: String?
    @State private var busy = false
    @State private var more = false
    @State private var photoItem: PhotosPickerItem?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text(kind.title)
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                    .foregroundStyle(c.foreground)
                Text(kind.prompt)
                    .foregroundStyle(c.muted)

                kindFields

                PhotosPicker(selection: $photoItem, matching: .any(of: [.images, .videos])) {
                    Text(mediaUrl == nil ? "Attach photo or video" : "Replace media")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .foregroundStyle(c.foreground)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.line))
                }
                .onChange(of: photoItem) { _, item in
                    guard let item else { return }
                    Task { await upload(item) }
                }
                CivicMedia(url: mediaUrl, mediaType: mediaType)

                GhostButton(more ? "Hide more" : "More") { more.toggle() }
                if more { moreFields }

                PostTermsAccept(accepted: $accepted) { onNavigate(Routes.terms) }
                if let error {
                    Text(error).foregroundStyle(c.danger)
                }
                AmberButton(busy ? "Publishing…" : "Publish", enabled: !busy) {
                    Task { await publish() }
                }
            }
            .padding(20)
        }
    }

    @ViewBuilder
    private var kindFields: some View {
        switch kind {
        case .share:
            JanarkField(text: $caption, label: "Caption", singleLine: false, minLines: 3)
            JanarkField(text: $locationLabel, label: "Place (optional)")
        case .report:
            JanarkField(text: $title, label: "What happened?")
            JanarkField(text: $bodyText, label: "Details", singleLine: false, minLines: 4)
            SectionLabel("Type")
            chipRow(REPORT_TYPES.map { ($0, $0.capitalized) }, selected: reportType) { reportType = $0 }
        case .issue:
            JanarkField(text: $title, label: "What’s the issue?")
            JanarkField(text: $bodyText, label: "Summary", singleLine: false, minLines: 3)
            SectionLabel("Category")
            chipRow(ISSUE_CATEGORIES.map { ($0, $0) }, selected: category) { category = $0 }
        case .petition:
            JanarkField(text: $title, label: "What should change?")
            JanarkField(text: $ask, label: "Clear ask")
            JanarkField(text: $bodyText, label: "Why?", singleLine: false, minLines: 4)
            JanarkField(text: $actorQuery, label: "Who should act?")
            ForEach(searchPetitionActors(actorQuery), id: \.name) { a in
                ChoiceChip(
                    label: a.region.map { "\(a.name) · \($0)" } ?? a.name,
                    selected: targetDetail == a.name
                ) {
                    targetDetail = a.name
                    target = a.target
                    actorQuery = a.name
                }
            }
            SectionLabel("Topic")
            chipRow(PETITION_CATEGORIES.map { ($0, $0) }, selected: category) { category = $0 }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(PETITION_TOPIC_CHIPS, id: \.self) { chip in
                        ChoiceChip(label: "#\(chip)", selected: tags.contains(chip)) {
                            if tags.contains(chip) {
                                tags = tags.replacingOccurrences(of: chip, with: "")
                            } else {
                                tags += " \(chip)"
                            }
                        }
                    }
                }
            }
        case .vote:
            JanarkField(text: $title, label: "What should people vote on?")
            JanarkField(text: $bodyText, label: "Context", singleLine: false, minLines: 3)
            SectionLabel("Ballot type")
            chipRow(Civic.voteTypes.map { ($0, $0) }, selected: voteType) { voteType = $0 }
            if voteType != "likert" {
                JanarkField(text: $optionsText, label: "Options (one per line)", singleLine: false, minLines: 4)
            }
        case .discussion:
            JanarkField(text: $title, label: "Topic")
            JanarkField(text: $bodyText, label: "What would you like to discuss?", singleLine: false, minLines: 5)
            chipRow(Civic.discussionKinds.map { ($0, $0.capitalized) }, selected: discussionKind) { discussionKind = $0 }
        case .notice:
            JanarkField(text: $title, label: "Title")
            JanarkField(text: $bodyText, label: "Notice", singleLine: false, minLines: 4)
            chipRow(NOTICE_TARGETS.map { ($0, $0.capitalized) }, selected: noticeTarget) { noticeTarget = $0 }
            JanarkField(text: $targetDetail, label: "Target detail (optional)")
        case .meme:
            JanarkField(text: $title, label: "Title")
            JanarkField(text: $caption, label: "Caption (optional)", singleLine: false, minLines: 3)
            JanarkField(text: $tags, label: "Hashtags (#janark #roads)")
        }
    }

    @ViewBuilder
    private var moreFields: some View {
        if kind != .share && kind != .issue && kind != .notice && kind != .meme {
            SectionLabel("Place")
            chipRow(LOCATION_LEVELS.map { ($0, $0) }, selected: locationLevel) { locationLevel = $0 }
            JanarkField(text: $village, label: "Village")
            JanarkField(text: $city, label: "City")
            JanarkField(text: $district, label: "District")
            JanarkField(text: $state, label: "State")
            JanarkField(text: $country, label: "Country")
        }
        if kind == .issue {
            JanarkField(text: $why, label: "Why it matters", singleLine: false)
            JanarkField(text: $current, label: "Current situation", singleLine: false)
        }
        JanarkField(text: $tags, label: "Topics / hashtags")
    }

    private func chipRow(_ items: [(String, String)], selected: String, onSelect: @escaping (String) -> Void) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(items, id: \.0) { item in
                    ChoiceChip(label: item.1, selected: selected == item.0) { onSelect(item.0) }
                }
            }
        }
    }

    private func hashtags() -> [String] {
        tags
            .split { $0 == "," || $0 == " " || $0 == "#" }
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
            .filter { $0.count >= 2 }
            .reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }
    }

    private func upload(_ item: PhotosPickerItem) async {
        if !app.session.uiSession.authenticated {
            app.auth.require("upload a photo") {}
            return
        }
        guard var data = try? await item.loadTransferable(type: Data.self) else {
            error = "Could not read media"
            return
        }
        var (filename, mime) = Self.sniffUpload(data: data)
        // HEIC / unknown image → re-encode JPEG so server magic check passes
        if mime == "application/octet-stream" || mime == "image/heic" || mime == "image/heif",
           let ui = UIImage(data: data), let jpeg = ui.jpegData(compressionQuality: 0.9) {
            data = jpeg
            filename = "upload.jpg"
            mime = "image/jpeg"
        }
        if mime == "application/octet-stream" {
            error = "Unsupported media type. Use JPEG, PNG, GIF, WebP, or MP4."
            return
        }
        switch await app.repository.upload(data, filename: filename, mime: mime) {
        case .ok(let value):
            mediaUrl = value.url
            mediaType = value.mediaType
            error = value.error
        case .err(let message, let unauthorized, _):
            if unauthorized {
                app.auth.require("upload a photo") {}
            } else {
                error = message
            }
        }
    }

    private func publish() async {
        if !app.session.uiSession.authenticated {
            app.auth.require("publish") { Task { await publish() } }
            return
        }
        guard accepted else {
            error = "Accept the Civic Posting Terms to publish."
            return
        }
        busy = true
        error = nil
        _ = await app.repository.acceptTerms()

        var result: Outcome<Any> = .err("Unknown create kind")
        switch kind {
        case .share:
            guard let url = mediaUrl, !url.isEmpty else {
                busy = false
                error = "Add a photo or video to share"
                return
            }
            let r = await app.repository.createShare(
                caption: caption.isEmpty ? title : caption,
                mediaUrl: url,
                mediaType: mediaType,
                locationLabel: locationLabel.isEmpty ? nil : locationLabel,
                hashtags: hashtags(),
                city: city,
                district: district,
                state: state
            )
            result = r.map { $0 as Any }
        case .report:
            let r = await app.repository.createReport(
                fields: [
                    "title": title,
                    "body": bodyText.isEmpty ? title : bodyText,
                    "type": reportType,
                    "locationLevel": locationLevel,
                    "village": village,
                    "city": city,
                    "district": district,
                    "state": state,
                    "country": country,
                ],
                hashtags: hashtags(),
                mediaUrl: mediaUrl,
                mediaType: mediaType
            )
            result = r.map { $0 as Any }
        case .issue:
            let r = await app.repository.createIssue(
                fields: [
                    "title": title,
                    "summary": bodyText.isEmpty ? title : bodyText,
                    "category": category,
                    "whyItMatters": why.isEmpty ? bodyText : why,
                    "currentSituation": current.isEmpty ? "Citizen-raised issue." : current,
                ],
                hashtags: hashtags(),
                mediaUrl: mediaUrl,
                mediaType: mediaType
            )
            result = r.map { $0 as Any }
        case .petition:
            let r = await app.repository.createDemand(
                fields: [
                    "title": title,
                    "ask": ask.isEmpty ? title : ask,
                    "body": bodyText.isEmpty ? (ask.isEmpty ? title : ask) : bodyText,
                    "target": target,
                    "targetDetail": targetDetail,
                    "category": category,
                    "locationLevel": locationLevel,
                    "village": village,
                    "city": city,
                    "district": district,
                    "state": state,
                    "country": country,
                ],
                hashtags: hashtags(),
                mediaUrl: mediaUrl,
                mediaType: mediaType
            )
            result = r.map { $0 as Any }
        case .vote:
            let options = optionsText
                .split(separator: "\n")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
            if voteType != "likert" && options.count < 2 {
                busy = false
                error = "Add at least two options (one per line) for this vote type."
                return
            }
            let r = await app.repository.createVote(
                fields: [
                    "title": title,
                    "description": bodyText.isEmpty ? title : bodyText,
                    "voteType": voteType,
                    "locationLevel": locationLevel,
                    "city": city,
                    "district": district,
                    "state": state,
                    "country": country,
                ],
                options: options,
                hashtags: hashtags(),
                mediaUrl: mediaUrl,
                mediaType: mediaType
            )
            result = r.map { $0 as Any }
        case .discussion:
            let r = await app.repository.createDiscussion(
                title: title,
                body: bodyText.isEmpty ? title : bodyText,
                kind: discussionKind,
                hashtags: hashtags(),
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                locationLevel: locationLevel,
                city: city,
                district: district,
                state: state,
                country: country
            )
            result = r.map { $0 as Any }
        case .notice:
            let r = await app.repository.createNotice(
                fields: [
                    "title": title,
                    "description": bodyText.isEmpty ? title : bodyText,
                    "target": noticeTarget,
                    "targetDetail": targetDetail,
                ],
                mediaUrl: mediaUrl,
                mediaType: mediaType
            )
            result = r.map { $0 as Any }
        case .meme:
            guard let url = mediaUrl, !url.isEmpty else {
                busy = false
                error = "Add an image or GIF for the meme"
                return
            }
            let tagsList = hashtags()
            guard !tagsList.isEmpty else {
                busy = false
                error = "Add at least one hashtag"
                return
            }
            let r = await app.repository.createMeme(
                title: title.isEmpty ? (caption.isEmpty ? "Meme" : caption) : title,
                caption: caption.isEmpty ? nil : caption,
                imageUrl: url,
                tags: tagsList
            )
            result = r.map { $0 as Any }
        }

        busy = false
        switch result {
        case .ok(let value):
            let dest = resolveCreatedDestination(value) ?? Routes.home
            onNavigate(dest)
        case .err(let message, let unauthorized, _):
            if unauthorized {
                app.auth.require("publish") { Task { await publish() } }
            } else {
                error = message
            }
        }
    }

    private func resolveCreatedDestination(_ value: Any) -> String? {
        if let v = value as? CreateShareResponse, let id = v.share?.id { return Routes.share(id) }
        if let v = value as? CreateReportResponse, let id = v.report?.id { return Routes.report(id) }
        if let v = value as? CreateIssueResponse, let slug = v.issue?.slug { return Routes.issue(slug) }
        if let v = value as? CreateDemandResponse, let id = v.demand?.id { return Routes.petition(id) }
        if let v = value as? CreateProposalResponse, let id = v.proposal?.id { return Routes.vote(id) }
        if let v = value as? CreateDiscussionResponse {
            if let publicId = v.publicId { return Routes.publicPost(publicId) }
            if let publicId = v.discussion?.publicId { return Routes.publicPost(publicId) }
            if let feedId = v.discussion?.feedPostId { return Routes.discussion(feedId) }
            return Routes.discussions
        }
        if let v = value as? CreateNoticeResponse, let id = v.notice?.id { return Routes.notice(id) }
        if let v = value as? CreateMemeResponse, let id = v.meme?.id { return Routes.meme(id) }
        return Routes.home
    }

    /// Match upload Content-Type to file magic so the server MIME check passes.
    private static func sniffUpload(data: Data) -> (filename: String, mime: String) {
        let bytes = [UInt8](data.prefix(12))
        if bytes.count >= 3, bytes[0] == 0xFF, bytes[1] == 0xD8, bytes[2] == 0xFF {
            return ("upload.jpg", "image/jpeg")
        }
        if bytes.count >= 8, bytes[0] == 0x89, bytes[1] == 0x50, bytes[2] == 0x4E, bytes[3] == 0x47 {
            return ("upload.png", "image/png")
        }
        if bytes.count >= 6, bytes[0] == 0x47, bytes[1] == 0x49, bytes[2] == 0x46 {
            return ("upload.gif", "image/gif")
        }
        if bytes.count >= 12,
           bytes[0] == 0x52, bytes[1] == 0x49, bytes[2] == 0x46, bytes[3] == 0x46,
           bytes[8] == 0x57, bytes[9] == 0x45, bytes[10] == 0x42, bytes[11] == 0x50 {
            return ("upload.webp", "image/webp")
        }
        if bytes.count >= 8, bytes[4] == 0x66, bytes[5] == 0x74, bytes[6] == 0x79, bytes[7] == 0x70 {
            // ISO-BMFF: HEIC/HEIF brands vs real video (isom/mp41/…)
            let brand = String(bytes: bytes[8..<min(12, bytes.count)], encoding: .ascii)?.lowercased() ?? ""
            if brand.hasPrefix("heic") || brand.hasPrefix("heif") || brand.hasPrefix("mif1")
                || brand.hasPrefix("msf1") || brand.hasPrefix("hevx") {
                return ("upload.heic", "image/heic")
            }
            return ("upload.mp4", "video/mp4")
        }
        if bytes.count >= 4, bytes[0] == 0x1A, bytes[1] == 0x45, bytes[2] == 0xDF, bytes[3] == 0xA3 {
            return ("upload.webm", "video/webm")
        }
        // Default: JPEG label only works if bytes are JPEG — otherwise show a clear error path via server
        return ("upload.bin", "application/octet-stream")
    }
}
