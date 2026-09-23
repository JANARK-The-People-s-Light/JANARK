import SwiftUI

enum ThemeId: String, CaseIterable, Identifiable, Codable {
    case brandDay = "brand-day"
    case brandWarm = "brand-warm"
    case brandNight = "brand-night"
    case monsoon = "monsoon"
    case emberGraphite = "ember-graphite"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .brandDay: return "Brand Day"
        case .brandWarm: return "Brand Warm"
        case .brandNight: return "Brand Night"
        case .monsoon: return "Monsoon"
        case .emberGraphite: return "Ember Graphite"
        }
    }

    var description: String {
        switch self {
        case .brandDay:
            return "White surfaces, deep navy type, orange actions — official Janark light."
        case .brandWarm:
            return "Light yellow paper wash with the same navy and orange brand marks."
        case .brandNight:
            return "Deep navy canvas, white type, golden accents — brand colors after dark."
        case .monsoon:
            return "Teal civic mist — water-and-sky palette for long reading sessions."
        case .emberGraphite:
            return "Charcoal surfaces with ember actions — focused night mode without brand navy."
        }
    }

    /// (surface, type, accent) as ARGB
    var swatches: (UInt32, UInt32, UInt32) {
        switch self {
        case .brandDay: return (0xFFFFFFFF, 0xFF002E57, 0xFFF89E17)
        case .brandWarm: return (0xFFFFE7A3, 0xFF02274B, 0xFFF89E17)
        case .brandNight: return (0xFF02274B, 0xFFFFFFFF, 0xFFFFC83D)
        case .monsoon: return (0xFFE8F1F2, 0xFF0B3D4A, 0xFF2A9D8F)
        case .emberGraphite: return (0xFF1C1917, 0xFFFAFAF9, 0xFFEA580C)
        }
    }

    var dark: Bool {
        switch self {
        case .brandNight, .emberGraphite: return true
        default: return false
        }
    }

    static func from(_ raw: String?) -> ThemeId {
        ThemeId(rawValue: raw ?? "") ?? .brandDay
    }
}

struct JanarkColors {
    let background: Color
    let foreground: Color
    let navy: Color
    let navyMid: Color
    let chrome: Color
    let chromeMid: Color
    let amber: Color
    let amberBright: Color
    let sand: Color
    let cream: Color
    let muted: Color
    let line: Color
    let surface: Color
    let onChrome: Color
    let success: Color
    let danger: Color
    let fact: Color
    let news: Color
}

