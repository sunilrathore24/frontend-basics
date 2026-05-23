# IRIS Frontend Architect — Round 2 (Technical) Prep

> 20 curated questions tailored to the two interviewers and the published JD.
> Round 1 is the coding screen. Round 2 is the technical deep-dive. Round 3 is managerial.

---

## Interviewer profiles

### Gavin de Kock — Global Principal Engineer (IRIS, Jun 2025 – Present)
- **Background**: 30 years in industry. Co-founder of Obsidian Systems (Linux pioneer in South Africa), 21+ years at IVIS Group running through Senior Consultant → Head of Product Development → Principal Consultant Software Engineer.
- **Domain depth**: ISO8583, payment card processing, .NET / ASP.NET, B2C e-commerce, OOP/OOD, Linux internals.
- **What he will probe**:
  - First-principles reasoning ("why this, not that")
  - Long-horizon consequences of architectural decisions (he has lived 20+ years with the choices he made)
  - Security and data integrity for financial / payroll workloads
  - .NET / C# integration nuances at the contract layer
  - Trade-offs not just at code level but at delivery, ops, support cost level

### Simon Morris — Lead Software Engineer (IRIS, Jan 2025 – Present)
- **Background**: Full-stack PHP, FileMaker, modern web. Director of IT at Lucardo Ltd. Senior Web Developer at School Spider. Multi-hat full-stack lead.
- **What he will probe**:
  - Pragmatic, ship-it judgement
  - Full-stack thinking (frontend that respects backend reality)
  - Real-world incident war stories
  - Modern web fundamentals (browser, network, runtime) — he sees both ends of the stack
  - How you mentor and unblock teammates

> **Strategy**: For each question I tag the likely asker (G / S / Both) so you can rehearse delivery style. Gavin wants depth and reasoning; Simon wants concrete examples and pragmatic outcomes.

---

## Top 5 things to land in Round 2

1. **Show you have shipped this before, not just read it** — every answer needs at least one "in my last role, the trade-off we hit was…"
2. **Make the .NET ↔ frontend contract explicit** — Gavin will appreciate that you treat the API boundary as a versioned, owned artefact
3. **Treat payroll/HR data as sensitive by default** — frame XSS, PII, audit, RBAC as architecture concerns, not afterthoughts
4. **Be opinionated but not dogmatic** — they want a leader, not a contrarian; agree → disagree → commit
5. **Talk like a coach, not a code-cop** — leadership outcomes (consensus, adoption, mentoring) are explicit JD requirements

---


# Q1. Walk me through the single architectural decision in your last role that you regret. What would you change and why? *(G — first-principles)*

### Why he is asking
Gavin has 30 years of decisions behind him. He wants to see if you reflect, if you can name a trade-off honestly, and whether your "regret" is at code level (small) or architecture level (interesting). Defensive answers fail this question.

### How to structure the answer
1. Name the decision in one sentence (concrete, not abstract)
2. State the constraint at the time — what *was* true that justified the call
3. State what changed — why the original constraint no longer holds
4. State the cost of carrying the decision and the migration cost out of it
5. State what you would do differently *given the same starting constraints*

### Sample answer
"We picked NgRx for every feature module across a 40-module Angular app because at the time the team was uneven on RxJS and we wanted one obvious pattern. Two years in, ~60% of our store was ceremonial — actions, reducers, effects for state that never left a single component. The cost was onboarding time and PR noise; junior engineers wrote 80 lines for what should have been a service with a `BehaviorSubject`.

What I would change: I would still pick a global store for cross-cutting state (auth, permissions, shared filters) but I would have written an architecture decision record up front saying *feature stores are opt-in, justified by at least two consumers or persistence requirements*. The lesson is that 'one obvious pattern' is a false economy when the pattern is heavyweight — consistency at the cost of leverage isn't consistency, it's tax."

### Trap to avoid
Don't pick a tooling regret ("I wish we'd used Vite instead of Webpack"). That signals shallow thinking. Pick a trade-off where the *consequences* matter — security, scalability, team velocity, support burden.

---

# Q2. We have a .NET Core backend. A team wants to introduce GraphQL via Hot Chocolate; another wants to keep REST and add a BFF in Node. Walk me through how you decide. *(G — .NET integration depth)*

### Why he is asking
Gavin's background is .NET / ISO8583 / payment processing. He will not accept a hand-wavy "it depends." He wants to see you weigh team capability, ops cost, and the actual frontend consumption pattern.

### Decision framework
| Dimension | REST + Node BFF | GraphQL via Hot Chocolate |
|---|---|---|
| Backend team skillset | Stays in C# only if BFF team owned by FE | One team, one language end-to-end |
| Schema evolution | Versioned URLs; old/new live side-by-side | Type system enforces; deprecation per field |
| Over/under-fetching | BFF aggregates per screen | Client picks fields directly |
| Caching | Easy at HTTP layer (CDN, ETag) | Persisted queries + APQ needed |
| Observability | Standard HTTP traces | Resolver-level tracing required |
| Frontend ergonomics | TypeScript types from OpenAPI | Codegen from schema; strongest |
| Team cost | Two services to operate | One service, one schema to govern |

