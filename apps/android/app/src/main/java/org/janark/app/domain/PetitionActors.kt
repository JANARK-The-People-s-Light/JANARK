package org.janark.app.domain

data class PetitionActor(
    val name: String,
    val target: String,
    val aliases: List<String> = emptyList(),
    val region: String? = null,
)

val PETITION_ACTORS = listOf(
    PetitionActor("BBMP", "institution", listOf("bruhat bengaluru mahanagara palike", "bmc bangalore", "corporation"), "Bengaluru"),
    PetitionActor("BESCOM", "institution", listOf("bangalore electricity"), "Bengaluru"),
    PetitionActor("Bangalore Water Supply and Sewerage Board", "institution", listOf("bwssb", "water board"), "Bengaluru"),
    PetitionActor("Bangalore Traffic Police", "institution", listOf("btp", "traffic police"), "Bengaluru"),
    PetitionActor("BMTC", "institution", listOf("bus", "transport"), "Bengaluru"),
    PetitionActor("Namma Metro / BMRCL", "institution", listOf("bmrcl", "metro"), "Bengaluru"),
    PetitionActor("Government of Karnataka", "state", listOf("karnataka government", "state government"), "Karnataka"),
    PetitionActor("Ministry of Railways", "government", listOf("railways", "indian railways")),
    PetitionActor("Ministry of Road Transport and Highways", "government", listOf("morth", "highways")),
    PetitionActor("Ministry of Environment, Forest and Climate Change", "government", listOf("moefcc", "environment ministry")),
    PetitionActor("Ministry of Education", "government", listOf("education ministry")),
    PetitionActor("Ministry of Health and Family Welfare", "government", listOf("mohfw", "health ministry")),
    PetitionActor("Municipal Corporation", "institution", listOf("municipality", "nagara palike")),
    PetitionActor("District Collector / Magistrate", "district", listOf("collector", "dm", "magistrate")),
    PetitionActor("State Police", "state", listOf("police")),
    PetitionActor("Parliament of India", "government", listOf("lok sabha", "rajya sabha")),
    PetitionActor("Supreme Court of India", "institution", listOf("supreme court")),
    PetitionActor("Public / fellow citizens", "public", listOf("citizens", "people")),
)

fun searchPetitionActors(q: String, limit: Int = 8): List<PetitionActor> {
    val needle = q.trim().lowercase()
    if (needle.isEmpty()) return PETITION_ACTORS.take(limit)
    return PETITION_ACTORS.map { a ->
        val hay = (listOf(a.name) + a.aliases + listOfNotNull(a.region)).joinToString(" ").lowercase()
        var score = 0
        if (a.name.lowercase().startsWith(needle)) score += 40
        if (a.name.lowercase().contains(needle)) score += 20
        if (hay.contains(needle)) score += 10
        needle.split(" ").filter { it.isNotBlank() }.forEach { if (hay.contains(it)) score += 5 }
        a to score
    }.filter { it.second > 0 }.sortedByDescending { it.second }.take(limit).map { it.first }
}
