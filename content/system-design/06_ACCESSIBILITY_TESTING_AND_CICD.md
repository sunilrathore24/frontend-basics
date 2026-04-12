# Accessibility, Testing & CI/CD Pipeline Architecture

## Principal/Architect-Level Frontend System Design — Questions 14, 15 & 17

> This document covers three advanced system design questions that test a frontend architect's
> ability to design accessibility compliance pipelines, comprehensive testing strategies for
> large Angular monorepos, and production-grade CI/CD pipelines with monorepo architecture.
> Each question includes real Angular/TypeScript code, CI/CD configuration, architecture diagrams,
> and practical trade-offs for enterprise-scale platforms.

---

## Table of Contents

1. [Q14: Accessibility Compliance Pipeline for 3,000+ Enterprise Clients](#q14-accessibility-compliance-pipeline-for-3000-enterprise-clients)
   - [Architecture Overview — Four-Layer A11y Testing Pyramid](#architecture-overview--four-layer-a11y-testing-pyramid)
   - [Layer 1: Development-Time Enforcement](#layer-1-development-time-enforcement)
   - [Layer 2: Automated Testing with axe-core](#layer-2-automated-testing-with-axe-core)
   - [Layer 3: Storybook Accessibility Addon](#layer-3-storybook-accessibility-addon)
   - [Layer 4: CI/CD Gate on A11y Failures](#layer-4-cicd-gate-on-a11y-failures)
   - [Angular CDK A11y Utilities](#angular-cdk-a11y-utilities)
   - [ARIA Patterns for Common Components](#aria-patterns-for-common-components)
   - [Screen Reader Testing Methodology](#screen-reader-testing-methodology)
   - [Architect's Verdict](#architects-verdict-q14)
2. [Q15: Testing Strategy for a Large Angular Monorepo](#q15-testing-strategy-for-a-large-angular-monorepo)
   - [Test Pyramid with Specific Numbers](#test-pyramid-with-specific-numbers)
   - [Unit Testing with Jest + TestBed](#unit-testing-with-jest--testbed)
   - [Component Testing with Angular Testing Library](#component-testing-with-angular-testing-library)
   - [E2E Testing with Playwright for Critical Paths](#e2e-testing-with-playwright-for-critical-paths)
   - [API Mocking with MSW (Mock Service Worker)](#api-mocking-with-msw-mock-service-worker)
   - [Contract Testing for MFE Boundaries](#contract-testing-for-mfe-boundaries)
   - [Parallel Test Execution with Nx Affected](#parallel-test-execution-with-nx-affected)
   - [Coverage Thresholds in CI](#coverage-thresholds-in-ci)
   - [Visual Regression Testing](#visual-regression-testing)
   - [Test Execution Time Optimization](#test-execution-time-optimization)
   - [Architect's Verdict](#architects-verdict-q15)
3. [Q17: Monorepo Architecture & CI/CD Pipeline for 8 Teams + 5 MFEs](#q17-monorepo-architecture--cicd-pipeline-for-8-teams--5-mfes)
   - [Nx Workspace Structure](#nx-workspace-structure)
   - [Affected Builds with nx affected](#affected-builds-with-nx-affected)
   - [Caching Strategy — Local + Remote Nx Cloud](#caching-strategy--local--remote-nx-cloud)
   - [Independent Deployment Pipelines per MFE](#independent-deployment-pipelines-per-mfe)
   - [Semantic Release with Conventional Commits](#semantic-release-with-conventional-commits)
   - [Environment Promotion Strategy](#environment-promotion-strategy)
   - [Storybook Deployment per PR](#storybook-deployment-per-pr)
   - [Bundle Size Tracking in CI](#bundle-size-tracking-in-ci)
   - [Full Pipeline Diagram — PR to Production](#full-pipeline-diagram--pr-to-production)
   - [Architect's Verdict](#architects-verdict-q17)
4. [Q16: Integrating Agentic AI Development Workflow into an Angular Engineering Team](#q16-integrating-agentic-ai-development-workflow-into-an-angular-engineering-team)
   - [AI Tooling Stack for Angular Development](#ai-tooling-stack-for-angular-development)
   - [MCP Server Architecture for Angular Monorepos](#mcp-server-architecture-for-angular-monorepos)
   - [Guardrails and Quality Gates](#guardrails-and-quality-gates)
   - [Adoption Strategy — 90-Day Rollout Plan](#adoption-strategy--90-day-rollout-plan)
   - [Productivity Measurement Framework](#productivity-measurement-framework)
   - [Real-World Example — Full Integration](#real-world-example--full-integration)
   - [Architect's Verdict](#architects-verdict-q16)

---

## Q14: Accessibility Compliance Pipeline for 3,000+ Enterprise Clients

### Problem Statement

> You are the frontend architect for a SaaS platform serving 3,000+ enterprise clients across
> healthcare, finance, and government sectors. Many clients have contractual obligations for
> WCAG 2.1 AA compliance. Design a comprehensive accessibility pipeline that enforces standards
> at development time, CI/CD, and runtime.

### Architecture Overview — Four-Layer A11y Testing Pyramid

The accessibility compliance pipeline operates across four enforcement layers, each catching
different categories of violations at increasing cost and decreasing speed:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FOUR-LAYER A11Y TESTING PYRAMID                          │
│                                                                             │
│                           ▲                                                 │
│                          ╱ ╲         Layer 4: Manual / Screen Reader        │
│                         ╱   ╲        • NVDA, JAWS, VoiceOver testing       │
│                        ╱  4  ╲       • Quarterly expert audits              │
│                       ╱       ╲      • ~5% of violations caught             │
│                      ╱─────────╲     • Highest cost, highest fidelity       │
│                     ╱           ╲                                            │
│                    ╱     3       ╲    Layer 3: E2E / Integration Tests      │
│                   ╱               ╲   • axe-core in Cypress/Playwright      │
│                  ╱                 ╲  • Keyboard navigation flows           │
│                 ╱───────────────────╲ • ~25% of violations caught           │
│                ╱                     ╲                                       │
│               ╱         2            ╲ Layer 2: Component-Level Tests       │
│              ╱                        ╲• Storybook a11y addon               │
│             ╱                          ╲• Unit tests for ARIA states        │
│            ╱────────────────────────────╲ ~30% of violations caught         │
│           ╱                              ╲                                   │
│          ╱              1                 ╲ Layer 1: Static Analysis        │
│         ╱                                  ╲• ESLint a11y rules             │
│        ╱                                    ╲• IDE plugins                  │
│       ╱──────────────────────────────────────╲ ~40% of violations caught   │
│      ╱                                        ╲                             │
│     ╱            FASTEST / CHEAPEST            ╲                            │
│    ╱────────────────────────────────────────────╲                           │
│                                                                             │
│   Cost:    $        $$          $$$         $$$$                             │
│   Speed:   <1s      ~30s        ~5min       ~2hrs                           │
│   Scope:   Syntax   Rendered    Full flow   Cognitive                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key insight**: No single layer catches everything. Static analysis catches ~40% of WCAG
violations (missing alt text, missing labels, invalid ARIA). E2E catches dynamic issues
(focus management, live regions). Manual testing catches cognitive and contextual issues
(reading order, meaningful labels). The pyramid ensures maximum coverage at minimum cost.

---

### Layer 1: Development-Time Enforcement

#### ESLint Angular Template Accessibility Configuration

The first line of defense is static analysis. We configure `@angular-eslint/template` with
strict a11y rules that catch violations before code leaves the developer's machine.

```json
// .eslintrc.json — Angular workspace root
{
  "root": true,
  "overrides": [
    {
      "files": ["*.ts"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended"
      ],
      "rules": {
        "@angular-eslint/component-selector": [
          "error",
          { "type": "element", "prefix": "app", "style": "kebab-case" }
        ]
      }
    },
    {
      "files": ["*.html"],
      "extends": [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility"
      ],
      "rules": {
        // ── Critical: Images ──
        "@angular-eslint/template/alt-text": "error",

        // ── Critical: Interactive Elements ──
        "@angular-eslint/template/click-events-have-key-events": "error",
        "@angular-eslint/template/mouse-events-have-key-events": "error",
        "@angular-eslint/template/interactive-supports-focus": "error",
        "@angular-eslint/template/no-autofocus": "error",

        // ── Critical: Form Labels ──
        "@angular-eslint/template/label-has-associated-control": "error",

        // ── Critical: ARIA ──
        "@angular-eslint/template/role-has-required-aria": "error",
        "@angular-eslint/template/valid-aria": "error",
        "@angular-eslint/template/no-positive-tabindex": "error",

        // ── Critical: Content Structure ──
        "@angular-eslint/template/elements-content": "error",
        "@angular-eslint/template/table-scope": "error",
        "@angular-eslint/template/no-distracting-elements": "error"
      }
    }
  ]
}
```

**Why this configuration matters at scale**: With 3,000+ enterprise clients, even a single
a11y regression can trigger contractual violations. The `"error"` severity ensures no PR
merges with known violations. The `template/accessibility` preset covers ~15 rules, and we
explicitly list critical ones to prevent accidental override by team-level configs.

#### IDE Integration — Pre-Commit Hooks

```json
// .husky/pre-commit (via lint-staged)
// package.json
{
  "lint-staged": {
    "*.html": ["eslint --fix --no-error-on-unmatched-pattern"],
    "*.ts": ["eslint --fix"]
  }
}
```

This catches violations at the earliest possible moment — before the commit even reaches
the remote repository.

---

### Angular CDK A11y Utilities

Angular CDK provides battle-tested a11y primitives that handle the hardest accessibility
patterns. These three utilities are critical for enterprise applications:

#### FocusTrap — Modal and Dialog Management

```typescript
// confirm-dialog.component.ts
import { Component } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CdkTrapFocus],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div
        class="dialog-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <h2 id="dialog-title">Confirm Action</h2>
        <p id="dialog-desc">Are you sure you want to delete this record?
          This action cannot be undone.</p>
        <div class="dialog-actions">
          <!-- cdkFocusInitial: Cancel is the safe default focus target -->
          <button (click)="onCancel()" cdkFocusInitial>Cancel</button>
          <button (click)="onConfirm()" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  // cdkTrapFocus: Tab key cycles within the dialog only
  // cdkTrapFocusAutoCapture: Restores focus to the trigger element on destroy
  // cdkFocusInitial: Sets initial focus to Cancel (safe default)

  onCancel(): void { /* close dialog, restore focus */ }
  onConfirm(): void { /* perform action, close dialog */ }

  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not the dialog content
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}
```

**Why FocusTrap matters**: Without it, keyboard users can Tab behind the modal into
invisible content. Screen readers may read background content. This is a WCAG 2.4.3
(Focus Order) violation that affects every modal, drawer, and popover in the platform.

#### LiveAnnouncer — Dynamic Content Updates for Screen Readers

```typescript
// data-table.component.ts
import { Component, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-data-table',
  template: `
    <!-- Hidden live region for screen reader announcements -->
    <div aria-live="polite" class="sr-only" id="table-status"></div>

    <table role="grid" aria-describedby="table-status" aria-label="User accounts">
      <thead>
        <tr>
          <th scope="col" (click)="onSort('name')"
              [attr.aria-sort]="getSortDirection('name')">
            Name
          </th>
          <th scope="col" (click)="onSort('email')"
              [attr.aria-sort]="getSortDirection('email')">
            Email
          </th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (user of users; track user.id) {
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button [attr.aria-label]="'Edit ' + user.name">Edit</button>
            </td>
          </tr>
        }
      </tbody>
    </table>

    <app-pagination
      [currentPage]="currentPage"
      [totalPages]="totalPages"
      (pageChange)="onPageChange($event)" />
  `
})
export class DataTableComponent {
  private liveAnnouncer = inject(LiveAnnouncer);

  users: User[] = [];
  currentPage = 1;
  totalPages = 10;
  totalItems = 0;
  private sortColumn = '';
  private sortDirection: 'ascending' | 'descending' | 'none' = 'none';

  async onPageChange(page: number): Promise<void> {
    // Announce loading state immediately
    await this.liveAnnouncer.announce(
      `Loading page ${page}. Please wait.`,
      'polite'
    );

    await this.loadData(page);

    // Announce completion with context
    await this.liveAnnouncer.announce(
      `Page ${page} loaded. Showing ${this.users.length} of ${this.totalItems} results.`,
      'assertive'
    );
  }

  async onSort(column: string): Promise<void> {
    this.sortDirection = this.sortColumn === column && this.sortDirection === 'ascending'
      ? 'descending' : 'ascending';
    this.sortColumn = column;

    await this.loadData(this.currentPage);

    await this.liveAnnouncer.announce(
      `Table sorted by ${column}, ${this.sortDirection} order.`,
      'assertive'
    );
  }

  async onFilter(filterText: string): Promise<void> {
    await this.loadData(1);

    await this.liveAnnouncer.announce(
      this.users.length > 0
        ? `Filter applied. ${this.users.length} results found.`
        : `No results found for "${filterText}". Try a different search term.`,
      'polite'
    );
  }

  getSortDirection(column: string): string {
    return this.sortColumn === column ? this.sortDirection : 'none';
  }

  private async loadData(page: number): Promise<void> { /* HTTP call */ }
}

interface User { id: string; name: string; email: string; }
```

**Why LiveAnnouncer matters**: Screen readers cannot detect DOM changes unless content is
in a live region. Without announcements, a blind user clicking "Next Page" gets no feedback
that data loaded. This is a WCAG 4.1.3 (Status Messages) violation.

#### FocusKeyManager — Keyboard Navigation for Custom Widgets

```typescript
// menu-item.component.ts
import { Component, ElementRef, inject } from '@angular/core';
import { FocusableOption } from '@angular/cdk/a11y';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  template: `
    <li role="menuitem"
        [attr.tabindex]="tabIndex"
        [attr.aria-disabled]="disabled">
      <ng-content></ng-content>
    </li>
  `,
  host: { '(focus)': 'onFocus()' }
})
export class MenuItemComponent implements FocusableOption {
  private el = inject(ElementRef);
  tabIndex = -1;
  disabled = false;

  focus(): void {
    this.el.nativeElement.querySelector('li')?.focus();
    this.tabIndex = 0;
  }

  onFocus(): void { this.tabIndex = 0; }
}
```

```typescript
// dropdown-menu.component.ts
import {
  Component, AfterViewInit, QueryList, ViewChildren, OnDestroy, Output, EventEmitter
} from '@angular/core';
import { FocusKeyManager } from '@angular/cdk/a11y';
import { MenuItemComponent } from './menu-item.component';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [MenuItemComponent],
  template: `
    <button
      (click)="toggle()"
      [attr.aria-expanded]="isOpen"
      aria-haspopup="menu"
      aria-controls="actions-menu">
      Actions ▾
    </button>

    @if (isOpen) {
      <ul
        id="actions-menu"
        role="menu"
        aria-label="Actions menu"
        (keydown)="onKeydown($event)">
        <app-menu-item #items (click)="select('edit')">Edit</app-menu-item>
        <app-menu-item #items (click)="select('duplicate')">Duplicate</app-menu-item>
        <app-menu-item #items (click)="select('archive')">Archive</app-menu-item>
        <app-menu-item #items [disabled]="true">Delete</app-menu-item>
      </ul>
    }
  `
})
export class DropdownMenuComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('items') items!: QueryList<MenuItemComponent>;
  @Output() action = new EventEmitter<string>();

  isOpen = false;
  private keyManager!: FocusKeyManager<MenuItemComponent>;

  ngAfterViewInit(): void {
    this.keyManager = new FocusKeyManager(this.items)
      .withWrap()              // Arrow Down on last item → wraps to first
      .withHomeAndEnd()        // Home/End key support
      .skipPredicate(item => item.disabled);  // Skip disabled items
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Focus first item after menu opens
      setTimeout(() => this.keyManager.setFirstItemActive());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen = false;
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const activeItem = this.keyManager.activeItem;
      if (activeItem && !activeItem.disabled) {
        // Trigger the active item's action
        activeItem.focus();
      }
      return;
    }
    this.keyManager.onKeydown(event);
  }

  select(action: string): void {
    this.action.emit(action);
    this.isOpen = false;
  }

  ngOnDestroy(): void {
    this.keyManager?.destroy();
  }
}
```

**Why FocusKeyManager matters**: Custom dropdown menus must support Arrow Up/Down, Home/End,
and skip disabled items — exactly like native `<select>`. Without this, keyboard users
cannot navigate menus. This is a WCAG 2.1.1 (Keyboard) violation.

---

### Layer 2: Automated Testing with axe-core

#### Cypress + axe-core Integration

```typescript
// cypress/support/commands.ts
import 'cypress-axe';

// Custom command: detailed violation logging with CI-friendly output
Cypress.Commands.add('logA11yViolations', (violations: any[]) => {
  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    rule: id,
    impact,
    description,
    nodeCount: nodes.length,
    nodes: nodes.map((n: any) => n.html).slice(0, 3) // First 3 for brevity
  }));

  cy.task('log', '──── Accessibility Violations ────');
  cy.task('table', violationData);
});
```

```typescript
// cypress/e2e/a11y/dashboard.a11y.cy.ts
describe('Dashboard Accessibility', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.injectAxe();
  });

  it('should have no WCAG 2.1 AA violations on initial load', () => {
    cy.checkA11y(
      null, // Scan entire page
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        },
        rules: {
          // Disable rules handled by third-party widgets we don't control
          'scrollable-region-focusable': { enabled: false }
        }
      },
      (violations) => {
        // Generate detailed report for CI artifacts
        const report = violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length
        }));

        cy.writeFile(
          'cypress/reports/a11y-dashboard.json',
          JSON.stringify(report, null, 2)
        );

        assert.equal(
          violations.length, 0,
          `${violations.length} a11y violations found. See cypress/reports/a11y-dashboard.json`
        );
      }
    );
  });

  it('should maintain a11y after user interactions', () => {
    // Open a modal
    cy.get('[data-testid="create-report-btn"]').click();
    cy.get('[role="dialog"]').should('be.visible');

    // Verify modal a11y (focus trap, ARIA)
    cy.checkA11y('[role="dialog"]', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
  });

  it('should support keyboard-only navigation', () => {
    // Tab through main navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'role', 'navigation');

    // Verify skip-to-content link
    cy.get('a[href="#main-content"]').focus();
    cy.focused().should('contain.text', 'Skip to main content');
    cy.focused().type('{enter}');
    cy.focused().should('be.within', cy.get('main'));
  });

  it('should have sufficient color contrast', () => {
    cy.checkA11y(null, {
      runOnly: { type: 'rule', values: ['color-contrast'] }
    });
  });
});
```

#### Playwright + axe-core Integration

```typescript
// e2e/fixtures/a11y-fixture.ts
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<A11yFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .disableRules(['scrollable-region-focusable']);
    await use(makeAxeBuilder);
  }
});

export { expect };
```

```typescript
// e2e/tests/a11y-audit.spec.ts
import { test, expect } from '../fixtures/a11y-fixture';

// Scan every critical route automatically
const CRITICAL_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/settings/profile', name: 'Profile Settings' },
  { path: '/reports', name: 'Reports' },
  { path: '/admin/users', name: 'User Management' }
];

for (const route of CRITICAL_ROUTES) {
  test(`${route.name} (${route.path}) — no a11y violations`, async ({
    page, makeAxeBuilder
  }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const results = await makeAxeBuilder().analyze();

    // Attach detailed report to Playwright HTML report
    await test.info().attach('a11y-scan-results', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    expect(results.violations).toEqual([]);
  });
}

test('Modal focus management', async ({ page, makeAxeBuilder }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="open-modal"]');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Run a11y scan on modal specifically
  const results = await makeAxeBuilder()
    .include('[role="dialog"]')
    .analyze();
  expect(results.violations).toEqual([]);

  // Verify focus trap: Tab should cycle within modal
  await page.keyboard.press('Tab');
  const focusedInModal = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog?.contains(document.activeElement);
  });
  expect(focusedInModal).toBe(true);

  // Verify Escape closes modal and restores focus
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-testid="open-modal"]')).toBeFocused();
});

test('Data table keyboard navigation', async ({ page, makeAxeBuilder }) => {
  await page.goto('/reports');

  // Verify sort announcement
  const sortHeader = page.locator('th[aria-sort]').first();
  await sortHeader.click();

  // Verify aria-sort attribute updated
  await expect(sortHeader).toHaveAttribute('aria-sort', 'ascending');

  // Verify pagination announcement
  const nextPage = page.getByRole('button', { name: /next page/i });
  await nextPage.click();

  // Verify live region was updated
  const liveRegion = page.locator('[aria-live="assertive"], [aria-live="polite"]');
  await expect(liveRegion).toContainText(/page.*loaded/i);
});
```

---

### Layer 3: Storybook Accessibility Addon

#### Storybook Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../libs/design-system/**/*.stories.@(ts|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',          // axe-core integration in Storybook panel
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/angular',
    options: {}
  }
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          // Disable rules that don't apply in isolated story context
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
          { id: 'region', enabled: false }
        ]
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
        }
      }
    }
  }
};

export default preview;
```

#### Component Story with A11y Testing

```typescript
// libs/design-system/src/button/button.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Design System/Button',
  component: ButtonComponent,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: { variant: 'primary', label: 'Submit Form' }
};

export const Disabled: Story = {
  args: { variant: 'primary', label: 'Submit Form', disabled: true },
  parameters: {
    a11y: {
      // Disabled buttons have relaxed contrast requirements per WCAG
      config: { rules: [{ id: 'color-contrast', enabled: false }] }
    }
  }
};

// Story specifically for a11y audit of all states
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <app-button variant="primary" label="Primary Action"></app-button>
        <app-button variant="secondary" label="Secondary Action"></app-button>
        <app-button variant="danger" label="Delete Item"></app-button>
        <app-button variant="primary" label="Disabled" [disabled]="true"></app-button>
      </div>
    `
  })
};
```

#### Automated Storybook A11y Testing in CI

```typescript
// tools/scripts/storybook-a11y-audit.ts
// Run axe-core against every Storybook story in CI using @storybook/test-runner
// package.json: "test-storybook": "test-storybook --url http://localhost:6006"

// .storybook/test-runner.ts
import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  }
};

export default config;
```

---

### Layer 4: CI/CD Gate on A11y Failures

#### GitHub Actions Pipeline with A11y Gate

```yaml
# .github/workflows/a11y-pipeline.yml
name: Accessibility Compliance Gate
on:
  pull_request:
    branches: [main, develop]

jobs:
  # ── Layer 1: Static Analysis ──
  lint-a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci

      - name: ESLint A11y Rules
        run: npx nx affected -t lint --base=origin/main --parallel=5
        # Fails PR if any template a11y rule is violated

  # ── Layer 2: Component-Level A11y ──
  storybook-a11y:
    runs-on: ubuntu-latest
    needs: lint-a11y
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci

      - name: Build Storybook
        run: npx nx run design-system:build-storybook

      - name: Run Storybook A11y Tests
        run: |
          npx http-server dist/storybook/design-system -p 6006 &
          sleep 5
          npx test-storybook --url http://localhost:6006 \
            --junit --outputFile=reports/storybook-a11y.xml

      - name: Upload A11y Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: storybook-a11y-report
          path: reports/storybook-a11y.xml

  # ── Layer 3: E2E A11y Audit ──
  e2e-a11y:
    runs-on: ubuntu-latest
    needs: lint-a11y
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Build Application
        run: npx nx build shell --configuration=production

      - name: Run E2E A11y Tests
        run: |
          npx nx run shell-e2e:e2e --grep="a11y" \
            --reporter=html --output=reports/a11y-e2e/

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-e2e-report
          path: reports/a11y-e2e/

  # ── Gate: Block merge if any a11y job fails ──
  a11y-gate:
    runs-on: ubuntu-latest
    needs: [lint-a11y, storybook-a11y, e2e-a11y]
    if: always()
    steps:
      - name: Check A11y Results
        run: |
          if [ "${{ needs.lint-a11y.result }}" != "success" ] || \
             [ "${{ needs.storybook-a11y.result }}" != "success" ] || \
             [ "${{ needs.e2e-a11y.result }}" != "success" ]; then
            echo "❌ Accessibility gate FAILED. Fix violations before merging."
            exit 1
          fi
          echo "✅ All accessibility checks passed."
```

**Branch protection rule**: The `a11y-gate` job is added as a required status check in
GitHub branch protection settings. No PR can merge to `main` without passing all three
a11y layers.

---

### ARIA Patterns for Common Components

These are the three most commonly asked ARIA patterns in architect interviews. Each must
handle keyboard navigation, screen reader announcements, and focus management correctly.

#### Pattern 1: Accessible Modal Dialog

```html
<!-- modal-dialog.component.html -->
<!-- Trigger button stores ref for focus restoration -->
<button
  #triggerBtn
  (click)="open()"
  [attr.aria-expanded]="isOpen"
  aria-haspopup="dialog">
  Open Settings
</button>

<!-- Modal overlay -->
@if (isOpen) {
  <div
    class="modal-overlay"
    (click)="onOverlayClick($event)"
    (keydown.escape)="close()">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      class="modal-content">

      <h2 id="modal-title">Account Settings</h2>
      <p id="modal-desc">Update your profile and notification preferences.</p>

      <form>
        <label for="display-name">Display Name</label>
        <input id="display-name" type="text" cdkFocusInitial />

        <fieldset>
          <legend>Notification Preferences</legend>
          <label>
            <input type="checkbox" name="email-notif" /> Email notifications
          </label>
          <label>
            <input type="checkbox" name="sms-notif" /> SMS notifications
          </label>
        </fieldset>
      </form>

      <div class="modal-actions">
        <button (click)="close()">Cancel</button>
        <button (click)="save()">Save Changes</button>
      </div>
    </div>
  </div>
}
```

**ARIA requirements checklist**:
- `role="dialog"` + `aria-modal="true"` — tells screen readers this is a modal
- `aria-labelledby` → points to the heading
- `aria-describedby` → points to the description
- Focus trapped inside (cdkTrapFocus)
- Escape key closes the modal
- Focus returns to trigger button on close

#### Pattern 2: Accessible Dropdown / Combobox

```html
<!-- autocomplete-search.component.html -->
<div class="combobox-container">
  <label id="search-label" for="search-input">Search users</label>
  <div role="combobox"
       aria-expanded="{{ isOpen }}"
       aria-owns="search-listbox"
       aria-haspopup="listbox">
    <input
      id="search-input"
      type="text"
      role="searchbox"
      aria-autocomplete="list"
      aria-controls="search-listbox"
      aria-labelledby="search-label"
      aria-activedescendant="{{ activeDescendantId }}"
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
      [attr.aria-describedby]="resultCount > 0 ? 'search-status' : null" />
  </div>

  <!-- Live region for result count -->
  <div id="search-status" role="status" aria-live="polite" class="sr-only">
    {{ resultCount }} results available. Use arrow keys to navigate.
  </div>

  @if (isOpen && results.length > 0) {
    <ul id="search-listbox" role="listbox" aria-labelledby="search-label">
      @for (result of results; track result.id; let i = $index) {
        <li
          [id]="'option-' + result.id"
          role="option"
          [attr.aria-selected]="i === activeIndex"
          (click)="select(result)"
          (mouseenter)="activeIndex = i">
          <span>{{ result.name }}</span>
          <span class="sr-only">{{ result.department }}</span>
        </li>
      }
    </ul>
  }
</div>
```

**Key ARIA attributes**:
- `role="combobox"` wraps the input + listbox relationship
- `aria-activedescendant` tracks the visually focused option without moving DOM focus
- `aria-expanded` communicates open/closed state
- `role="status"` live region announces result count changes
- `aria-selected` marks the current option

#### Pattern 3: Accessible Data Grid

```html
<!-- data-grid.component.html -->
<div role="grid"
     aria-label="Employee directory"
     aria-rowcount="{{ totalRows }}"
     aria-colcount="{{ columns.length }}"
     (keydown)="onGridKeydown($event)">

  <!-- Column headers -->
  <div role="row" aria-rowindex="1">
    @for (col of columns; track col.key; let i = $index) {
      <div role="columnheader"
           [attr.aria-colindex]="i + 1"
           [attr.aria-sort]="col.key === sortColumn ? sortDirection : null"
           (click)="sort(col.key)"
           (keydown.enter)="sort(col.key)"
           (keydown.space)="sort(col.key); $event.preventDefault()"
           tabindex="0">
        {{ col.label }}
      </div>
    }
  </div>

  <!-- Data rows (virtualized — only visible rows rendered) -->
  @for (row of visibleRows; track row.id; let rowIdx = $index) {
    <div role="row"
         [attr.aria-rowindex]="row.virtualIndex + 2"
         [attr.aria-selected]="selectedRows.has(row.id)">
      @for (col of columns; track col.key; let colIdx = $index) {
        <div role="gridcell"
             [attr.aria-colindex]="colIdx + 1"
             [attr.tabindex]="isActiveCell(rowIdx, colIdx) ? 0 : -1">
          {{ row[col.key] }}
        </div>
      }
    </div>
  }
</div>

<!-- Pagination with live announcements -->
<nav aria-label="Table pagination">
  <button (click)="prevPage()" [attr.aria-disabled]="currentPage === 1">
    Previous
  </button>
  <span aria-current="page">Page {{ currentPage }} of {{ totalPages }}</span>
  <button (click)="nextPage()" [attr.aria-disabled]="currentPage === totalPages">
    Next
  </button>
</nav>
```

**Data grid ARIA requirements**:
- `role="grid"` with `aria-rowcount`/`aria-colcount` for virtual scrolling
- `aria-rowindex` on each row (accounts for virtualized rows not in DOM)
- `aria-sort` on sortable column headers
- `aria-selected` for row selection
- Roving tabindex: only the active cell has `tabindex="0"`
- Arrow keys navigate cells, Enter activates, Escape cancels edit

---

### Screen Reader Testing Methodology

#### Testing Matrix

| Screen Reader | Browser | OS | Priority |
|---|---|---|---|
| NVDA | Chrome, Firefox | Windows | P0 — 40% of SR users |
| JAWS | Chrome, Edge | Windows | P0 — 30% of SR users |
| VoiceOver | Safari | macOS/iOS | P1 — 20% of SR users |
| TalkBack | Chrome | Android | P2 — 10% of SR users |

#### Manual Testing Checklist (Per Component)

```
┌─────────────────────────────────────────────────────────────────┐
│              SCREEN READER TEST SCRIPT                          │
│                                                                 │
│  Component: _______________  Tester: _______________            │
│  SR: NVDA / JAWS / VO      Browser: _______________            │
│                                                                 │
│  ☐ 1. Navigate to component using Tab key only                 │
│  ☐ 2. Verify role is announced (e.g., "button", "dialog")      │
│  ☐ 3. Verify name/label is announced                           │
│  ☐ 4. Verify state is announced (expanded, selected, disabled) │
│  ☐ 5. Activate with Enter/Space — verify action + announcement │
│  ☐ 6. Navigate within component (Arrow keys for menus/grids)   │
│  ☐ 7. Verify dynamic content changes are announced             │
│  ☐ 8. Escape to dismiss — verify focus returns to trigger      │
│  ☐ 9. Verify no content is hidden from SR that should be read  │
│  ☐ 10. Verify no content is read that should be hidden         │
│       (decorative images, icons)                                │
│                                                                 │
│  Result: PASS / FAIL    Notes: _________________________        │
└─────────────────────────────────────────────────────────────────┘
```

#### Automated Screen Reader Testing (Experimental)

```typescript
// tools/scripts/sr-smoke-test.ts
// Uses @guidepup/guidepup for automated VoiceOver testing on macOS CI
import { voiceOver, MacOSKeystroke } from '@guidepup/guidepup';

async function testModalAnnouncements(): Promise<void> {
  await voiceOver.start();

  // Navigate to the open modal button
  await voiceOver.perform(MacOSKeystroke.findNext, { text: 'Open Settings' });

  // Verify button is announced with correct role
  const buttonAnnouncement = await voiceOver.lastSpokenPhrase();
  console.assert(
    buttonAnnouncement.includes('button'),
    `Expected "button" role, got: ${buttonAnnouncement}`
  );

  // Activate the button
  await voiceOver.press('Enter');

  // Verify dialog announcement
  const dialogAnnouncement = await voiceOver.lastSpokenPhrase();
  console.assert(
    dialogAnnouncement.includes('dialog') || dialogAnnouncement.includes('Account Settings'),
    `Expected dialog announcement, got: ${dialogAnnouncement}`
  );

  await voiceOver.stop();
}
```

---

### Architect's Verdict (Q14)

**The 30-second answer**: Accessibility at enterprise scale requires a four-layer pipeline —
static analysis (ESLint a11y rules) catches 40% of violations at near-zero cost, component
testing (Storybook addon) validates rendered output, E2E testing (axe-core in Playwright)
catches dynamic interaction issues, and manual screen reader testing catches cognitive
issues no automation can find. The CI/CD gate makes a11y a hard requirement — no PR merges
with violations. Angular CDK's FocusTrap, LiveAnnouncer, and FocusKeyManager handle the
three hardest a11y patterns: focus management, dynamic announcements, and keyboard navigation.

**Key trade-offs to discuss**:

| Decision | Trade-off |
|---|---|
| `"error"` severity on all a11y rules | Blocks PRs but prevents regressions |
| axe-core in E2E vs unit tests | Slower but catches real rendering issues |
| Storybook a11y addon | Great for component isolation, misses page-level context |
| Manual SR testing quarterly | Expensive but catches ~5% of issues automation misses |
| `aria-live="assertive"` vs `"polite"` | Assertive interrupts user; polite may be missed |

**What interviewers want to hear**: You understand that automated tools catch ~57% of WCAG
violations (per GDS research). The remaining 43% requires manual testing, expert review,
and user testing with people who use assistive technology. A mature a11y program combines
both, with CI gates preventing regression while manual audits drive improvement.

---

## Q16: Integrating Agentic AI Development Workflow into an Angular Engineering Team

### Problem Statement

> You are the frontend architect for an Angular engineering team of 20 developers working on
> an enterprise platform built as an Nx monorepo with 12 libraries, 4 micro-frontends, and a
> shared design system. Leadership wants to integrate AI-assisted development workflows to
> improve velocity without sacrificing code quality. Design the tooling stack, guardrails,
> MCP server architecture, and a 90-day adoption strategy.

### AI Tooling Stack for Angular Development

The AI tooling stack operates at four integration points — IDE, CLI, CI/CD, and codebase
context. Each layer serves a different purpose in the developer workflow:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AI-ASSISTED DEVELOPMENT STACK                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  Layer 4: CI/CD Integration                                        │     │
│  │  • AI-generated PR summaries    • Auto-fix lint violations         │     │
│  │  • AI code review bot           • Test generation on coverage gaps │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                              ▲                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  Layer 3: Custom AI Agents                                         │     │
│  │  • Component scaffolding agent  • Test generation agent            │     │
│  │  • Code review agent            • Documentation agent              │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                              ▲                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  Layer 2: MCP Servers (Codebase Context)                           │     │
│  │  • Component registry           • Design token definitions         │     │
│  │  • API contract schemas         • Architecture decision records    │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                              ▲                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  Layer 1: IDE Integration                                          │     │
│  │  • GitHub Copilot / Amazon Q    • Kiro (spec-driven development)   │     │
│  │  • Cursor (codebase-aware)      • VS Code extensions               │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### IDE-Level AI Integration

Each tool fills a different niche. The team doesn't pick one — they layer them:

```typescript
// .vscode/settings.json — Team-wide AI configuration
{
  // GitHub Copilot: inline completions for boilerplate
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "yaml": true
  },
  // Restrict Copilot suggestions to follow project patterns
  "github.copilot.advanced": {
    "inlineSuggestCount": 3
  },

  // Kiro: spec-driven development for features
  // Kiro generates requirements → design → tasks from natural language specs
  // Ideal for new feature development where traceability matters

  // File nesting for AI-generated artifacts
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.component.ts": "${capture}.component.html,${capture}.component.scss,${capture}.component.spec.ts",
    "*.service.ts": "${capture}.service.spec.ts"
  }
}
```

**Why multiple tools**: Copilot excels at line-level completions (boilerplate, repetitive patterns).
Kiro excels at spec-driven feature development with requirements traceability. Cursor excels at
codebase-wide refactoring with full-repo context. No single tool covers all use cases.

---

### MCP Server Architecture for Angular Monorepos

MCP (Model Context Protocol) servers act as a bridge between your codebase and LLMs. Instead
of dumping the entire repo into context, MCP servers expose structured, queryable endpoints
that give AI tools exactly the context they need.

#### How MCP Servers Provide Context to LLMs

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     MCP SERVER ARCHITECTURE                              │
│                                                                          │
│  Developer (IDE)                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────┐    stdio/SSE    ┌─────────────────────────────────┐       │
│  │ AI Tool  │ ◄─────────────► │  MCP Server (Node.js process)   │       │
│  │ (Copilot │                 │                                  │       │
│  │  / Kiro  │                 │  Tools:                          │       │
│  │  / Q)    │                 │  ├─ getComponentAPI(name)        │       │
│  └──────────┘                 │  ├─ getDesignTokens(category)    │       │
│                               │  ├─ getAPIContract(endpoint)     │       │
│                               │  ├─ getArchDecisionRecord(id)    │       │
│                               │  └─ searchCodePatterns(query)    │       │
│                               │                                  │       │
│                               │  Resources:                      │       │
│                               │  ├─ component://button           │       │
│                               │  ├─ token://colors/primary       │       │
│                               │  └─ api://users/v2               │       │
│                               └──────────────┬──────────────────┘       │
│                                              │                           │
│                               ┌──────────────▼──────────────────┐       │
│                               │  Angular Monorepo (Nx)           │       │
│                               │  ├─ libs/design-system/          │       │
│                               │  ├─ libs/shared/api-contracts/   │       │
│                               │  ├─ apps/shell/                  │       │
│                               │  └─ docs/architecture/           │       │
│                               └─────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Custom MCP Server for Angular Design System

```typescript
// tools/mcp-server/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'fast-glob';

const server = new McpServer({
  name: 'angular-monorepo-context',
  version: '1.0.0'
});

// ── Tool: Get component public API ──
server.tool(
  'getComponentAPI',
  'Returns the public API (inputs, outputs, methods) of an Angular component',
  { componentName: z.string().describe('PascalCase component name, e.g. DataTableComponent') },
  async ({ componentName }) => {
    const files = await glob.glob(`libs/**/src/**/${toKebabCase(componentName)}.ts`);
    if (files.length === 0) {
      return { content: [{ type: 'text', text: `Component ${componentName} not found` }] };
    }

    const source = fs.readFileSync(files[0], 'utf-8');

    // Extract @Input(), @Output(), and public methods
    const inputs = [...source.matchAll(/@Input\(\)\s+(\w+)[\s:]/g)].map(m => m[1]);
    const outputs = [...source.matchAll(/@Output\(\)\s+(\w+)/g)].map(m => m[1]);
    const inputSignals = [...source.matchAll(/(\w+)\s*=\s*input(?:<[^>]+>)?\(/g)].map(m => m[1]);
    const outputSignals = [...source.matchAll(/(\w+)\s*=\s*output(?:<[^>]+>)?\(/g)].map(m => m[1]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          component: componentName,
          file: files[0],
          inputs: [...inputs, ...inputSignals],
          outputs: [...outputs, ...outputSignals],
          note: 'Use these exact input/output names when generating templates.'
        }, null, 2)
      }]
    };
  }
);

// ── Tool: Get design tokens ──
server.tool(
  'getDesignTokens',
  'Returns design tokens (colors, spacing, typography) for consistent styling',
  { category: z.enum(['colors', 'spacing', 'typography', 'breakpoints', 'all']) },
  async ({ category }) => {
    const tokenFile = 'libs/design-system/src/tokens/tokens.json';
    const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));

    const result = category === 'all' ? tokens : tokens[category];
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tokens: result,
          usage: 'Reference these tokens via CSS custom properties: var(--ds-color-primary)',
          warning: 'Do NOT use hardcoded hex values. Always use design tokens.'
        }, null, 2)
      }]
    };
  }
);

// ── Tool: Get API contract ──
server.tool(
  'getAPIContract',
  'Returns the OpenAPI/Swagger schema for a backend endpoint',
  { endpoint: z.string().describe('API path, e.g. /api/v2/users') },
  async ({ endpoint }) => {
    const specFile = 'libs/shared/api-contracts/openapi.yaml';
    // In production, parse YAML and extract the specific endpoint
    const spec = fs.readFileSync(specFile, 'utf-8');

    return {
      content: [{
        type: 'text',
        text: `OpenAPI spec for ${endpoint}:\n${spec}`,
      }]
    };
  }
);

// ── Resource: Expose component catalog as browsable resources ──
server.resource(
  'component-catalog',
  'design-system://components',
  async (uri) => {
    const components = await glob.glob('libs/design-system/src/**/!(*.spec|*.stories).ts');
    const catalog = components.map(f => path.basename(f, '.ts'));

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({ components: catalog }, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);

// ── Start server ──
function toKebabCase(str: string): string {
  return str.replace(/Component$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase() + '.component';
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

#### MCP Configuration File

```json
// .kiro/mcp.json (or mcp.json at workspace root)
{
  "mcpServers": {
    "angular-monorepo": {
      "command": "npx",
      "args": ["tsx", "tools/mcp-server/src/index.ts"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "NODE_ENV": "development"
      }
    },
    "nx-workspace": {
      "command": "npx",
      "args": ["@nicepkg/nx-mcp"],
      "env": {
        "NX_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

#### MCP Security Considerations

```typescript
// tools/mcp-server/src/security.ts
// What to expose vs. restrict through MCP

const SECURITY_POLICY = {
  // ✅ SAFE TO EXPOSE — helps AI generate correct code
  expose: [
    'Component public APIs (inputs, outputs, selectors)',
    'Design token values (colors, spacing, typography)',
    'OpenAPI contract schemas (request/response shapes)',
    'Architecture Decision Records (ADRs)',
    'ESLint and Prettier configurations',
    'Nx project graph (dependency relationships)',
    'Public type definitions and interfaces'
  ],

  // ❌ NEVER EXPOSE — security and compliance risk
  restrict: [
    'Environment variables and secrets (.env files)',
    'Authentication tokens, API keys, certificates',
    'Database connection strings or credentials',
    'Internal security audit reports',
    'Customer PII or production data samples',
    'License keys or proprietary algorithm implementations',
    'Infrastructure-as-code with hardcoded secrets'
  ],

  // ⚠️ CONDITIONAL — expose structure, not values
  conditional: [
    'CI/CD pipeline configs (expose structure, mask secrets)',
    'Deployment manifests (expose patterns, mask endpoints)',
    'Feature flags (expose names, not targeting rules)',
    'Error tracking configs (expose setup, mask DSNs)'
  ]
};

// Implement as a file filter in the MCP server
function isPathAllowed(filePath: string): boolean {
  const BLOCKED_PATTERNS = [
    /\.env/,
    /secrets?\./,
    /credentials/,
    /\.pem$/,
    /\.key$/,
    /docker-compose.*prod/,
    /infrastructure\/.*\.tf$/
  ];

  return !BLOCKED_PATTERNS.some(pattern => pattern.test(filePath));
}
```

---

### Guardrails and Quality Gates

AI-generated code in an enterprise Angular codebase needs the same rigor as human-written
code — plus additional validation layers to catch hallucination patterns unique to LLMs.

#### AI Code Review Policy

```typescript
// tools/scripts/ai-code-review-policy.ts
// Enforced via GitHub Actions — annotates PRs with AI-generated code markers

interface AICodeReviewPolicy {
  // Every AI-generated file must have a human reviewer approval
  mandatoryHumanReview: true;

  // AI-generated code gets a special label for tracking
  prLabels: ['ai-assisted', 'needs-human-review'];

  // Maximum percentage of AI-generated code per PR
  maxAICodePercentage: 70; // Forces humans to understand and own the code

  // Required checks before AI code can merge
  requiredChecks: [
    'lint-pass',
    'type-check-pass',
    'unit-tests-pass',
    'e2e-affected-pass',
    'bundle-size-check',
    'a11y-audit-pass'
  ];
}
```

```yaml
# .github/workflows/ai-code-validation.yml
name: AI Code Validation Gate
on:
  pull_request:
    branches: [main, develop]

jobs:
  validate-ai-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci

      # Type-check: catches AI hallucinated APIs
      - name: TypeScript Strict Check
        run: npx tsc --noEmit --strict

      # Lint: catches AI-generated anti-patterns
      - name: ESLint with AI-specific rules
        run: npx nx affected -t lint --base=origin/main

      # Unit tests: catches AI logic errors
      - name: Run Affected Unit Tests
        run: npx nx affected -t test --base=origin/main --parallel=5

      # Schema validation: catches hallucinated API contracts
      - name: Validate API Contract Compliance
        run: |
          npx openapi-typescript-codegen verify \
            --input libs/shared/api-contracts/openapi.yaml \
            --output libs/shared/api-contracts/generated/

      # Bundle size: catches AI over-importing
      - name: Bundle Size Check
        run: |
          npx nx build shell --configuration=production
          node tools/scripts/check-bundle-size.js --max-delta=5kb
```

#### Prompt Engineering Standards

Standardized prompt templates prevent inconsistent AI output across the team. These live
in the repo and are versioned alongside the code.

```markdown
<!-- .kiro/prompts/component-generation.md -->
# Angular Component Generation Template

## Context
You are generating an Angular component for the {{PROJECT_NAME}} design system.
The project uses:
- Angular 19+ with standalone components and signals
- OnPush change detection strategy (mandatory)
- Design tokens from `libs/design-system/src/tokens/`
- Nx monorepo with library-based architecture

## Requirements
- Component name: {{COMPONENT_NAME}}
- Library: libs/{{LIBRARY_NAME}}/src/lib/
- Purpose: {{DESCRIPTION}}

## Constraints (MUST follow)
1. Use `changeDetection: ChangeDetectionStrategy.OnPush`
2. Use signal-based inputs: `input()`, `input.required()`
3. Use signal-based outputs: `output()`
4. Use `inject()` instead of constructor injection
5. Use design tokens via CSS custom properties — NEVER hardcode colors
6. Include `data-testid` attributes on interactive elements
7. Include ARIA attributes for accessibility
8. Export component from the library's public API (index.ts)

## File Structure
Generate these files:
- {{name}}.component.ts (component class)
- {{name}}.component.html (template)
- {{name}}.component.scss (styles using design tokens)
- {{name}}.component.spec.ts (unit tests with >80% coverage)

## Example Pattern (follow this exactly)
```typescript
@Component({
  selector: 'ds-{{kebab-name}}',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './{{kebab-name}}.component.html',
  styleUrl: './{{kebab-name}}.component.scss'
})
export class {{PascalName}}Component {
  // Signal inputs
  label = input.required<string>();
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input<boolean>(false);

  // Signal outputs
  clicked = output<void>();

  // Injected services
  private readonly a11yService = inject(LiveAnnouncer);
}
```
```

#### Preventing AI Hallucinations with Contract Testing

```typescript
// tools/scripts/validate-ai-output.ts
// Run after any AI-generated service to verify it matches the real API contract

import Ajv from 'ajv';
import * as fs from 'fs';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateGeneratedService(
  generatedFilePath: string,
  openApiSpecPath: string
): ValidationResult {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const spec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf-8'));
  const generatedCode = fs.readFileSync(generatedFilePath, 'utf-8');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Verify all HTTP methods match the spec
  const httpCalls = [...generatedCode.matchAll(
    /this\.http\.(get|post|put|patch|delete)<([^>]+)>\(\s*[`']([^`']+)[`']/g
  )];

  for (const [, method, responseType, url] of httpCalls) {
    const specPath = spec.paths?.[url.replace(/\$\{[^}]+\}/g, '{id}')];
    if (!specPath) {
      errors.push(`HALLUCINATION: Endpoint ${method.toUpperCase()} ${url} does not exist in API spec`);
      continue;
    }
    if (!specPath[method]) {
      errors.push(`HALLUCINATION: Method ${method.toUpperCase()} not allowed on ${url}`);
    }
  }

  // Check 2: Verify response types match schema definitions
  const interfaceNames = [...generatedCode.matchAll(/interface\s+(\w+)\s*\{/g)].map(m => m[1]);
  for (const name of interfaceNames) {
    const schemaRef = spec.components?.schemas?.[name];
    if (!schemaRef) {
      warnings.push(`WARNING: Interface ${name} has no matching schema in API spec — verify manually`);
    }
  }

  // Check 3: Verify no hardcoded URLs (common AI hallucination)
  const hardcodedUrls = [...generatedCode.matchAll(/['"`](https?:\/\/[^'"`]+)['"`]/g)];
  for (const [, url] of hardcodedUrls) {
    errors.push(`HARDCODED URL: ${url} — use environment config instead`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

### Adoption Strategy — 90-Day Rollout Plan

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    90-DAY AI ADOPTION ROADMAP                                │
│                                                                              │
│  Phase 1 (Days 1-30)          Phase 2 (Days 30-60)       Phase 3 (60-90)    │
│  ─────────────────           ──────────────────          ────────────────    │
│  • 3-4 senior engineers      • Full team (20 devs)      • CI/CD integration │
│  • Copilot + Kiro setup      • Prompt library v1        • Custom MCP server │
│  • Baseline metrics          • Custom agents             • ROI measurement  │
│  • Document patterns         • Training workshops        • Governance model │
│  • Weekly retros             • Bi-weekly retros          • Exec report      │
│                                                                              │
│  Success Gate:               Success Gate:               Success Gate:       │
│  3 features shipped          Team prompt library         15% PR cycle time  │
│  with AI assistance          with 20+ templates          reduction measured  │
│                                                                              │
│  Risk Mitigation:            Risk Mitigation:            Risk Mitigation:    │
│  Rollback to manual          Pair AI-skeptics with       A/B sprint data    │
│  if quality drops            AI-champions                validates ROI      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 1: Pilot (Days 1-30)

```typescript
// tools/scripts/baseline-metrics.ts
// Capture baseline metrics BEFORE AI adoption for honest comparison

interface BaselineMetrics {
  // Velocity metrics
  prCycleTime: {
    median: number;     // Hours from PR open to merge
    p90: number;        // 90th percentile
    source: 'GitHub API — pulls endpoint with timeline events';
  };

  // Quality metrics
  bugEscapeRate: {
    perSprint: number;  // Bugs found in production per 2-week sprint
    source: 'Jira — bugs created with fixVersion = current release';
  };

  testCoverage: {
    overall: number;    // Percentage
    perLibrary: Record<string, number>;
    source: 'Istanbul/nyc coverage reports from CI';
  };

  // Developer experience
  devSatisfaction: {
    score: number;      // 1-10 from anonymous survey
    topFrustrations: string[];
    source: 'Quarterly developer experience survey';
  };
}

// Collect via GitHub API
async function captureBaseline(): Promise<BaselineMetrics> {
  const prs = await fetchMergedPRs({ days: 30 });
  const cycleTimes = prs.map(pr =>
    (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / 3600000
  );

  return {
    prCycleTime: {
      median: percentile(cycleTimes, 50),
      p90: percentile(cycleTimes, 90),
      source: 'GitHub API — pulls endpoint with timeline events'
    },
    bugEscapeRate: {
      perSprint: await countProductionBugs({ days: 14 }),
      source: 'Jira — bugs created with fixVersion = current release'
    },
    testCoverage: {
      overall: await getOverallCoverage(),
      perLibrary: await getPerLibraryCoverage(),
      source: 'Istanbul/nyc coverage reports from CI'
    },
    devSatisfaction: {
      score: 0, // Filled from survey
      topFrustrations: [],
      source: 'Quarterly developer experience survey'
    }
  };
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function fetchMergedPRs(opts: { days: number }): Promise<any[]> { return []; }
async function countProductionBugs(opts: { days: number }): Promise<number> { return 0; }
async function getOverallCoverage(): Promise<number> { return 0; }
async function getPerLibraryCoverage(): Promise<Record<string, number>> { return {}; }
```

#### Phase 2: Team Expansion (Days 30-60)

Key activities:
- Onboard remaining 16 developers with structured training sessions
- Establish shared prompt library in `tools/prompts/` (version-controlled)
- Create custom AI agents for the three highest-ROI tasks: component scaffolding,
  test generation, and PR description writing
- Pair AI-skeptical developers with AI-champion developers for knowledge transfer
- Run bi-weekly retrospectives focused on AI workflow friction points

#### Phase 3: CI/CD Integration and Governance (Days 60-90)

Key activities:
- Deploy custom MCP server to provide codebase context to all AI tools
- Integrate AI validation gates into the CI/CD pipeline
- Measure ROI against Phase 1 baseline metrics
- Establish governance model: who approves new prompts, who maintains MCP server,
  how to handle AI-generated code in security-sensitive modules
- Present executive report with data-backed ROI analysis

---

### Productivity Measurement Framework

```typescript
// tools/scripts/ai-productivity-dashboard.ts
// Tracks AI adoption impact across the team

interface AIProductivityMetrics {
  // ── Velocity ──
  prCycleTime: {
    before: number;   // Baseline median hours
    after: number;    // Post-adoption median hours
    delta: string;    // e.g., "-22%"
  };

  linesPerSprint: {
    before: number;
    after: number;
    note: 'Lines of code is a vanity metric — track alongside quality metrics';
  };

  // ── Quality ──
  testCoverageDelta: {
    before: number;   // e.g., 72%
    after: number;    // e.g., 81%
    note: 'AI-generated tests often increase coverage but may lack edge cases';
  };

  bugEscapeRate: {
    before: number;   // Bugs per sprint reaching production
    after: number;
    note: 'Most important quality metric — must not increase with AI adoption';
  };

  // ── AI-Specific ──
  aiSuggestionAcceptRate: {
    copilot: number;  // % of Copilot suggestions accepted
    target: '25-35% is healthy — lower means poor context, higher means rubber-stamping';
  };

  aiGeneratedCodeRatio: {
    percentage: number; // % of merged code that was AI-generated
    target: '30-50% — above 50% suggests insufficient human oversight';
  };

  // ── Developer Experience ──
  devSatisfaction: {
    before: number;   // 1-10 scale
    after: number;
    topBenefits: string[];
    topFrustrations: string[];
  };
}

// A/B Sprint Comparison
interface ABSprintComparison {
  sprintA: {
    name: 'Sprint 24 (no AI)';
    teamSize: 10;
    storiesCompleted: number;
    avgPRCycleHours: number;
    bugsEscaped: number;
    testCoverage: number;
  };
  sprintB: {
    name: 'Sprint 25 (AI-assisted)';
    teamSize: 10;
    storiesCompleted: number;
    avgPRCycleHours: number;
    bugsEscaped: number;
    testCoverage: number;
  };
  analysis: string; // Written summary for leadership
}
```

---

### Real-World Example — Full Integration

#### 1. Custom MCP Server Config for Angular Design System

```json
// .kiro/mcp.json — Production-ready configuration
{
  "mcpServers": {
    "angular-design-system": {
      "command": "node",
      "args": ["tools/mcp-server/dist/index.js"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "COMPONENT_LIB_PATH": "libs/design-system/src",
        "TOKEN_FILE": "libs/design-system/src/tokens/tokens.json",
        "API_SPEC": "libs/shared/api-contracts/openapi.yaml",
        "LOG_LEVEL": "warn"
      }
    },
    "nx-project-graph": {
      "command": "npx",
      "args": ["@nicepkg/nx-mcp"],
      "env": {
        "NX_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

#### 2. Prompt Template for Angular Component Generation

```typescript
// tools/prompts/generate-component.ts
// Used by team members when asking AI to scaffold a new component

export function buildComponentPrompt(config: {
  name: string;
  library: string;
  description: string;
  inputs: Array<{ name: string; type: string; required: boolean }>;
  outputs: Array<{ name: string; eventType: string }>;
}): string {
  return `
Generate an Angular standalone component with the following specifications:

## Component: ${config.name}
Library: libs/${config.library}/src/lib/${toKebabCase(config.name)}/
Description: ${config.description}

## Technical Requirements (MANDATORY)
- Angular 19+ standalone component
- ChangeDetectionStrategy.OnPush
- Signal-based inputs using input() and input.required()
- Signal-based outputs using output()
- inject() for dependency injection (no constructor injection)
- All styles must use design tokens: var(--ds-*)
- Include data-testid on all interactive elements
- Include appropriate ARIA attributes

## Inputs
${config.inputs.map(i =>
  `- ${i.name}: ${i.type} ${i.required ? '(required)' : '(optional)'}`
).join('\n')}

## Outputs
${config.outputs.map(o =>
  `- ${o.name}: EventEmitter<${o.eventType}>`
).join('\n')}

## Files to Generate
1. ${toKebabCase(config.name)}.component.ts
2. ${toKebabCase(config.name)}.component.html
3. ${toKebabCase(config.name)}.component.scss
4. ${toKebabCase(config.name)}.component.spec.ts (Jest, >80% coverage)

## Testing Requirements
- Test all input variations
- Test output emissions
- Test keyboard interactions
- Test ARIA attribute presence
- Use Angular Testing Library (render + screen)

Do NOT:
- Use hardcoded color values (use design tokens)
- Use any as a type
- Skip error handling
- Generate code that imports from relative paths outside the library
`;
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
```

#### 3. Pre-Commit Hook for AI-Generated Code Validation

```typescript
// tools/hooks/validate-ai-code.ts
// Kiro hook or Husky pre-commit — validates AI output before it reaches the repo

import { execSync } from 'child_process';

interface ValidationReport {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

async function validateStagedFiles(): Promise<ValidationReport> {
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
    .toString().trim().split('\n').filter(Boolean);

  const tsFiles = stagedFiles.filter(f => f.endsWith('.ts'));
  const htmlFiles = stagedFiles.filter(f => f.endsWith('.html'));
  const checks: ValidationReport['checks'] = [];

  // Check 1: TypeScript strict compilation
  if (tsFiles.length > 0) {
    try {
      execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
      checks.push({ name: 'TypeScript', passed: true, message: 'Strict type check passed' });
    } catch (e: any) {
      checks.push({ name: 'TypeScript', passed: false, message: e.stdout?.toString() || 'Type errors found' });
    }
  }

  // Check 2: ESLint (includes a11y rules for templates)
  const allFiles = [...tsFiles, ...htmlFiles];
  if (allFiles.length > 0) {
    try {
      execSync(`npx eslint ${allFiles.join(' ')} --max-warnings=0`, { stdio: 'pipe' });
      checks.push({ name: 'ESLint', passed: true, message: 'No lint violations' });
    } catch (e: any) {
      checks.push({ name: 'ESLint', passed: false, message: 'Lint violations found — run eslint --fix' });
    }
  }

  // Check 3: No banned patterns (common AI hallucinations)
  const bannedPatterns = [
    { pattern: /any(?:\s|;|,|\))/g, message: 'Avoid using "any" type' },
    { pattern: /console\.(log|debug|info)\(/g, message: 'Remove console statements' },
    { pattern: /\/\/ TODO: implement/gi, message: 'AI left TODO stubs — implement before committing' },
    { pattern: /https?:\/\/(?!localhost)[^\s'"]+/g, message: 'Hardcoded URL detected — use environment config' },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/g, message: 'Possible hardcoded credential' }
  ];

  for (const file of tsFiles) {
    const content = require('fs').readFileSync(file, 'utf-8');
    for (const { pattern, message } of bannedPatterns) {
      if (pattern.test(content)) {
        checks.push({ name: `Pattern: ${file}`, passed: false, message });
      }
      pattern.lastIndex = 0; // Reset regex state
    }
  }

  // Check 4: Affected unit tests pass
  if (tsFiles.some(f => !f.endsWith('.spec.ts'))) {
    try {
      execSync('npx nx affected -t test --base=HEAD~1 --parallel=3', {
        stdio: 'pipe',
        timeout: 120000
      });
      checks.push({ name: 'Unit Tests', passed: true, message: 'Affected tests pass' });
    } catch {
      checks.push({ name: 'Unit Tests', passed: false, message: 'Affected unit tests failed' });
    }
  }

  const passed = checks.every(c => c.passed);

  if (!passed) {
    console.error('\n❌ AI Code Validation Failed:\n');
    checks.filter(c => !c.passed).forEach(c => {
      console.error(`  ✗ ${c.name}: ${c.message}`);
    });
    console.error('\nFix the issues above before committing.\n');
  } else {
    console.log('✅ All AI code validation checks passed.');
  }

  return { passed, checks };
}

// Execute
validateStagedFiles().then(report => {
  process.exit(report.passed ? 0 : 1);
});
```

---

### Architect's Verdict (Q16)

**The 30-second answer**: Integrating AI into an Angular team requires four layers — IDE tools
for inline assistance (Copilot, Kiro), MCP servers for structured codebase context, guardrails
to catch hallucinations (type-checking, contract validation, banned pattern detection), and a
phased 90-day rollout that starts with senior engineers and expands only after measuring quality
impact. The critical insight is that AI tools amplify existing engineering culture — if your team
has strong linting, testing, and review practices, AI accelerates them. If those foundations are
weak, AI will generate confident-looking code that silently degrades quality.

**Key trade-offs to discuss**:

| Decision | Trade-off | Interview Talking Point |
|---|---|---|
| Multiple AI tools vs. single tool | Higher licensing cost, but each tool excels at different tasks | "Copilot for completions, Kiro for spec-driven features, Cursor for refactoring — they're complementary, not competing" |
| Custom MCP server | Engineering investment to build and maintain, but dramatically improves AI output quality | "Without codebase context, AI generates generic Angular — with MCP, it generates code that follows our patterns" |
| Mandatory human review of AI code | Slows PR throughput slightly, but prevents hallucinated APIs and security issues | "AI is a junior developer that never gets tired — you still need a senior to review its work" |
| 70% max AI code per PR | Limits AI productivity gains, but ensures developers understand what they're shipping | "If you can't explain every line in the PR, you shouldn't merge it — regardless of who wrote it" |
| Phased 90-day rollout | Slower adoption, but builds evidence-based case for ROI | "We measured before and after — PR cycle time dropped 22%, bug escape rate stayed flat" |
| Prompt templates in version control | Overhead to maintain, but ensures consistent AI output across 20 developers | "Prompt engineering is software engineering — it needs versioning, review, and testing" |
| Contract testing for AI output | Extra CI time, but catches the #1 AI failure mode: hallucinated API endpoints | "The AI confidently generated a PUT /api/v2/users/:id endpoint that doesn't exist — contract testing caught it" |
| Exposing design tokens via MCP | Requires token file to be machine-readable JSON, not just SCSS | "We refactored tokens to JSON source-of-truth with SCSS/CSS generation — AI and humans both benefit" |

**What interviewers want to hear**: You understand that AI adoption is a sociotechnical problem,
not just a tooling problem. The technology stack matters (MCP servers, validation gates), but the
adoption strategy matters more (phased rollout, baseline metrics, developer buy-in). The architect's
role is to design guardrails that let the team move fast without sacrificing the quality bar — and
to measure whether AI is actually helping or just generating more code to review.

---