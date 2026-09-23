/** Civic Posting Terms — versioned; bump when legal text changes. */
export const CIVIC_POST_TERMS_VERSION = "2026-07-21.3";

export const CIVIC_POST_TERMS_TITLE =
  "Janark Civic Posting Terms & Conditions";

export type TermsSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export const CIVIC_POST_TERMS_SECTIONS: TermsSection[] = [
  {
    heading: "1. Purpose of Janark",
    paragraphs: [
      "Janark is operated as a non-profit organisation. It is an independent, unofficial civic technology platform for citizens to discuss, report, demand, and organise around the betterment of people and public life. It is not a for-profit social network, not a government portal, not a court, not a police station, not a political party channel, and not an election campaign tool.",
      "As a non-profit civic project, Janark’s purpose is public benefit — informed participation, accountability, and collective voice — not commercial exploitation of citizens or partisan gain.",
      "By publishing content on Janark, you confirm that your post is intended to advance public interest — accountability, rights, services, and informed civic participation — and not to promote any political party, candidate, or partisan campaign.",
    ],
  },
  {
    heading: "2. Strict non-partisan rule",
    paragraphs: [
      "You agree that your post will not promote, endorse, advertise, fundraise for, recruit for, or campaign on behalf of any political party, coalition, candidate, election symbol, or partisan organisation — whether national, state, or local.",
      "You further agree not to use Janark to attack or demean people solely because of their party affiliation, nor to turn a civic issue into a party marketing message.",
    ],
    bullets: [
      "No party logos, slogans, manifesto pitches, or “vote for / vote against [party or candidate]” calls to action.",
      "No paid or unpaid election canvassing, booth-level organising, or campaign donation appeals.",
      "No impersonation of parties, candidates, officials, or institutions.",
      "Critique of policies, laws, budgets, and public institutions is allowed; converting that critique into party propaganda is not.",
    ],
  },
  {
    heading: "3. Allowed civic subject matter",
    paragraphs: [
      "Posts should relate to the betterment of people and public life. Suitable topics include (non-exhaustive):",
    ],
    bullets: [
      "Judiciary & justice — courts, access to justice, legal aid, delayed cases, rights under law.",
      "Governance & public policy — laws, schemes, budgets, transparency, corruption, service delivery (institutions and outcomes, not party branding).",
      "Education — schools, colleges, exams, midday meals, teacher shortages, scholarships, curriculum quality.",
      "Healthcare — hospitals, medicines, public health, sanitation, epidemics, insurance access.",
      "Infrastructure & utilities — roads, water, electricity, transport, housing, drainage, internet access.",
      "Employment & livelihoods — jobs, wages, skilling, labour safety, local industry, farmer welfare.",
      "Environment & climate — pollution, waste, forests, water bodies, disaster preparedness.",
      "Safety & policing — street safety, women’s safety, traffic, emergency response (facts and reforms, not communal agitation).",
      "Civic rights & inclusion — disability access, language access, barriers to public services, non-partisan voter information.",
      "Other public-interest topics that similarly aim at people’s welfare, accountability, or informed civic debate.",
    ],
  },
  {
    heading: "4. What you must not post",
    paragraphs: [
      "In addition to the non-partisan rule, you agree not to publish content that:",
    ],
    bullets: [
      "Spreads knowing falsehoods, fabricated “evidence,” or deepfakes presented as fact.",
      "Incites violence, communal hatred, or targeted harassment of individuals or groups.",
      "Doxxes or reveals private phone numbers, addresses, IDs, or other personal data without lawful public-interest necessity.",
      "Is illegal under applicable law (including threats, child sexual exploitation material, or clear calls to commit crimes).",
      "Is primarily spam, scams, affiliate schemes, or unrelated commercial advertising.",
      "Uses Janark’s anonymity features to evade accountability for abuse while harming others.",
    ],
  },
  {
    heading: "5. Honesty, evidence, and constructive tone",
    paragraphs: [
      "You should aim for accuracy. Where you assert facts about public services, crime, or institutions, prefer verifiable details (place, time, documents, photos) over rumour.",
      "Disagreement is welcome. Personal insults, pile-ons, and bad-faith targeting of private individuals are not. Focus on systems, decisions, and outcomes that affect the public.",
    ],
  },
  {
    heading: "6. You are solely responsible for your content",
    paragraphs: [
      "Everything you publish — text, titles, asks, captions, hashtags, links, GIFs, images, videos, comments, replies, reports, demands, memes, notices, issues, and votes — is your content. You alone are responsible for it.",
      "Janark does not author, commission, or adopt your statements as its own. Your anonymity ID does not transfer legal responsibility for your words or media to Janark, its operators, maintainers, contributors, hosts, or affiliates.",
    ],
    bullets: [
      "You confirm that your content is lawful, that you have rights to post it, and that it complies with these Terms.",
      "You accept all consequences of publishing — including disputes, complaints, reputational claims, regulatory notices, and legal proceedings arising from your content.",
      "If authorities lawfully require information about abusive or illegal use, Janark may comply as required by applicable law; anonymity is not a promise of absolute secrecy against lawful process.",
    ],
  },
  {
    heading: "7. Anonymity and identity",
    paragraphs: [
      "Janark may require phone OTP to reduce bots. Your phone number is not shown publicly; you are represented by an anonymity ID. OTP proves you are a real person — it is not a public display name and is not an endorsement of your content.",
      "You remain responsible for what you publish under that anonymity ID. Anonymity is a shield for honest civic speech, not a licence for party propaganda, defamation, or abuse.",
    ],
  },
  {
    heading: "8. Platform is an intermediary — not responsible for user content",
    paragraphs: [
      "Janark is a hosting and facilitation layer for user-generated civic speech. It is not the publisher, author, editor, or speaker of citizen posts in the ordinary course of operation.",
      "Janark, its operators, maintainers, open-source contributors, hosting providers, and affiliates are not responsible or liable for user-generated content, including its accuracy, completeness, legality, fairness, tone, or consequences.",
    ],
    bullets: [
      "We do not guarantee that any report, demand, meme, comment, vote, or discussion is true, verified, complete, or unbiased.",
      "We do not guarantee that trending, ranking, filters, or notifications reflect official facts, court findings, or government records.",
      "Appearance of content on Janark does not mean Janark investigated, endorsed, certified, or fact-checked it.",
      "Third-party media links (including Giphy, Tenor, Imgur, CDNs, or other URLs) are outside Janark’s control; Janark is not responsible for third-party sites, files, malware, copyright claims, or content behind those links.",
      "Other users’ votes, replies, flags, and shares are their actions — not Janark’s advice or conclusions.",
    ],
  },
  {
    heading: "9. No official status; no advice; emergencies",
    paragraphs: [
      "Janark is not a substitute for official government portals, police, courts, hospitals, election authorities, or licensed professionals.",
      "Nothing on Janark is legal advice, medical advice, financial advice, safety advice, or an official complaint to any authority.",
    ],
    bullets: [
      "For emergencies, dial official emergency numbers and contact local police, fire, ambulance, or disaster services directly.",
      "For legal rights or disputes, consult a qualified lawyer or the competent court / authority.",
      "For schemes, certificates, FIRs, RTI, and official filings, use authorised government channels.",
      "Reliance on any post, ranking, or discussion on Janark is entirely at your own risk.",
    ],
  },
  {
    heading: "10. Moderation (discretionary; no duty to monitor)",
    paragraphs: [
      "Janark may — but is not obliged to — review, hide, remove, downrank, restrict, or refuse content or accounts that appear to violate these Terms or applicable law, especially party promotion, hate, doxxing, or illegal material, with or without prior notice where risk appears urgent.",
      "Citizens may flag content. Flagging does not create a promise of investigation, removal, or any particular outcome. These Terms do not create a duty for Janark to monitor, fact-check, or police every post in real time.",
      "Failure to remove any particular item does not mean Janark endorses it or accepts liability for it.",
    ],
  },
  {
    heading: "11. Your licence to Janark",
    paragraphs: [
      "By posting, you grant Janark a non-exclusive, worldwide, royalty-free licence to host, store, display, distribute, moderate, index, and technically process your content solely to operate, secure, and improve the civic platform.",
      "You represent that you have all rights needed to post the text and media you submit. You keep ownership of your content to the extent the law allows; Janark keeps ownership of the platform software, branding, and non-user materials.",
    ],
  },
  {
    heading: "12. Disclaimer of warranties",
    paragraphs: [
      "Janark is provided on an “AS IS” and “AS AVAILABLE” basis, without warranties of any kind — express, implied, or statutory — including merchantability, fitness for a particular purpose, non-infringement, uninterrupted access, error-free operation, or security.",
      "We do not warrant that the platform will be available at all times, free of bugs, free of abuse, or free of third-party interference. Civic tools can fail, lag, be rate-limited, or be misused.",
    ],
  },
  {
    heading: "13. Limitation of liability — platform not responsible",
    paragraphs: [
      "To the maximum extent permitted by applicable law, Janark and its operators, maintainers, contributors, hosts, and affiliates shall not be liable for any claim, loss, damage, cost, or expense arising out of or related to user-generated content; your reliance on any content, ranking, filter result, profile, or notification; disputes between users or with third parties or authorities; unavailability, data loss, delayed updates, or ranking changes; moderation decisions (including removal or non-removal); unauthorised access or misuse of accounts or anonymity features (except where liability cannot be excluded by law); or any indirect, incidental, special, consequential, punitive, or exemplary damages — including lost data, lost opportunity, reputational harm, or emotional distress — even if advised of the possibility.",
      "Where liability cannot be fully excluded under mandatory law, Janark’s total aggregate liability for all claims relating to the platform shall be limited to the greater of (a) the amount you paid Janark for the service in the three months before the claim (if any — Janark is typically free), or (b) one thousand Indian Rupees (₹1,000), except where such cap is prohibited.",
      "Nothing in these Terms excludes liability for death or personal injury caused by proven negligence, fraud, or any other liability that cannot be limited under applicable law.",
    ],
  },
  {
    heading: "14. Indemnity",
    paragraphs: [
      "You agree to defend, indemnify, and hold harmless Janark and its operators, maintainers, contributors, hosts, and affiliates from and against any claims, demands, actions, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or related to:",
    ],
    bullets: [
      "Your content or your use of the platform.",
      "Your breach of these Terms or of applicable law.",
      "Your infringement of any third party’s rights (including privacy, publicity, and intellectual property).",
      "Any dispute between you and another user or third party connected to your activity on Janark.",
    ],
  },
  {
    heading: "15. Changes, termination, and severability",
    paragraphs: [
      "Janark may update these Terms by publishing a new version. Continued publishing after the version changes means you accept the updated Terms for new posts. We may suspend or stop the service, or your access, at any time.",
      "If any clause is held unenforceable, the rest remains in effect. These Terms do not create a partnership, employment, or agency relationship between you and Janark.",
    ],
  },
  {
    heading: "16. Acceptance for each publication",
    paragraphs: [
      `By checking “I agree” and publishing, you confirm that you have read these Civic Posting Terms & Conditions (version ${CIVIC_POST_TERMS_VERSION}), that your post complies with them — including the ban on political-party promotion — and that the post is offered for the betterment of people in the civic domains described above.`,
      "You expressly acknowledge that Janark is not responsible for user-generated content; that you alone are responsible for what you publish; that Janark does not endorse or verify posts; and that you use the platform at your own risk.",
      "If you do not agree, do not publish. Publishing without acceptance is not permitted.",
    ],
  },
];

