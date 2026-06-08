# IBM Frontend Architect — Round 2 Interview Prep

> **Role:** Frontend Architect | **Company:** IBM  
> **Round:** 2 (Technical Deep-Dive) | **Date:** Tomorrow  
> **Strategy:** Every answer references real project work (Fero/FeroUI/Flare). IBM's product suite (watsonx, Cloud Pak, Instana, Turbonomic) is a multi-product enterprise platform — your MFE + design system experience maps directly.

---

## 🎯 Tab 1: Overview — What They'll Probe & Your Angles

### What Architect Rounds Probe at IBM

IBM's frontend architect interviews focus on **5 dimensions**:

1. **Architectural decisions & trade-offs** — not "I used X" but "why X over Y, and what did we sacrifice"
2. **Cross-cutting concerns** — performance, a11y, security, scalability as architecture, not afterthoughts
3. **AI/GenAI integration** — explicit in IBM JDs; how AI surfaces in the UI layer (watsonx, Granite models)
4. **Influence & standards** — design systems, code review, team enablement, RFC processes
5. **Enterprise scale** — micro-frontends, Module Federation, multi-team coordination

### 5 Most Likely IBM Questions

| # | Question | Your Strongest Angle |
|---|---|---|
| 1 | "Walk me through a micro-frontend system you've designed end-to-end" | FeroUI MFE (shell + remotes + shared packages + CI contracts) |
| 2 | "How do you ensure a design system is actually adopted, not just built?" | Flare/Fero — 80+ components, inner-source model, automated uptake PRs |
| 3 | "How would you integrate AI/GenAI capabilities into the frontend?" | Flare AI Assist (streaming architecture, watsonx-style chat, singleton trigger pattern) |
| 4 | "Tell me about a performance problem you diagnosed and fixed" | OnPush + virtual scroll + shareReplay in Fero's 24-stream facade; Flare's bundle-per-package tree-shaking |
| 5 | "How do you enforce accessibility at scale across multiple teams?" | 4-layer a11y strategy: ESLint rules → CI test suite → Storybook audits → manual 508 testing |

### Your Strongest Angles to Lead With

| Angle | Real Project Evidence |
|---|---|
| **MFE at enterprise scale** | FeroUI: shell (saba-cloud-host) + 5 remotes, Module Federation with dynamic remote resolution, shared NgRx store + interceptor chain |
| **Design system with adoption** | Fero: 80+ Angular components, 10+ themes, published to Artifactory; Flare: 15 React packages, 63 locales |
| **AI integration** | Flare AI Assist: singleton pattern, streaming responses, multi-agent architecture (Engineering, Design, JIRA agents) |
| **Security for sensitive data** | FeroUI auth: server-side sessions, CSRF nonce interceptor, HttpOnly cookies, no tokens in JS |
| **Supply chain security** | Flare: BlackDuck CVE scanning, DOMPurify for XSS, exact version pinning in .npmrc |

---

## 🏗️ Tab 2: Architecture — MFE, Design System, State, API Contracts

### Micro-Frontend / Module Federation Deep-Dive

**Your answer when asked "Describe your MFE architecture":**

> "I architected the FeroUI micro-frontend platform — a shell-and-remote model using Webpack Module Federation. The shell (`saba-cloud-host`) owns authentication, navigation, theming, and the shared interceptor chain. Five independently deployable remotes (`saba-cloud`, `saba-cloud-login`, `saba-cloud-guest`, `analytics`, `saba-integration-hub`) are loaded at runtime based on URL context. Each remote inherits auth transparently through three mechanisms: shared HttpClient with the shell's interceptor chain, shared NgRx store for user state, and server-side session cookies on the same domain."

**Architecture diagram to whiteboard:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHELL (saba-cloud-host)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Shared Services (Module Federation singletons)          │   │
│  │  • @angular/core, @angular/common/http                   │   │
│  │  • @ngrx/store, @ngrx/effects                           │   │
│  │  • @torque/framework (layout, nav guards)                │   │
│  │  • @saba/uxe/platform/shared/core (interceptors, facade) │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐   ┌──────────────────────────────────────┐    │
│  │  Interceptor │   │  SabaCloudFacade (NgRx)              │    │
│  │  Chain (11)  │   │  • getUserInfo$, isGuestUser$        │    │
│  │  CSRF, Auth, │   │  • logout action + effects           │    │
│  │  Cache, Log  │   │  • user context from /api/uicontext  │    │
│  └─────────────┘   └──────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐  ┌──────┐  │
│  │saba-    │  │saba-    │  │saba-    │  │analyt-│  │ SIH  │  │
│  │cloud    │  │cloud-   │  │cloud-   │  │ics   │  │      │  │
│  │(main)   │  │login    │  │guest    │  │       │  │      │  │
│  │         │  │(pre-auth)│  │(public) │  │       │  │      │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────┘  └──────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key decisions to explain:**

1. **Why shell decides what to load at bootstrap** — reads `TRQ_APP` from URL. No app context → login remote. Has context → main remote. This means auth state determines the *entire* UI composition.

2. **Why shared singletons via Module Federation config** — `base-module-federation.config.js` declares `@angular/core`, `@ngrx/store`, `@torque/framework`, `@saba/uxe/platform/shared/core` as singletons. Guarantees one injector tree, one store instance, one interceptor chain across all remotes.

3. **Why server-side sessions over JWTs in localStorage** — payroll/HR data is sensitive. HttpOnly cookies are inaccessible to XSS. The CSRF nonce pattern (server-injected into page HTML, attached via `CsrfInterceptor`) prevents CSRF without storing tokens in JavaScript.

4. **How remotes inherit auth without knowing about it** — remotes share the same `HttpClient` instance (via MFE singleton sharing). The shell's interceptor chain is automatically applied to all HTTP calls from any remote. Zero auth code in remote applications.

### Design System Layer Model

**Your answer when asked "How do you structure a design system?":**

> "I've built and maintained two enterprise design systems. Fero is an Angular monorepo with 80+ components serving 10+ themes, publishing 15 packages to Artifactory. Flare is a React monorepo with 15 packages, 63 supported locales, and a full Storybook 10 documentation hub. Both follow the same layered architecture."

```
Layer 1: Design Tokens
    Fero:  @lego/design-tokens → Figma Variables → Style Dictionary → CSS custom properties
    Flare: getTheme() → TypeScript theme object → xstyled th() helpers

Layer 2: CDK / Core Utilities
    Fero:  @fero/core/cdk — FocusKeyManager, TabTrap, AriaList, HotkeyService
    Flare: @flare/core-utils — HTTP clients, session mgmt, bootstrap, MFE utilities

Layer 3: Component Libraries
    Fero:  @fero/ui (60+ components), @fero/forms (20+ form components)
    Flare: @flare/primitives (80+ components), @flare/charts, @flare/patterns

Layer 4: Framework / Patterns
    Fero:  @fero/framework — app shell (header, sidenav, footer) + NgRx facade
    Flare: @flare/patterns — GlobalNavigation, AI Assist, Object Picker

Layer 5: Domain Packages
    Fero:  consumed by FeroUI (10+ domain modules: learning, performance, etc.)
    Flare: @flare/learning, @flare/performance, @flare/core-hr, @flare/recruiting
```

### State Management Decision Framework

**Your answer when asked "How do you decide what goes in global state vs local?":**

| State Type | Example | Where It Lives | Why |
|---|---|---|---|
| Server state | Employee list, payroll data | TanStack Query / HTTP service + caching | Handles caching, background sync, stale-while-revalidate automatically |
| Cross-cutting app state | Auth, user context, nav tree, feature flags | NgRx store (Angular) / React Context (Flare) | Multiple modules need it, changes infrequently |
| UI configuration | Small screen, sticky header, tile nav | NgRx feature store via Facade (Fero) | Many components read it, rare writes |
| Component UI state | Modal open/closed, dropdown expanded | Component-local state (useState / class property) | Only one component cares |
| Form state | Input values, validation | Reactive Forms (Angular) / react-hook-form (Flare) | Dedicated form library handles complex validation |
| URL state | Filters, pagination, search | Router query params | Shareable, bookmarkable, back-button works |

**Real example from Fero — the Facade pattern:**

```typescript
// Components NEVER touch the store directly — they use the facade
@Injectable()
class TrqFrameworkFacade {
  // 40+ observables, each with shareReplay for performance
  isSmallScreen$ = this._store.select(fromFramework.isSmallScreen)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  // Composed observable — combines 24 streams into one body config
  body$ = combineLatest([...24 observables]).pipe(
    map(([...values]) => ({ /* TrqFrameworkFacadeBodyConfig */ })),
    shareReplay(SHARE_REPLAY_CONFIG)
  );

  // Write methods hide dispatch details
  toggleSideNav(collapsed: boolean): void {
    this._store.dispatch(new ToggleSideNav(collapsed));
  }
}
```

**Why this pattern matters at IBM scale:** If the underlying state management changes (NgRx → Signals, Redux → Zustand), only the facade implementation changes. Zero component code changes. This is how you migrate incrementally without big-bang rewrites.

### API Contract Patterns

**For IBM's .NET/Java backend context:**

| Pattern | When to Use | IBM Relevance |
|---|---|---|
| **REST + OpenAPI** | CRUD operations, well-defined entities | Most IBM services start here |
| **GraphQL (Hot Chocolate / Apollo)** | Dashboard aggregating multiple services | watsonx UI pulling from multiple AI services |
| **BFF (Backend-for-Frontend)** | Backend APIs designed for service-to-service, painful for FE | Cloud Pak UI needing aggregated views |
| **SignalR / WebSocket** | Real-time push (AI generation progress, notifications) | Streaming LLM responses from watsonx |
| **Generated TypeScript types from OpenAPI** | Type-safe FE/BE contract | Every IBM API should generate FE types |

---

## ⚡ Tab 3: Performance & Accessibility

### Core Web Vitals — Architect-Level Answers

**Your answer when asked "How do you approach performance?":**

> "I measure before optimising. I set performance budgets, enforce them in CI, and track real user metrics (not just synthetic Lighthouse). In the Fero framework, performance was addressed at every layer — OnPush change detection on 40+ components reduced CD cycles by 60-80%, virtual scrolling handled 10K+ row datasets, the facade's `shareReplay` prevented redundant store subscriptions, and the HTTP in-flight interceptor deduplicated concurrent requests. In Flare, tree-shaking via ESM + sideEffects:false per package, culture data lazy-loaded from CDN (63 locales, only active one downloaded), and TanStack Virtual for virtualised data grids."

**Performance budget I'd set for IBM:**

| Metric | Target | Rationale |
|---|---|---|
| LCP (p75, field) | ≤ 2.5s | Google "good" threshold |
| INP (p75) | ≤ 200ms | Form-heavy enterprise apps need fast interactions |
| CLS (p75) | ≤ 0.1 | Data tables must not shift |
| Initial JS (compressed) | ≤ 170 KB | Shell only; features lazy-loaded |
| Long tasks > 50ms | ≤ 1 per route load | Anything more blocks INP |

**The 6 biggest performance levers in my experience:**

1. **Code splitting** — route-based lazy loading (FeroUI: 50+ lazy routes; Flare: per-package imports)
2. **Tree-shaking** — secondary entry points in Fero (`import from '@fero/ui/button'` not `'@fero/ui'`); ESM output in Flare
3. **Change detection strategy** — OnPush everywhere in Fero (40+ components); React.memo + useMemo in Flare
4. **Virtual scrolling** — `@fero/ui/virtual-scroll`; `@tanstack/react-virtual` in Flare DataGrid
5. **HTTP deduplication** — `TrqInFlightInterceptor` (Fero) shares in-flight GETs via `share()` operator
6. **Memoised selectors** — NgRx `createSelector` (Fero); `useMemo` + memoised context values (Flare)

### Accessibility at Scale — Your aria-modal/inert Work

**Your answer when asked "How do you ensure WCAG compliance across 10 teams?":**

> "I implemented a 4-layer accessibility strategy across both the Fero and Flare design systems. The key insight is that accessibility must be cheaper to do right than to do wrong — that means accessible-by-default components, automated CI gates, and manual audits for what automation can't catch."

**The 4 layers:**

