import Foundation

enum Outcome<T> {
    case ok(T)
    case err(String, unauthorized: Bool = false, status: Int? = nil)

    var value: T? {
        if case .ok(let v) = self { return v }
        return nil
    }

    var errorMessage: String? {
        if case .err(let message, _, _) = self { return message }
        return nil
    }

    var isUnauthorized: Bool {
        if case .err(_, let unauthorized, _) = self { return unauthorized }
        return false
    }

    func getOrNull() -> T? { value }

    func map<R>(_ transform: (T) -> R) -> Outcome<R> {
        switch self {
        case .ok(let v): return .ok(transform(v))
        case .err(let message, let unauthorized, let status):
            return .err(message, unauthorized: unauthorized, status: status)
        }
    }
}
