# Proposed Skills — Gap Analysis & Recommendations

> Generated: April 23, 2026
> Current catalog: 58 skills in `packages/skills/catalog/`

---

## Source Repository Trust Verification

Every skill below comes from a verified, trusted source. Here is the trust assessment for each upstream repository:

| Repository | Owner | Stars | Forks | License | Trust Level | Notes |
|------------|-------|-------|-------|---------|-------------|-------|
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Addy Osmani (Google Chrome team lead) | ~19k | ~2.4k | MIT | ✅ High | Well-known industry figure. Already syncing 7 skills from this repo. |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Vercel (official org) | ~19.6k | ~1.8k | MIT | ✅ High | Official Vercel repo. Already syncing `react-best-practices`. |
| [obra/superpowers](https://github.com/obra/superpowers) | Jesse Vincent | ~105k+ | ~13k | MIT | ✅ High | Most-starred skills repo in the ecosystem. Already syncing 4 skills. |
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic (official org) | ~117k | ~13.5k | Apache 2.0 | ✅ High | Official Anthropic repo. Already syncing `frontend-design` and `skill-creator`. |
| [yonatangross/orchestkit](https://github.com/yonatangross/orchestkit) | Yonatan Gross | ~1k+ | — | MIT | ⚠️ Medium | Active community project (105 skills, 37 agents). Already syncing `design-system-tokens`. Listed on skills.sh and LobeHub. |
| [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | Julien Thibeaut (ibelick) | ~1k+ | ~49 | MIT | ⚠️ Medium | Focused UI skills collection. Listed on skills.sh. Smaller community but specialized. |
| [microsoft/skills](https://github.com/microsoft/skills) | Microsoft (official org) | ~100+ | ~9 | MIT | ✅ High | Official Microsoft repo. 132 skills for Azure SDKs. Newer repo, growing. |
| *Internal (write new)* | flare-team | — | — | — | ✅ Internal | Skills authored in-house for gaps no upstream covers. |

---

## Tier 1 — Sync from Repos Already in Use (Low Effort, High Value)

These come from repos you already pull skills from. Use `sync-upstream-skill` via Sourcegraph MCP.

### 1. frontend-ui-engineering

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering) |
| **Origin** | `agent-skills` |
| **What it does** | Component architecture, design systems, state management, responsive design, WCAG 2.1 AA accessibility |
| **Why missing matters** | You have `frontend-design` (aesthetics from Anthropic) but NOT the engineering patterns skill. This covers component structure, state management, and accessibility — the build-side of frontend work. |
| **Lifecycle** | `implementation` |
| **Tags** | `react`, `frontend`, `components`, `state-management`, `responsive`, `a11y` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 2. spec-driven-development

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development) |
| **Origin** | `agent-skills` |
| **What it does** | Write a PRD covering objectives, commands, structure, code style, testing, and boundaries before any code |
| **Why missing matters** | You have `brainstorming` (idea exploration) but not the structured spec/PRD workflow that comes after brainstorming and before planning. |
| **Lifecycle** | `design` |
| **Tags** | `spec`, `prd`, `requirements`, `design`, `planning` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 3. idea-refine

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/idea-refine) |
| **Origin** | `agent-skills` |
| **What it does** | Structured divergent/convergent thinking to turn vague ideas into concrete proposals |
| **Why missing matters** | Complements `brainstorming`. Brainstorming explores intent; idea-refine structures the output into actionable proposals. |
| **Lifecycle** | `ideation` |
| **Tags** | `ideation`, `divergent-thinking`, `proposals`, `exploration` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 4. context-engineering

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/context-engineering) |
| **Origin** | `agent-skills` |
| **What it does** | Feed agents the right information at the right time — rules files, context packing, MCP integrations |
| **Why missing matters** | Meta-skill for agent effectiveness. Especially relevant for your MCP-heavy setup. No equivalent in your catalog. |
| **Lifecycle** | `implementation` |
| **Tags** | `context`, `mcp`, `rules`, `agent-effectiveness`, `meta` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 5. source-driven-development

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development) |
| **Origin** | `agent-skills` |
| **What it does** | Ground every framework decision in official documentation — verify, cite sources, flag what's unverified |
| **Why missing matters** | Prevents hallucinated API usage. Complements `context7` (which fetches docs) by enforcing the discipline of citing them. |
| **Lifecycle** | `implementation` |
| **Tags** | `documentation`, `verification`, `sources`, `frameworks`, `accuracy` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 6. git-workflow-and-versioning

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/git-workflow-and-versioning) |
| **Origin** | `agent-skills` |
| **What it does** | Trunk-based development, atomic commits, change sizing (~100 lines), commit-as-save-point pattern |
| **Why missing matters** | You have `write-commit-message` (message formatting) but nothing for the broader git workflow discipline — branching strategy, change sizing, when to commit. |
| **Lifecycle** | `implementation` |
| **Tags** | `git`, `branching`, `trunk-based`, `versioning`, `commits` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 7. ci-cd-and-automation

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation) |
| **Origin** | `agent-skills` |
| **What it does** | Shift Left, feature flags, quality gate pipelines, failure feedback loops |
| **Why missing matters** | Zero CI/CD skills in your catalog. This is a significant gap for any team shipping software. |
| **Lifecycle** | `deployment` |
| **Tags** | `ci-cd`, `pipelines`, `feature-flags`, `automation`, `deployment` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 8. documentation-and-adrs

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs) |
| **Origin** | `agent-skills` |
| **What it does** | Architecture Decision Records, API docs, inline documentation standards — document the why |
| **Why missing matters** | You have `document-code` (inline docs) and `generate-readme` (project docs) but nothing for ADRs — documenting architectural decisions and their rationale. |
| **Lifecycle** | `documentation` |
| **Tags** | `adr`, `architecture`, `decisions`, `documentation`, `api-docs` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 9. shipping-and-launch

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch) |
| **Origin** | `agent-skills` |
| **What it does** | Pre-launch checklists, feature flag lifecycle, staged rollouts, rollback procedures, monitoring setup |
| **Why missing matters** | No launch/ship skill at all. Complements `ci-cd-and-automation` with the human-side of shipping. |
| **Lifecycle** | `deployment` |
| **Tags** | `launch`, `rollout`, `monitoring`, `rollback`, `checklists` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