```
Layer 1: Static Analysis (every PR)
├── @fero/eslint-plugin template-a11y config (10 rules as errors)
├── alt-text, valid-aria, label-has-associated-control,
│   role-has-required-aria, mouse-events-have-key-events,
│   no-positive-tabindex, no-autofocus, button-has-type
└── Key: AriaService handles keyboard events at RUNTIME,
    so click-events-have-key-events is disabled (no false positives)

Layer 2: Component-Level A11y Tests (every PR)
├── Fero: dedicated sanity-a11y.sh CI step (separate from unit tests)
├── Flare: jest-axe in unit tests + @storybook/addon-a11y
└── Both: axe-core violations = build failure

Layer 3: Runtime A11y Infrastructure
├── Fero CDK: FocusKeyManager, TabTrap, AriaList, HotkeyService,
│   AriaService (auto-adds Enter/Space to clickable elements),
│   LiveAnnouncer (screen reader announcements)
├── Flare: LiveAnnouncerProvider (queue-based, assertive jumps front),
│   ScreenReaderOnlyText, useCallbackOnEsc, Universal Focus Mode
└── Key: TrqAriaEventManager replaces Angular's EventManager —
    EVERY click handler automatically gets keyboard equivalent

Layer 4: Manual Testing (release cycle)
├── Screen reader testing: JAWS, NVDA, VoiceOver
├── Keyboard-only navigation testing
├── Section 508 compliance checklist
└── Key: Automated tools catch ~30-40%. Humans catch the rest.
```

**The TrqAriaEventManager pattern (unique talking point):**

> "In Fero, I implemented a custom `EventManager` that replaces Angular's default. Every time a `click` event handler is registered on any element in the entire application, the AriaEventManager automatically adds `keyup` listeners for Enter and Space keys, adds `keydown` to prevent browser scrolling on Space, and applies appropriate ARIA attributes. This means every clickable element in the app gets keyboard support without developers doing anything extra — it's truly accessible by default."

### SSR/SSG Decision Tree

| Question | Answer → Recommendation |
|---|---|
| Does it need SEO? | Yes → SSR or SSG |
| Is data real-time? | Yes → SSR or CSR with WebSocket |
| Is it behind auth? | Yes → CSR is fine (SEO doesn't matter) |
| Is content mostly static? | Yes → SSG (pre-build) |
| Is initial load time critical? | Yes → SSR shell + deferred features |
| Does it need offline? | Yes → PWA with Service Worker |

**For IBM's product suite:** Most IBM products are behind auth (CSR is fine), but the **landing page and login flow** benefit from SSR for fast first paint. AI chat interfaces benefit from streaming SSR for progressive rendering of LLM responses.

---

## 🔒 Tab 4: Security

### XSS Prevention (CSP + Trusted Types)

**Your answer when asked about XSS:**

> "XSS is the #1 frontend vulnerability. I address it through defence-in-depth: framework sanitisation by default (Angular sanitises, React escapes JSX), CSP headers to prevent inline script execution, DOMPurify for any user-generated HTML, and Trusted Types as the strictest layer."

**Content Security Policy I'd recommend for IBM:**

```
Content-Security-Policy:
  script-src 'self' 'nonce-{random}' https://cdn.ibm.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  connect-src 'self' https://api.ibm.com wss://realtime.ibm.com;
  img-src 'self' https://assets.ibm.com data:;
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';
  base-uri 'self';
```

**Trusted Types (bleeding edge, shows you're current):**

```typescript
// Trusted Types policy — prevents DOM injection entirely
if (window.trustedTypes) {
  const policy = trustedTypes.createPolicy('ibm-sanitize', {
    createHTML: (input) => DOMPurify.sanitize(input),
    createScriptURL: (input) => {
      if (input.startsWith('https://cdn.ibm.com/')) return input;
      throw new Error('Untrusted script URL');
    }
  });
}
```

### CSRF (SameSite + Token Trade-off)

**Real implementation from FeroUI:**

> "In FeroUI, CSRF is handled via a nonce pattern. The server injects a CSRF token into the page HTML at render time. The `CsrfInterceptor` reads it from `Saba.site.env.fero.csrfToken` (a window property) and attaches it as a `csrfNonce` query parameter on every outgoing HTTP request. The server validates the nonce on each request. On mismatch (error code 120766), the `AuthErrorInterceptor` prompts the user to refresh."

**Trade-off discussion for IBM:**

| Approach | Pros | Cons | IBM Fit |
|---|---|---|---|
| `SameSite=Strict` cookie | Zero JS, automatic | Breaks cross-origin flows (OAuth redirects) | ❌ Too strict for IBM SSO |
| `SameSite=Lax` + CSRF token | Works with SSO, strong CSRF protection | Requires interceptor infrastructure | ✅ Best for IBM |
| Double-submit cookie | Stateless server-side | Requires domain control, weaker than synced token | Maybe |

### Supply Chain Security (BlackDuck CVE Work — IBM-Relevant)

**Your answer framed for IBM:**

> "Supply chain security is critical for enterprise products. In both Fero and Flare, we enforced: exact version pinning (`save-exact=true` in `.npmrc`), `yarn --frozen-lockfile` in CI preventing accidental version drift, pre-commit hooks that block manual version bumps in package.json (only CI can publish), and DOMPurify (v3.4.0) for sanitising user-generated HTML. The design system itself is published to a private Artifactory registry with access control — no public npm for production code."

**For IBM specifically — mention these:**
- Subresource Integrity (SRI) for any CDN-loaded scripts
- `npm audit` / `yarn audit` in CI pipeline (Flare runs this)
- Renovate/Dependabot for automated vulnerability PRs
- Minimal dependency surface — every package is an attack vector

### Auth Flows (IBM SSO / OIDC Context)

**Your FeroUI auth architecture answer:**

> "In FeroUI, authentication is fully centralised in the shell. The shell decides what remote to load based on auth state — no app context means load the login remote. Credentials go to the server (`POST /api/prelogin/signin`), the server establishes a session with HttpOnly cookies, and the client receives a redirect URL. The key design principle: **the shell centralises authentication; remotes are auth-consumers, never auth-producers.** The actual session lifecycle lives on the server."

**For IBM (likely OIDC with IBM Security Verify or Keycloak):**

```
User → IBM Login (OIDC flow, server-side) → Auth cookie set
  → Shell loads → reads auth context from cookie/token
  → Shell loads appropriate remote based on user role
  → Remote makes API calls → interceptor attaches Bearer token
  → Token refresh: silent background refresh before expiry
  → Logout: server revokes, client clears, shell reloads
```

---

## 🤖 Tab 5: AI/GenAI — Mention watsonx by Name

### Streaming Chat UX Architecture

**Your answer when asked about AI integration:**

> "In the Flare design system, I architected the AI Assist feature — a streaming chat interface that follows the same patterns watsonx uses. The architecture has three layers: `ai-core` for service integration with Flowise streaming, `ai-blocks` for reusable UI building blocks (chat messages, input, feedback), and `ai-surfaces` for surface-level components (contextual panel, FAB, overlay)."

**Streaming LLM response pattern (from Flare AI Assist):**

```typescript
// Server-Sent Events for streaming AI responses
async function streamCompletion(prompt: string, onToken: (token: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE format
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      onToken(data.token);
    }
  }
}
```

**Chat state management (from Flare):**

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'sending' | 'streaming' | 'complete' | 'error';
  timestamp: number;
}

// Optimistic UI: show user message immediately, stream assistant response
class ChatStore {
  messages = signal<ChatMessage[]>([]);
  isStreaming = signal(false);

  async sendMessage(content: string) {
    // Add user message immediately (optimistic)
    const userMsg = { id: uuid(), role: 'user', content, status: 'complete' };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Add placeholder for streaming response
    const assistantMsg = { id: uuid(), role: 'assistant', content: '', status: 'streaming' };
    this.messages.update(msgs => [...msgs, assistantMsg]);

    // Stream tokens into the placeholder
    await streamCompletion(content, (token) => {
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantMsg.id
          ? { ...m, content: m.content + token }
          : m
        )
      );
    });
  }
}
```

### Adaptive UI Patterns for AI

**Patterns IBM will care about (mention watsonx by name):**

1. **Streaming indicator** — animated typing indicator while tokens arrive (like watsonx.ai chat)
2. **Stop generating button** — `AbortController` to cancel the stream mid-response
3. **Markdown rendering** — AI responses as rich content (code blocks, lists, tables)
4. **Copy code button** — on code blocks in AI responses
5. **Regenerate response** — retry with same prompt
6. **Context window indicator** — token count / remaining context budget
7. **Rate limiting feedback** — graceful degradation when API limits hit
8. **Multi-agent routing** — Flare supports 4 agent types (Engineering, Design, JIRA, General)

### Flare's Global Singleton Pattern (for triggering AI from anywhere):

```typescript
// AIAssistGlobal — singleton bridging React and non-React code
export class AIAssistGlobal {
  private static instance: AIAssistGlobal;
  private handlers: { openAssist?, closeAssist?, setInputValue?, submitPrompt? } = {};

  public static getInstance(): AIAssistGlobal { ... }

  // Imperative trigger from anywhere (non-React code, browser extensions, etc.)
  public triggerWithPrompt(prompt: string, options?): void {
    this.handlers.openAssist?.(options);
    this.handlers.setInputValue?.(prompt);
    setTimeout(() => this.handlers.submitPrompt?.(prompt), 0);
  }
}

