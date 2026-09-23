import SwiftUI
import UIKit

struct EngageBar: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let targetType: String
    let targetId: String
    let sharePath: String
    let shareTitle: String?
    var compact: Bool = true
    var onOpenComments: (() -> Void)? = nil
    var showComments: Bool = false

    @State private var counts: EngageCountsDto?
    @State private var error: String?
    @State private var flagOpen = false
    @State private var commentsOpen = false
    @State private var sharePayload: SharePayload?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                HStack(spacing: 4) {
                    Button { vote("upvote") } label: {
                        Image(systemName: counts?.myVote == 1 ? "hand.thumbsup.fill" : "hand.thumbsup")
                            .foregroundStyle(counts?.myVote == 1 ? c.amber : c.muted)
                    }
                    Text(indianCount(counts?.upvotes ?? 0))
                        .font(.subheadline)
                        .foregroundStyle(c.foreground)
                    Button { vote("downvote") } label: {
                        Image(systemName: counts?.myVote == -1 ? "hand.thumbsdown.fill" : "hand.thumbsdown")
                            .foregroundStyle(counts?.myVote == -1 ? c.danger : c.muted)
                    }
                    Button {
                        if showComments {
                            // Comments already inline — avoid a duplicate sheet
                            return
                        }
                        if let onOpenComments {
                            onOpenComments()
                        } else {
                            commentsOpen = true
                        }
                    } label: {
                        Image(systemName: "bubble.right")
                            .foregroundStyle(c.muted)
                    }
                    Text(indianCount(counts?.commentCount ?? 0))
                        .font(.subheadline)
                        .foregroundStyle(c.muted)
                }
                Spacer()
                HStack(spacing: 4) {
                    Button { share() } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundStyle(c.muted)
                    }
                    Button {
                        gated("flag this") { flagOpen = true }
                    } label: {
                        Image(systemName: "flag")
                            .foregroundStyle(c.muted)
                    }
                }
            }
            .buttonStyle(.plain)

            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(c.danger)
            }

            if showComments {
                CommentThread(targetType: targetType, targetId: targetId)
            }
        }
        .task(id: "\(targetType)-\(targetId)") { await load() }
        .sheet(isPresented: $flagOpen) {
            FlagSheet(targetType: targetType, targetId: targetId) { flagOpen = false }
        }
        .sheet(isPresented: $commentsOpen) {
            NavigationStack {
                ScrollView {
                    CommentThread(targetType: targetType, targetId: targetId)
                        .padding()
                }
                .navigationTitle("Comments")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") { commentsOpen = false }
                    }
                }
            }
        }
        .sheet(item: $sharePayload) { payload in
            ActivityView(activityItems: [payload.text])
        }
    }

    private func load() async {
        switch await app.repository.engage(targetType: targetType, targetId: targetId) {
        case .ok(let value): counts = value
        case .err(let message, _, _): error = message
        }
    }

    private func gated(_ reason: String, _ block: @escaping () -> Void) {
        if app.session.uiSession.authenticated {
            block()
        } else {
            app.auth.require(reason, onSuccess: block)
        }
    }

    private func vote(_ choice: String) {
        gated("vote") {
            Task {
                switch await app.repository.voteEngage(targetType: targetType, targetId: targetId, choice: choice) {
                case .ok(let value):
                    counts = value
                case .err(let message, let unauthorized, _):
                    if unauthorized {
                        app.auth.require("vote") { vote(choice) }
                    } else {
                        error = message
                    }
                }
            }
        }
    }

    private func share() {
        gated("share") {
            Task {
                _ = await app.repository.trackShare(platform: "native", path: sharePath, title: shareTitle)
                let base = app.session.currentApiBase()
                let absolute: String = {
                    if sharePath.hasPrefix("http://") || sharePath.hasPrefix("https://") {
                        return sharePath
                    }
                    let path = sharePath.hasPrefix("/") ? sharePath : "/\(sharePath)"
                    return base + path
                }()
                let text = [shareTitle, absolute].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: "\n")
                sharePayload = SharePayload(text: text.isEmpty ? "Janark" : text)
            }
        }
    }
}

private struct SharePayload: Identifiable {
    let id = UUID()
    let text: String
}

struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
