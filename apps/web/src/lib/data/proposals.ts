import type { Proposal } from "@/lib/types";

export const proposals: Proposal[] = [
  {
    id: "asset-disclosure",
    title: "Mandatory Asset Disclosure",
    description:
      "All elected representatives should publicly disclose assets and liabilities annually in a machine-readable format.",
    benefits: ["Transparency", "Reduced corruption", "Public trust"],
    argumentsFor: [
      "Voters can track wealth changes during a term.",
      "Journalists and citizens gain auditability.",
      "Creates a norm of clean public office.",
    ],
    argumentsAgainst: [
      "Family privacy must be carefully scoped.",
      "Without verification, forms become theatre.",
      "Filings can be weaponised in partisan fights.",
    ],
    issueSlug: "corruption-disclosure",
    voteType: "likert",
    totalVotes: 11002,
    results: {
      strongly_support: 48,
      support: 27,
      neutral: 12,
      oppose: 8,
      strongly_oppose: 5,
    },
  },
  {
    id: "candidate-qualifications",
    title: "Candidate Qualification Standards",
    description:
      "Should candidates for public office meet selected civic standards before appearing on the ballot?",
    benefits: ["Higher accountability", "Informed choice", "Ethics floor"],
    argumentsFor: [
      "Clear standards raise the bar for public service.",
      "Voters get comparable information across candidates.",
    ],
    argumentsAgainst: [
      "Overly rigid rules can exclude grassroots leaders.",
      "Who defines 'qualification' can become political.",
    ],
    voteType: "checklist",
    options: [
      "Public service experience",
      "Financial disclosure",
      "Clean criminal record",
      "Educational qualification",
      "Leadership experience",
      "Policy knowledge",
      "Ethics certification",
    ],
    totalVotes: 8421,
    results: {
      "Public service experience": 62,
      "Financial disclosure": 81,
      "Clean criminal record": 88,
      "Educational qualification": 54,
      "Leadership experience": 49,
      "Policy knowledge": 57,
      "Ethics certification": 71,
    },
  },
  {
    id: "finance-minister-background",
    title: "Preferred Finance Minister Background",
    description:
      "What professional background should a Finance Minister ideally bring?",
    benefits: ["Informed preference map", "Public mandate signal"],
    argumentsFor: [
      "Economists may prioritise macro stability.",
      "Practitioners may prioritise delivery and markets.",
    ],
    argumentsAgainst: [
      "Background is not destiny; integrity matters more.",
      "Preference polls can oversimplify complex roles.",
    ],
    voteType: "preference",
    options: [
      "Economist",
      "CA",
      "MBA",
      "IAS",
      "Entrepreneur",
      "Professor",
      "Other",
    ],
    totalVotes: 5310,
    results: {
      Economist: 43,
      CA: 27,
      MBA: 18,
      IAS: 12,
      Entrepreneur: 9,
      Professor: 6,
      Other: 12,
    },
  },
  {
    id: "neet-security-overhaul",
    title: "NEET Security Overhaul",
    description:
      "Independent chain-of-custody audits, randomised centre allocation, and mandatory public post-exam integrity reports.",
    benefits: ["Exam integrity", "Student trust", "Deterrence"],
    argumentsFor: [
      "Visible audits restore confidence after leaks.",
      "Standard protocols reduce state-by-state chaos.",
    ],
    argumentsAgainst: [
      "Security theatre without capacity is expensive.",
      "Students need stability more than constant redesign.",
    ],
    issueSlug: "neet-reform",
    voteType: "likert",
    totalVotes: 12342,
    results: {
      strongly_support: 52,
      support: 29,
      neutral: 10,
      oppose: 6,
      strongly_oppose: 3,
    },
  },
  {
    id: "fast-track-courts",
    title: "Expand Fast-Track Courts for Priority Cases",
    description:
      "Fund time-bound benches for crimes against women, corruption of public servants, and cases older than five years.",
    benefits: ["Faster justice", "Deterrence", "Victim relief"],
    argumentsFor: [
      "Dedicated capacity clears chronic backlogs.",
      "Victims should not wait a decade for hearings.",
    ],
    argumentsAgainst: [
      "Creating parallel tracks can starve regular courts.",
      "Speed must not compromise fair trial rights.",
    ],
    issueSlug: "judicial-reforms",
    voteType: "likert",
    totalVotes: 9231,
    results: {
      strongly_support: 41,
      support: 33,
      neutral: 14,
      oppose: 8,
      strongly_oppose: 4,
    },
  },
];

export function getProposal(id: string): Proposal | undefined {
  return proposals.find((p) => p.id === id);
}
