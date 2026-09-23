import SwiftUI

struct AboutScreen: View {
    @Environment(\.janarkColors) private var c

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("About Janark")
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                    .foregroundStyle(c.foreground)
                Text("India's first open source social platform.")
                    .font(.body.weight(.medium))
                    .foregroundStyle(c.foreground)
                Text("Independent civic discussion, petitions, reports, and community voting — built in the open.")
                    .foregroundStyle(c.muted)
                Text("Public launch 26 January 2027. Until then, use this app against a running Janark server for preview.")
                    .foregroundStyle(c.muted)
                Text("Read freely. Participate when you choose. Every report, petition, discussion, vote, and contribution shapes what Janark becomes.")
                    .foregroundStyle(c.muted)

                SectionLabel("Participate your way")
                bullet("Browse freely without signing in.")
                bullet("Verify once by phone when you choose to post, support, vote, or comment.")
                bullet("Stay anonymous with a public Janark ID — your phone number is never shown.")
                bullet("Support ideas, not personalities.")

                SectionLabel("What matters")
                bullet("India's first open source social platform.")
                bullet("Independent of governments and political parties.")
                bullet("Community supported and open source.")
                bullet("Public opinion, not official elections.")
                bullet("Transparent moderation and vote integrity.")

                SectionLabel("Contribute")
                Text("Janark is built in the open. The JANARK name and logo are reserved; commercial use and public hosting need written permission.")
                    .foregroundStyle(c.muted)
                Text("github.com/JANARK-The-People-s-Light")
                    .foregroundStyle(c.amber)
            }
            .padding(20)
        }
    }

    private func bullet(_ text: String) -> some View {
        Text("· \(text)").foregroundStyle(c.muted)
    }
}
