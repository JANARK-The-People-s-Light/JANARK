import SwiftUI

private struct JanarkColorsKey: EnvironmentKey {
    static let defaultValue: JanarkColors = colorsFor(.brandDay)
}

private struct ThemeIdKey: EnvironmentKey {
    static let defaultValue: ThemeId = .brandDay
}

extension EnvironmentValues {
    var janarkColors: JanarkColors {
        get { self[JanarkColorsKey.self] }
        set { self[JanarkColorsKey.self] = newValue }
    }

    var themeId: ThemeId {
        get { self[ThemeIdKey.self] }
        set { self[ThemeIdKey.self] = newValue }
    }
}

struct JanarkThemeModifier: ViewModifier {
    let theme: ThemeId

    func body(content: Content) -> some View {
        let tokens = colorsFor(theme)
        content
            .environment(\.janarkColors, tokens)
            .environment(\.themeId, theme)
            .preferredColorScheme(theme.dark ? .dark : .light)
            .tint(tokens.amber)
            .background(tokens.background.ignoresSafeArea())
    }
}

extension View {
    func janarkTheme(_ theme: ThemeId) -> some View {
        modifier(JanarkThemeModifier(theme: theme))
    }
}
