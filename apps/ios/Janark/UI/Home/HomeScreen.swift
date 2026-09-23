import SwiftUI

struct HomeScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let onNavigate: (String) -> Void

    @State private var type = "all"
    @State private var sort = "trending"
    @State private var q = ""
    @State private var tag = ""
    @State private var country = "India"
    @State private var state = ""
    @State private var district = ""
    @State private var city = ""
    @State private var filtersOpen = false
    @State private var loading = true
    @State private var error: String?
    @State private var data: FeedResponse?

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                JanarkField(text: $q, label: "Search the square")
                Button { Task { await reload() } } label: {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(c.foreground)
                }
                Button { filtersOpen = true } label: {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundStyle(c.foreground)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(FEED_TABS, id: \.0) { item in
                        ChoiceChip(label: item.1, selected: type == item.0) { type = item.0 }
                    }
                }
                .padding(.horizontal, 16)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(FEED_SORTS, id: \.0) { item in
                        ChoiceChip(label: item.1, selected: sort == item.0) { sort = item.0 }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }

            if let tags = data?.hashtags, !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ChoiceChip(label: "All topics", selected: tag.isEmpty) { tag = "" }
                        ForEach(tags, id: \.tag) { h in
                            ChoiceChip(label: "#\(h.tag)", selected: tag == h.tag) {
                                tag = tag == h.tag ? "" : h.tag
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 4)
                }
            }

            if let note = data?.ranking?.note {
                Text(note)
                    .font(.caption)
                    .foregroundStyle(c.muted)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 4)
            }

            content
        }
        .task(id: filterKey) { await reload() }
        .sheet(isPresented: $filtersOpen) {
            NavigationStack {
                Form {
                    Section("Content type") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(FEED_TABS + FEED_EXTRA_TYPES, id: \.0) { item in
                                    ChoiceChip(label: item.1, selected: type == item.0) { type = item.0 }
                                }
                            }
                        }
                    }
                    Section("Place") {
                        JanarkField(text: $country, label: "Country")
                        LocationSuggest(label: "State", value: $state, options: data?.locations.states ?? [])
                        LocationSuggest(label: "District", value: $district, options: data?.locations.districts ?? [])
                        LocationSuggest(label: "City / town", value: $city, options: data?.locations.cities ?? [])
                    }
                }
                .navigationTitle("Filters")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Apply") {
                            filtersOpen = false
                            Task { await reload() }
                        }
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
    }

    @ViewBuilder
    private var content: some View {
        let posts = data?.posts ?? []
        if loading && data == nil {
            LoadingView()
        } else if let error, data == nil {
            ErrorView(message: error) { Task { await reload() } }
        } else if posts.isEmpty {
            EmptyStateView(title: "Nothing here yet", bodyText: "Be the first to raise a civic post.")
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(posts, id: \.id) { post in
                        HomePost(post: post, onNavigate: onNavigate)
                    }
                }
                .padding(16)
            }
        }
    }

    private var filterKey: String {
        [type, sort, tag, country, state, district, city].joined(separator: "|")
    }

    private func params() -> [String: String] {
        var map: [String: String] = [
            "type": type,
            "sort": sort,
            "limit": "40",
        ]
        if !q.isEmpty { map["q"] = q }
        if !tag.isEmpty { map["tag"] = tag }
        if !country.isEmpty { map["country"] = country }
        if !state.isEmpty { map["state"] = state }
        if !district.isEmpty { map["district"] = district }
        if !city.isEmpty { map["city"] = city }
        return map
    }

    private func reload() async {
        loading = true
        error = nil
        switch await app.repository.loadFeed(params: params()) {
        case .ok(let value): data = value
        case .err(let message, _, _): error = message
        }
        loading = false
    }
}

struct LocationSuggest: View {
    let label: String
    @Binding var value: String
    let options: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            JanarkField(text: $value, label: label)
            if !value.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(options.filter { $0.localizedCaseInsensitiveContains(value) }.prefix(8), id: \.self) { opt in
                            ChoiceChip(label: opt, selected: value.compare(opt, options: .caseInsensitive) == .orderedSame) {
                                value = opt
                            }
                        }
                    }
                }
            }
        }
    }
}

struct HomePost: View {
    let post: FeedPostDto
    let onNavigate: (String) -> Void

    var body: some View {
        let target = engageTargetForFeedPost(
            id: post.id,
            type: post.type,
            refId: post.refId,
            title: post.title,
            tags: post.tags,
            href: post.href
        )
        let share = sharePathForPost(
            publicId: post.publicId,
            href: post.href,
            id: post.id,
            targetType: target.targetType,
            refId: post.refId
        )
        FeedCard(
            post: post,
            onOpen: {
                let route = hrefToRoute(post.href)
                    ?? post.publicId.map(Routes.publicPost)
                    ?? Routes.discussion(post.id)
                onNavigate(route)
            },
            onAuthor: { onNavigate(Routes.profile($0)) }
        ) {
            EngageBar(
                targetType: target.targetType,
                targetId: target.targetId,
                sharePath: share,
                shareTitle: post.title,
                compact: true,
                onOpenComments: {
                    let route = hrefToRoute(post.href) ?? Routes.discussion(post.id)
                    onNavigate(route)
                },
                showComments: false
            )
        }
    }
}