export type TermsFaq = {
  id: string;
  question: string;
  answer: string[];
};

/** Plain-language FAQs that mirror the binding Terms above. */
export const CIVIC_POST_TERMS_FAQS: TermsFaq[] = [
  {
    id: "nonprofit",
    question: "Is Janark a non-profit organisation?",
    answer: [
      "Yes. Janark is operated as a non-profit civic organisation — independent of government and political parties.",
      "Its purpose is public benefit: a place for citizens to speak, organise, and signal shared needs. It is not a for-profit social network and is not a commercial election or marketing tool.",
    ],
  },
  {
    id: "responsible",
    question: "Is Janark responsible for what people post?",
    answer: [
      "No. Janark hosts and facilitates civic discussion. Posts, comments, media, links, demands, reports, memes, notices, issues, and votes are created by users.",
      "Janark does not author those statements, does not adopt them as its own views, and is not liable for their accuracy, legality, fairness, or consequences. You alone are responsible for what you publish under your anonymity ID.",
    ],
  },
  {
    id: "party",
    question: "Can I post in support of a political party or candidate?",
    answer: [
      "No. Party promotion, candidate campaigning, manifesto pitches, election canvassing, and “vote for / against” party calls are forbidden.",
      "You may discuss laws, policies, budgets, public services, and institutional performance — without turning the post into partisan advertising.",
    ],
  },
  {
    id: "topics",
    question: "What topics are allowed?",
    answer: [
      "Civic betterment topics such as judiciary and justice, governance and public policy, education, healthcare, infrastructure, livelihoods, environment, safety, and civic rights — plus similar public-interest subjects.",
      "The goal is people’s welfare and accountability, not party branding or private harassment.",
    ],
  },
  {
    id: "anonymous",
    question: "If I am anonymous, am I free from responsibility?",
    answer: [
      "No. Phone OTP helps prove you are a real person and reduces bots. Your number is not shown publicly, but you remain responsible for content published under your anonymity ID.",
      "Anonymity is meant to protect honest civic speech — not to enable party propaganda, defamation, doxxing, or illegal activity. Janark may comply with lawful process where required.",
    ],
  },
  {
    id: "verified",
    question: "Does a post on Janark mean it is verified or official?",
    answer: [
      "No. Presence on Janark does not mean the claim was investigated, endorsed, certified, or fact-checked by Janark.",
      "Trending and ranking reflect civic momentum signals (such as discussion and participation) — not court findings, government records, or official truth.",
    ],
  },
  {
    id: "emergency",
    question: "Can I use Janark instead of calling the police or filing a case?",
    answer: [
      "No. Janark is not a police station, court, hospital, or government portal. It is not legal, medical, or emergency advice.",
      "For emergencies, contact official emergency services. For FIRs, RTI, schemes, and court matters, use authorised government and legal channels.",
    ],
  },
  {
    id: "false",
    question: "What if someone posts something false or harmful about me?",
    answer: [
      "Users are responsible for their own content. You may flag content that appears to violate these Terms.",
      "Flagging does not guarantee removal or any particular outcome. Janark may moderate at its discretion but has no duty to monitor every post in real time. You may also pursue remedies available under applicable law against the responsible person.",
    ],
  },
  {
    id: "media",
    question: "Who is responsible for GIF and media links I paste?",
    answer: [
      "You are. Comments allow GIF links; other posts may allow image, GIF, or video URLs. You must have the rights to share those links.",
      "Third-party hosts (Giphy, Tenor, CDNs, and others) are outside Janark’s control. Janark is not responsible for third-party files, malware, copyright claims, or content behind those URLs.",
    ],
  },
  {
    id: "moderation",
    question: "Will Janark always remove content I report?",
    answer: [
      "Not necessarily. Janark may hide, remove, downrank, or restrict content that appears to violate these Terms or the law, especially party promotion, hate, doxxing, or illegal material.",
      "There is no promise that every flag will lead to removal. Failure to remove an item does not mean Janark endorses it or accepts liability for it.",
    ],
  },
  {
    id: "liability",
    question: "What does “platform not responsible” mean in practice?",
    answer: [
      "It means that, to the fullest extent allowed by law, Janark and its operators are not liable for user posts; for your reliance on posts or rankings; for disputes between users or with authorities; for downtime or ranking changes; or for most consequential damages.",
      "Where the law does not allow a full exclusion, liability is capped as described in the Terms (typically to a small amount, since Janark is usually free), except for liabilities that cannot be limited by law.",
    ],
  },
  {
    id: "accept",
    question: "Why must I accept Terms every time I publish?",
    answer: [
      "Each publication is a fresh confirmation that your specific post complies with the current Terms version — including non-partisan rules and platform non-liability.",
      "If the Terms version changes, you must accept the new version before publishing again. If you do not agree, do not publish.",
    ],
  },
  {
    id: "binding",
    question: "Are FAQ answers legally binding?",
    answer: [
      "FAQs explain the Terms in plain language. If anything in an FAQ conflicts with the numbered Terms sections above, the numbered Terms control.",
      "Acceptance of the Terms (checkbox + publish) is what binds you for each publication.",
    ],
  },
];

export function requireCivicPostTerms(body: Record<string, unknown>): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  const accepted =
    body.acceptedTerms === true ||
    body.acceptedTerms === "true" ||
    body.acceptedTerms === 1;
  const version = String(body.termsVersion ?? "").trim();

  if (!accepted) {
    return {
      ok: false,
      error:
        "You must accept the Civic Posting Terms & Conditions before publishing.",
    };
  }
  if (version !== CIVIC_POST_TERMS_VERSION) {
    return {
      ok: false,
      error:
        "Please open and accept the latest Civic Posting Terms & Conditions, then try again.",
    };
  }
  return { ok: true };
}

export function termsPayload(accepted: boolean) {
  return accepted
    ? {
        acceptedTerms: true as const,
        termsVersion: CIVIC_POST_TERMS_VERSION,
      }
    : {
        acceptedTerms: false as const,
        termsVersion: CIVIC_POST_TERMS_VERSION,
      };
}
