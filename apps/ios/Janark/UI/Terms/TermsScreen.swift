import SwiftUI

struct TermsScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    @State private var acceptedNote: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(Civic.termsTitle)
                    .font(.system(.title, design: .serif).weight(.semibold))
                    .foregroundStyle(c.foreground)
                Text("Version \(Civic.termsVersion)")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(c.muted)

                ForEach(CIVIC_POST_TERMS_SECTIONS, id: \.heading) { section in
                    Text(section.heading)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(c.foreground)
                    ForEach(section.paragraphs, id: \.self) { p in
                        Text(p).foregroundStyle(c.muted)
                    }
                    ForEach(section.bullets, id: \.self) { b in
                        Text("· \(b)").foregroundStyle(c.foreground)
                    }
                }

                SectionLabel("Plain-language FAQs")
                ForEach(CIVIC_POST_TERMS_FAQS, id: \.id) { faq in
                    Text(faq.question)
                        .font(.headline)
                        .foregroundStyle(c.foreground)
                    ForEach(faq.answer, id: \.self) { a in
                        Text(a).foregroundStyle(c.muted)
                    }
                }

                AmberButton("I have read these terms") {
                    Task {
                        _ = await app.repository.acceptTerms()
                        acceptedNote = "Saved on this device. You still confirm acceptance each time you publish."
                    }
                }
                if let acceptedNote {
                    Text(acceptedNote).foregroundStyle(c.success)
                }
            }
            .padding(20)
        }
    }
}