// Exposed globally for external access
(window as any).FlareAIAssist = aiAssistGlobal;
```

**Why this matters for IBM:** watsonx integration points likely need to trigger AI assist from multiple surfaces (button clicks, keyboard shortcuts, contextual menus, external tools). The singleton bridge pattern handles this without tight coupling to the React tree.

### Prompt Engineering Scoped to Frontend

**What an IBM architect should know about FE-scoped prompt engineering:**

1. **System prompts per surface** — different prompt for code completion vs documentation vs troubleshooting
2. **Context injection** — send relevant page context (current component props, error state, user role) with the prompt
3. **Structured output** — request JSON responses from the LLM for programmatic use (not just text)
4. **Prompt templates** — version-controlled, tested, and measured prompt templates
5. **A/B testing prompts** — feature flags for prompt variants, measure response quality

---

## 📖 Tab 6: STAR Stories & Questions to Ask IBM

### Pre-Built STAR Stories Using Your Actual Work

#### Story 1: MFE System Design (Architecture)

**Situation:** The FeroUI product had 10+ domain teams committing to a single Angular monorepo, causing merge conflicts, slow CI (45+ min), and deployment coupling — one team's bug blocked all teams from releasing.

**Task:** Design and implement a micro-frontend architecture that gives teams deployment independence while maintaining a consistent UX.

**Action:** I architected the Module Federation shell-and-remote model. The shell owns authentication (server-side sessions with CSRF nonce pattern), the navigation framework (NgRx-backed with 30+ selectors), and the shared interceptor chain (11 interceptors handling auth, caching, logging, CSRF). Each domain team became an independent remote with its own CI/CD pipeline but shared the Angular platform and Fero component library as singletons via the Module Federation config.

**Result:** Teams deployed independently on different cadences. CI time per remote dropped from 45 minutes (full monorepo) to 8 minutes (isolated build). A remote crashing no longer took down the shell — error boundaries isolated failures. The architecture now serves 10+ domain teams across learning, performance, compensation, analytics, recruiting, eCommerce, and more.

#### Story 2: Design System Adoption (Influence)

**Situation:** Feature teams at Cornerstone were building inconsistent UIs — different button styles, different form patterns, duplicated components. Each team had their own take on accessibility, leading to WCAG violations in production.

**Task:** Build a shared component library that teams actually adopt, not just one that exists in a repo.

**Action:** I built the Fero design system with 80+ components and the Flare design system with 15 packages. Key to adoption: (1) Made the right thing the easy thing — Nx generators scaffold components with correct structure and boilerplate. (2) Built a four-layer a11y strategy so teams got accessibility for free. (3) Published to private Artifactory with automated uptake PRs (BitBot). (4) Storybook as living documentation — if it's not in Storybook, it doesn't exist. (5) Inner-source contribution model — feature teams contribute, platform team reviews.

**Result:** 100% adoption across all product teams. Component coverage went from <30% to >85%. WCAG violations in production dropped by 70%. New component creation time went from 2 weeks (custom) to 2 hours (using generators + design system).

#### Story 3: Performance Crisis (Debugging)

**Situation:** The FeroUI dashboard was rendering slowly on page navigation — the body component subscribed to a facade observable that combined 24 NgRx streams via `combineLatest`. Any single state change triggered a full re-evaluation of all 24 streams, causing hundreds of unnecessary template bindings to re-evaluate.

**Task:** Fix the performance without rewriting the state management layer (too risky for a production system).

**Action:** I applied three targeted fixes: (1) Added `shareReplay({ bufferSize: 1, refCount: true })` to every facade observable — late subscribers got cached values instead of triggering new store computations. (2) Migrated 40+ components to OnPush change detection — Angular only checks when inputs change by reference, not on every async event. (3) Added `debounceTime(100)` on high-frequency observables like breadcrumb updates to batch rapid navigation events.

**Result:** Change detection cycles dropped by 80% on the dashboard. Navigation between routes went from ~800ms (visible jank) to ~50ms (imperceptible). Memory usage stabilized because `refCount: true` cleaned up subscriptions when components destroyed.

#### Story 4: Security Fix (Supply Chain)

**Situation:** An audit revealed that `localStorage` was being used to cache API responses that included employee PII (names, salaries, department assignments). This data survived browser sessions and was accessible to any XSS attack.

**Task:** Redesign the caching strategy to eliminate PII exposure without degrading performance.

**Action:** I redesigned the Fero cache system with three storage backends: memory (fastest, lost on refresh — for sensitive data), session storage (survives navigation, lost on tab close — for non-sensitive reference data), and localStorage (only for non-PII config like theme preferences). I added scope providers so the locale-aware cache automatically invalidated on language switch. Payroll endpoints got explicit `Cache-Control: no-store` and were excluded from any client-side caching.

**Result:** Zero PII in persistent browser storage. Performance was maintained because hot data stayed in memory cache during the session. The scoped cache invalidation prevented stale translations from appearing after locale switches.

### Questions to Ask IBM at the End

**Architecture questions (show you've done homework on IBM):**

1. "IBM has a large portfolio — watsonx, Cloud Pak, Instana, Turbonomic. How do these products currently share frontend code? Is there a shared design system, or is each product independent?"
2. "What's the current state of the Carbon Design System's adoption across IBM products? Is this role expected to influence Carbon's direction or build on top of it?"
3. "How does the frontend team integrate with watsonx/Granite model APIs? Is there a BFF layer, or do frontends call model endpoints directly?"
4. "What does the current micro-frontend landscape look like? Module Federation, single-spa, or something else?"
5. "How is AI/GenAI being surfaced in IBM's internal tools vs customer-facing products? Is there a shared AI UX pattern library?"

**Team and role questions:**

6. "What's the team structure? How many frontend engineers, and how are they organised across products?"
7. "What does decision-making authority look like for this role — is it advisory, or does the architect have direct authority on technology choices?"
8. "What's the biggest frontend pain point the team faces today that this role should address in the first 6 months?"
9. "How are technical decisions made — RFC process, architecture review board, or more informal?"
10. "What does success look like at 6 and 12 months for this role?"

---

## 🎯 The One Thing to Drill Tonight

### MFE System Design Whiteboard Exercise

IBM's enterprise product suite (watsonx, Cloud Pak, Instana, Turbonomic) is the **perfect fit** for the shell + remotes + shared packages pattern. This question will almost certainly come up.

**Practice whiteboarding this out loud once:**

```
┌─────────────────────────────────────────────────────────────┐
│  SHELL (IBM Platform Shell)                                  │
│  Owns: Auth (OIDC/SAML), Carbon Design System, Navigation  │
│  Shared: @carbon/react, shared state, interceptors          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
│  │ watsonx │  │Cloud Pak│  │ Instana │  │ Turbonomic  │  │
│  │ AI/ML   │  │  Data   │  │  Obs.   │  │   Perf.     │  │
│  │         │  │         │  │         │  │             │  │
│  │ Own CI  │  │ Own CI  │  │ Own CI  │  │   Own CI    │  │
│  │ Own team│  │ Own team│  │ Own team│  │   Own team  │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  SHARED PACKAGES (npm registry)                              │
│  @ibm/design-tokens    — single source of truth for visuals │
│  @ibm/shared-auth      — token management, permission hooks │
│  @ibm/shared-analytics — Segment/Amplitude tracking         │
│  @ibm/mfe-contracts    — TypeScript interfaces for remotes  │
│  @ibm/event-bus        — cross-remote communication         │
└─────────────────────────────────────────────────────────────┘
```

**CI contract enforcement:**

```
Remote A's CI Pipeline:
  1. Build
  2. Unit tests
  3. Contract validation ← "Do I still expose './WatsonxModule'?"
  4. Version compatibility check ← "Is my @angular/core compatible with shell?"
  5. Deploy to CDN
  6. Update remote registry (JSON manifest)

Shell's CI Pipeline:
  1. Build
  2. Integration test with ALL current remote versions
  3. Deploy
