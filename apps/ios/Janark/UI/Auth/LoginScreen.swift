import SwiftUI

struct LoginScreen: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.janarkColors) private var c

    var reason: String = "participate"
    let onSuccess: () -> Void
    var onClose: (() -> Void)? = nil

    @State private var phone = ""
    @State private var code = ""
    @State private var hint: String?
    @State private var devCode: String?
    @State private var sent = false
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Image("JanarkLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 88, height: 88)
                Text("Janark")
                    .font(.system(size: 32, weight: .semibold, design: .serif))
                    .foregroundStyle(c.foreground)
                Text("Verify by phone to \(reason)")
                    .foregroundStyle(c.muted)
                Text("Your number is never shown. You appear as an anonymity ID (jn-xxxxxxxx).")
                    .font(.footnote)
                    .foregroundStyle(c.muted)
                    .multilineTextAlignment(.center)

                JanarkField(
                    text: Binding(
                        get: { phone },
                        set: { phone = String($0.filter { $0.isNumber || $0 == "+" }.prefix(15)) }
                    ),
                    label: "Mobile number"
                )

                if sent {
                    JanarkField(
                        text: Binding(
                            get: { code },
                            set: { code = String($0.filter(\.isNumber).prefix(6)) }
                        ),
                        label: "6-digit OTP"
                    )
                    if let hint {
                        Text("Sent to \(hint)")
                            .font(.caption)
                            .foregroundStyle(c.muted)
                    }
                    if let devCode {
                        Text("Dev OTP: \(devCode)")
                            .font(.subheadline)
                            .foregroundStyle(c.amber)
                    }
                }

                if let error {
                    Text(error).foregroundStyle(c.danger)
                }

                if !sent {
                    AmberButton("Send OTP", enabled: !loading && phone.count >= 10) {
                        Task { await requestOtp() }
                    }
                } else {
                    AmberButton("Verify", enabled: !loading && code.count == 6) {
                        Task { await verify() }
                    }
                    GhostButton("Use a different number") {
                        sent = false
                        code = ""
                        devCode = nil
                    }
                }

                if let onClose {
                    GhostButton("Not now", action: onClose)
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity)
        }
    }

    private func requestOtp() async {
        loading = true
        error = nil
        switch await app.repository.requestOtp(phone: phone) {
        case .ok(let value):
            sent = true
            hint = value.hint
            devCode = value.devCode
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }

    private func verify() async {
        loading = true
        error = nil
        switch await app.repository.verifyOtp(phone: phone, code: code) {
        case .ok:
            onSuccess()
        case .err(let message, _, _):
            error = message
        }
        loading = false
    }
}
