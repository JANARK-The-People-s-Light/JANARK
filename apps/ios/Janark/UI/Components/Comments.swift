import SwiftUI

struct CommentThread: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let targetType: String
    let targetId: String

    @State private var comments: [CommentDto] = []
    @State private var draft = ""
    @State private var gif = ""
    @State private var replyTo: String?
    @State private var editingId: String?
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Comments")
                .font(.headline)
                .foregroundStyle(c.foreground)

            ForEach(comments, id: \.id) { comment in
                CommentItem(
                    comment: comment,
                    depth: 0,
                    onReply: { id in
                        replyTo = id
                        editingId = nil
                        draft = ""
                    },
                    onEdit: { id, body in
                        editingId = id
                        replyTo = nil
                        draft = body
                        gif = ""
                    },
                    onDelete: { id in
                        Task { await deleteComment(id) }
                    }
                )
            }

            if replyTo != nil {
                Text("Replying…")
                    .font(.caption)
                    .foregroundStyle(c.muted)
            }
            if editingId != nil {
                Text("Editing your comment…")
                    .font(.caption)
                    .foregroundStyle(c.muted)
            }

            JanarkField(
                text: $draft,
                label: editingId != nil ? "Edit comment" : (replyTo != nil ? "Reply" : "Add a comment"),
                singleLine: false,
                minLines: 2
            )
            if editingId == nil {
                JanarkField(text: $gif, label: "GIF link (optional)")
            }
            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(c.danger)
            }
            HStack(spacing: 8) {
                AmberButton(
                    editingId != nil ? "Save" : "Post comment",
                    enabled: draft.count >= 2 || (editingId == nil && !gif.isEmpty)
                ) {
                    Task { await send() }
                }
                if replyTo != nil || editingId != nil {
                    GhostButton("Cancel") {
                        replyTo = nil
                        editingId = nil
                        draft = ""
                        gif = ""
                    }
                }
            }
        }
        .task(id: "\(targetType)-\(targetId)") { await load() }
    }

    private func load() async {
        switch await app.repository.comments(targetType: targetType, targetId: targetId) {
        case .ok(let value):
            comments = value.comments
        case .err(let message, _, _):
            error = message
        }
    }

    private func send() async {
        let work: () async -> Void = {
            let result: Outcome<CommentsResponse>
            if let editingId {
                result = await app.repository.editComment(id: editingId, body: draft)
            } else {
                result = await app.repository.postComment(
                    targetType: targetType,
                    targetId: targetId,
                    body: draft,
                    parentId: replyTo,
                    mediaUrl: gif.isEmpty ? nil : gif,
                    mediaType: gif.isEmpty ? nil : "gif"
                )
            }
            switch result {
            case .ok(let value):
                comments = value.comments
                draft = ""
                gif = ""
                replyTo = nil
                editingId = nil
                error = nil
            case .err(let message, let unauthorized, _):
                if unauthorized {
                    app.auth.require("comment") { Task { await send() } }
                } else {
                    error = message
                }
            }
        }
        if app.session.uiSession.authenticated {
            await work()
        } else {
            app.auth.require("comment") { Task { await work() } }
        }
    }

    private func deleteComment(_ id: String) async {
        let work: () async -> Void = {
            switch await app.repository.deleteComment(id: id) {
            case .ok:
                await load()
            case .err(let message, let unauthorized, _):
                if unauthorized {
                    app.auth.require("delete comment") { Task { await deleteComment(id) } }
                } else {
                    error = message
                }
            }
        }
        if app.session.uiSession.authenticated {
            await work()
        } else {
            app.auth.require("delete comment") { Task { await work() } }
        }
    }
}

private struct CommentItem: View {
    @Environment(\.janarkColors) private var c
    let comment: CommentDto
    let depth: Int
    let onReply: (String) -> Void
    let onEdit: (String, String) -> Void
    let onDelete: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(comment.authorLabel ?? comment.authorAnonId ?? "Citizen")
                .font(.caption)
                .foregroundStyle(c.amber)
            Text(comment.body)
                .font(.subheadline)
                .foregroundStyle(c.foreground)
            CivicMedia(url: comment.mediaUrl, mediaType: comment.mediaType)
            HStack(spacing: 8) {
                Text(relativeTime(comment.createdAt) ?? "")
                    .font(.caption2)
                    .foregroundStyle(c.muted)
                Button("Reply") { onReply(comment.id) }
                    .font(.caption)
                    .foregroundStyle(c.amber)
                if comment.isMine {
                    Button("Edit") { onEdit(comment.id, comment.body) }
                        .font(.caption)
                        .foregroundStyle(c.muted)
                    Button("Delete") { onDelete(comment.id) }
                        .font(.caption)
                        .foregroundStyle(c.danger)
                }
            }
            .buttonStyle(.plain)

            ForEach(comment.replies, id: \.id) { reply in
                CommentItem(
                    comment: reply,
                    depth: depth + 1,
                    onReply: onReply,
                    onEdit: onEdit,
                    onDelete: onDelete
                )
            }
        }
        .padding(.leading, CGFloat(depth * 12))
    }
}

struct FlagSheet: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c
    @Environment(\.dismiss) private var dismiss

    let targetType: String
    let targetId: String
    var onDismiss: () -> Void

    @State private var reason = "spam"
    @State private var detail = ""
    @State private var msg: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Why are you reporting this?") {
                    ForEach(FLAG_REASONS, id: \.self) { r in
                        ChoiceChip(label: r.capitalized, selected: reason == r) {
                            reason = r
                        }
                    }
                    JanarkField(text: $detail, label: "Details (optional)", singleLine: false)
                    if let msg {
                        Text(msg)
                            .foregroundStyle(c.foreground)
                    }
                }
            }
            .navigationTitle("Report content")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        onDismiss()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Submit") {
                        Task { await submit() }
                    }
                    .foregroundStyle(c.amber)
                }
            }
        }
    }

    private func submit() async {
        switch await app.repository.flag(targetType: targetType, targetId: targetId, reason: reason, detail: detail.isEmpty ? nil : detail) {
        case .ok(let value):
            if value.alreadyReported {
                msg = "You already reported this"
            } else {
                msg = value.message ?? "Reported"
            }
        case .err(let message, let unauthorized, _):
            if unauthorized {
                onDismiss()
                dismiss()
                app.auth.require("flag this") {}
            } else {
                msg = message
            }
        }
    }
}