```

**Key talking points when whiteboarding:**

1. "The host references remotes by URL, not bundled code. The connection is a runtime HTTP fetch, not a build-time import."
2. "Shared dependencies are negotiated at runtime via webpack's shared scope. The host declares 'I have @angular/core@17', the remote declares 'I need ^17' — webpack resolves to use the host's copy."
3. "Each remote can run standalone for local development — its own `main.ts` bootstraps when loaded directly, but this code never executes when loaded inside the host."
4. "Error boundaries isolate remote failures. A crashing remote shows a fallback UI — the shell and other remotes continue working."
5. "For cross-framework scenarios (Angular shell loading a React remote), the DOM is the universal integration layer. The remote exposes a `mount(element, options)` function that the shell calls."

---

## Quick Reference — Key Numbers

| Metric | Fero | Flare |
|---|---|---|
| Components | 80+ (Angular) | 80+ (React) |
| Published Packages | 15 | 15 |
| Themes | 10+ | 2 (runtime customisable via baseColor) |
| Angular/React Version | 20.x | 19.x |
| Locales Supported | 6 RTL + many LTR | 63 (3 in Storybook) |
| NgRx Facade Observables | 40+ | N/A (Context API) |
| HTTP Interceptors | 3 (core) + 11 (FeroUI shell) | Retry with configurable strategy |
| Storybook Version | 8.6 | 10.2 |
| CI Steps | 4 (lint, test, a11y, build) | 4 (lint, test, build, storybook tests) |
| Design Token Source | Figma Variables → Style Dictionary | TypeScript getTheme() |
| Test Runners | Karma/Jasmine | Jest 30 + Vitest + Playwright |
| A11y ESLint Rules | 10 (enforced as errors) | jest-axe + Storybook addon |
| MFE Remotes | 5 (FeroUI) | MFE session with reference counting |
| OnPush Components | 40+ | N/A (React.memo equivalent) |

---

## 🔥 Tab 7: 10 IBM-Specific Architect Questions (From Glassdoor/Interview Research)

> Based on web research across Glassdoor, Dataford, InterviewQuery, and frontend system design interview platforms — these are the types of questions IBM asks at the architect level, particularly for frontend/solutions architect roles.

---

### Q1. "Design a solution to migrate an on-premise legacy system to the cloud while minimizing downtime."

**Why IBM asks this:** IBM's core business is modernisation. They help enterprises move from legacy systems to hybrid cloud (Red Hat OpenShift, IBM Cloud). This tests your migration thinking.

**Your answer (framed with Fero/FeroUI):**

> "I've done this. FeroUI migrated from a monolithic Angular application to a Module Federation micro-frontend architecture — that's essentially the same pattern as legacy-to-cloud, but on the frontend. The approach is Strangler Fig: route traffic to the new system feature by feature, never a big-bang cutover.

> **Phase 1:** Run old and new side by side. The shell decides which remote to load based on URL context. No user-facing disruption — they hit the same domain.

> **Phase 2:** Migrate domain by domain, ordered by business value × risk. Low-risk, high-visibility features first (read-only views), then data-entry flows, then admin features last.

> **Phase 3:** Feature flags control which users see old vs new. Canary rollout: 5% → 25% → 100%. Instant rollback by flipping the flag.

> **Zero downtime:** Both systems share the same auth (session cookies on same domain). The proxy/shell routes requests transparently. Users never know they crossed from legacy to new."

---

### Q2. "How do you handle security authentication and authorization in a distributed system?"

**Why IBM asks this:** IBM builds distributed enterprise systems with strict security requirements (banking, healthcare, government). They need architects who treat auth as a first-class concern.

**Your answer:**

> "Auth must be centralised — never distributed across micro-frontends. In FeroUI, the shell owns the entire auth lifecycle:

> 1. **Authentication:** Server-side sessions with HttpOnly cookies. No tokens in JavaScript (prevents XSS from stealing credentials). CSRF nonce pattern for mutation protection.

> 2. **Authorization (RBAC):** Permissions loaded once at login into NgRx store. Route guards prevent navigation to unauthorized routes. Structural directives hide UI elements (`*hasPermission='payroll:approve'`). Critical rule: UI hiding is cosmetic — the server enforces every permission check.

> 3. **Distributed propagation:** All micro-frontend remotes inherit auth via three mechanisms: shared HttpClient (same interceptor chain), shared NgRx store (same user state), and same-domain cookies (automatic attachment).

> 4. **SSO integration:** OIDC flow with SameSite=Lax cookies + CSRF tokens. The identity provider handles the redirect flow server-side — the frontend never directly interacts with the IdP.

> The principle: **the shell centralises auth; remotes are auth-consumers, never auth-producers.**"

---

### Q3. "What factors do you consider when choosing between a synchronous and asynchronous integration pattern?"

**Why IBM asks this:** IBM Consulting architects design integration patterns for enterprise clients daily. This tests your trade-off thinking.

**Your answer:**

| Factor | Synchronous (REST/GraphQL) | Asynchronous (WebSocket/SSE/Queue) |
|---|---|---|
| User expects immediate response | ✅ Form submit, CRUD | ❌ Too slow for polling-based |
| Long-running operation | ❌ Blocks the user, timeout risk | ✅ Submit and poll/push status |
| Real-time updates needed | ❌ Polling is wasteful | ✅ WebSocket/SSE push |
| Coupling tolerance | Tight (request-response) | Loose (fire-and-forget) |
| Error handling | Simple (HTTP status codes) | Complex (retry queues, dead letter) |
| Frontend UX | Loading spinner → result | Optimistic UI → confirmation |

> "In FeroUI, we use synchronous REST for CRUD operations (create employee, submit leave request) and SignalR/WebSocket for real-time notifications (payroll run progress, leave approval alerts). In Flare, the AI Assist feature uses Server-Sent Events for streaming LLM responses — async because tokens arrive over 5-10 seconds, and we render them progressively.

> **My decision framework:** If the user is waiting and the operation takes < 2 seconds, synchronous. If it's > 2 seconds or the user doesn't need to wait, asynchronous with status polling or push notification."

---

### Q4. "Tell me about a time you had to say 'no' to a technical request from a stakeholder. How did you handle it?"

**Why IBM asks this:** IBM Solutions Architects are client-facing. They need architects who push back constructively, not cave to bad decisions or alienate clients.

**Your answer (STAR format):**

> **Situation:** A product team wanted to store payroll calculation results in localStorage for "offline access" so accountants could view payslips without network connectivity.

> **Task:** Evaluate the request against security requirements and propose an alternative.

> **Action:** I didn't say "no" outright. I said "let me show you the risk." I demonstrated that localStorage is accessible to any XSS attack — a single cross-site scripting vulnerability would expose every employee's salary data to an attacker. I then proposed an alternative: Service Worker cache with a memory-only backend for sensitive data (cleared on logout), and localStorage only for non-PII preferences (theme, language, last-viewed page).

> **Result:** The team adopted the Service Worker approach. They got the offline capability they wanted without the PII exposure risk. The key was showing the *alternative*, not just the problem. Saying "no" without an alternative is unhelpful; saying "no, but here's a better path" is leadership."

---

### Q5. "How would you architect a system that needs to handle a sudden 10x spike in traffic?"

**Why IBM asks this:** IBM builds systems for enterprises that experience traffic spikes (Black Friday for retail, tax deadline for payroll, open enrollment for HR).

**Your answer (frontend-focused):**

> "On the frontend, handling 10x traffic is about reducing server load and staying responsive:

> 1. **CDN everything static** — HTML shell, JS bundles, CSS, images, fonts all served from edge CDN (CloudFront). The origin server never sees static asset requests. Content-hashed filenames with `Cache-Control: immutable, max-age=31536000`.

> 2. **API response caching** — stale-while-revalidate pattern for non-critical data. During a spike, serve slightly stale data rather than hammering the backend. In Fero, the `TrqCacheInterceptor` caches API responses with configurable TTLs per URL pattern.

> 3. **HTTP request deduplication** — Fero's `TrqInFlightInterceptor` ensures that if 1000 users request the same endpoint simultaneously, only one HTTP call is made and all 1000 get the same shared response via RxJS `share()`.

> 4. **Graceful degradation** — if the API is overwhelmed (429/503), show cached data with a "data may be outdated" banner. Don't show error screens; show the last-known-good state.

> 5. **Code splitting** — only load the code for the route the user is on. Don't pre-load all 50 feature modules on login. Initial bundle < 170KB, features lazy-loaded on navigation.

> 6. **Rate limiting on the client** — debounce search inputs, throttle scroll handlers, prevent double-submit on forms. Reduce outbound requests at source."

---

### Q6. "How do you explain a complex technical failure or architectural risk to a non-technical executive?"

**Why IBM asks this:** IBM Architects present to C-level executives. This tests communication skill, not just technical depth.

**Your answer:**

> "I use analogies and business impact, never jargon.

> **Example:** When I needed to explain why our micro-frontend architecture needed a version compatibility enforcement system, I told the VP: 'Imagine each team builds a floor of a building independently. Without a shared building code, Team A's plumbing doesn't connect to Team B's pipes. Our version pinning is the building code — it ensures all floors can connect.'

> **Structure I follow:**
> 1. **What's the business risk?** (not the technical detail) — "If we don't fix this, customers will see errors during payroll processing"
> 2. **What's the cause?** (one sentence, no jargon) — "Two teams deployed incompatible versions at the same time"
> 3. **What's the fix?** (concrete action) — "We're adding an automated check that prevents incompatible deployments"
> 4. **What's the cost of the fix?** (time/money) — "Two sprint investment, zero ongoing cost"
> 5. **What happens if we don't fix it?** (business consequence) — "This will recur monthly and each incident costs 4 hours of engineering time"

> Numbers and business impact, not technical jargon."

---

### Q7. "Design a frontend observability strategy — how do you know when something is wrong in production before users report it?"

**Why IBM asks this:** IBM products (Instana, Turbonomic) ARE observability tools. They expect architects to think about frontend observability as a first-class concern.

**Your answer:**

> "I implement three pillars of frontend observability:

> **Pillar 1: Error Monitoring (Sentry/Datadog RUM)**
> - Global error handler catches unhandled exceptions and promise rejections
> - Source maps uploaded to monitoring platform (never served publicly)
> - Structured context: user ID, tenant, route, component tree, session ID
> - Alert on error *rate* spikes, not individual errors (reduces noise)
> - In Flare: dual-adapter logging (Splunk + Console simultaneously)

> **Pillar 2: Performance Monitoring (Real User Monitoring)**
> - `web-vitals` library reports LCP, INP, CLS from real users
> - Custom performance marks for critical flows: login → dashboard ready, payroll submit → confirmation
> - p75 targets (not averages — averages hide the tail)
> - Alerting: if p75 LCP exceeds 2.5s for 10 minutes → page the on-call

> **Pillar 3: Business Flow Monitoring**
> - Track critical user journeys as funnels: start payroll → add employees → calculate → submit → confirm
> - Drop-off at any step triggers investigation
> - Correlation IDs on every request (`X-Correlation-ID` header) — trace a user's session from frontend to backend to database

> The key insight: **don't wait for users to report issues. Detect anomalies in error rates, performance metrics, and funnel drop-offs automatically.** By the time a user reports a bug, hundreds have already experienced it silently."

---

### Q8. "How would you implement a feature flag system for progressive rollout of a major UI change?"

**Why IBM asks this:** IBM ships to 100,000+ customers. You can't deploy a major change to everyone simultaneously. They need architects who think in gradual rollout.

**Your answer:**

> "In Fero, we built a feature toggle system with three layers:

> **1. Toggle service with evaluation logic:**
> ```typescript
> // Supports AND/OR operators and negation
> featureToggleService.validate('new-dashboard')           // simple boolean
> featureToggleService.validate(['feature.a', 'feature.b'], AND)  // all must be true
> featureToggleService.validate('!legacy-mode')            // negation
> ```

> **2. Route-level guard:**
> ```typescript
> {
>   path: 'new-dashboard',
>   canActivate: [TrqFeatureToggleRouteGuard],
>   data: {
>     featureToggle: 'new-dashboard',
>     redirectTo: '/legacy-dashboard'  // graceful fallback
>   }
> }
> ```

> **3. Template-level directive:**
> ```html
> <div *featureToggle="'new-dashboard'">
>   <new-dashboard-widget />
> </div>
> ```

> **Progressive rollout strategy:**
> - Day 1: internal users only (feature flag: `role === 'internal'`)
> - Day 3: 5% canary (hash(userId) % 100 < 5)
> - Day 7: 25% (if error rates stable)
> - Day 14: 50% → 75% → 100%
> - Kill switch: flip the flag, instant rollback without deployment

> **Key principle:** Feature flags have an *expiration date*. After full rollout, the flag is removed. Dead flags are tech debt."

---

### Q9. "How do you approach building for internationalisation in a product that serves 135+ countries?"

**Why IBM asks this:** IBM operates in 175+ countries. i18n is not optional — it's table stakes.

**Your answer:**

> "In Fero, I architected a runtime i18n system serving 6+ RTL locales and dozens of LTR locales. In Flare, we support 63 locales with CDN-loaded culture data. Key decisions:

> **1. Runtime over build-time translations** — one build serves all locales. Translations fetched from API at startup, cached in memory. No per-locale builds.

> **2. ICU message format for plurals and gender:**
> ```
> {count, plural, =0 {No employees} one {1 employee} other {{count} employees}}
> ```
> Different languages have different plural rules (English: 2, Arabic: 6, Japanese: 1). ICU handles this.

> **3. RTL as a first-class concern** — in Fero, `TrqLocaleDirectionService` detects RTL locales (ar, fa, he, yi, ur) and sets `dir='rtl'` on `<html>`. PostCSS RTL plugin auto-generates mirrored stylesheets. CSS logical properties (`margin-inline-start`) everywhere.

> **4. Culture-aware formatting** — NEVER format dates/numbers manually. Use `Intl.DateTimeFormat` and `Intl.NumberFormat`. In Flare, `@flare/globalization` loads culture data from CDN per-locale with fallback support.

> **5. Text expansion** — German is 30% longer than English. UI MUST accommodate this. We test with pseudo-locales (extended strings) to catch truncation.

> **6. Locale-aware caching** — in Fero, the cache key includes `Accept-Language` header. Switching locale automatically invalidates stale cached translations."

---

### Q10. "Describe a time when a project was going off track. What steps did you take to recover it?"

**Why IBM asks this:** IBM places heavy emphasis on behavioral questions. This tests leadership under pressure — a core architect responsibility.

**Your answer (STAR format):**

> **Situation:** The Fero design system upgrade from Angular 14 to Angular 16 was scoped for one sprint (2 weeks). At day 8, we discovered that 3 of our forked vendor libraries (ng-sidebar, ngx-perfect-scrollbar, ngx-popper) had no Angular 16-compatible versions. The upgrade was blocked.

> **Task:** Unblock the migration without slipping the quarterly release that depended on it.

> **Action:** I took three steps immediately:
> 1. **Reframed the problem** — presented to the team: "We don't need to upgrade the vendors. We need to remove the dependency on them." This changed the conversation from "wait for upstream" to "what's our internal solution?"
> 2. **Parallel-tracked** — assigned one engineer to patch the existing forks with Angular 16 compatibility (short-term), while two engineers built lightweight replacements using Angular CDK primitives (long-term).
> 3. **Reduced scope** — the patched forks shipped with the Angular 16 upgrade in sprint 2. The CDK replacements shipped in the following sprint. We split one large migration into two smaller, shippable increments.

> **Result:** Angular 16 shipped on time with patched vendor forks. CDK replacements shipped the following sprint and eliminated three external dependencies permanently. The team learned: **big migrations need escape hatches for unexpected blockers. Plan for 80% smooth, budget time for the 20% surprises.**"

---

### Key Themes IBM Interviewers Evaluate (from research)

| Evaluation Criteria | What They're Looking For | How to Signal It |
|---|---|---|
| **Technical Proficiency** | Deep expertise in system design, integration patterns, cloud architecture | Reference specific architecture decisions with trade-off reasoning |
| **Client Focus** | Managing stakeholders, translating jargon, handling pushback | STAR stories where you said "no" constructively |
| **Problem Solving** | Structured approach to ambiguity, methodology (Agile, IBM Garage) | Walk through your thinking process, not just the answer |
| **Growth Mindset** | Curiosity, mentoring juniors, staying current with AI/GenAI | Mention how you've upskilled teams, adopted new tech |
| **IBM Values** | "Be essential" — every contribution should matter | Frame answers in terms of business impact, not just technical correctness |

---

## 🧠 Tab 8: Interviewer Profile & 10 More Questions (System Design + Missed Topics)

### Interviewer: Prathap Simha — Application Architect, IBM (9+ years)

**Profile analysis:**

| Aspect | Detail | What This Means for You |
|---|---|---|
| **Role** | Application Architect at IBM since April 2017 (9+ years) | He's deeply embedded in IBM's architecture practices — will ask real-world IBM patterns |
| **Certifications** | Azure Solutions Architect Expert, Azure Fundamentals | He thinks in cloud-native terms — expect questions about cloud architecture, hybrid cloud, scalability |
| **Previous** | Tech Lead at Tech Mahindra (5 years) | Understands enterprise delivery, outsourcing dynamics, team coordination |
| **Background** | Commerce degree, not CS | He likely values clear communication over academic jargon. Explain things simply. |
| **Experience** | 17+ years total, majority at IBM | He has seen IBM's evolution — will value practical experience over theoretical knowledge |

**How to tailor your answers for Prathap:**

1. **Speak in cloud-native terms** — he has Azure certifications, so frame your architecture with cloud concepts (CDN, auto-scaling, containerisation, CI/CD pipelines)
2. **Don't over-academicise** — he's Commerce background turned architect. He values clarity and practical outcomes over theoretical depth
3. **Show enterprise maturity** — he's been an application architect for 9 years. He'll spot surface-level answers. Show you've lived with the consequences of your decisions
4. **Respect his domain** — "Application Architect" at IBM typically means he designs end-to-end application architectures (frontend + backend + infrastructure). Expect full-stack thinking questions, not pure frontend niche questions
5. **Azure/cloud framing** — when discussing infrastructure (CDN, caching, deployment), mention cloud-native patterns. He'll connect with that

---

### 5 Frontend System Design Questions

---

#### SD1. "Design a real-time collaborative dashboard where multiple users see the same live data with zero-lag updates"

**Framework for answering (5-step system design approach):**

**Step 1 — Clarify requirements:**
- How many concurrent viewers? (10? 1000? 100,000?)
- Is it read-only live data (stock ticker) or collaborative editing (Google Docs)?
- What's the acceptable lag? (sub-second? 5 seconds?)
- What happens if connection drops?

**Step 2 — High-level architecture:**

```
┌─────────────┐     WebSocket/SSE      ┌──────────────┐
│  Browser    │◄───────────────────────►│  WS Gateway  │
│  (React/    │                         │  (load        │
│   Angular)  │                         │   balanced)   │
└──────┬──────┘                         └──────┬───────┘
       │                                       │
       │ Local state                           │ Pub/Sub
       │ (optimistic UI)                       │ (Redis/Kafka)
       ▼                                       ▼
┌──────────────┐                        ┌──────────────┐
│ Virtual DOM  │                        │  Data Service│
│ + diffing    │                        │  (source of  │
│              │                        │   truth)     │
└──────────────┘                        └──────────────┘
```

**Step 3 — Key decisions:**

| Decision | Choice | Trade-off |
|---|---|---|
| Transport | WebSocket for bidirectional, SSE for server-push only | WS is more complex but supports collaboration; SSE simpler for read-only |
| State sync | Server pushes deltas (not full state) | Reduces bandwidth but requires client-side merge logic |
| Reconnection | Exponential backoff with jitter | Prevents thundering herd when server recovers |
| Stale data | Show last-known-good + "updating..." indicator | Never show blank screen; always show something useful |
| Scaling | Redis Pub/Sub fans out to multiple WS server instances | Single WS server can handle ~10K connections; beyond that, need horizontal scaling |

**Step 4 — Frontend specifics:**
- **Virtual scrolling** for large datasets (TanStack Virtual) — render only visible rows
- **RequestAnimationFrame** for batching DOM updates from rapid WebSocket messages
- **Web Worker** for processing incoming data off the main thread
- **Optimistic UI** for collaborative actions — show instantly, reconcile with server

**Step 5 — Failure modes:**
- WS disconnects → fall back to polling every 5s → show "reconnecting" banner
- Server overwhelmed → client-side throttle (accept max 10 updates/second, drop intermediate ones)
- Network partition → show stale data with timestamp: "Last updated 30s ago"

---

#### SD2. "Design a search autocomplete system for an enterprise application with millions of records"

**Requirements clarification:**
- Source: API-backed (not client-side filtering)
- Latency target: results in < 200ms
- Scale: 1M+ searchable records (employees, documents, products)

**Architecture:**

```
User types → Debounce (300ms) → AbortController (cancel previous)
  → Check LRU cache → cache hit? return immediately
  → cache miss? → fetch('/api/search?q=...')
  → Server: trie/elasticsearch → top 10 results
  → Client: render with highlighted matching text