func colorsFor(_ theme: ThemeId) -> JanarkColors {
    switch theme {
    case .brandDay:
        return JanarkColors(
            background: Color(hex: 0xFFFFFFFF),
            foreground: Color(hex: 0xFF02274B),
            navy: Color(hex: 0xFF02274B),
            navyMid: Color(hex: 0xFF002E57),
            chrome: Color(hex: 0xFF02274B),
            chromeMid: Color(hex: 0xFF002E57),
            amber: Color(hex: 0xFFF89E17),
            amberBright: Color(hex: 0xFFFFC83D),
            sand: Color(hex: 0xFFFFE7A3),
            cream: Color(hex: 0xFFFFF8E8),
            muted: Color(hex: 0xFF5D6264),
            line: Color(hex: 0xFFD9DDE0),
            surface: Color(hex: 0xFFFFFFFF),
            onChrome: Color(hex: 0xFFFFF8E8),
            success: Color(hex: 0xFF1F6B4A),
            danger: Color(hex: 0xFF9B2C2C),
            fact: Color(hex: 0xFF002E57),
            news: Color(hex: 0xFF8A6A12)
        )
    case .brandWarm:
        return JanarkColors(
            background: Color(hex: 0xFFFFE7A3),
            foreground: Color(hex: 0xFF02274B),
            navy: Color(hex: 0xFF02274B),
            navyMid: Color(hex: 0xFF002E57),
            chrome: Color(hex: 0xFF02274B),
            chromeMid: Color(hex: 0xFF002E57),
            amber: Color(hex: 0xFFF89E17),
            amberBright: Color(hex: 0xFFFFC83D),
            sand: Color(hex: 0xFFFFC83D),
            cream: Color(hex: 0xFFFFF4CC),
            muted: Color(hex: 0xFF5D6264),
            line: Color(hex: 0xFFE0C86A),
            surface: Color(hex: 0xFFFFF8E8),
            onChrome: Color(hex: 0xFFFFF8E8),
            success: Color(hex: 0xFF1F6B4A),
            danger: Color(hex: 0xFF9B2C2C),
            fact: Color(hex: 0xFF002E57),
            news: Color(hex: 0xFF8A6A12)
        )
    case .brandNight:
        return JanarkColors(
            background: Color(hex: 0xFF02274B),
            foreground: Color(hex: 0xFFFFFFFF),
            navy: Color(hex: 0xFFFFFFFF),
            navyMid: Color(hex: 0xFFFFE7A3),
            chrome: Color(hex: 0xFF002E57),
            chromeMid: Color(hex: 0xFF0A3A66),
            amber: Color(hex: 0xFFFFC83D),
            amberBright: Color(hex: 0xFFF89E17),
            sand: Color(hex: 0xFF002E57),
            cream: Color(hex: 0xFF0A3058),
            muted: Color(hex: 0xFFA8B0B5),
            line: Color(hex: 0xFF5D6264),
            surface: Color(hex: 0xFF0A3A66),
            onChrome: Color(hex: 0xFFFFFFFF),
            success: Color(hex: 0xFF3DD68C),
            danger: Color(hex: 0xFFF87171),
            fact: Color(hex: 0xFFFFE7A3),
            news: Color(hex: 0xFFFFC83D)
        )
    case .monsoon:
        return JanarkColors(
            background: Color(hex: 0xFFE8F1F2),
            foreground: Color(hex: 0xFF0B3D4A),
            navy: Color(hex: 0xFF0B3D4A),
            navyMid: Color(hex: 0xFF145566),
            chrome: Color(hex: 0xFF0B3D4A),
            chromeMid: Color(hex: 0xFF145566),
            amber: Color(hex: 0xFF2A9D8F),
            amberBright: Color(hex: 0xFF3DB8A8),
            sand: Color(hex: 0xFFD4E8EA),
            cream: Color(hex: 0xFFF3F9F9),
            muted: Color(hex: 0xFF5A7178),
            line: Color(hex: 0xFFB7CFD3),
            surface: Color(hex: 0xFFFFFFFF),
            onChrome: Color(hex: 0xFFF3F9F9),
            success: Color(hex: 0xFF1F6B4A),
            danger: Color(hex: 0xFF9B2C2C),
            fact: Color(hex: 0xFF145566),
            news: Color(hex: 0xFF8A6A12)
        )
    case .emberGraphite:
        return JanarkColors(
            background: Color(hex: 0xFF1C1917),
            foreground: Color(hex: 0xFFFAFAF9),
            navy: Color(hex: 0xFFFAFAF9),
            navyMid: Color(hex: 0xFFE7E5E4),
            chrome: Color(hex: 0xFF292524),
            chromeMid: Color(hex: 0xFF44403C),
            amber: Color(hex: 0xFFEA580C),
            amberBright: Color(hex: 0xFFF97316),
            sand: Color(hex: 0xFF292524),
            cream: Color(hex: 0xFF1C1917),
            muted: Color(hex: 0xFFA8A29E),
            line: Color(hex: 0xFF44403C),
            surface: Color(hex: 0xFF292524),
            onChrome: Color(hex: 0xFFFAFAF9),
            success: Color(hex: 0xFF4ADE80),
            danger: Color(hex: 0xFFF87171),
            fact: Color(hex: 0xFFFED7AA),
            news: Color(hex: 0xFFFBBF24)
        )
    }
}

extension Color {
    /// ARGB hex, e.g. `0xFF02274B`.
    init(hex: UInt32) {
        let a = Double((hex >> 24) & 0xFF) / 255.0
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