### Sample answer
"I default to whichever option keeps the team count low without crippling the client. With Hot Chocolate already in the .NET ecosystem, the team can keep the backend in C# and still give the frontend the field-level flexibility GraphQL offers — that's a single service to operate. A Node BFF is justified when (a) the frontend needs aggregation across services that already have hard contract boundaries, or (b) you need to inject frontend-specific concerns like personalisation or feature-flag rewrites that don't belong in the domain backend.

For HR/payroll specifically, I'd lean Hot Chocolate. Payroll has deeply nested entities — employee → contract → pay run → payslip → deductions — that punish REST round-trips. The trade-off I'd flag: GraphQL erases the easy HTTP cache, so I'd require persisted queries from day one and put the FE on Apollo or urql with a normalised cache. If the team has zero GraphQL experience I'd still pick it but pair the rollout with a one-month enablement plan and a contract test suite."

### Trap to avoid
Don't dismiss either option. Both are valid. Show you would *measure* the call against team capability and the dominant query pattern.

---

# Q3. Payroll data is sensitive. Walk through every layer where a bad architectural call could leak it on the frontend. *(G — security mindset)*

### Why he is asking
Payment processing is in his bones (ISO8583). He wants to see if you treat the frontend as a security surface, not a paint job.

### Layered answer
1. **Token storage** — access token in memory only; refresh token in `httpOnly`, `Secure`, `SameSite=Strict` cookie. `localStorage` is a non-starter because XSS reads it.
2. **XSS surface** — Angular sanitisation is on by default; React's `dangerouslySetInnerHTML` is the failure mode. Audit every place it's used. CSP with `script-src 'self' 'nonce-...'` and no `unsafe-inline`.
3. **Logging** — never log PII or tokens. Frontend error monitors (Sentry, Rollbar) need a `beforeSend` scrubber to strip emails, NI numbers, salary fields.
4. **Browser DevTools / source maps** — production source maps go to a private bucket, served only to authenticated tools, never public.
5. **Caching** — `Cache-Control: no-store` on payroll API responses; service worker route exclusions for payroll endpoints; no SWR for sensitive read paths.
6. **State persistence** — if you persist Redux/NgRx to `localStorage` for offline, payroll slices are explicitly excluded from the persistence whitelist.
7. **Memory hygiene** — clear sensitive in-memory state on logout; clear it on idle timeout; never hold a payslip object in a closure that survives navigation.
8. **Clipboard / autofill** — disable autofill on salary fields (`autocomplete="off"`); avoid copy buttons unless you scrub on-blur.
9. **Postmessage / iframe** — every `postMessage` listener checks `event.origin`; iframes use `sandbox` with the smallest required allowlist.
10. **Third-party scripts** — analytics, chat widgets, A/B tools see the DOM. Subresource Integrity and a strict CSP. PII-bearing pages get a tighter CSP than marketing pages.
11. **RBAC at UI layer** — never rely on hiding a button. Every privileged route hits an authorisation check on the server; the UI hide is purely cosmetic.
12. **Audit trail** — sensitive reads (viewing a payslip) emit a server-side audit event. The frontend doesn't write the audit; it just consumes the API that does.

### Sample answer (compressed)
"I think about it as twelve layers, but the four that bite hardest in payroll are: tokens never in `localStorage`, no `dangerouslySetInnerHTML` paths, `Cache-Control: no-store` on every payroll response, and an explicit persistence whitelist if we use offline. The sleeper risk is third-party scripts — analytics see the DOM, so payslip pages get a stricter CSP than the rest of the app and we run periodic Subresource Integrity audits. RBAC on the UI is cosmetic; the server is the actual gate."

### Trap to avoid
Don't lecture on every OWASP item. Pick the four-to-six that matter most for HR/payroll and show you have lived with each.

---

# Q4. The JD says "selecting best-of-breed UI frameworks that integrate effectively with the existing .NET backend ecosystem." If you had a greenfield IRIS module, would you pick Angular, React, Blazor, or Vue, and why? *(Both — opinion under pressure)*

### Why they are asking
JD requirement, plus they want to see if you have a defensible default vs a "depends" cop-out.

### Sample answer
"For a new module on a .NET backend at IRIS scale, my default is **React** — but I want to give you the honest reasoning rather than a brand answer.

- **Angular** wins when the team is large, junior-skewed, and we need opinionated DI, routing, forms, and HTTP out of the box. IRIS already has Angular in the portfolio; if a module sits adjacent to other Angular apps and shares libraries, I'd pick Angular for cohesion alone.
- **React** wins on talent market, ecosystem depth, and the ability to compose. For greenfield, the lower opinion-cost lets me adopt the parts I want (TanStack Query, Zustand or Redux Toolkit, React Hook Form, Tailwind or styled-components) without fighting a framework.
- **Blazor** is the most interesting answer because the backend is .NET. Blazor Server gets you the smallest team-skill-distance from .NET engineers, and Blazor WebAssembly closes the language seam entirely. The cost is bundle size on WASM and the smaller talent pool. For an internal tool with a captive .NET team I'd seriously consider it. For a public-facing customer module I'd not, today.
- **Vue** is excellent but doesn't earn its keep here — the talent market in the UK enterprise space is thinner than React or Angular.

