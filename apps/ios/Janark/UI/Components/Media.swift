import SwiftUI

struct CivicMedia: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    let url: String?
    let mediaType: String?

    var body: some View {
        Group {
            if let url, !url.isEmpty,
               let abs = mediaAbsoluteURL(base: app.session.apiBaseURL, url: url) {
                if mediaType == "video" {
                    Link(destination: abs) {
                        ZStack {
                            c.chrome
                            Text("Play video")
                                .foregroundStyle(c.onChrome)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 160)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                } else {
                    AsyncImage(url: abs) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        case .failure:
                            c.line
                        default:
                            ProgressView()
                                .frame(maxWidth: .infinity, minHeight: 120)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(maxHeight: 320)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }
}
