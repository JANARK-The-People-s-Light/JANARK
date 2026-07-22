# Janark UX & Product Vision

> Not “copy Linear” or “copy Reddit.”  
> This is Janark’s product and UX direction — actionable for design and engineering.

**Identity:** A civic operating system — modern like Linear, community-driven like Reddit, action-oriented like Change.org, trustworthy like FixMyStreet — without becoming another social network.

---

## Design principles

Apply across the entire product:

1. **Content first** — civic content is the focus, not the chrome.
2. **One primary action per screen** — reduce distraction while creating or participating.
3. **Progressive disclosure** — advanced options stay hidden until needed.
4. **Consistency** — every creation flow should feel familiar.
5. **Trust by design** — anonymity, transparency, and moderation stay understandable without overwhelm.
6. **Community over popularity** — surface useful civic participation, not engagement bait.
7. **Consumer-grade experience** — polished like modern productivity apps, mission is civic.

---

## 1. Design language (Linear-inspired)

### Adopt

- Typography-first hierarchy
- Generous whitespace; fewer borders and dividers
- Distraction-free layouts
- Progressive disclosure
- Consistent spacing, buttons, and components
- Subtle motion; restrained micro-interactions
- Minimal palette; semantic color only

### Janark implementation

- [x] Single-column creation composers (Share, Report, Issue, Petition, Vote)
- [x] Advanced settings under **More**
- [x] Compose focus mode (hide topics rail / FAB / mobile tabs on `/new`)
- [ ] Shared component library tokens (spacing, type scale, chips, dialogs)
- [ ] Reduce clutter on list / detail pages to the same standard
- [ ] Skeleton loaders and purposeful page transitions

---

## 2. Community experience (Reddit-inspired)

### Adopt

- Feed-first home
- Rich threaded discussion
- Lightweight reactions and voting
- Discovery via topics
- Clean cards; infinite scroll where appropriate

### Janark implementation

- [x] Home shows **Community Feed** first (not explanatory chrome)
- [x] Simplified tabs: All · Petitions · Reports · Votes · Discussions
- [x] Content-type personality on cards (accent + label)
- [x] Replace “Signal” with support / participants / momentum
- [x] Trending rail with context
- [ ] Nested reply depth + clearer thread UX
- [ ] Save / bookmark content
- [ ] Follow issues, locations, and categories (beyond people)
- [ ] Infinite scroll (or clearer pagination)

---

## 3. Petitions (Change.org–inspired)

### Adopt

- Action-oriented flow
- Strong storytelling
- Clear decision-maker
- Progress + creator updates

### Janark implementation

- [x] Create: What should change? · Who should act? · Why?
- [x] Searchable decision-maker (BBMP, ministries, …)
- [x] **Launch petition** framing
- [ ] Petition hub: supporters, milestones, timeline, updates
- [ ] Related reports / discussions on petition page
- [ ] Rich social share cards
- [ ] Auto updates to supporters

---

## 4. Reporting (FixMyStreet–inspired)

### Adopt

- Fast, photo-first reporting
- Auto location
- Lifecycle tracking
- Evidence-focused submissions

### Janark implementation

- [x] Intent-first report composer + photo entry
- [x] Auto-detect location + category/topic hints
- [ ] Camera-first mobile capture path
- [ ] Status lifecycle: Reported → Verified → Under Review → Action Taken → Resolved
- [ ] Map of nearby reports
- [ ] Duplicate detection / merge

---

## 5. Unified content creation

Every type opens with one guiding question; the rest of the shell stays the same.

| Type       | Opening prompt                       | Status |
| ---------- | ------------------------------------ | ------ |
| Share      | Share something with your community  | Done   |
| Report     | What happened?                       | Done   |
| Issue      | What’s the issue?                    | Done   |
| Petition   | What should change?                  | Done   |
| Vote       | What question should people vote on? | Done   |
| Discussion | What would you like to discuss?      | Todo   |

Shared everywhere: attachments · location · topics · related content · publish.

- [x] **Share** — media-first civic community posts (not lifestyle feed)
- [x] Create menu grouped: Quick (Share, Report) · Organize (Issue, Petition, Vote, Discussion)
- [ ] Bring **Discussion** onto the same `CivicCreateShell`
- [ ] Optional unified entry: “What would you like to create?” then type-specific fields
- [ ] Convert Share → Report / Issue / Petition / Discussion (prefill from share)

---

## 6. AI-assisted experience

Detect and suggest; user confirms or edits:

- Location, category, topics
- Related issues / similar reports / existing petitions
- Duplicate content

- [x] Lightweight client-side detection (keywords + geolocation)
- [ ] Stronger suggestion quality (server / model-assisted)
- [ ] Related-content and duplicate surfacing at compose time

---

## 7. Unified civic journey

Janark’s differentiator: every action connects to the next.

```text
Report → Issue → Discussion → Petition → Vote → Resolution
```

Example:

```text
Broken road
  → multiple reports
  → road maintenance issue
  → community discussion
  → petition
  → public vote
  → resolved
```

- [x] Cross-links on create (Report ↔ Issue, petition ↔ issue)
- [ ] Explicit journey UI on every hub page (“Next step”, linked graph)
- [ ] Aggregate reports under issues; petitions/votes under issues

---

## 8. Rich content hubs

Pages are hubs, not orphan posts.

**Issue page (target):** Overview · Timeline · Related reports · Petitions · Votes · Discussions · Media · Updates · Activity · Contributors

- [ ] Issue hub redesign
- [ ] Same hub pattern for Petition / Report / Vote

---

## 9. Modern feed cards

Each card should communicate immediately:

- Content type · headline · location · status · engagement · time · quick actions  

Less metadata. More readability.

- [x] First pass (type accent, breathing title, clearer metrics)
- [ ] Status chips where lifecycle exists
- [ ] Stronger quick actions without clutter

---

## 10. Mobile-first

- Bottom nav · floating create · swipe where useful  
- Camera-first reporting · smooth transitions · responsive layouts  

- [x] Bottom nav + create FAB (hidden on compose)
- [ ] Camera-first report path
- [ ] Gesture polish and native feel pass

---

## 11. Search & discovery

- Global search · by location / category  
- Trending · nearby issues · popular petitions  
- Saved searches · recommendations  

- [x] Home filter (place, type, topics, sort)
- [ ] Global search surface
- [ ] Nearby / popular discovery modules

---

## 12. Community reputation

Prefer civic reputation over follower vanity:

- Trusted Reporter · Active Volunteer · Community Moderator · Research Contributor · Fact Checker  

- [ ] Reputation model + badges on profiles

---

## 13. Real-time updates

- Live votes · discussion · petition milestones · report status · follow notifications · activity feed  

- [x] Periodic feed refresh on home
- [ ] True live updates / push notifications

---

## 14. Premium interaction design

- Page transitions · skeletons · autosave · inline validation  
- Contextual menus · drag-and-drop · keyboard shortcuts · restrained animation  

- [x] Draft autosave on create flows
- [ ] Skeletons and transition system
- [ ] Keyboard shortcuts for power users

---

## Suggested delivery order

1. **Polish the grammar we already started** — Discussion composer parity; hub pages; petition progress UI  
2. **Civic journey graph** — reports → issues → petitions → votes, visible on every hub  
3. **Report lifecycle + map** — FixMyStreet depth  
4. **Discovery & search** — global + nearby  
5. **Reputation & realtime** — trust layer and live feel  

---

## North star

Janark should feel like **one coherent civic OS**: creating a report, signing a petition, voting, discussing, and following issues are chapters of the same story — with an interface as thoughtful as the product underneath.