So my real answer: greenfield customer-facing module → React unless the rest of the suite is Angular, in which case Angular for cohesion. Internal tools with deep .NET teams → seriously evaluate Blazor."

### Trap to avoid
Avoid the trap of refusing to commit. They are hiring an architect. "It depends" without a default is a fail.

---

# Q5. How would you version and publish a shared component library that both Angular and React apps consume? *(S — pragmatic shipping)*

### Why he is asking
Simon ships. He wants to see you have actually run a private package pipeline, not just read about Storybook.

### Sample answer
"I'd run it as a monorepo (Nx or Turborepo) with three publishable packages:

1. `@iris/tokens` — design tokens authored in Style Dictionary, output as CSS custom properties, SCSS, TS constants
2. `@iris/components-web` — Web Components built with Lit or Stencil; framework-agnostic primitives (buttons, inputs, modals, date pickers)
3. `@iris/components-react` and `@iris/components-angular` — thin wrappers that adapt the Web Components to idiomatic React / Angular APIs (typed props, event handlers, schematics)

Versioning is **strict semver**, enforced by `changesets`. Every PR that changes a public API includes a changeset file describing patch / minor / major. CI fails without a changeset on a relevant path. Releases go to a private registry (GitHub Packages, AWS CodeArtifact, or Verdaccio).

Breaking changes get a major bump and a written migration guide. Consumers pin to a major version range (`^2.x`) so they get fixes and additions automatically but never silent breakage.

The piece that catches most teams: **publish a Storybook per major version** to a versioned URL (e.g., `design.iris/2/`, `design.iris/3/`). Consumers on v2 see v2 docs, not v3 docs that don't apply to them yet. Without this, your design system documentation lies to half your consumers from the moment you ship v3."

### Trap to avoid
Don't skip the versioned docs detail — that's the part that signals you've done this before vs read about it.

---

# Q6. How do you measure whether your design system is actually being adopted? *(Both — outcomes)*

### Why they are asking
JD lists "core components, documentation, and a contribution model successfully adopted by at least two delivery teams" as a 12-month outcome. They want metrics, not vibes.

### Metrics framework
| Metric | What it tells you | How to measure |
|---|---|---|
| Component coverage | % of UI built from DS components vs ad-hoc | Static analysis: AST scan of consumer repos for non-DS imports of styling primitives |
| Token adoption | % of CSS values that resolve to a token vs literal | Linter rule that flags hex codes, raw px values |
| PR contribution rate | How many feature teams have shipped a DS PR | Count distinct authors per quarter |
| Issue-to-merge time | How healthy the contribution loop is | Median days from PR open to merge |
| Visual regression test coverage | % of components with a Chromatic baseline | CI report |
| Accessibility score | axe violations per 1k components rendered | axe-core in CI |
| Bundle size delta | Cost teams pay to adopt | Bundle-analyzer report per consumer |
| Designer/dev round-trip | How often do designers ship a token vs request a one-off colour | Figma plugin telemetry |

### Sample answer
"I publish a quarterly DS health dashboard with eight metrics, and I treat the leading ones as adoption signals: component coverage, token adoption, and PR contribution rate. The lagging ones — accessibility score, visual regression coverage — confirm that adoption is *good* adoption, not paste-and-pray adoption.

The metric that surprises people is *issue-to-merge time*. If a feature team contributes a fix and it sits for three weeks, they will fork the component locally next time. The DS team's responsiveness is the real adoption gate."

### Trap to avoid
Vanity metrics like "downloads" are weak. A team can `npm install` and never use a thing.

---

# Q7. A senior engineer pushes back hard on adopting OnPush change detection across the Angular codebase. Walk me through that conversation. *(S — leadership style)*

### Why he is asking
Simon will be your peer or report. He wants to see how you handle disagreement without being either spineless or a bulldozer.

### How to frame the answer
1. **Hear the objection first** — name the worry, don't pre-empt it
2. **Bring evidence, not authority** — show the perf data, not the rule
3. **Acknowledge the cost** — OnPush has real footguns (mutable state, async pipe everywhere)
4. **Propose a bounded rollout** — pilot one feature, measure, decide
5. **Commit either way** — agree, disagree, or commit; don't leave it ambiguous

### Sample answer
"I'd start by asking what specifically worries them — usually it's one of two things: 'OnPush surfaces bugs from mutating data we used to get away with' or 'the codebase has too much nested state for OnPush to be safe right now.'

If it's the first, I bring a profile from React DevTools or Angular DevTools showing the cost of Default change detection on a typical dashboard render — usually 200–400 components ticking on every async event — and contrast it with a feature we already migrated to OnPush. The data does most of the work.

If it's the second, they're right — I'd agree to make OnPush the default for *new* feature modules and tackle existing ones one at a time, behind a checklist (immutable state shape, async pipes for observable bindings, signals for local state). I'd own the migration plan and the rollback if a feature regresses.