### 10. finishing-a-development-branch

| Field | Value |
|-------|-------|
| **Source** | [obra/superpowers](https://github.com/obra/superpowers/tree/main/skills/finishing-a-development-branch) |
| **Origin** | `superpowers` |
| **What it does** | Verify tests → present options (merge/PR/keep/discard) → execute choice → clean up worktree |
| **Why missing matters** | No branch completion workflow. You have `write-commit-message` and `write-pr-description` but nothing that ties the end-of-branch workflow together. |
| **Lifecycle** | `implementation` |
| **Tags** | `git`, `branch`, `merge`, `pr`, `cleanup`, `workflow` |
| **Trust** | ✅ Jesse Vincent — MIT — ~105k+ stars |

---

## Tier 2 — New Skills from Existing Upstream Repos (Medium Effort)

These come from repos you already sync from but are skills you haven't pulled yet.

### 11. web-design-guidelines

| Field | Value |
|-------|-------|
| **Source** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) |
| **Origin** | `vercel` |
| **What it does** | 100+ rules auditing accessibility, focus states, forms, animation, typography, images, performance, dark mode, i18n |
| **Why missing matters** | Your `frontend-design` is about *creating* beautiful UI. This is about *auditing* existing UI against best practices. Different purpose, complementary skill. |
| **Lifecycle** | `review` |
| **Tags** | `audit`, `ui`, `accessibility`, `forms`, `animation`, `typography`, `dark-mode`, `i18n` |
| **Trust** | ✅ Vercel (official) — MIT — ~19.6k stars |

### 12. composition-patterns

| Field | Value |
|-------|-------|
| **Source** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns) |
| **Origin** | `vercel` |
| **What it does** | React compound components, state lifting, avoiding boolean prop proliferation, composing internals for flexibility |
| **Why missing matters** | Fills the gap between `write-react-typescript` (type patterns) and `react-best-practices` (performance). This is about component API design. |
| **Lifecycle** | `implementation` |
| **Tags** | `react`, `composition`, `compound-components`, `component-api`, `patterns` |
| **Trust** | ✅ Vercel (official) — MIT — ~19.6k stars |

