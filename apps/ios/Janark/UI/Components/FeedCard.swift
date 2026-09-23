import SwiftUI

struct FeedCard: View {
    @Environment(\.janarkColors) private var c

    let post: FeedPostDto
    var onOpen: () -> Void
    var onAuthor: ((String) -> Void)? = nil
    var footer: AnyView? = nil

    var body: some View {
        let tags = post.tags
        let kind = resolveFeedKind(type: post.type, title: post.title, href: post.href, tags: tags)
        let bar: Color = {
            switch kind.kind {
            case .petition: return c.success
            case .vote: return c.fact
            case .report: return c.danger
            case .issue: return c.amber
            case .notice: return c.amberBright
            case .share: return c.news
            case .discussion, .other: return c.muted
            }
        }()
        let place = placeLabel(city: post.city, district: post.district, state: post.state, country: post.country)
        let time = relativeTime(post.createdAt)
        let metric = metricLabel(kind.metric, n: post.votes)

        SurfaceCard(onTap: onOpen) {
            HStack(alignment: .top, spacing: 12) {
                AccentBar(color: bar)
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        KindPill(label: kind.label, color: bar)
                        if post.hot == true {
                            KindPill(label: "Hot", color: c.amber)
                        }
                        if let publicId = post.publicId {
                            Text(publicId)
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(c.muted)
                        }
                    }
                    Text(post.title)
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(c.foreground)
                        .lineLimit(3)
                    if let excerpt = post.excerpt, !excerpt.isEmpty {
                        Text(excerpt)
                            .font(.subheadline)
                            .foregroundStyle(c.muted)
                            .lineLimit(3)
                    }
                    CivicMedia(url: post.mediaUrl, mediaType: post.mediaType)
                    HStack(spacing: 10) {
                        Text("\(metric.0) \(metric.1)")
                            .font(.caption)
                            .foregroundStyle(c.muted)
                        if let place {
                            Text(place)
                                .font(.caption)
                                .foregroundStyle(c.muted)
                        }
                        if let time {
                            Text(time)
                                .font(.caption)
                                .foregroundStyle(c.muted)
                        }
                    }
                    if let authorAnonId = post.authorAnonId {
                        Button(authorAnonId) { onAuthor?(authorAnonId) }
                            .font(.caption)
                            .foregroundStyle(c.amber)
                            .buttonStyle(.plain)
                    } else if let author = post.author, !author.isEmpty {
                        Text(author)
                            .font(.caption)
                            .foregroundStyle(c.amber)
                    }
                    if !tags.isEmpty {
                        Text(tags.prefix(5).map { $0.hasPrefix("#") ? $0 : "#\($0)" }.joined(separator: " "))
                            .font(.caption)
                            .foregroundStyle(c.navyMid)
                    }
                    if let footer {
                        footer
                    }
                }
            }
        }
    }
}

extension FeedCard {
    init(
        post: FeedPostDto,
        onOpen: @escaping () -> Void,
        onAuthor: ((String) -> Void)? = nil,
        @ViewBuilder footer: () -> some View
    ) {
        self.post = post
        self.onOpen = onOpen
        self.onAuthor = onAuthor
        self.footer = AnyView(footer())
    }
}