The thing I won't do is mandate it top-down. Architects who win every argument lose their teams. I'd rather agree slower and have the team push the change forward themselves."

### Trap to avoid
Don't say "I'd explain why I'm right." That's the answer they're listening for as a fail signal.

---

# Q8. Tell me about a production incident on the frontend you led the response to. *(S — war stories)*

### Why he is asking
Director of IT background. He has been the person at 2am. He wants to know if you have been too.

### How to structure
- **Symptom**: what users saw
- **Detection**: how you found out (and how long after the issue started)
- **Triage**: first 15 minutes — what did you check, what did you rule out
- **Mitigation**: the change that stopped the bleed (often not the root-cause fix)
- **Root cause**: what actually broke
- **Prevention**: the durable fix and the process change

### Sample answer (template — replace with your real story)
"Six months in at $PreviousCompany we had a P1 — the dashboard's main chart silently rendered wrong values for ~2 hours. Customers in two timezones saw their revenue understated by ~12%. We caught it from a customer support ticket, not monitoring, which was the real failure.

In the first 15 minutes I ruled out: backend (DB query was correct, API response payload correct in network tab), authentication (no recent change), CDN (cache headers correct). The smoking gun was a recently-merged client-side aggregation that summed values *after* a `toLocaleString` had stripped trailing zeros from currency strings. A unit test had passed because the test data had no values ending in `.x0`.

Mitigation: feature flag the new aggregation off — 8 minutes from decision to rollout because we had per-route flags. Root cause: aggregation should never run on display strings; it should run on numeric values and format last. Durable fix: a lint rule that flags arithmetic on the output of any `toLocaleString`/`toFixed` call.

The process change was bigger than the code: we added a synthetic check that compared aggregate totals against a known-good fixture every five minutes, so customer-reported P1s stop being how we find data bugs."

### Trap to avoid
Don't choose a story where you were the hero saving everyone. Choose one where you were *partly responsible* and acted well. They want maturity, not heroics.

---

# Q9. The JD asks for "performance budgets, Core Web Vitals targets." Walk me through the budget you'd set on day one for IRIS Elements and how you'd defend each number. *(Both — concrete numbers)*

### Why they are asking
This is a screenable claim. Anyone can say "I care about Core Web Vitals." Few can defend numbers.

### Sample budget (defensible numbers)
| Metric | Target | Rationale |
|---|---|---|
| LCP (p75, mobile) | ≤ 2.5s | Google "good" threshold; below this users perceive snappy |
| INP (p75) | ≤ 200ms | New CWV; replaces FID; matters for form-heavy HR app |
| CLS (p75) | ≤ 0.1 | Tables of payroll data must not shift; stricter than default |
| TTFB (p75) | ≤ 600ms | API gateway warm + CDN; SSR scenarios stricter |
| Initial JS (compressed) | ≤ 170 KB | Tier-1 page; rest deferred |
| Initial CSS (compressed) | ≤ 60 KB | Critical path only |
| Total transfer (initial route, p75) | ≤ 500 KB | Reasonable on 4G |
| Long tasks > 50ms | ≤ 1 per route load | Anything more blocks INP |
| Hydration time (Angular SSR) | ≤ 1.5s on mid-tier mobile | Otherwise SSR is theatre |

### Sample answer
"I'd set CWV targets at Google's 'good' thresholds for LCP and CLS but tighten INP to 200ms because HR/payroll forms are interaction-heavy and we lose users at 300ms on data entry. Bundle budgets I'd set at 170 KB initial JS, 60 KB initial CSS, 500 KB total — those are defensible for an enterprise SaaS audience that's mostly desktop on broadband but not exclusively.

The number I'd defend hardest is *long tasks per route load ≤ 1*. INP is dominated by long tasks blocking the main thread on user interaction; if you let three or four through on initial load you've shipped a janky feel that doesn't show up in synthetic tests. I'd wire `PerformanceObserver` for `longtask` entries into our RUM and treat regressions as P3 bugs.

Defending these to teams: each budget gets a 30-day exemption window with a written remediation plan, and budget violations break the build but not deploys — the team can ship and pay it back, but they can't pretend the violation didn't happen."

### Trap to avoid
Don't quote numbers without saying *p75 mobile real users*. Lab numbers are easy and lying.

---

# Q10. How would you architect WCAG 2.2 AA compliance into a 10-team frontend organisation so it doesn't get retrofitted at the end? *(Both — JD-driven)*

### Why they are asking
JD: "embed accessibility (WCAG compliance) … as core considerations in all front-end work." This is asked to filter out architects who treat a11y as a bolt-on.

