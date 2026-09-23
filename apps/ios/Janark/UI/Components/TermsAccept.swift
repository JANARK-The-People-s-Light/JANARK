import SwiftUI

struct PostTermsAccept: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    @Binding var accepted: Bool
    var onOpenTerms: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(isOn: $accepted) {
                Text("I agree to the \(Civic.termsTitle) (v\(Civic.termsVersion)). Janark is not responsible for what I publish.")
                    .font(.footnote)
                    .foregroundStyle(c.foreground)
            }
            .tint(c.amber)

            TextLinkButton(title: "Read Civic Posting Terms", action: onOpenTerms)

            if let stored = app.session.acceptedTermsVersion,
               stored != Civic.termsVersion {
                Text("Terms were updated — please review and accept again.")
                    .font(.caption)
                    .foregroundStyle(c.danger)
            }
        }
    }
}