```

**Key implementation details:**

```typescript
// 1. Debounce — don't fire on every keystroke
const debouncedSearch = debounce(query => fetchResults(query), 300);

// 2. AbortController — cancel stale requests
let controller: AbortController;
async function fetchResults(query: string) {
  controller?.abort(); // cancel previous
  controller = new AbortController();
  
  const cached = lruCache.get(query);
  if (cached) return cached;
  
  const res = await fetch(`/api/search?q=${query}`, { signal: controller.signal });
  const data = await res.json();
  lruCache.set(query, data);
  return data;
}

// 3. LRU cache — bounded memory (max 100 entries)
// Prevents redundant API calls for repeated queries

// 4. Minimum characters — don't search on 1 character (too broad)
if (query.length < 2) return;
```

**Accessibility (critical for IBM):**
```html
<input role="combobox" aria-expanded="true" aria-controls="results"
       aria-activedescendant="result-2" />
<ul id="results" role="listbox">
  <li id="result-0" role="option">Angular Architecture</li>
  <li id="result-1" role="option">Angular CDK</li>
  <li id="result-2" role="option" aria-selected="true">Angular Testing</li>
</ul>
```

**Keyboard navigation:** Arrow keys move highlight, Enter selects, Escape closes dropdown.

---

#### SD3. "Design a notification system — in-app toasts, badge counts, push notifications, and real-time updates"

**Architecture layers:**

```
Layer 1: Transport
├── WebSocket (persistent connection for real-time push)
├── SSE (fallback if WebSocket blocked by corporate proxy)
└── Polling (last resort — every 30s check /api/notifications/unread)

Layer 2: Client State
├── Notification store (unread count, notification list)
├── Toast queue (max 3 visible, FIFO with assertive priority jump)
└── Badge count (derived from unread list)

Layer 3: UI Components
├── Toast container (positioned fixed, stacked)
├── Notification bell (badge with count)
├── Notification center (flyout panel with history)
└── Push notification (OS-level via Service Worker)
```

**Toast system design:**
- Max 3 visible simultaneously
- Auto-dismiss after 5s (configurable)
- "Assertive" toasts (errors) jump to front of queue
- Pause timer on hover (user is reading)
- Screen reader: `role="alert"` for errors, `role="status"` for info

**Real-time architecture (from Flare LiveAnnouncerProvider pattern):**
```typescript
const announce = (text: string, politeness: 'polite' | 'assertive') => {
  const newItem = { id: Date.now(), text, politeness };
  setQueue(current => {
    if (politeness === 'assertive') return [newItem, ...current]; // front
    return [...current, newItem]; // back
  });
};
```

---

#### SD4. "Design a multi-step form wizard with validation, save-as-draft, and resume capability"

**Requirements:**
- 5+ steps (personal info → education → employment → documents → review)
- Validate each step before proceeding
- Save progress (user can leave and resume later)
- Works offline (draft saved locally)

**Architecture:**

```typescript
// State machine approach — each step is a state
type WizardState = 'personal' | 'education' | 'employment' | 'documents' | 'review';

interface WizardContext {
  currentStep: WizardState;
  completedSteps: Set<WizardState>;
  formData: Record<WizardState, Record<string, any>>;
  isDirty: boolean;
  lastSavedAt: Date | null;
}
```

**Key decisions:**

| Concern | Solution | Why |
|---|---|---|
| Form state | react-hook-form with FormProvider / Angular Reactive Forms | Built-in validation, performance (doesn't re-render on every keystroke) |
| Persistence | Auto-save to IndexedDB every 30s + on step change | Survives browser crash, tab close |
| Server sync | Debounced PUT to /api/drafts/{id} every 60s | Enables resume on different device |
| Validation | Per-step schema (Zod/Yup) — validate only current step, not entire form | Don't block user on step 1 for step 5 validation |
| Navigation | Allow back to completed steps, block forward to uncompleted | Linear progression with ability to review |
| Offline | Service Worker queues draft saves when offline | Sync when back online |

**UX patterns:**
- Progress indicator showing completed/current/remaining steps
- "Save & Exit" button — saves current state, user can resume later
- "Discard Draft" with confirmation dialog
- Unsaved changes warning on browser close (`beforeunload`)
- Step summary on the review page with "Edit" links back to each step

---

#### SD5. "Design a data-heavy dashboard with multiple widgets that load independently, can be rearranged, and support different refresh rates"

**Requirements:**
- 6-8 widgets on a dashboard (charts, tables, KPI cards, activity feed)
- Each widget fetches its own data independently
- Users can rearrange widgets (drag-and-drop)
- Different widgets refresh at different intervals (KPIs every 10s, charts every 60s)
- One widget failing shouldn't crash others

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Shell (layout grid + DnD context)                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Widget A │  │ Widget B │  │ Widget C │  │ Widget D │   │
│  │ KPI Card │  │ Chart    │  │ Table    │  │ Feed     │   │
│  │ 10s poll │  │ 60s poll │  │ on-demand│  │ WebSocket│   │
│  │          │  │          │  │          │  │          │   │
│  │ [Error   │  │ [Error   │  │ [Error   │  │ [Error   │   │
│  │  Boundary]│  │  Boundary]│  │  Boundary]│  │  Boundary]│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key patterns:**

1. **Error boundaries per widget** — Widget C throws? Show "Failed to load" in that slot, other widgets continue working. Exactly like MFE remote isolation.

2. **Independent data fetching:**
```typescript
// Each widget manages its own polling interval
const { data } = useQuery({
  queryKey: ['kpi-revenue'],
  queryFn: fetchRevenue,
  refetchInterval: 10_000, // 10s for KPIs
});

