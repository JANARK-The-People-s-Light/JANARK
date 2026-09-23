import Foundation

// MARK: - Defaulting property wrappers for lenient JSON decode

@propertyWrapper
struct DefaultFalse: Codable, Hashable, Sendable {
    var wrappedValue: Bool
    init(wrappedValue: Bool = false) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        wrappedValue = (try? c.decode(Bool.self)) ?? false
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultTrue: Codable, Hashable, Sendable {
    var wrappedValue: Bool
    init(wrappedValue: Bool = true) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        wrappedValue = (try? c.decode(Bool.self)) ?? true
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultZero: Codable, Hashable, Sendable {
    var wrappedValue: Int
    init(wrappedValue: Int = 0) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let i = try? c.decode(Int.self) { wrappedValue = i }
        else if let d = try? c.decode(Double.self) { wrappedValue = Int(d) }
        else { wrappedValue = 0 }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultZeroDouble: Codable, Hashable, Sendable {
    var wrappedValue: Double
    init(wrappedValue: Double = 0) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let d = try? c.decode(Double.self) { wrappedValue = d }
        else if let i = try? c.decode(Int.self) { wrappedValue = Double(i) }
        else { wrappedValue = 0 }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultEmpty: Codable, Hashable, Sendable {
    var wrappedValue: String
    init(wrappedValue: String = "") { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { wrappedValue = "" }
        else if let s = try? c.decode(String.self) { wrappedValue = s }
        else if let i = try? c.decode(Int.self) { wrappedValue = String(i) }
        else { wrappedValue = "" }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultEmptyArray<Element: Codable & Hashable & Sendable>: Codable, Hashable, Sendable {
    var wrappedValue: [Element]
    init(wrappedValue: [Element] = []) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        wrappedValue = (try? c.decode([Element].self)) ?? []
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultEmptyDict: Codable, Hashable, Sendable {
    var wrappedValue: [String: Int]
    init(wrappedValue: [String: Int] = [:]) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        wrappedValue = (try? c.decode([String: Int].self)) ?? [:]
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

@propertyWrapper
struct DefaultEmptyDoubleDict: Codable, Hashable, Sendable {
    var wrappedValue: [String: Double]
    init(wrappedValue: [String: Double] = [:]) { self.wrappedValue = wrappedValue }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        wrappedValue = (try? c.decode([String: Double].self)) ?? [:]
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(wrappedValue)
    }
}

extension KeyedDecodingContainer {
    func decode(_ type: DefaultFalse.Type, forKey key: Key) throws -> DefaultFalse {
        try decodeIfPresent(DefaultFalse.self, forKey: key) ?? DefaultFalse(wrappedValue: false)
    }
    func decode(_ type: DefaultTrue.Type, forKey key: Key) throws -> DefaultTrue {
        try decodeIfPresent(DefaultTrue.self, forKey: key) ?? DefaultTrue(wrappedValue: true)
    }
    func decode(_ type: DefaultZero.Type, forKey key: Key) throws -> DefaultZero {
        try decodeIfPresent(DefaultZero.self, forKey: key) ?? DefaultZero(wrappedValue: 0)
    }
    func decode(_ type: DefaultZeroDouble.Type, forKey key: Key) throws -> DefaultZeroDouble {
        try decodeIfPresent(DefaultZeroDouble.self, forKey: key) ?? DefaultZeroDouble(wrappedValue: 0)
    }
    func decode(_ type: DefaultEmpty.Type, forKey key: Key) throws -> DefaultEmpty {
        try decodeIfPresent(DefaultEmpty.self, forKey: key) ?? DefaultEmpty(wrappedValue: "")
    }
    func decode<T: Codable & Hashable & Sendable>(
        _ type: DefaultEmptyArray<T>.Type,
        forKey key: Key
    ) throws -> DefaultEmptyArray<T> {
        try decodeIfPresent(DefaultEmptyArray<T>.self, forKey: key) ?? DefaultEmptyArray(wrappedValue: [])
    }
    func decode(_ type: DefaultEmptyDict.Type, forKey key: Key) throws -> DefaultEmptyDict {
        try decodeIfPresent(DefaultEmptyDict.self, forKey: key) ?? DefaultEmptyDict(wrappedValue: [:])
    }
    func decode(_ type: DefaultEmptyDoubleDict.Type, forKey key: Key) throws -> DefaultEmptyDoubleDict {
        try decodeIfPresent(DefaultEmptyDoubleDict.self, forKey: key) ?? DefaultEmptyDoubleDict(wrappedValue: [:])
    }
}