### Strategy
1. **Tokens encode contrast**. Colour tokens carry pass/fail metadata against WCAG contrast ratios. Designers cannot define a token that fails AA against its background pair.
2. **Component library is accessible by default**. Every primitive ships with correct semantics, focus management, ARIA where required, keyboard interaction, and a Storybook a11y addon report. Apps inheriting the primitives inherit accessibility.
3. **Lint at PR time**. `eslint-plugin-jsx-a11y` (React) and `@angular-eslint/template/accessibility-*` (Angular). PR cannot merge with violations of severity ≥ warning.
4. **Automated audits in CI**. axe-core via Playwright on critical user journeys. Net-new violations fail CI.
5. **Manual audits per quarter**. axe catches ~30–40% of issues. The rest needs keyboard + screen reader testing. Pay an external auditor for one journey per release train.
6. **Definition of Done** explicit. Accessibility checklist in PR template: keyboard reachable, focus visible, screen reader pass, no axe violations.
7. **Training**. Half-day workshop on day one for every new joiner; quarterly refresh; published internal playbooks.

### Sample answer
"The rule I run by is: accessibility must be cheaper to do right than to do wrong. That means tokens that can't fail contrast, primitives that can't be inaccessible, and CI that catches ~70% of the rest before review. The remaining 30% — cognitive load, screen reader semantics, complex widget patterns — needs human judgement, so I budget for quarterly external audits and put the findings into the design system backlog.

The cultural piece: I've seen teams treat WCAG as the QA team's job. That fails. I make a11y a part of the Definition of Done in the same row as 'tests pass' — non-negotiable, not a separate ticket."

### Trap to avoid
Don't claim full WCAG AA conformance without manual testing. Tools catch a fraction. Be honest about that limit.

---

# Q11. You inherit a 6-year-old Angular app on Angular 11. The team wants to upgrade to Angular 17 standalone components. How do you sequence it? *(G — long-horizon migration)*

### Why he is asking
He has lived with 20-year-old codebases. He wants to see you don't propose a rewrite.

### Sequence
1. **Audit first** — `ng update --next` dry-run; map all third-party deps to their Angular 17-compatible versions; flag any with no path forward (these are migration blockers).
2. **Stepwise version upgrades** — 11 → 12 → 13 → 14 → 15 → 16 → 17, one at a time. Each step is its own PR with tests passing. Skipping versions is how you lose two weeks.
3. **NgModule → standalone is orthogonal** — do not bundle it with the version upgrade. Get to 17 with NgModules first, ship, observe.
4. **Standalone migration is incremental** — Angular 15+ supports `standalone: true` per component. New components are standalone-by-default; existing ones migrate when touched (boy scout rule). A schematic exists (`ng generate @angular/core:standalone`) but use it per feature module, not all at once.
5. **Routing migration** — once a feature module is fully standalone, switch its lazy-loaded route to `loadComponent` / `loadChildren` with a routes array. This is where the bundle size win is.
6. **Signal adoption** — separate decision; don't bundle it with structural migration.

### Sample answer
"I split this into three independent migrations: version, structure, and reactivity. Each one is sequenced separately and has its own rollback plan. The version upgrade is mechanical and I'd do it in 2-week increments per major. Standalone is by-feature-module on the boy-scout rule. Signals is a separate, opt-in decision per team.

The thing I won't do is run a parallel Angular 17 rewrite. I have seen rewrites take three years and ship something subtly worse. The Strangler Fig approach inside the existing repo is slower-feeling but ships value every sprint."

### Trap to avoid
Don't propose a rewrite. Gavin will hear "I have not done a real upgrade before."

---

# Q12. Explain how you'd implement white-labelling and theming for enterprise customers without proliferating builds. *(G — multi-tenancy)*

### Why he is asking
JD-driven, but also a hard problem he has likely solved at IVIS — payments and B2C e-commerce both demand it.

### Sample answer
"One build, runtime theming. Three layers:

1. **Token layer** — every visual property is a CSS custom property. Themes are objects of token overrides, not separate stylesheets.
2. **Tenant resolution at boot** — on app load the shell resolves the tenant from subdomain or auth claim, fetches the theme JSON from a CDN, sets the custom properties on `:root`, and caches the theme.
3. **Asset overrides** — logo, favicon, custom fonts loaded from the same theme manifest.

For deeper white-labelling — different navigation structures, different feature flags per tenant — that's not a theme, that's a configuration. I'd put that behind a tenant-config service consumed at the route guard layer.

The trap most teams hit: building separate apps per tenant. That gives you N codebases drifting apart. I'd refuse that path unless one tenant's requirements diverge so far they need their own domain model — at which point it's not the same product anymore.

For RTL languages or fundamentally different layouts, you handle that with logical CSS properties (`margin-inline-start`) and `dir="rtl"` at the root. Same build, different runtime."

### Trap to avoid
Don't say "we built separate webpack configs per tenant." That's the failure mode he's testing for.

---

# Q13. You're given a screenshot showing a ~3s LCP on a payroll dashboard. Walk me through diagnosing it. *(S — practical debugging)*

### Why he is asking
Pragmatic full-stack lead. Wants to see your debugging instinct, not your knowledge of metrics.

