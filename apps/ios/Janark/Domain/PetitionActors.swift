import Foundation

struct PetitionActor: Identifiable, Hashable, Sendable {
    var id: String { name }
    let name: String
    let target: String
    let aliases: [String]
    let region: String?

    init(name: String, target: String, aliases: [String] = [], region: String? = nil) {
        self.name = name
        self.target = target
        self.aliases = aliases
        self.region = region
    }
}

let PETITION_ACTORS: [PetitionActor] = [
    PetitionActor(name: "BBMP", target: "institution", aliases: ["bruhat bengaluru mahanagara palike", "bmc bangalore", "corporation"], region: "Bengaluru"),
    PetitionActor(name: "BESCOM", target: "institution", aliases: ["bangalore electricity"], region: "Bengaluru"),
    PetitionActor(name: "Bangalore Water Supply and Sewerage Board", target: "institution", aliases: ["bwssb", "water board"], region: "Bengaluru"),
    PetitionActor(name: "Bangalore Traffic Police", target: "institution", aliases: ["btp", "traffic police"], region: "Bengaluru"),
    PetitionActor(name: "BMTC", target: "institution", aliases: ["bus", "transport"], region: "Bengaluru"),
    PetitionActor(name: "Namma Metro / BMRCL", target: "institution", aliases: ["bmrcl", "metro"], region: "Bengaluru"),
    PetitionActor(name: "Government of Karnataka", target: "state", aliases: ["karnataka government", "state government"], region: "Karnataka"),
    PetitionActor(name: "Ministry of Railways", target: "government", aliases: ["railways", "indian railways"]),
    PetitionActor(name: "Ministry of Road Transport and Highways", target: "government", aliases: ["morth", "highways"]),
    PetitionActor(name: "Ministry of Environment, Forest and Climate Change", target: "government", aliases: ["moefcc", "environment ministry"]),
    PetitionActor(name: "Ministry of Education", target: "government", aliases: ["education ministry"]),
    PetitionActor(name: "Ministry of Health and Family Welfare", target: "government", aliases: ["mohfw", "health ministry"]),
    PetitionActor(name: "Municipal Corporation", target: "institution", aliases: ["municipality", "nagara palike"]),
    PetitionActor(name: "District Collector / Magistrate", target: "district", aliases: ["collector", "dm", "magistrate"]),
    PetitionActor(name: "State Police", target: "state", aliases: ["police"]),
    PetitionActor(name: "Parliament of India", target: "government", aliases: ["lok sabha", "rajya sabha"]),
    PetitionActor(name: "Supreme Court of India", target: "institution", aliases: ["supreme court"]),
    PetitionActor(name: "Public / fellow citizens", target: "public", aliases: ["citizens", "people"]),
    PetitionActor(name: "Delhi Jal Board", target: "institution", aliases: ["djb", "water board delhi"], region: "Delhi"),
    PetitionActor(name: "Brihanmumbai Municipal Corporation", target: "institution", aliases: ["bmc mumbai", "mcgm"], region: "Mumbai"),
    PetitionActor(name: "Chennai Metro Water", target: "institution", aliases: ["cmwssb"], region: "Chennai"),
    PetitionActor(name: "Greater Hyderabad Municipal Corporation", target: "institution", aliases: ["ghmc"], region: "Hyderabad"),
    PetitionActor(name: "Kolkata Municipal Corporation", target: "institution", aliases: ["kmc"], region: "Kolkata"),
    PetitionActor(name: "National Highways Authority of India", target: "government", aliases: ["nhai", "highways authority"]),
    PetitionActor(name: "Central Pollution Control Board", target: "government", aliases: ["cpcb", "pollution board"]),
    PetitionActor(name: "Election Commission of India", target: "institution", aliases: ["eci", "election commission"]),
    PetitionActor(name: "Ministry of Housing and Urban Affairs", target: "government", aliases: ["mohua", "urban affairs"]),
    PetitionActor(name: "Ministry of Women and Child Development", target: "government", aliases: ["mwcd", "wcd"]),
    PetitionActor(name: "State Education Department", target: "state", aliases: ["education dept", "school education"]),
    PetitionActor(name: "State Health Department", target: "state", aliases: ["health dept", "public health"]),
]

func searchPetitionActors(_ q: String, limit: Int = 8) -> [PetitionActor] {
    let needle = q.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if needle.isEmpty { return Array(PETITION_ACTORS.prefix(limit)) }

    let scored: [(PetitionActor, Int)] = PETITION_ACTORS.map { a in
        let hay = ([a.name] + a.aliases + [a.region].compactMap { $0 })
            .joined(separator: " ")
            .lowercased()
        var score = 0
        if a.name.lowercased().hasPrefix(needle) { score += 40 }
        if a.name.lowercased().contains(needle) { score += 20 }
        if hay.contains(needle) { score += 10 }
        for token in needle.split(separator: " ").map(String.init).filter({ !$0.isEmpty }) {
            if hay.contains(token) { score += 5 }
        }
        return (a, score)
    }

    return scored
        .filter { $0.1 > 0 }
        .sorted { $0.1 > $1.1 }
        .prefix(limit)
        .map(\.0)
}
