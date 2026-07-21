import type { Issue } from "@/lib/types";

export const issues: Issue[] = [
  {
    slug: "neet-reform",
    title: "NEET & Exam Integrity Reform",
    category: "Education",
    summary:
      "Citizens are demanding transparent, leak-proof national entrance exams after repeated paper-leak scandals and unequal access to coaching.",
    whyItMatters:
      "Entrance exams decide who enters medicine and higher education. When integrity fails, trust in the system collapses and merit becomes optional.",
    currentSituation:
      "Multiple states have reported irregularities. Students face anxiety, delayed counselling, and a perception that wealth buys preparation while leaks punish the honest.",
    pros: [
      "Stronger oversight could restore faith in national exams.",
      "Digital monitoring and independent audit trails reduce leak risk.",
      "More seats and decentralised pathways could ease single-exam pressure.",
    ],
    cons: [
      "Over-centralisation may ignore regional language and syllabus differences.",
      "Heavy security can raise costs and exclude rural centres.",
      "Frequent rule changes create instability for students already mid-cycle.",
    ],
    sources: [
      { label: "NTA public notices", url: "https://nta.ac.in" },
      { label: "Education ministry updates", url: "https://www.education.gov.in" },
    ],
    relatedSlugs: ["paper-leaks", "employment-youth"],
    voteCount: 12342,
    rating: 4.8,
    trendingRank: 1,
  },
  {
    slug: "paper-leaks",
    title: "Paper Leaks & Exam Transparency",
    category: "Education",
    summary:
      "A national push for criminal accountability, chain-of-custody rules, and open post-exam audits whenever question papers are compromised.",
    whyItMatters:
      "Paper leaks turn years of preparation into a lottery and signal that institutions cannot protect fairness.",
    currentSituation:
      "Leak cases span board and entrance exams. Investigations are slow; students rarely get timely redress.",
    pros: [
      "Strict liability for officials could deter negligence.",
      "Public post-mortems build transparency.",
      "Alternate assessment windows reduce lost years.",
    ],
    cons: [
      "Harsh laws alone do not fix weak logistics.",
      "Mass re-exams punish students who played fair.",
      "Media trials can outpace evidence.",
    ],
    sources: [
      { label: "Public Interest Litigation summaries", url: "https://indiankanoon.org" },
    ],
    relatedSlugs: ["neet-reform", "corruption-disclosure"],
    voteCount: 9841,
    rating: 4.6,
    trendingRank: 2,
  },
  {
    slug: "judicial-reforms",
    title: "Judicial Reforms & Case Backlogs",
    category: "Judiciary",
    summary:
      "Citizens want faster justice: more judges, time-bound hearings for priority cases, and transparent listing practices.",
    whyItMatters:
      "Delayed justice is denied justice. Backlogs trap families, businesses, and victims in limbo for decades.",
    currentSituation:
      "Millions of cases pending across courts. Vacancies, adjournment culture, and opaque scheduling remain chronic.",
    pros: [
      "Filling vacancies and expanding benches reduces wait times.",
      "Technology for e-filing and virtual hearings improves access.",
      "Specialist courts can clear specialised dockets faster.",
    ],
    cons: [
      "Speed without quality risks wrongful outcomes.",
      "Budget and infrastructure constraints are real.",
      "Reform must protect judicial independence from political pressure.",
    ],
    sources: [
      { label: "National Judicial Data Grid", url: "https://njdg.ecourts.gov.in" },
    ],
    relatedSlugs: ["corruption-disclosure", "women-reservation"],
    voteCount: 9231,
    rating: 4.4,
    trendingRank: 3,
  },
  {
    slug: "women-reservation",
    title: "Women's Representation in Politics",
    category: "Women",
    summary:
      "Debate on implementing reserved seats for women in legislatures, with timelines, rotation rules, and support for first-time candidates.",
    whyItMatters:
      "Half the population remains underrepresented in lawmaking. Representation shapes which issues get priority.",
    currentSituation:
      "Constitutional amendment exists; implementation details and delimitation linkages keep timelines contested.",
    pros: [
      "Reservation accelerates parity in decision-making.",
      "Diverse legislatures improve policy for safety, health, and care work.",
      "Role models expand political aspiration for girls.",
    ],
    cons: [
      "Seat rotation can weaken accountability to local voters.",
      "Without party reform, elites may capture reserved seats.",
      "Delimitation delays can push reform indefinitely.",
    ],
    sources: [
      { label: "Parliament of India", url: "https://sansad.in" },
    ],
    relatedSlugs: ["voting-reform", "employment-youth"],
    voteCount: 6231,
    rating: 4.3,
    trendingRank: 4,
  },
  {
    slug: "employment-youth",
    title: "Youth Employment & Skills",
    category: "Employment",
    summary:
      "Citizens seek credible jobs data, apprenticeship pathways, and policies that match education to local industry demand.",
    whyItMatters:
      "A young workforce without work fuels migration stress, underemployment, and distrust in growth narratives.",
    currentSituation:
      "Job quality and measurement remain contested. Gig work grows while secure formal employment feels scarce.",
    pros: [
      "Transparent labour statistics enable better policy.",
      "Industry-linked skilling reduces mismatch.",
      "Public works and green jobs can absorb surplus labour.",
    ],
    cons: [
      "Training without hiring commitments wastes time.",
      "Over-regulation can deter formal hiring.",
      "One national template ignores regional economies.",
    ],
    sources: [
      { label: "MoSPI labour statistics", url: "https://www.mospi.gov.in" },
    ],
    relatedSlugs: ["neet-reform", "ai-jobs"],
    voteCount: 8712,
    rating: 4.5,
    trendingRank: 5,
  },
  {
    slug: "corruption-disclosure",
    title: "Mandatory Asset Disclosure",
    category: "Corruption",
    summary:
      "A reform proposal that all elected representatives publish annual, machine-readable asset and liability statements.",
    whyItMatters:
      "Without disclosure, citizens cannot spot unexplained wealth or conflicts of interest.",
    currentSituation:
      "Some disclosures exist at election time; ongoing annual transparency and verification remain uneven.",
    pros: [
      "Public assets deter enrichment through office.",
      "Journalists and citizens can audit claims.",
      "Builds a culture of accountability.",
    ],
    cons: [
      "Privacy concerns for family assets need careful design.",
      "Fake declarations without verification are theatre.",
      "Weaponisation of filings in political rivalry.",
    ],
    sources: [
      { label: "Election Commission filings", url: "https://www.eci.gov.in" },
    ],
    relatedSlugs: ["judicial-reforms", "paper-leaks"],
    voteCount: 11002,
    rating: 4.7,
    trendingRank: 6,
  },
  {
    slug: "healthcare-access",
    title: "Public Healthcare Access",
    category: "Healthcare",
    summary:
      "Citizens want reliable primary care, medicine availability, and transparent wait times in public hospitals.",
    whyItMatters:
      "Health shocks push families into debt. Unequal access between cities and villages is a daily civic failure.",
    currentSituation:
      "Insurance schemes expanded coverage on paper; ground capacity, staffing, and drug supply still lag in many districts.",
    pros: [
      "Stronger primary care reduces tertiary overload.",
      "Open bed and drug dashboards improve accountability.",
      "Community health workers extend last-mile reach.",
    ],
    cons: [
      "Budgets compete with other priorities.",
      "Privatisation partnerships can exclude the poorest.",
      "Data without staffing does not heal patients.",
    ],
    sources: [
      { label: "MoHFW", url: "https://www.mohfw.gov.in" },
    ],
    relatedSlugs: ["employment-youth", "environment-pollution"],
    voteCount: 5420,
    rating: 4.2,
  },
  {
    slug: "environment-pollution",
    title: "Air & Water Pollution",
    category: "Environment",
    summary:
      "Urban and rural citizens demand enforceable air quality targets, cleaner fuels, and protection of water bodies.",
    whyItMatters:
      "Pollution shortens lives and hits outdoor workers and children hardest.",
    currentSituation:
      "Seasonal smog and contaminated water remain recurring crises despite monitoring networks.",
    pros: [
      "Hard emission caps with fines create deterrence.",
      "Public AQI alerts enable citizen adaptation.",
      "River rejuvenation protects livelihoods.",
    ],
    cons: [
      "Industry compliance costs may raise prices.",
      "Enforcement varies wildly by state capacity.",
      "Blame cycles between farmers, cities, and factories stall action.",
    ],
    sources: [
      { label: "CPCB", url: "https://cpcb.nic.in" },
    ],
    relatedSlugs: ["healthcare-access", "agriculture-farmers"],
    voteCount: 4890,
    rating: 4.1,
  },
  {
    slug: "agriculture-farmers",
    title: "Farmer Income & Markets",
    category: "Agriculture",
    summary:
      "Debate on MSP guarantees, market access, crop insurance fairness, and climate-resilient farming support.",
    whyItMatters:
      "Farm households feed the nation yet face debt, weather risk, and price volatility.",
    currentSituation:
      "Procurement is uneven across crops and states. Insurance claim delays frustrate growers.",
    pros: [
      "Predictable prices reduce distress sales.",
      "Better storage cuts post-harvest loss.",
      "Climate advisory services protect yields.",
    ],
    cons: [
      "Blanket MSP for all crops is fiscally heavy.",
      "Market reforms without trust spark protest.",
      "Middlemen capture gains without farmer voice.",
    ],
    sources: [
      { label: "Ministry of Agriculture", url: "https://agriwelfare.gov.in" },
    ],
    relatedSlugs: ["environment-pollution", "employment-youth"],
    voteCount: 4102,
    rating: 4.0,
  },
  {
    slug: "voting-reform",
    title: "Voting & Electoral Process Reform",
    category: "Voting Reform",
    summary:
      "Citizens discuss VVPAT audits, campaign finance transparency, and easier voter registration for migrants.",
    whyItMatters:
      "Elections are the primary formal mandate. Process trust determines whether results feel legitimate.",
    currentSituation:
      "Turnout and logistics are strong; debates continue on audit depth, money power, and migrant franchise.",
    pros: [
      "Stronger audits increase confidence.",
      "Transparent funding levels the field.",
      "Portable voting helps internal migrants.",
    ],
    cons: [
      "Over-complex rules can confuse voters.",
      "Tech changes need independent testing.",
      "Reform timing near elections looks partisan.",
    ],
    sources: [
      { label: "Election Commission of India", url: "https://www.eci.gov.in" },
    ],
    relatedSlugs: ["women-reservation", "corruption-disclosure"],
    voteCount: 7201,
    rating: 4.4,
  },
  {
    slug: "ai-jobs",
    title: "AI, Automation & Future of Work",
    category: "Employment",
    summary:
      "How India should prepare workers for AI displacement while capturing productivity gains in public services.",
    whyItMatters:
      "Automation will reshape white-collar and service jobs faster than previous industrial shifts.",
    currentSituation:
      "AI adoption is uneven. Public debate mixes hype, fear, and little worker-centred transition planning.",
    pros: [
      "AI can speed courts, welfare delivery, and diagnostics.",
      "Reskilling funds can create new digital livelihoods.",
      "Open public datasets enable local innovation.",
    ],
    cons: [
      "Job loss may hit graduates first.",
      "Biased systems can harm citizens silently.",
      "Vendor lock-in wastes public money.",
    ],
    sources: [
      { label: "NITI Aayog AI discussions", url: "https://www.niti.gov.in" },
    ],
    relatedSlugs: ["employment-youth", "cybersecurity-privacy"],
    voteCount: 3560,
    rating: 3.9,
  },
  {
    slug: "cybersecurity-privacy",
    title: "Cybersecurity & Digital Privacy",
    category: "Cybersecurity",
    summary:
      "Citizens want clearer consent, breach notification, and limits on surveillance overreach while fighting cybercrime.",
    whyItMatters:
      "Digital identity and payments are now civic infrastructure. Weak privacy is weak citizenship.",
    currentSituation:
      "Data protection law exists; enforcement capacity, awareness, and breach response are still maturing.",
    pros: [
      "Strong breach notices build trust.",
      "Purpose limitation reduces abuse of citizen data.",
      "Cybercrime cells need citizen-friendly reporting.",
    ],
    cons: [
      "Security agencies argue for broad access powers.",
      "Compliance burdens hit small platforms.",
      "Awareness gaps leave users vulnerable regardless of law.",
    ],
    sources: [
      { label: "MeitY", url: "https://www.meity.gov.in" },
    ],
    relatedSlugs: ["ai-jobs", "corruption-disclosure"],
    voteCount: 2980,
    rating: 3.8,
  },
];

export function getIssue(slug: string): Issue | undefined {
  return issues.find((i) => i.slug === slug);
}

export function getIssuesByCategory(category: string): Issue[] {
  return issues.filter((i) => i.category === category);
}

export const categories = [
  "Education",
  "Employment",
  "Healthcare",
  "Corruption",
  "Judiciary",
  "Women",
  "Agriculture",
  "Environment",
  "Infrastructure",
  "Police",
  "Cybersecurity",
  "Voting Reform",
] as const;