### Diagnosis flow
1. **Reproduce** — same network throttling, same device class, same auth state. RUM only tells you it's slow; you need a Performance trace.
2. **Identify the LCP element** — Chrome DevTools → Performance → Timings → LCP marker shows the element. Is it text, an image, a chart canvas?
3. **Trace its critical path** — Network tab waterfall: did the LCP element wait on a chained request? (HTML → JS → API → render is the typical 3s pattern.)
4. **Bucket the cause**:
   - LCP element waits on JS to mount → bundle split or SSR
   - LCP waits on API → API too slow, or chained too late
   - LCP element is an image → preload, optimise format, sized correctly
   - LCP renders fast but server is slow → TTFB issue, not really LCP
5. **Fix at the cheapest layer first** — preload, prefetch, or hoist the API call to the route resolver before fixing the bundle.

### Sample answer
"I'd start by capturing a Performance trace on a representative slow client, then look at three things in order: TTFB, the LCP element identity, and the chain of work between TTFB and LCP. Most 3-second LCPs at the dashboard layer are one of three patterns:

1. **Chained API calls** — page renders skeleton, fires user query, then permissions query, then dashboard query. Three serial round-trips at 300ms each is your 1s right there. Fix: parallelise via route resolver or BFF.
2. **Heavy hydration** — Angular SSR ships 1MB of JS that has to parse before the LCP text becomes interactive. Fix: code-split routes, lazy non-critical widgets, defer chart libraries.
3. **Above-the-fold image not preloaded** — logo or hero image discovered late. Fix: `<link rel="preload" as="image">`.

I'd take whichever bucket the trace points to and fix the cheapest one first. If after the cheap fix we're still over 2.5s, that's where I'd talk about SSR/hydration architecture."

### Trap to avoid
Don't list every CWV optimisation under the sun. Pick the diagnostic flow.

---

# Q14. How would you set up cross-browser and cross-device testing without making CI take 45 minutes? *(S — pragmatic shipping)*

### Why he is asking
JD requirement, but also a practical problem he has felt.

### Sample answer
"Three tiers, scaled by stage:

**Tier 1 — every PR (5 min budget)**: Unit + component tests in jsdom. Playwright smoke test in Chromium-only, headless. axe-core on the smoke journey. Visual regression against Chromatic on changed components only.

**Tier 2 — main branch nightly (30 min budget)**: Full Playwright suite across Chromium, Firefox, WebKit. Visual regression on full component library. Real-device testing via BrowserStack or Sauce Labs on the top 5 device/browser combos that match RUM data.

**Tier 3 — release candidate (manual approval)**: Manual QA on the device matrix; accessibility audit by a human; load test if perf budgets at risk.

The trick is the *tier scaling*. Running every browser on every PR doesn't help — most regressions are in your own code, not browser behaviour. But running zero cross-browser until release is too late. Nightly on main catches the cross-browser regressions before they pile up.

Device matrix: I'd take the top 5 browser/device combos from real user monitoring and pin to those. Don't test what your users don't use."

### Trap to avoid
Don't propose 'every browser every PR'. That's how teams disable tests.

---

# Q15. What does a healthy contribution model for a design system look like, and how do you stop it becoming a bottleneck? *(Both — JD-driven leadership)*

### Why they are asking
JD: "Coach teams on contribution models so that feature teams can extend the design system while maintaining consistency and quality." Bottleneck risk is the unspoken concern.

### Model
1. **Tier the changes**. Token additions / new variants of existing components → reviewed and merged within 48 hours. New components → RFC + design review + 2-week SLA.
2. **Office hours**. DS team holds 1 hour twice a week for paired work with feature teams. Most blocks dissolve in an hour.
3. **Trusted contributor program**. After 3 merged PRs to the DS, an engineer becomes a trusted contributor and can review PRs in their domain. This scales the team without growing it.
4. **Escape hatches that are public**. If a feature team needs a one-off, they can add it locally with a clear naming convention (`Feature-PayrollSpecificButton`) and an issue in the DS backlog. Don't pretend you can absorb everything immediately.
5. **Graduation rule**. If three feature teams build the same local component, the DS team picks it up next sprint. The DS pulls from the field; it doesn't push from the centre.
6. **No gatekeeping on design**. The DS team owns API and quality; feature teams own visual language for their domain (in collaboration with design). DS is not the design veto.

### Sample answer
"Most DS teams die from being either too closed (every feature team forks locally and the system fragments) or too open (every PR ships and the system loses coherence). The model I run is graduated trust: junior contributions land via PR with DS review; experienced contributors review their own domain; and one-offs are publicly allowed in feature codebases with a naming convention so they can be promoted later.

The promotion rule — three feature teams ship the same local component, DS pulls it up — is the most important cultural piece. It tells feature teams the DS works *for* them, not at them."

### Trap to avoid
Don't propose "every change goes through DS team review." That's the bottleneck they're listening for.

---

# Q16. Walk me through how you would validate, not just claim, that React Native vs .NET MAUI vs PWA is the right mobile choice for the IRIS suite. *(G — decision rigour)*

### Why he is asking
JD requirement, plus he wants evidence-based reasoning, not a brand preference.