const { data: chartData } = useQuery({
  queryKey: ['monthly-chart'],
  queryFn: fetchChartData,
  refetchInterval: 60_000, // 60s for charts
});
```

3. **Drag-and-drop layout** — persist layout to backend per user. Use CSS Grid + DnD Kit. Layout config is JSON: `[{ widgetId: 'kpi', x: 0, y: 0, w: 3, h: 2 }]`

4. **Skeleton loaders per widget** — show the grid immediately with skeleton placeholders. Each widget renders its skeleton independently, then replaces with real content.

5. **Lazy loading** — heavy widgets (charts with D3, large tables) use `React.lazy` / `@defer` so they don't block initial render.

---

### 5 Questions on Missed Topics (Tailored to Prathap's Profile)

---

#### MT1. "How do you approach cloud-native frontend deployment? Walk me through your CI/CD pipeline for frontend artefacts."

**Why Prathap asks this:** He has Azure certifications. He thinks in cloud-native terms — containers, CDN, pipelines, blue/green deployments.

**Your answer:**

> "In both Fero and Flare, we use containerised CI pipelines:

> **Fero pipeline (TeamCity):**
> ```
> Docker container: lerna-worker (Node 24 Alpine)
> ┌─────────────────────────────────────────────┐
> │ 1. yarn install --frozen-lockfile            │
> │ 2. Lint (ESLint TS + Stylelint SCSS)        │
> │ 3. Unit tests (Karma/Jasmine)               │
> │ 4. A11y tests (dedicated step)              │
> │ 5. Production build (ng-packagr APF)        │
> │ 6. RTL stylesheet generation (PostCSS)      │
> │ 7. Publish 15 packages to Artifactory       │
> └─────────────────────────────────────────────┘
> ```

> **Flare pipeline (PipelineKit/Jenkins):**
> ```
> Docker container: Node 24 Alpine + Playwright Noble
> ┌─────────────────────────────────────────────┐
> │ 1. affected:lint:ci (only changed packages) │
> │ 2. affected:test:ci (Jest + typecheck)      │
> │ 3. build:ci:parallel (Lerna parallel)       │
> │ 4. test:storybook:ci (visual + a11y)        │
> │ 5. Publish to Artifactory registry          │
> │ 6. Deploy Storybook docs to S3              │
> └─────────────────────────────────────────────┘
> ```

> **Cloud-native deployment patterns I'd use at IBM:**
> - **Static assets → CDN** (CloudFront/Azure CDN) with content-hashed filenames and immutable cache headers
> - **Blue/green deployment** — new version deployed alongside old, traffic switched after health check passes
> - **Canary releases** — 5% of traffic to new version, monitor error rates, roll forward or back
> - **Infrastructure as Code** — CDN config, S3 buckets, CloudFront distributions all in Terraform/CDK
> - **Container-based CI** — reproducible builds, no "works on my machine" issues"

---

#### MT2. "How do you handle technical debt in a long-lived enterprise application? How do you sell it to product leadership?"

**Why Prathap asks this:** He's been at IBM for 9 years. He has lived with technical debt. He wants to know if you manage it strategically.

**Your answer:**

> "Technical debt is not inherently bad — it's a deliberate trade-off. The problem is *untracked, unmanaged* debt.

> **My framework:**
> 1. **Make debt visible** — tag TODO comments with ticket links. Maintain a "tech debt backlog" as first-class items, not hidden in Jira descriptions.
> 2. **Categorise by impact:**
>    - P1: Security risk (XSS, exposed PII) — fix NOW
>    - P2: Blocks other teams (shared component bug) — next sprint
>    - P3: Slows velocity (outdated test framework) — quarterly
>    - P4: Cosmetic (old naming conventions) — boy scout rule
> 3. **20% rule** — every sprint, 20% capacity goes to debt reduction. Non-negotiable.
> 4. **Boy Scout Rule** — leave code better than you found it. Touching a file? Fix the lint warnings.

> **How to sell to leadership:**
> Frame it as *velocity investment*, not cleanup:
> - "If we spend 2 sprints on this, we'll ship features 30% faster for the next 6 months"
> - Track metrics: build time (was 45min, now 8min after MFE split), test execution time, time-to-first-PR for new hires
> - Never say "we need to refactor." Say "this investment will reduce our incident rate from 3/month to 0."

> **Real example:** In Fero, we carried three forked vendor libraries (ng-sidebar, ngx-perfect-scrollbar, ngx-popper) for years because upgrading Angular was blocked by them. The strategic fix wasn't upgrading the forks — it was replacing them with CDK-based alternatives. That eliminated the external dependency entirely and unblocked all future Angular upgrades."

---

#### MT3. "How do you ensure consistency when multiple teams contribute to the same frontend platform?"

**Why Prathap asks this:** At IBM, dozens of teams work on products. Consistency at scale is an architect's primary challenge.

**Your answer:**

> "Consistency comes from three sources: automation, tooling, and culture. In that order of reliability.

> **1. Automation (can't be bypassed):**
> - Shared ESLint config as an npm package — all teams extend it, all rules enforced in CI
> - Nx module boundary rules — lint prevents payroll code from importing HR code
> - Bundle size budgets — CI fails if initial bundle exceeds threshold
> - Pre-commit hooks (Husky + lint-staged) — formatting and related tests run before commit lands
> - In Fero: `@fero/eslint-plugin` with custom template-a11y rules enforced as errors

> **2. Tooling (makes the right thing easy):**
> - Code generators — `yarn add:component` scaffolds correct file structure, barrel exports, test boilerplate
> - Reference implementation — a working app that demonstrates every pattern (not a slide deck)
> - Storybook as the living style guide — designers and engineers reference the same source of truth

> **3. Culture (reinforces the first two):**
> - Architecture Decision Records (ADRs) — every significant decision documented with "why"
> - PR reviews as teaching moments — "here's *why* this pattern is preferred"
> - Architecture guild meetings (bi-weekly) — cross-team alignment on upcoming changes
> - Inner-source contribution model — feature teams contribute to shared platform, platform team reviews

> **The principle: make the right thing the easy thing.** If following the standard is harder than going rogue, teams will go rogue. The generators, lint rules, and shared configs ensure the default path is the correct path."

---

#### MT4. "What's your approach to evaluating and adopting new technologies? How do you prevent 'shiny object syndrome'?"

**Why Prathap asks this:** 9 years at IBM means he's seen many tech hype cycles. He wants to know you're pragmatic, not trendy.

**Your answer:**

> "I use a decision framework that filters new tech through four gates:

> **Gate 1: Does it solve a real problem we have today?**
> Not "could we theoretically benefit" — but "do we have a documented pain point this addresses?" If not, it goes on the 'watch' list.

> **Gate 2: Is the ecosystem mature enough for enterprise?**
> - LTS/support policy? (Angular: LTS for 18 months. React: no formal LTS but Meta supports it)
> - Security patch cadence?
> - Can we hire people who know it? (check LinkedIn, job postings)
> - Enterprise adoption? (IBM, Google, Meta use it — not just startups)

> **Gate 3: What's the migration cost and reversibility?**
> - One-way door (framework choice) → needs POC, team consensus, months of evaluation
> - Two-way door (library swap, build tool) → try it, revert if it doesn't work, days

> **Gate 4: Time-boxed proof of concept**
> Build the same feature with the new tech AND the current tech. Compare: developer experience, bundle size, performance, testing ergonomics. The team that does the POC writes the trade-off document.

> **Tech Radar approach:**
> I maintain a simple four-quadrant tech radar:
> - **Adopt** — use in production (proven: Angular, React, TypeScript, Nx)
> - **Trial** — limited production use (evaluating: Angular Signals, Bun, Vite)
> - **Assess** — POC only (watching: Qwik, React Server Components for our use case)
> - **Hold** — don't adopt (deprecated: AngularJS, Webpack 4, Moment.js)

> Updated quarterly with team input, published internally so everyone knows the direction."

---

#### MT5. "Describe your approach to making the frontend architecture horizontally scalable as the team grows from 5 to 50 engineers."

**Why Prathap asks this:** IBM hires architects to build systems that scale with the organisation, not just with traffic.

**Your answer:**

> "Technical architecture must scale with the team, not just the product. I've lived this transition — from a single team on one repo to 10+ teams on a micro-frontend platform.

> **At 5 engineers (one team):**
> - Well-structured monolith is fine — feature-based folder structure, shared component library
> - One CI pipeline, one deployment, one codebase
> - Convention over configuration — verbal agreements work at this scale

> **At 15 engineers (2-3 teams):**
> - Monorepo with Nx — shared tooling, but clear library boundaries
> - Module boundary lint rules prevent cross-team coupling
> - Shared design system as an internal package (not copy-paste)
> - Code ownership files (CODEOWNERS) — teams own their directories

> **At 30+ engineers (5+ teams):**
> - Micro-frontends become necessary — teams need deployment independence
> - Module Federation shell + remotes — each team deploys independently
> - Shared contracts (TypeScript interfaces package) — integration points are versioned
> - Platform team owns shell, design system, auth, CI infrastructure
> - Feature teams own their remotes end-to-end (build, test, deploy, monitor)
> - Inner-source model for shared code — PRs reviewed by platform team

> **At 50+ engineers (10+ teams):**
> - Architecture guild for cross-team alignment
> - RFC process for significant changes
> - Automated dependency update PRs (like FeroUI's BitBot for Fero uptakes)
> - Per-team CI pipelines, per-team deployment cadence
> - Shared observability (error rates, performance budgets per team)
> - Tech radar maintained collaboratively

> **The key insight from FeroUI:** We went from a fork-per-team model (16 forks!) to Module Federation. The fork model gave autonomy but made integration painful. MFE gives the same autonomy with runtime integration — no merge conflicts, no coordinated releases.

> **What stays constant at every scale:**
> - Design tokens as the visual contract
> - Automated quality gates (lint, test, a11y, bundle budget)
> - ADRs for significant decisions
> - The design system grows WITH the teams, not ahead of them"

---

### Interviewer-Specific Tips for Prathap

| Signal | How to Respond |
|---|---|
| He asks about Azure/cloud | Frame your answers with cloud deployment patterns (CDN, containers, pipelines, blue/green) |
| He asks about end-to-end architecture | Don't stay purely frontend — show you understand API contracts, auth flows, caching layers |
| He asks "how would you" | Give a structured approach (step 1, 2, 3), not just the final answer — he's evaluating your thinking process |
| He probes on team coordination | Reference the fork-per-team model in FeroUI and how MFE solved the coordination problem |
| He asks about IBM-specific tech | Mention Carbon Design System, watsonx, hybrid cloud — show you've done homework on IBM's ecosystem |
| He goes deep on one topic | Don't rush. He has 9 years of architect experience — he'll probe until he finds your depth limit. Go deep where you're strong. |

---

---

## 🧱 Tab 9: OOP, Design Patterns, SOLID & Data Structures (10 Questions)

> Since Prathap's background is Application Architect (not purely frontend), expect questions on general software engineering principles — OOP, design patterns, SOLID, and data structures applied to frontend/full-stack contexts.

---

### OOP1. "Explain SOLID principles. Give a frontend example for each."

**Answer:**

| Principle | Meaning | Frontend Example |
|---|---|---|
| **S** — Single Responsibility | A class/component does ONE thing | A `<Button>` renders a button. It doesn't fetch data, manage auth, or handle routing. A `PayrollService` handles payroll API calls — it doesn't manage UI state. |
| **O** — Open/Closed | Open for extension, closed for modification | A `ThemeProvider` is extensible (pass any theme object) without modifying its source. Design tokens: add new tokens without changing existing component code. |
| **L** — Liskov Substitution | Subtypes must be substitutable for their base types | If `ModalBase` has `open()` and `close()`, then `ConfirmModal extends ModalBase` must also work with `open()` and `close()` without breaking consumers. |
| **I** — Interface Segregation | Don't force clients to depend on interfaces they don't use | Don't make a `<FormField>` accept 50 props. Split into `<TextField>`, `<SelectField>`, `<DateField>` — each takes only what it needs. |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | Angular DI: components inject `AuthService` (interface), not `KeycloakAuthService` (concrete). In React: components accept a `fetcher` function prop, not a hardcoded `axios` call. |

**Real project example (Fero):**

> "In Fero, the `TrqResourceBundleService` follows Dependency Inversion — it's an **abstract class**. Each consuming app provides its own concrete implementation (e.g., `PlayResourceBundleService` fetches from JSON files, production fetches from an API). The platform code never knows or cares where translations come from — it only depends on the abstract interface."

---

### OOP2. "What design patterns do you use most in frontend architecture?"

**Answer:**

| Pattern | Where I've Used It | Real Code Example |
|---|---|---|
| **Facade** | NgRx store abstraction | `TrqFrameworkFacade` — components call `facade.toggleSideNav()`, never `store.dispatch()` directly. Hides 40+ observables behind a clean API. |
| **Observer** | RxJS subscriptions, React Context | `facade.body$` — 24 streams combined via `combineLatest`, all subscribers get updates automatically. |
| **Singleton** | Global services, AI Assist | `AIAssistGlobal.getInstance()` — one instance across the entire app. Angular services with `providedIn: 'root'` are singletons. |
| **Strategy** | HTTP interceptors, validation | `TrqCacheInterceptor` picks the best cache strategy per URL pattern (memory/session/localStorage). Different strategies, same interface. |
| **Factory** | Component creation, theming | `getTheme({ baseColor })` — factory function produces different theme objects based on input. Nx generators are factories that produce component boilerplate. |
| **Decorator** | Angular decorators, HOCs | `@Component()`, `@Injectable()` — add metadata without modifying the class. React HOCs like `withAuth(Component)` add behaviour. |
| **Compound Component** | Complex UI components | `<DataGrid>` → `<DataGrid.Header />`, `<DataGrid.Body />`, `<DataGrid.Pagination />` — share implicit state via Context. |
| **Adapter** | API client layer | `lxpToCsod()` in Flare — adapts LXP context format to standard CSOD context format. Different input shapes, same output interface. |
| **Proxy** | HTTP interceptors | `TrqInFlightInterceptor` is a proxy — sits between the component and the real HTTP call, adding deduplication logic transparently. |
| **Command** | NgRx actions, undo/redo | `store.dispatch(new ToggleSideNav(true))` — encapsulates an operation as an object. Enables logging, replay, time-travel debugging. |

---

### OOP3. "Explain the Observer pattern. How is it used in Angular vs React?"

**Answer:**

**Observer pattern:** An object (subject) maintains a list of dependents (observers) and notifies them automatically of state changes.

**In Angular (RxJS Observables):**
```typescript
// Subject (Observable)
const isSmallScreen$ = store.select(fromFramework.isSmallScreen);

// Observers (subscribers)
isSmallScreen$.subscribe(value => this.updateLayout(value));  // Observer 1
isSmallScreen$.subscribe(value => this.updateNav(value));     // Observer 2

// When state changes → both observers notified automatically
```

**In React (Context + useState / Signals):**
```typescript
// Subject (Context Provider)
const ThemeContext = createContext(defaultTheme);

// Observers (consuming components)
function Button() {
  const theme = useContext(ThemeContext); // Observer — re-renders when theme changes
  return <button style={{ color: theme.primary }}>Click</button>;
}
```

**Key difference:**
- Angular: **push-based** — Observables push values to subscribers. Explicit subscribe/unsubscribe.
- React: **pull-based** — components re-render and pull the latest value from context. No explicit subscription.

---

### OOP4. "What's the difference between Composition vs Inheritance? Which do you prefer in frontend?"

**Answer:**

```
Inheritance: "is-a" relationship
  AdminDashboard extends Dashboard extends Component
  → Deep hierarchy, fragile base class, tight coupling

Composition: "has-a" relationship
  Dashboard = Layout + Widgets + Filters + ErrorBoundary
  → Flat, flexible, mix-and-match
```

**I strongly prefer composition.** Here's why:

| Aspect | Inheritance | Composition |
|---|---|---|
| Flexibility | Locked to one hierarchy | Mix any behaviours together |
| Reuse | Must inherit entire base class | Pick only what you need |
| Testing | Must test entire hierarchy | Test each piece in isolation |
| Refactoring | Change base → breaks all children | Change one piece → others unaffected |

**Real examples from my work:**

```typescript
// Angular — Composition via DI (not inheritance)
@Component({...})
class PayrollDashboard {
  constructor(
    private auth: AuthService,       // composed in
    private cache: CacheService,     // composed in
    private logger: LoggerService    // composed in
  ) {}
}
// NOT: class PayrollDashboard extends AuthenticatedCachedLoggedComponent

// React — Composition via hooks
function PayrollDashboard() {
  const auth = useAuth();            // composed in
  const { data } = useQuery(...);   // composed in
  const logger = useLogger();        // composed in
}
// NOT: class PayrollDashboard extends React.Component with mixins
```

**The React team literally removed mixins and class inheritance patterns in favour of hooks (composition).** Angular's DI is also composition — you inject capabilities, not inherit them.

---

### OOP5. "Explain the Strategy pattern with a real frontend use case."

**Answer:**

**Strategy pattern:** Define a family of algorithms, encapsulate each one, and make them interchangeable. The client picks which strategy to use at runtime.

**Real example — Fero's caching system:**

```typescript
// The Strategy interface
interface CacheStorage {
  get(key: string): any;
  set(key: string, value: any): void;
  remove(key: string): void;
}

// Strategy 1: Memory (fast, lost on refresh)
class MemoryStorage implements CacheStorage {
  private store = new Map();
  get(key) { return this.store.get(key); }
  set(key, value) { this.store.set(key, value); }
  remove(key) { this.store.delete(key); }
}

// Strategy 2: Session Storage (survives navigation, lost on tab close)
class SessionCacheStorage implements CacheStorage {
  get(key) { return JSON.parse(sessionStorage.getItem(key)); }
  set(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); }
  remove(key) { sessionStorage.removeItem(key); }
}

// Strategy 3: Local Storage (persists across sessions)
class LocalCacheStorage implements CacheStorage {
  get(key) { return JSON.parse(localStorage.getItem(key)); }
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  remove(key) { localStorage.removeItem(key); }
}

// The Context — picks strategy based on configuration
class Cache {
  private storage: CacheStorage;

  constructor(mode: 'memory' | 'session' | 'local') {
    switch(mode) {
      case 'memory': this.storage = new MemoryStorage(); break;
      case 'session': this.storage = new SessionCacheStorage(); break;
      case 'local': this.storage = new LocalCacheStorage(); break;
    }
  }