### 13. react-view-transitions

| Field | Value |
|-------|-------|
| **Source** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions) |
| **Origin** | `vercel` |
| **What it does** | View Transition API, `<ViewTransition>` component, `addTransitionType`, Next.js integration, CSS animation recipes, accessibility (prefers-reduced-motion) |
| **Why missing matters** | Modern React animation patterns. View Transitions are the new standard for page transitions and shared element animations. No animation-specific skill in your catalog. |
| **Lifecycle** | `implementation` |
| **Tags** | `react`, `animation`, `view-transitions`, `nextjs`, `css`, `motion` |
| **Trust** | ✅ Vercel (official) — MIT — ~19.6k stars |

### 14. browser-testing-with-devtools

| Field | Value |
|-------|-------|
| **Source** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools) |
| **Origin** | `agent-skills` |
| **What it does** | Chrome DevTools MCP for live runtime data — DOM inspection, console logs, network traces, performance profiling |
| **Why missing matters** | Your `test-in-browser` is Playwright-focused (automation). This is DevTools-focused (debugging and profiling). Different use case. |
| **Lifecycle** | `testing` |
| **Tags** | `devtools`, `chrome`, `debugging`, `profiling`, `network`, `dom` |
| **Trust** | ✅ Addy Osmani / Google — MIT — ~19k stars |

---

## Tier 3 — Skills from Additional Trusted Repos (New Upstream)

These require adding new upstream origins to your sync configuration.

### 15. storybook-testing