### Validation approach
1. **List the user journeys** — what do customers actually do on mobile? View payslip, approve timesheets, time-off requests, push notifications? Or full payroll workflows?
2. **Map journey requirements to platform capability** — does the journey need offline? Camera? Biometric auth? Background sync? Push notifications?
3. **Estimate team cost** — does the team have JS engineers or .NET engineers? Hiring market for each?
4. **Estimate ops cost** — App Store review cycles, CodePush vs OTA, two app stores' processes
5. **Build a 2-week proof-of-concept on the top journey in each candidate** — not slides, code. Measure dev time, app size, real device performance.
6. **Decide on the outcome of the POCs, not the slide deck**

### Sample answer
"Honest answer: I wouldn't decide this in a meeting. I'd run a 4-week evaluation. Week 1: define the top 3 mobile user journeys with product. Week 2: map requirements to capabilities and rule out anything that fails on must-haves. Week 3-4: build the same one journey three times — React Native, MAUI, and a PWA — using the team that would actually own it.

By the end of week 4 I'd have real numbers: dev hours, bundle size, cold-start time, hot-reload friction, store-review pain. The team that built each POC writes the trade-off doc. I make the call with engineering leadership.

If I had to give a default before that work: PWA for read-mostly workflows (payslip viewing, timesheet approval) — lowest cost, no app stores. React Native for richer interactions if the team is JS-strong. MAUI if the team is .NET-strong and journeys don't need bleeding-edge native UX. But I would not commit to that without the POCs."

### Trap to avoid
Don't pick one in the abstract without saying you'd validate it. Gavin sees "Here's a slide deck" decisions go wrong every year.

---

# Q17. The JD calls out "configuration-driven UI" and "RBAC-driven UI." Sketch the architecture. *(G — enterprise patterns)*

### Why he is asking
This is enterprise SaaS bread and butter. He wants to see if you have the right primitives.

### Architecture sketch
1. **Permissions claim format** — claims attached to JWT or fetched from `/me`. Shape: `{ permissions: ['payroll:run:execute', 'payroll:report:view'] }` or RBAC roles.
2. **Permission service** — frontend singleton: `permissions.has('payroll:run:execute')` and `permissions.hasAny([...])`, `permissions.hasAll([...])`.
3. **Three rendering primitives**:
   - `<IfAllowed permission="payroll:run:execute">` — wraps a UI region
   - `usePermission()` hook / `permission` directive — for branching logic
   - Route guard — denies navigation to forbidden routes
4. **Configuration-driven feature toggles** — separate concept from RBAC. Per-tenant config fetched at app boot; UI behaviour driven by config keys, not code branches.
5. **Critical rule**: UI hide is cosmetic. The server enforces every authorisation. Even if the user finds the URL or runs the API directly, the server says no.
6. **Audit hook**: rendering of sensitive data (a payslip, a salary field) emits a server-side audit log. Frontend doesn't write the log — it consumes the API that does.
7. **Test discipline**: snapshot tests run for each role profile. CI matrix tests permissions x components.

### Sample answer
"Two separate axes, often confused: RBAC drives *what a user can do*; configuration drives *what a tenant can do*. I keep them in separate services and separate decision points.

For RBAC, I'd put a single permission service in the shell, expose three primitives — a directive/wrapper, a hook, and a route guard — and treat any UI hide as cosmetic. The server is the gate. I've seen teams where the FE thinks it's enforcing RBAC; the result is a UI that lies about what the server actually allows.

For tenant configuration, I'd fetch the config at app boot, cache it, and feature-flag UI off config keys. Critical: configuration changes invalidate the cached state on the next app boot, not mid-session, otherwise you get half-loaded states."

### Trap to avoid
Don't claim FE-side hiding is sufficient. He has worked in payments. He knows.

---

# Q18. How would you onboard a new senior engineer in their first 30 days so they can ship without breaking anything? *(S — mentorship)*

### Why he is asking
JD: "Upskill and support Senior Engineers and Engineering Leads through mentoring, pairing, reviews, workshops, and documentation." Simon will be the day-to-day partner on this.

### 30-day plan
**Week 1 — context**
- Day 1: working environment up; can run app and tests locally
- Day 2: domain crash course — what is payroll, what is a pay run, what is HMRC RTI, what is a P60. *Domain matters more than tooling.*
- Day 3-5: pair with a different engineer each day on a real task; observe code review, observe a stand-up, attend a customer call

**Week 2 — small contributions**
- Pick up two well-scoped issues from a "good first issue" backlog
- Write the ADR for one decision they encountered
- Review three PRs and discuss reviews with a buddy

**Week 3 — feature ownership**
- Take a small feature end-to-end; pair on the design, solo on the implementation
- Shadow an on-call rotation
- Run a brown-bag on something they brought from their previous role

**Week 4 — outward**
- Lead a code review session
- Present the feature they shipped
- Identify one process or tool improvement they want to drive in months 2–3

**Continuous**
- Weekly 1:1 with the architect (me) for the first 90 days
- Slack channel access to all relevant teams
- Buddy assigned for tactical questions

### Sample answer
"The best signal I have for whether a senior engineer will succeed is whether they ship a small feature in week three. Not week one — too early — and not week six — too late. So my onboarding is engineered backwards from that: week one is context, week two is contributions, week three is ownership.

