import SwiftUI

struct LoadingView: View {
    @Environment(\.janarkColors) private var c

    var body: some View {
        ProgressView()
            .tint(c.amber)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct EmptyStateView: View {
    @Environment(\.janarkColors) private var c
    let title: String
    var bodyText: String? = nil
    var action: String? = nil
    var onAction: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundStyle(c.foreground)
                .multilineTextAlignment(.center)
            if let bodyText, !bodyText.isEmpty {
                Text(bodyText)
                    .font(.subheadline)
                    .foregroundStyle(c.muted)
                    .multilineTextAlignment(.center)
            }
            if let action, let onAction {
                AmberButton(action, action: onAction)
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorView: View {
    let message: String
    var onRetry: (() -> Void)? = nil

    var body: some View {
        EmptyStateView(
            title: "Couldn’t load this",
            bodyText: message,
            action: onRetry != nil ? "Try again" : nil,
            onAction: onRetry
        )
    }
}

struct AmberButton: View {
    @Environment(\.janarkColors) private var c
    let title: String
    var enabled: Bool = true
    let action: () -> Void

    init(_ title: String, enabled: Bool = true, action: @escaping () -> Void) {
        self.title = title
        self.enabled = enabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .foregroundStyle(c.chrome)
                .background(enabled ? c.amber : c.line, in: RoundedRectangle(cornerRadius: 10))
        }
        .disabled(!enabled)
        .buttonStyle(.plain)
    }
}

struct GhostButton: View {
    @Environment(\.janarkColors) private var c
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .foregroundStyle(c.foreground)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(c.line, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

struct KindPill: View {
    let label: String
    let color: Color

    var body: some View {
        Text(label.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.6)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
    }
}

struct ChoiceChip: View {
    @Environment(\.janarkColors) private var c
    let label: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .foregroundStyle(selected ? c.foreground : c.muted)
                .background(
                    selected ? c.amber.opacity(0.2) : c.surface,
                    in: Capsule()
                )
                .overlay(
                    Capsule().stroke(c.line, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

struct JanarkField: View {
    @Environment(\.janarkColors) private var c
    @Binding var text: String
    let label: String
    var singleLine: Bool = true
    var minLines: Int = 1
    var placeholder: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(c.muted)
            Group {
                if singleLine {
                    TextField(placeholder ?? label, text: $text)
                } else {
                    TextField(placeholder ?? label, text: $text, axis: .vertical)
                        .lineLimit(minLines...12)
                }
            }
            .padding(12)
            .foregroundStyle(c.foreground)
            .background(c.surface, in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(c.line, lineWidth: 1)
            )
        }
    }
}

struct SectionLabel: View {
    @Environment(\.janarkColors) private var c
    let text: String

    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(1)
            .foregroundStyle(c.muted)
            .padding(.vertical, 8)
    }
}

struct TextLinkButton: View {
    @Environment(\.janarkColors) private var c
    let title: String
    let action: () -> Void

    var body: some View {
        Button(title, action: action)
            .foregroundStyle(c.amber)
            .buttonStyle(.plain)
    }
}

struct SurfaceCard<Content: View>: View {
    @Environment(\.janarkColors) private var c
    var onTap: (() -> Void)? = nil
    @ViewBuilder var content: Content

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) { card }
                    .buttonStyle(.plain)
            } else {
                card
            }
        }
    }

    private var card: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(c.surface, in: RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(c.line, lineWidth: 1)
            )
    }
}

struct AccentBar: View {
    let color: Color

    var body: some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(color)
            .frame(width: 4, height: 48)
    }
}
