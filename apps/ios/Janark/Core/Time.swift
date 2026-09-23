import Foundation

private let enIN = Locale(identifier: "en_IN")

private let shortDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = enIN
    f.dateStyle = .medium
    f.timeStyle = .none
    return f
}()

func parseInstant(_ iso: String) -> Date? {
    let isoFormatter = ISO8601DateFormatter()
    isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = isoFormatter.date(from: iso) { return d }
    isoFormatter.formatOptions = [.withInternetDateTime]
    if let d = isoFormatter.date(from: iso) { return d }
    let patched = iso.replacingOccurrences(of: " ", with: "T") + "Z"
    return isoFormatter.date(from: patched)
}

func relativeTime(_ iso: String?) -> String? {
    guard let iso, !iso.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
    guard let t = parseInstant(iso) else {
        return String(iso.prefix(10))
    }
    let sec = Int(Date().timeIntervalSince(t))
    if sec < 60 { return "Just now" }
    let min = Int((Double(sec) / 60.0).rounded())
    if min < 60 { return "\(min)m ago" }
    let hr = Int((Double(min) / 60.0).rounded())
    if hr < 48 { return "\(hr)h ago" }
    let day = Int((Double(hr) / 24.0).rounded())
    if day < 14 { return "\(day)d ago" }
    return shortDateFormatter.string(from: t)
}

func formatDate(_ iso: String?) -> String {
    guard let iso, !iso.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return "" }
    guard let t = parseInstant(iso) else { return String(iso.prefix(10)) }
    return shortDateFormatter.string(from: t)
}

func placeLabel(
    city: String? = nil,
    district: String? = nil,
    state: String? = nil,
    country: String? = nil,
    extra: String? = nil
) -> String? {
    let parts = [extra, city, district, state]
        .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
    let label = parts.joined(separator: ", ")
    if !label.isEmpty { return label }
    let c = country?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return c.isEmpty ? nil : c
}

func indianCount(_ n: Int) -> String {
    let formatter = NumberFormatter()
    formatter.locale = enIN
    formatter.numberStyle = .decimal
    return formatter.string(from: NSNumber(value: n)) ?? "\(n)"
}