| Field | Value |
|-------|-------|
| **Source** | [yonatangross/orchestkit](https://github.com/yonatangross/orchestkit) (path: `src/skills/storybook-testing`) |
| **Origin** | `orchestkit` |
| **What it does** | Storybook 9/10 testing patterns — interaction testing with play functions, visual regression, accessibility validation, Vitest integration, CI pipelines |
| **Why missing matters** | Zero Storybook skills in your catalog. Storybook is widely used for component development and testing. |
| **Lifecycle** | `testing` |
| **Tags** | `storybook`, `testing`, `visual-regression`, `interaction-testing`, `components` |
| **Trust** | ⚠️ Medium — Community project, ~1k stars, MIT. Already syncing `design-system-tokens` from this repo. Listed on skills.sh and LobeHub marketplace. |

### 16. responsive-patterns

| Field | Value |
|-------|-------|
| **Source** | [yonatangross/orchestkit](https://github.com/yonatangross/orchestkit) (path: `src/skills/responsive-patterns`) |
| **Origin** | `orchestkit` |
| **What it does** | Container Queries, cqi/cqb units, fluid typography with clamp(), CSS Grid layouts, mobile-first breakpoint strategies |
| **Why missing matters** | Your `frontend-design` touches responsive design at a high level. This goes deep on modern CSS responsive techniques (Container Queries, fluid type). |
| **Lifecycle** | `implementation` |
| **Tags** | `css`, `responsive`, `container-queries`, `fluid-typography`, `grid`, `mobile-first` |
| **Trust** | ⚠️ Medium — Same repo as above. Review content before syncing. |

### 17. frontend-design-review (Microsoft)

| Field | Value |
|-------|-------|
| **Source** | [microsoft/skills](https://github.com/microsoft/skills) (path: `.github/skills/frontend-design-review`) |
| **Origin** | `microsoft` |
| **What it does** | Review and create distinctive frontend interfaces. Design system compliance, quality pillars, accessibility, and creative aesthetics. |
| **Why missing matters** | A review-oriented frontend skill from Microsoft's perspective. Complements your Anthropic-sourced `frontend-design` with a different lens. |
| **Lifecycle** | `review` |
| **Tags** | `frontend`, `review`, `design-system`, `accessibility`, `quality` |
| **Trust** | ✅ Microsoft (official) — MIT — Growing repo (132 skills). |

---

## Tier 4 — Write Internally (No Upstream Available)

These fill gaps that no trusted upstream repo covers. Would need to be authored by flare-team.

### 18. frontend-testing

| Field | Value |
|-------|-------|
| **Source** | Internal (write new) |
| **Origin** | `flare` |
| **What it does** | React Testing Library patterns, component unit testing, mock strategies, snapshot testing, test organization |
| **Why missing matters** | You have `test-driven-development` (general TDD) and `test-in-browser` (e2e), but nothing for React component unit/integration testing specifically. |
| **Lifecycle** | `testing` |
| **Tags** | `react`, `testing-library`, `unit-testing`, `integration-testing`, `mocking`, `components` |
| **Trust** | ✅ Internal |

### 19. css-architecture

| Field | Value |
|-------|-------|
| **Source** | Internal (write new) |
| **Origin** | `flare` |
| **What it does** | CSS methodology guidance — BEM, CSS Modules, CSS-in-JS patterns, Tailwind conventions, specificity management, naming conventions |
| **Why missing matters** | Your `frontend-design` covers visual design. No skill addresses CSS engineering — how to organize, name, and structure stylesheets at scale. |
| **Lifecycle** | `implementation` |
| **Tags** | `css`, `architecture`, `bem`, `css-modules`, `tailwind`, `specificity`, `naming` |
| **Trust** | ✅ Internal |

### 20. state-management

| Field | Value |
|-------|-------|
| **Source** | Internal (write new) |
| **Origin** | `flare` |
| **What it does** | Choosing and implementing state management — Redux Toolkit, Zustand, Jotai, React Context, server state (TanStack Query), when to use what |
| **Why missing matters** | No state management skill at all. This is a core frontend architecture decision that agents should have guidance on. |
| **Lifecycle** | `implementation` |
| **Tags** | `react`, `state-management`, `redux`, `zustand`, `jotai`, `tanstack-query`, `context` |
| **Trust** | ✅ Internal |

### 21. monorepo-patterns

| Field | Value |
|-------|-------|
| **Source** | Internal (write new) |
| **Origin** | `flare` |
| **What it does** | Nx monorepo conventions, dependency management, affected commands, project boundaries, publishable vs buildable libraries |
| **Why missing matters** | This repo IS an Nx monorepo but has no skill for monorepo conventions. Useful for anyone working in similar setups. |
| **Lifecycle** | `implementation` |
| **Tags** | `nx`, `monorepo`, `dependencies`, `project-boundaries`, `affected` |
| **Trust** | ✅ Internal |

### 22. i18n-and-l10n

| Field | Value |
|-------|-------|
| **Source** | Internal (write new) |
| **Origin** | `flare` |
| **What it does** | Internationalization patterns — react-intl/react-i18next setup, message extraction, pluralization, RTL support, date/number formatting |
| **Why missing matters** | No i18n skill. The Vercel `web-design-guidelines` touches i18n in its audit rules, but there's no skill for implementing it. |
| **Lifecycle** | `implementation` |
| **Tags** | `i18n`, `l10n`, `internationalization`, `react-intl`, `rtl`, `localization` |
| **Trust** | ✅ Internal |

---

## Summary

| Tier | Count | Effort | Source |
|------|-------|--------|--------|
| **Tier 1** — Sync from existing upstreams | 10 | Low (Sourcegraph sync) | addyosmani (8), obra (1), anthropic (1) |
| **Tier 2** — New skills from existing upstreams | 4 | Medium (sync + review) | vercel-labs (3), addyosmani (1) |
| **Tier 3** — New upstream repos | 3 | Medium (add origin + sync) | orchestkit (2), microsoft (1) |
| **Tier 4** — Write internally | 5 | High (author from scratch) | flare-team |
| **Total** | **22** | | |

### Recommended Priority Order

1. **frontend-ui-engineering** — biggest single frontend gap
2. **web-design-guidelines** — UI audit checklist (100+ rules)
3. **ci-cd-and-automation** — zero CI/CD coverage currently
4. **composition-patterns** — React component API design
5. **git-workflow-and-versioning** — broader git discipline
6. **spec-driven-development** — structured PRD workflow
7. **storybook-testing** — component development/testing
8. **documentation-and-adrs** — architectural decision records
9. **browser-testing-with-devtools** — DevTools debugging
10. **frontend-testing** (internal) — React Testing Library patterns

---

*All source links verified as of April 23, 2026. Star counts are approximate and may have changed since verification.*