  get(key: string) { return this.storage.get(key); }
  set(key: string, value: any) { this.storage.set(key, value); }
}
```

In Fero, different URL patterns use different cache strategies:
- `/api/reference-data/*` → localStorage (rarely changes)
- `/api/employees/*` → sessionStorage (changes per session)
- `/api/payroll/run/*` → memory only (sensitive, never persisted)

---

### DSA1. "What data structures do you use most in frontend development?"

**Answer:**

| Data Structure | Frontend Use Case | Example |
|---|---|---|
| **Map** | O(1) key-value lookup | Cache stores, entity normalization (`Map<employeeId, Employee>`) |
| **Set** | O(1) unique membership check | Selected row IDs in a datagrid, deduplication of notifications |
| **Array** | Ordered list rendering | Any `*ngFor` / `.map()` list render |
| **Stack (Array)** | Undo/redo history | Command pattern — push actions, pop to undo |
| **Queue (Array)** | Notification toast queue | FIFO processing — oldest toast dismissed first |
| **Tree** | Navigation hierarchy, DOM, org chart | Fero's `TreeModel` for parsing nav JSON into a traversable tree |
| **Trie** | Autocomplete/search suggestions | Prefix matching — "pay" matches "payroll", "payment", "payslip" |
| **LRU Cache (Map)** | API response caching with bounded memory | Keep last 100 search results, evict oldest on overflow |
| **Graph** | Dependency graphs, workflow builders | Nx dependency graph; org chart with reporting relationships |
| **WeakMap** | Metadata on DOM elements without preventing GC | Associate data with elements without memory leaks |

---

### DSA2. "Implement an LRU Cache. Where would you use it in a frontend app?"

**Answer:**

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete first (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }
}
```

**Why `Map` works here:** JavaScript `Map` maintains insertion order. `keys().next().value` gives the oldest entry. Moving to end = delete + re-insert.

**Frontend use cases:**
- **Search autocomplete** — cache last 50 search queries → instant results for repeated searches
- **API response caching** — cache last 100 API responses, evict least-recently-accessed
- **Image/avatar cache** — keep last N user avatars in memory, evict when scrolling long lists
- **Route component cache** — keep last 5 visited page components mounted (like Vue's `keep-alive`)

---

### DSA3. "How would you efficiently store and retrieve hierarchical data (like an org chart or navigation tree) on the frontend?"

**Answer:**

**The problem:** Navigation/org data comes from the API as a flat array or nested JSON. You need to traverse it (find a node, get path to root, get children) efficiently.

**Approach 1: Nested tree (Fero's approach):**

```typescript
// API returns nested JSON
interface NavNode {
  id: string;
  label: string;
  href: string;
  children: NavNode[];
}

// Fero uses TreeModel library to parse it into a traversable tree
import TreeModel from 'tree-model';
const tree = new TreeModel();
const root = tree.parse(navJson);

// Operations:
root.first(node => node.model.id === 'payroll');       // O(n) find
root.all(node => node.model.href.startsWith('/hr'));   // O(n) filter
node.getPath();  // O(depth) — path from root to this node (for breadcrumbs)
```

**Approach 2: Normalized flat map + parent references (better for large datasets):**

```typescript
// Normalize into a Map for O(1) lookup
interface FlatNode {
  id: string;
  label: string;
  parentId: string | null;
  childIds: string[];
}

const nodeMap = new Map<string, FlatNode>();  // O(1) lookup by ID

// Build breadcrumb (walk up parent chain) — O(depth)
function getBreadcrumb(nodeId: string): FlatNode[] {
  const path: FlatNode[] = [];
  let current = nodeMap.get(nodeId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }
  return path;
}

// Get children — O(1)
function getChildren(nodeId: string): FlatNode[] {
  const node = nodeMap.get(nodeId)!;
  return node.childIds.map(id => nodeMap.get(id)!);
}
```

**Trade-off:**

| Approach | Pros | Cons |
|---|---|---|
| Nested tree | Natural structure, easy to render recursively | O(n) search, deep cloning for immutability |
| Flat map + parent refs | O(1) lookup, easy to update single nodes | Must maintain parent/child relationships manually |

**In Fero:** We use TreeModel (nested) because the nav tree is small (~100 nodes) and read-heavy (render menus, build breadcrumbs). The O(n) search cost is negligible for 100 nodes. For a 10,000-node org chart, I'd use the flat map approach.

---

### DSA4. "Explain the Pub/Sub pattern. How does it differ from Observer, and where have you used it?"

**Answer:**

```
Observer: Subject knows its observers directly
  Component → subscribes to → Observable
  (tight coupling — subject references observers)

Pub/Sub: Publishers and subscribers don't know each other — a broker/bus mediates
  Publisher → event bus → Subscriber
  (loose coupling — neither knows the other exists)
```

| Aspect | Observer | Pub/Sub |
|---|---|---|
| Coupling | Subject knows observers | Decoupled via message broker |
| Use case | Component subscribing to a data stream | Cross-MFE communication, plugin systems |
| Example | RxJS Observable, React Context | NgRx actions, CustomEvent on window, event bus |

**Where I've used Pub/Sub:**

1. **NgRx actions** — dispatching `RefreshNavAction` is pub/sub. The dispatcher doesn't know which reducers/effects will handle it. The store is the broker.

2. **Cross-MFE communication in FeroUI** — MFEs communicate with the host shell via events:
```typescript
// Publisher (MFE requests token refresh)
eventBus.emit('appshell:refreshAccessToken');

// Subscriber (Shell handles it — MFE doesn't know how)
eventBus.on('appshell:retrievedAccessToken:success', (token) => {
  updateContext(token);
});
```

3. **Custom DOM events** — framework-agnostic communication:
```typescript
// Any framework can publish
window.dispatchEvent(new CustomEvent('user:logout', { detail: { reason: 'timeout' } }));

// Any framework can subscribe
window.addEventListener('user:logout', (e) => clearState());
```

---

### DSA5. "What is memoization? How and when do you apply it in frontend code?"

**Answer:**

**Memoization** = caching the result of a function based on its inputs. If the same inputs are provided again, return the cached result instead of recomputing.

**Where it's used in frontend:**

| Location | Mechanism | What It Caches |
|---|---|---|
| NgRx selectors | `createSelector()` | Derived state — only recomputes when input state changes |
| React components | `React.memo()` | Component render output — skips re-render if props unchanged |
| React hooks | `useMemo()` | Expensive computed values — only recomputes when dependencies change |
| React callbacks | `useCallback()` | Function reference — prevents child re-renders |
| Fero framework | `TrqMemoizePipe` | Template expression results — caches pure function outputs |
| API responses | LRU cache | Network responses — avoids redundant HTTP calls |

**Implementation:**

```typescript
// Generic memoize function
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveCalc = memoize((employees: Employee[]) => {
  return employees.reduce((sum, emp) => sum + emp.salary, 0); // O(n)
});

expensiveCalc(employees); // computes (slow)
expensiveCalc(employees); // returns cached (instant)
```

**When NOT to memoize:**
- Cheap computations (adding two numbers — memoization overhead > computation cost)
- Functions with side effects (API calls — you WANT to re-execute)
- Functions called with always-new arguments (cache never hits — wasted memory)

**NgRx selector memoization (Fero):**
```typescript
// createSelector memoizes automatically — only recomputes when inputs change
export const getPrimaryNavItems = createSelector(
  getPrimaryNodes,    // input selector 1
  getSortedNavFlag,   // input selector 2
  (nodes, sorted) => {  // only runs when nodes OR sorted changes
    return sorted ? nodes.sort(...) : nodes;
  }
);
```

---

---

## 📐 Tab 10: Generic Frontend System Design Framework (Applicable to Any UI Component/Feature)

> Use this framework when asked "Design X" in the interview — whether it's a search bar, chat widget, dashboard, or form wizard. The steps are always the same.

---

### The 7-Step Framework

```
Step 1: CLARIFY REQUIREMENTS (2 min)
Step 2: DEFINE SCOPE (1 min)
Step 3: HIGH-LEVEL ARCHITECTURE (3 min)
Step 4: COMPONENT BREAKDOWN (5 min)
Step 5: DATA LAYER (5 min)
Step 6: CROSS-CUTTING CONCERNS (5 min)
Step 7: TRADE-OFFS & ALTERNATIVES (2 min)
```

---

### Step 1: Clarify Requirements

**Always ask these before designing:**

| Category | Questions to Ask |
|---|---|
| **Users** | Who uses this? How many concurrent users? What devices? |
| **Data** | How much data? Real-time or static? How often does it change? |
| **Scale** | 100 items or 100,000 items? Single tenant or multi-tenant? |
| **Performance** | What's the latency target? What's the initial load budget? |
| **Offline** | Does it need to work without network? |
| **Accessibility** | What WCAG level? Screen reader support required? |
| **i18n** | Multiple languages? RTL support? |
| **Integration** | REST API? GraphQL? WebSocket? Existing backend or greenfield? |

**Example — "Design a data table component":**
> "Before I design, let me clarify: How many rows? (100 vs 100K changes the approach entirely.) Is sorting/filtering server-side or client-side? Is it real-time or static? Does it need row selection, inline editing, or is it read-only?"

---

### Step 2: Define Scope (What's In / Out)

**Draw a boundary:**

```
IN SCOPE (will design now):
✅ Core component structure
✅ Data fetching strategy
✅ State management
✅ Key interactions (sort, filter, paginate)
✅ Accessibility basics

OUT OF SCOPE (mention but don't deep-dive):
❌ Backend API design (assume it exists)
❌ Authentication (assume user is logged in)
❌ Full responsive design (mention breakpoints, don't design all)
❌ Edge cases (handle after core design is solid)
```

---

### Step 3: High-Level Architecture

**Always draw this diagram (adapt for any component):**

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Components)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Container    │  │ Presentational│  │ Shared UI    │  │
│  │ (smart)      │  │ (dumb)        │  │ (design sys) │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
├─────────┼────────────────────────────────────────────────┤
│  STATE LAYER                                             │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Local State  │  │ Server State │  │ URL State    │  │
│  │ (useState/   │  │ (useQuery/   │  │ (query      │  │
│  │  signal)     │  │  service)    │  │  params)     │  │
│  └──────────────┘  └──────┬───────┘  └──────────────┘  │
│                           │                              │
├───────────────────────────┼──────────────────────────────┤
│  DATA LAYER               │                              │
│  ┌────────────────────────▼─────────────────────────┐   │
│  │  API Client (fetch/axios/HttpClient)              │   │
│  │  + Interceptors (auth, cache, retry, logging)     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Step 4: Component Breakdown

**Apply this split to any feature:**

```typescript
// Container (smart) — handles data and logic
function EmployeeListContainer() {
  const { data, isLoading, error } = useQuery(['employees'], fetchEmployees);
  const [filters, setFilters] = useState(defaultFilters);
  
  return (
    <EmployeeListView 
      employees={data}
      isLoading={isLoading}
      error={error}
      filters={filters}
      onFilterChange={setFilters}
    />
  );
}

// Presentational (dumb) — handles rendering only
function EmployeeListView({ employees, isLoading, error, filters, onFilterChange }) {
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBanner />;
  return (
    <>
      <FilterBar filters={filters} onChange={onFilterChange} />
      <DataGrid data={employees} />
      <Pagination />
    </>
  );
}
```

**Why this split matters:**
- Presentational components are **testable in Storybook** (pass props, see output)
- Container components are **testable with mocked APIs** (no DOM assertions)
- Presentational components are **reusable** (different data, same UI)

---

### Step 5: Data Layer Design

**Answer these for any system design question:**

| Question | Options | Decision Criteria |
|---|---|---|
| Where does data come from? | REST / GraphQL / WebSocket | Complexity of data shape, real-time needs |
| How is it cached? | React Query / in-memory / localStorage | Freshness requirements, offline needs |
| How fresh must it be? | Real-time (WS) / Stale-while-revalidate / On-demand | User expectation, data sensitivity |
| How much data? | All at once / Paginated / Virtualized | Dataset size, performance budget |
| How is it updated? | Optimistic / Pessimistic / Real-time push | UX priority (speed vs accuracy) |

**Decision tree:**

```
Data size < 1000 items? → Fetch all, filter client-side
Data size > 1000 items? → Server-side pagination + search
Real-time needed? → WebSocket or SSE
Offline needed? → IndexedDB + Background Sync
Multiple components need same data? → Shared cache (React Query / NgRx)
Only one component needs it? → Local fetch, no shared state
```

---

### Step 6: Cross-Cutting Concerns (mention ALL of these)

**This is what separates a senior answer from a junior answer:**

| Concern | What to Mention | 30-Second Answer |
|---|---|---|
| **Performance** | Virtual scrolling for large lists, lazy loading, memoization, code splitting | "I'd virtualize any list > 100 items and lazy-load below-fold content" |
| **Accessibility** | ARIA roles, keyboard navigation, focus management, screen reader announcements | "The component uses semantic HTML, supports full keyboard nav, and announces state changes via aria-live" |
| **Error handling** | Error boundaries, retry logic, fallback UI, graceful degradation | "Each widget has its own error boundary — one failing doesn't crash others" |
| **Loading states** | Skeleton loaders (not spinners), progressive loading, optimistic UI | "Skeleton screens for initial load, inline spinners for user-initiated actions" |
| **i18n** | Externalized strings, RTL support, locale-aware formatting | "All strings from translation files, logical CSS properties for RTL" |
| **Security** | Input sanitization (DOMPurify), XSS prevention, CSRF on mutations | "User-generated content sanitized via DOMPurify before rendering" |
| **Testing** | Unit tests for logic, component tests for behaviour, visual regression | "Testing Library for user-centric assertions, Chromatic for visual diffs" |
| **Responsive** | Breakpoints, touch targets, mobile-first | "Mobile-first CSS, 44px minimum touch targets" |

---

### Step 7: Trade-offs & Alternatives

**Always end with:**

> "The trade-off with this approach is [X]. An alternative would be [Y], which is better when [Z condition]. I chose this approach because [our specific constraint]."

**Examples:**

| Decision | Trade-off | Alternative |
|---|---|---|
| Client-side filtering | Fast for small datasets, but won't scale to 100K rows | Server-side filtering with debounced search |
| WebSocket for real-time | Persistent connection, infrastructure cost | SSE (simpler, auto-reconnect) or polling (simplest) |
| Optimistic UI | Feels instant, but complex rollback logic | Pessimistic (wait for server) — simpler but slower UX |
| Virtual scrolling | Smooth performance, but breaks Cmd+F browser search | Pagination (simpler, search works) |
| CSS-in-JS | Co-located styles, dynamic theming | CSS Modules (zero runtime, but no dynamic theming) |

---

### Quick Template (Use for ANY "Design X" Question)

```
1. "Let me clarify requirements..." (ask 3-4 questions)
2. "The scope I'll focus on is..." (in/out boundary)
3. "Here's the high-level architecture..." (draw the 3-layer diagram)
4. "The component breakdown is..." (smart/dumb split)
5. "For data, I'd use..." (fetching + caching + state strategy)
6. "Cross-cutting concerns I'd address..." (perf, a11y, errors, loading)
7. "The main trade-off is... an alternative would be..." (show maturity)
```

---

## ♿ Tab 11: Accessibility Best Practices (Comprehensive Reference)

> IBM takes accessibility seriously — their products must meet WCAG 2.1 AA minimum. Prathap may test your a11y knowledge at the architecture level.

---

### The 4 WCAG Principles (POUR)

| Principle | Meaning | Key Requirements |
|---|---|---|
| **P**erceivable | Users can perceive the content | Text alternatives for images, captions for video, sufficient contrast |
| **O**perable | Users can interact with the UI | Keyboard accessible, no time limits, no seizure triggers |
| **U**nderstandable | Users can understand the content | Readable text, predictable navigation, error prevention |
| **R**obust | Works with assistive technologies | Valid HTML, proper ARIA, compatible with screen readers |

---

### Top 10 Accessibility Rules Every Architect Must Enforce

#### 1. Semantic HTML First — ARIA Last

```html
<!-- ❌ BAD — div with ARIA imitating a button -->
<div role="button" tabindex="0" onclick="submit()">Submit</div>

<!-- ✅ GOOD — just use a button -->
<button type="submit">Submit</button>
```

**Rule:** If a native HTML element does the job, use it. ARIA supplements HTML — it doesn't replace it. First rule of ARIA: don't use ARIA.

#### 2. All Interactive Elements Must Be Keyboard Accessible

```
Every clickable element must respond to:
- Enter key (activates links and buttons)
- Space key (activates buttons, toggles checkboxes)
- Arrow keys (navigates within widgets: tabs, menus, radio groups)
- Escape (closes modals, dropdowns, tooltips)
- Tab (moves between focusable elements)
```

**In Fero:** `TrqAriaEventManager` automatically adds keyboard handlers to every click event in the entire application. Zero developer effort needed.

#### 3. Focus Management — Modals, Dialogs, Route Changes

```typescript
// When a modal opens:
// 1. Move focus INTO the modal (first focusable element)
// 2. Trap focus inside (Tab cycles within modal, not behind it)
// 3. On close: return focus to the trigger element

// Fero CDK: TabTrap directive handles this
<div trqTabTrap>
  <h2>Modal Title</h2>
  <input autofocus />  <!-- focus moves here on open -->
  <button (click)="close()">Close</button>
</div>

// On route change: move focus to the main content heading
// Prevents screen reader users from being lost after navigation
router.events.subscribe(event => {
  if (event instanceof NavigationEnd) {
    document.querySelector('h1')?.focus();
  }
});
```

#### 4. Color Contrast — WCAG AA Minimums

| Text Type | Minimum Ratio | Example |
|---|---|---|
| Normal text (< 18px) | 4.5:1 | Dark grey (#555) on white (#FFF) = 7.5:1 ✅ |
| Large text (≥ 18px or 14px bold) | 3:1 | — |
| UI components (borders, icons) | 3:1 | — |
| Non-text (decorative) | No requirement | — |

**In Fero:** Design tokens enforce contrast. A token like `darkText (#383838)` on `white (#FFFFFF)` = 11.4:1 ratio. Tokens that fail contrast cannot exist in the system.

#### 5. Form Labels and Error Messages

```html
<!-- Every input MUST have a visible label -->
<label for="email">Email Address</label>
<input id="email" type="email" aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert">Please enter a valid email</span>
```

**Key patterns:**
- `<label for="id">` associates label with input (clickable label, screen reader announces it)
- `aria-describedby` links error messages to the input
- `aria-invalid="true"` tells screen readers the field has an error
- `role="alert"` makes error announcements immediate (assertive)

#### 6. Images and Icons — Text Alternatives

```html
<!-- Informative image — needs alt text -->
<img src="chart.png" alt="Revenue chart showing 15% growth in Q2 2025" />

<!-- Decorative image — hide from screen readers -->
<img src="divider.svg" alt="" role="presentation" />

<!-- Icon button — needs accessible name -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>  <!-- hide SVG from screen reader -->
</button>

<!-- Icon with text — icon is decorative -->
<button>
  <svg aria-hidden="true">...</svg>
  <span>Download</span>  <!-- text provides the accessible name -->
</button>
```

#### 7. Live Regions — Dynamic Content Announcements

```html
<!-- For content that updates without page reload -->
<!-- polite: waits for screen reader to finish current announcement -->
<div aria-live="polite" aria-atomic="true">
  3 search results found
</div>

<!-- assertive: interrupts immediately (use sparingly — errors only) -->
<div aria-live="assertive" role="alert">
  Error: Payment failed. Please try again.
</div>
```

**In Flare:** `LiveAnnouncerProvider` manages a queue — assertive announcements jump to front, polite ones queue up. Duplicate texts get a non-breaking space appended to force re-announcement.

#### 8. Skip Navigation Link

```html
<!-- First focusable element on the page — hidden until focused -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<nav>... long navigation ...</nav>

<main id="main-content" tabindex="-1">
  <!-- Main content starts here -->
</main>
```

**Why:** Keyboard users and screen reader users shouldn't have to Tab through 50 navigation links on every page load.

#### 9. Tables — Proper Markup for Data

```html
<!-- Data table (not layout table) -->
<table>
  <caption>Employee Salary Report — Q2 2025</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Department</th>
      <th scope="col">Salary</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Smith</td>
      <td>Engineering</td>
      <td>£85,000</td>
    </tr>
  </tbody>
</table>
```

**Key:**
- `<caption>` gives the table an accessible name
- `scope="col"` tells screen readers which header applies to which cells
- Screen readers announce: "Name column, row 1, John Smith"

#### 10. Touch Targets — Minimum 44×44px

```css
/* WCAG 2.5.5 — Target Size */
button, a, [role="button"] {
  min-width: 44px;
  min-height: 44px;
  /* Or use padding to achieve the size even with small text */
}
```

**In Flare:** `ThemeProvider` has `enableTouchTarget` prop that adds `.flr-touch-target` class to body — increases all interactive elements to 44px minimum. In Fero: similar pattern via SCSS utility class.

---

### ARIA Roles Cheat Sheet (Most Common in Enterprise UIs)

| Widget | Role | Required ARIA | Keyboard |
|---|---|---|---|
| Modal/Dialog | `role="dialog"` | `aria-modal="true"`, `aria-labelledby` | Escape to close, focus trapped |
| Dropdown menu | `role="menu"` | `aria-expanded`, `aria-haspopup` | Arrow keys navigate, Escape closes |
| Tab panel | `role="tablist"` / `role="tab"` / `role="tabpanel"` | `aria-selected`, `aria-controls` | Arrow keys switch tabs |
| Autocomplete | `role="combobox"` | `aria-expanded`, `aria-activedescendant` | Arrow keys navigate results |
| Alert/Toast | `role="alert"` | (implicit `aria-live="assertive"`) | No keyboard — announced immediately |
| Breadcrumb | `role="navigation"` + `aria-label="Breadcrumb"` | `aria-current="page"` on current | Standard link navigation |
| Progress bar | `role="progressbar"` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | — |
| Toggle | `role="switch"` | `aria-checked` | Space to toggle |

---

### Testing Accessibility — The Full Stack

| Layer | Tool | What It Catches | Coverage |
|---|---|---|---|
| **IDE** | axe Accessibility Linter (VS Code) | Missing alt, invalid ARIA | ~15% |
| **Lint** | eslint-plugin-jsx-a11y / @angular-eslint/template | Code-level a11y violations | ~20% |
| **Unit test** | jest-axe (`expect(container).toHaveNoViolations()`) | Rendered component violations | ~30% |
| **Storybook** | @storybook/addon-a11y (axe-core) | Visual + interactive violations | ~35% |
| **E2E** | Playwright + axe-core (`@axe-core/playwright`) | Full-page audits on real routes | ~40% |
| **Manual** | Screen reader (NVDA, VoiceOver, JAWS) | Logic, flow, context, usability | ~90% |
| **Expert audit** | External a11y consultant | Cognitive load, complex patterns | ~95% |

**Key insight:** Automated tools catch **30-40% max**. The rest requires human testing. Budget for it.

---

### Accessibility Architecture Decisions

| Decision | Approach | Rationale |
|---|---|---|
| Focus management strategy | CDK service (FocusKeyManager, TabTrap) | Centralized, reusable, not per-component |
| Screen reader announcements | Global LiveAnnouncer provider | Queue-based, consistent across app |
| Keyboard navigation | Auto-add via AriaEventManager (Fero) | Zero developer effort for basic keyboard support |
| Color contrast | Enforce at token level | Impossible to use non-compliant colors |
| Touch targets | Theme-level toggle (enableTouchTarget) | One switch enables for entire app |
| RTL support | CSS logical properties + direction provider | Automatic mirroring without component changes |
| Error announcements | `role="alert"` + `aria-live="assertive"` | Immediate announcement on validation failure |
| Form validation | Linked via `aria-describedby` + `aria-invalid` | Screen readers announce errors in context |

---

### Interview One-Liner for Accessibility

> "Accessibility is an architecture concern, not a feature. I embed it at four levels: tokens that can't fail contrast, components that handle focus/keyboard by default, CI gates that fail on axe-core violations, and quarterly manual audits with screen readers for the 60% that automation misses. The goal: make it cheaper to do right than to do wrong — accessible-by-default components mean feature teams get WCAG compliance for free."

---

*Good luck tomorrow. Prathap is a seasoned architect — he'll respect depth over breadth. Pick 2-3 areas where you can go deepest (MFE, design systems, security) and steer the conversation there. If he asks something you don't know, say "I haven't implemented that, but here's how I'd evaluate it" — architects who admit gaps are more credible than those who bluff.*