The piece teams under-invest in is *domain*. A senior engineer who knows React perfectly but doesn't know what RTI is will misdesign the payroll module. I budget half a day on domain in week one and pair them with a domain expert."

### Trap to avoid
Don't make the answer about Confluence pages. Make it about what they ship.

---

# Q19. The JD asks for visual regression and Storybook. How do you keep Storybook from becoming a graveyard? *(S — pragmatic)*

### Why he is asking
Many teams set up Storybook with optimism and stop maintaining it after six months. He wants to see you have seen this.

### Sample answer
"Storybook dies for three reasons: stale stories, undocumented components, and no one looking at it. I attack each:

1. **Stale stories die at PR time.** A Storybook story for a component is required at PR time — CI fails if the changed component doesn't have an updated story. The story is part of the component, not a separate task.
2. **Documentation lives in MDX next to the story.** Not in a wiki that drifts. The DS team owns a documentation template (when to use, when not to use, accessibility, props, examples).
3. **Discovery is engineered.** Storybook is the published face of the design system, linked from every internal portal, with a search that works. Designers use it as a reference; engineers use it to find primitives. If no one's using it, it's failing — measure traffic.
4. **Visual regression on every story.** Chromatic baseline per merge. Breakage is loud, not silent.
5. **Quarterly story health audit.** Stories that haven't been touched in 6 months and whose underlying component has changed are flagged. The DS team triages.

The biggest cultural piece: Storybook is *not* the design system. The design system is the npm package. Storybook is its documentation. When I separate those concepts, teams stop treating stories as optional."

### Trap to avoid
Don't say "we just have a strict policy that all components need stories." Policies fail silently. Make it CI-enforced.

---

# Q20. What questions do you have for us? *(closing — your turn)*

### Why this matters
This is half the interview. Bad candidates ask logistics questions; great candidates ask architecture questions that demonstrate they've done their homework on IRIS.

### Strong questions to ask Gavin
1. "You've been at IRIS less than a year as Global Principal. From the inside, where is the platform's biggest architectural debt that this role would inherit?"
2. "How do Angular and React currently coexist in the portfolio — is there a defined seam, or is it more accidental?"
3. "What does the .NET team's appetite look like for GraphQL or BFF patterns? Is that a settled question or still up for discussion?"
4. "How is the design system funded today — central platform team, or contribution from delivery teams?"
5. "What does the current state of mobile look like — is there a strategy in flight, or is this role expected to define it?"

### Strong questions to ask Simon
1. "What does the day-to-day cadence look like between this role and the engineering leads? Where do you see the boundary?"
2. "What's the most painful part of the current frontend developer experience that you'd want this role to fix in the first six months?"
3. "How are technical decisions made today — RFC, architecture review board, or more informal?"
4. "What does the on-call rotation look like for frontend? What's the typical incident profile?"
5. "What's the team's current view on AI-assisted development tooling — are there guardrails, or is it open?"

### Strong questions for both
1. "What are the success metrics this role will be measured on at 6 and 12 months?"
2. "What's the one thing you wish the previous person in this role had done differently?"
3. "What does the relationship between platform engineering and product engineering look like? Where is the budget tension?"
4. "Where is the executive sponsorship for the design system / platform investment? Is it secure for the multi-year horizon, or quarter to quarter?"
5. "If I'm successful, what does my role look like in three years?"

### Trap to avoid
Don't ask salary, hours, or holiday in this round. Save that for the offer stage. Don't ask anything you could find on the careers page in 30 seconds.

---

## Final delivery checklist

- [ ] Read Round 1 prep (`16_IRIS_FRONTEND_ARCHITECT_INTERVIEW_PREP.md`) the night before to align language
- [ ] Re-read the JD; have it on a tab during the call
- [ ] Have one war story ready per category: incident, migration, leadership disagreement, design system rollout
- [ ] Have one number ready per claim — bundle size, p75 LCP, headcount you've led, teams you've coached
- [ ] Don't say "best practice" — say "the practice that worked for us, given X constraint"
- [ ] If asked something you don't know, say "I haven't used that — here's how I'd evaluate it" rather than bluffing
- [ ] Mirror Gavin's depth on principal-engineering questions; mirror Simon's pragmatism on shipping questions
- [ ] Close with your questions — having strong ones is half the signal in Round 2

---

> Cross-references in this codebase:
> - `frontend-basics/content/architect/16_IRIS_FRONTEND_ARCHITECT_INTERVIEW_PREP.md` — Round 1 (50 questions)
> - `frontend-basics/content/system-design/01_MICRO_FRONTEND_ARCHITECTURE.md`
> - `frontend-basics/content/system-design/02_DESIGN_SYSTEMS_AND_COMPONENT_LIBRARIES.md`
> - `frontend-basics/content/system-design/03_PERFORMANCE_CORE_WEB_VITALS.md`
> - `frontend-basics/content/system-design/05_SECURITY_ARCHITECTURE.md`
> - `frontend-basics/content/architect/15_REACT_VS_ANGULAR_FRAMEWORK_DECISION.md`
