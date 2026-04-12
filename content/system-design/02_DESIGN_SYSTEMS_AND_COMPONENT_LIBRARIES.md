# Design Systems & Component Libraries — Principal/Architect Interview Guide

## Senior / Principal Frontend Architect — System Design Interview Prep

> This document covers three critical system design questions that a Senior or Principal-level
> frontend architect must be prepared to answer in depth. These questions span the full lifecycle
> of enterprise design systems: building framework-agnostic component libraries, architecting
> scalable design token pipelines, and managing versioning strategies for shared libraries
> consumed by multiple product teams.

> 🔑 **Interview Mindset:** At the Principal/Architect level, interviewers don't want a textbook
> answer. They want to see you lead with trade-offs, acknowledge constraints, and justify decisions
> with real-world experience. Every "it depends" should be followed by "and here's how I'd decide."

---

## Table of Contents

1. [Q4: Framework-Agnostic UI Component Library](#q4-framework-agnostic-ui-component-library)
   - [Problem Statement](#problem-statement)
   - [High-Level Architecture](#high-level-architecture)
   - [Web Components (Lit) vs Framework-Specific Wrappers](#web-components-lit-vs-framework-specific-wrappers)
   - [Core Lit Web Component Implementation](#core-lit-web-component-implementation)
   - [The Wrapper Pattern: Angular & React Consumers](#the-wrapper-pattern-angular--react-consumers)
   - [Design Token Architecture](#design-token-architecture-global--alias--component)
   - [Versioning & Semver Strategy](#versioning--semver-strategy)
   - [Storybook-Driven Documentation](#storybook-driven-documentation)
   - [Tree-Shaking via Secondary Entry Points](#tree-shaking-via-secondary-entry-points)
   - [Consumer DX: How Teams Consume the Library](#consumer-dx-how-teams-consume-the-library)
   - [Architect's Verdict](#architects-verdict-q4)

2. [Q5: Scalable Design Token System (Figma → Production)](#q5-scalable-design-token-system-figma--production)
   - [Problem Statement](#problem-statement-1)
   - [Token Hierarchy: Three-Tier Architecture](#token-hierarchy-three-tier-architecture)
   - [CSS Custom Properties vs SCSS Variables](#css-custom-properties-vs-scss-variables)
   - [The Full Pipeline: Figma → Style Dictionary → Code](#the-full-pipeline-figma--style-dictionary--code)
   - [Theming Pipeline: Dark Mode & Multi-Brand](#theming-pipeline-dark-mode--multi-brand)
   - [Runtime Theme Switching](#runtime-theme-switching)
   - [CI/CD Token Sync from Figma](#cicd-token-sync-from-figma)
   - [Architect's Verdict](#architects-verdict-q5)

3. [Q6: Versioning & Breaking-Change Management](#q6-versioning--breaking-change-management)
   - [Problem Statement](#problem-statement-2)
   - [Semantic Versioning Rules with Examples](#semantic-versioning-rules-with-examples)
   - [Deprecation Policy](#deprecation-policy)
   - [Migration Schematics (ng update)](#migration-schematics-ng-update)
   - [Changelog Automation with Conventional Commits](#changelog-automation-with-conventional-commits)
   - [Peer Dependency Management in Nx Monorepo](#peer-dependency-management-in-nx-monorepo)
   - [Canary/Beta Release Strategy](#canarybeta-release-strategy)
   - [Communication Plan for Breaking Changes](#communication-plan-for-breaking-changes)
   - [Architect's Verdict](#architects-verdict-q6)

---

## Q4: Framework-Agnostic UI Component Library

### Problem Statement

> Design a UI Component Library that serves Angular, React, and Vue teams simultaneously
> across an enterprise with 10+ product teams. The library must provide a consistent UX,
> minimize maintenance burden, and allow teams to adopt it incrementally.

> 🎯 **Interview Tip:** Start by clarifying: "How many frameworks are in play today? Is there
> a dominant one? What's the appetite for migration?" This shapes whether you go full Web
> Components or a hybrid approach. Then lead with the architecture diagram.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Design Tokens (JSON/YAML)                    │
│              colors, spacing, typography, elevation             │
│         Source of truth: Figma Tokens → Style Dictionary        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ consumed by
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Core Web Components (Lit)                       │
│           <ds-button>, <ds-input>, <ds-modal>, <ds-card>        │
│           Shadow DOM + CSS Custom Properties + ARIA             │
│                                                                 │
│   packages/core/          ← Lit components (source of truth)    │
│   packages/tokens/        ← Design tokens (JSON → CSS/SCSS/TS) │
│   packages/icons/         ← SVG icon system                    │
└────────┬──────────────────┬──────────────────┬──────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Angular    │   │    React     │   │     Vue      │
│   Wrapper    │   │   Wrapper    │   │   Wrapper    │
│   Package    │   │   Package    │   │   Package    │
│              │   │              │   │              │
│ @ds/angular  │   │  @ds/react   │   │   @ds/vue    │
│              │   │              │   │              │
│ • NgModule   │   │ • forwardRef │   │ • defineComp │
│ • Signals    │   │ • useRef     │   │ • v-model    │
│ • Forms API  │   │ • Events     │   │ • Events     │
└──────────────┘   └──────────────┘   └──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Storybook Documentation                       │
│              Component playground + API docs + tokens            │
│              Deployed to: https://ds.corp.com                   │
└─────────────────────────────────────────────────────────────────┘
```

### Web Components (Lit) vs Framework-Specific Wrappers

> 🎯 **Interview Tip:** This is the first major decision point. Show you understand both
> approaches deeply before recommending one. The interviewer wants trade-off analysis, not dogma.

#### Approach Comparison

| Aspect | Web Components (Lit) + Wrappers | Framework-Specific (3× codebases) |
|--------|-------------------------------|-----------------------------------|
| Source of truth | Single Lit codebase | 3 separate implementations |
| Code duplication | ~15% (wrapper boilerplate) | ~70% (logic duplicated 3×) |
| Maintenance cost | 1 team maintains core + thin wrappers | 3 teams or 1 team × 3 effort |
| Bug fix propagation | Fix once in core → all frameworks get it | Fix 3 times, hope they stay in sync |
| Native framework feel | 90% native (wrappers bridge the gap) | 100% native |
| Form integration | Needs wrapper for Angular ReactiveForms | Native support per framework |
| SSR support | Improving (`@lit-labs/ssr`) | Mature per framework |
| Performance | Slight Shadow DOM overhead (~2ms) | Optimal per framework |
| Bundle size (button) | ~5KB (Lit runtime) + ~2KB (component) | ~1-3KB per framework |
| Testing | 1 core test suite + wrapper integration | 3 full test suites |
| Onboarding | Learn Lit once | Learn framework-specific patterns |
| Browser support | All modern browsers (native WC) | Depends on framework |
| Accessibility | Single a11y implementation | 3 a11y implementations to audit |

#### Why Lit Over Vanilla Web Components?

| Aspect | Vanilla Web Components | Lit |
|--------|----------------------|-----|
| Boilerplate | High — manual lifecycle, manual DOM | Minimal — decorators + reactive properties |
| Reactivity | Manual `attributeChangedCallback` | Built-in reactive properties with `@property()` |
| Templating | `innerHTML` or manual DOM manipulation | Tagged template literals (`html\`\``) with diffing |
| Bundle Size | 0 KB (native APIs) | ~5 KB gzipped (tiny runtime) |
| SSR Support | Limited | `@lit-labs/ssr` available |
| TypeScript | Manual typing for everything | First-class support with decorators |
| Update batching | Manual — each attribute change triggers render | Automatic — batches multiple property changes |
| Community | Fragmented | Strong ecosystem, Google-backed |

### Core Lit Web Component Implementation

> **What this code does:** This is the single source of truth for `<ds-button>`. It uses Lit's
> reactive properties, CSS custom properties for theming, Shadow DOM for style encapsulation,
> and ARIA attributes for accessibility. Every framework wrapper delegates to this component.

```typescript
// packages/core/src/components/ds-button/ds-button.ts
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@customElement('ds-button')
export class DsButton extends LitElement {
  // ─── Styles ──────────────────────────────────────────────
  // Three-tier token system: component → alias → global
  // Component tokens (--ds-button-*) override alias tokens (--ds-color-*)
  // which override global tokens (--ds-blue-500)
  static override styles = css`
    :host {
      display: inline-flex;
      /* Component tokens with alias fallbacks */
      --_bg: var(--ds-button-bg, var(--ds-color-primary-500));
      --_color: var(--ds-button-color, var(--ds-color-on-primary));
      --_padding-x: var(--ds-button-padding-x, var(--ds-spacing-4));
      --_padding-y: var(--ds-button-padding-y, var(--ds-spacing-2));
      --_radius: var(--ds-button-radius, var(--ds-radius-md));
      --_font-size: var(--ds-button-font-size, var(--ds-font-size-md));
      --_border: var(--ds-button-border, none);
    }

    :host([hidden]) { display: none; }

    button {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ds-spacing-2);
      background: var(--_bg);
      color: var(--_color);
      padding: var(--_padding-y) var(--_padding-x);
      border-radius: var(--_radius);
      font-size: var(--_font-size);
      font-family: var(--ds-font-family-sans);
      font-weight: var(--ds-font-weight-medium);
      border: var(--_border);
      cursor: pointer;
      transition: all var(--ds-transition-fast) ease;
      box-sizing: border-box;
      line-height: 1.5;
    }

    button:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ─── Variants ─── */
    :host([variant='secondary']) {
      --_bg: transparent;
      --_color: var(--ds-color-primary-500);
      --_border: 1px solid var(--ds-color-primary-500);
    }

    :host([variant='ghost']) {
      --_bg: transparent;
      --_color: var(--ds-color-primary-500);
    }

    :host([variant='danger']) {
      --_bg: var(--ds-color-danger-500);
      --_color: var(--ds-color-on-danger);
    }

    /* ─── Sizes ─── */
    :host([size='sm']) {
      --_padding-x: var(--ds-spacing-3);
      --_padding-y: var(--ds-spacing-1);
      --_font-size: var(--ds-font-size-sm);
    }

    :host([size='lg']) {
      --_padding-x: var(--ds-spacing-6);
      --_padding-y: var(--ds-spacing-3);
      --_font-size: var(--ds-font-size-lg);
    }

    /* ─── Loading State ─── */
    .spinner {
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 600ms linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // ─── Reactive Properties ─────────────────────────────────
  @property({ reflect: true }) variant: ButtonVariant = 'primary';
  @property({ reflect: true }) size: ButtonSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  // ─── Render ──────────────────────────────────────────────
  override render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        part="button"
      >
        ${this.loading
          ? html`<span class="spinner" role="status" aria-label="Loading">
                   <span class="sr-only">Loading...</span>
                 </span>`
          : nothing}
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </button>
    `;
  }
}

// Type augmentation for HTML tag map
declare global {
  interface HTMLElementTagNameMap {
    'ds-button': DsButton;
  }
}
```

```typescript
// packages/core/src/components/ds-button/ds-button.test.ts
// Core component tests — run once, cover all frameworks
import { fixture, html, expect } from '@open-wc/testing';
import './ds-button.js';
import type { DsButton } from './ds-button.js';

describe('ds-button', () => {
  it('renders with default props', async () => {
    const el = await fixture<DsButton>(html`<ds-button>Click me</ds-button>`);
    expect(el.variant).to.equal('primary');
    expect(el.size).to.equal('md');
    expect(el.disabled).to.be.false;
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<DsButton>(
      html`<ds-button variant="danger">Delete</ds-button>`
    );
    expect(el.getAttribute('variant')).to.equal('danger');
  });

  it('disables button when loading', async () => {
    const el = await fixture<DsButton>(
      html`<ds-button loading>Save</ds-button>`
    );
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.disabled).to.be.true;
    expect(button.getAttribute('aria-busy')).to.equal('true');
  });

  it('supports keyboard activation', async () => {
    let clicked = false;
    const el = await fixture<DsButton>(
      html`<ds-button @click=${() => (clicked = true)}>Go</ds-button>`
    );
    const button = el.shadowRoot!.querySelector('button')!;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  });
});
```

### The Wrapper Pattern: Angular & React Consumers

> **Why wrappers?** Web Components have friction points with frameworks:
> - Angular: `CUSTOM_ELEMENTS_SCHEMA` bypasses template type-checking, no ReactiveForms support
> - React: Poor event handling (React's synthetic events don't work with CustomEvents), property vs attribute confusion
> - Vue: Best native WC support, but still benefits from typed wrappers
>
> The wrapper pattern: Lit base component (logic + styles) → thin framework wrapper (DX + type safety)

```
┌─────────────────────────────────────────────────────────┐
│                    Lit Core Component                    │
│                                                         │
│  • All business logic                                   │
│  • All styles (CSS custom properties)                   │
│  • All accessibility (ARIA)                             │
│  • All tests (single suite)                             │
│                                                         │
│  This is the SOURCE OF TRUTH                            │
└────────┬──────────────────┬──────────────────┬──────────┘
         │                  │                  │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ Angular │       │  React  │       │   Vue   │
    │ Wrapper │       │ Wrapper │       │ Wrapper │
    │         │       │         │       │         │
    │ ~30 LOC │       │ ~40 LOC │       │ ~25 LOC │
    │ per     │       │ per     │       │ per     │
    │ component│      │component│       │component│
    │         │       │         │       │         │
    │ Adds:   │       │ Adds:   │       │ Adds:   │
    │ • Types │       │ • Ref   │       │ • Props │
    │ • Forms │       │ • Events│       │ • Emits │
    │ • I/O   │       │ • Types │       │ • Slots │
    └─────────┘       └─────────┘       └─────────┘
```

#### Angular Wrapper

```typescript
// packages/angular/src/lib/button/ds-button.component.ts
import {
  Component, Input, Output, EventEmitter,
  CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy,
  forwardRef, ElementRef, inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ButtonVariant, ButtonSize } from '@ds/core';
// Side-effect import registers the custom element
import '@ds/core/ds-button';

@Component({
  selector: 'ds-button',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-button
      [attr.variant]="variant"
      [attr.size]="size"
      [attr.disabled]="disabled || null"
      [attr.loading]="loading || null"
      [attr.type]="type"
      (click)="handleClick($event)"
    >
      <ng-content select="[slot=prefix]" slot="prefix" />
      <ng-content />
      <ng-content select="[slot=suffix]" slot="suffix" />
    </ds-button>
  `,
  styles: [`:host { display: inline-flex; }`],
})
export class DsButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() dsClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.dsClick.emit(event);
    }
  }
}
```

#### React Wrapper

```tsx
// packages/react/src/components/DsButton.tsx
import React, { useRef, useEffect, forwardRef, useCallback } from 'react';
import type { ButtonVariant, ButtonSize } from '@ds/core';
import '@ds/core/ds-button';

// Augment JSX for the web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ds-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: ButtonVariant;
          size?: ButtonSize;
          disabled?: boolean;
          loading?: boolean;
          type?: 'button' | 'submit' | 'reset';
        },
        HTMLElement
      >;
    }
  }
}

export interface DsButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DsButton = forwardRef<HTMLElement, DsButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      type = 'button',
      onClick,
      children,
      className,
      style,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLElement>) || innerRef;

    // Bridge native DOM events to React callback
    // React's synthetic event system doesn't handle WC events properly
    useEffect(() => {
      const el = resolvedRef.current;
      if (!el || !onClick) return;

      const handler = (e: Event) => onClick(e as MouseEvent);
      el.addEventListener('click', handler);
      return () => el.removeEventListener('click', handler);
    }, [onClick, resolvedRef]);

    return (
      <ds-button
        ref={resolvedRef}
        variant={variant}
        size={size}
        disabled={disabled || undefined}
        loading={loading || undefined}
        type={type}
        className={className}
        style={style}
      >
        {children}
      </ds-button>
    );
  }
);

DsButton.displayName = 'DsButton';
```

#### Consumer DX — How Angular and React Teams Use the Same Component

```typescript
// ─── Angular Consumer ──────────────────────────────────────
// app.component.ts
import { Component } from '@angular/core';
import { DsButtonComponent } from '@ds/angular/button';

@Component({
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <ds-button
      variant="primary"
      size="lg"
      [loading]="isSaving"
      [disabled]="!form.valid"
      (dsClick)="onSave()"
    >
      Save Changes
    </ds-button>

    <ds-button variant="ghost" (dsClick)="onCancel()">
      Cancel
    </ds-button>

    <ds-button variant="danger" (dsClick)="onDelete()">
      <lucide-icon slot="prefix" name="trash" />
      Delete Account
    </ds-button>
  `
})
export class SettingsPageComponent {
  isSaving = false;
  form = inject(FormBuilder).group({ /* ... */ });

  async onSave(): Promise<void> {
    this.isSaving = true;
    await this.settingsService.save(this.form.value);
    this.isSaving = false;
  }
}
```

```tsx
// ─── React Consumer ────────────────────────────────────────
// SettingsPage.tsx
import { useState } from 'react';
import { DsButton } from '@ds/react';

export function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await settingsService.save(formData);
    setIsSaving(false);
  };

  return (
    <div>
      <DsButton
        variant="primary"
        size="lg"
        loading={isSaving}
        disabled={!isFormValid}
        onClick={handleSave}
      >
        Save Changes
      </DsButton>

      <DsButton variant="ghost" onClick={handleCancel}>
        Cancel
      </DsButton>

      <DsButton variant="danger" onClick={handleDelete}>
        <LucideIcon slot="prefix" name="trash" />
        Delete Account
      </DsButton>
    </div>
  );
}
```

### Design Token Architecture (Global → Alias → Component)

```
┌──────────────────────────────────────────────────────────────────┐
│  TIER 1: GLOBAL TOKENS (Primitives)                              │
│  Raw values — never used directly in components                  │
│                                                                  │
│  --ds-blue-50:  #EFF6FF     --ds-spacing-0:  0                  │
│  --ds-blue-100: #DBEAFE     --ds-spacing-1:  0.25rem            │
│  --ds-blue-500: #3B82F6     --ds-spacing-2:  0.5rem             │
│  --ds-blue-900: #1E3A8A     --ds-spacing-4:  1rem               │
│  --ds-red-500:  #EF4444     --ds-spacing-8:  2rem               │
│  --ds-gray-50:  #F9FAFB     --ds-font-size-sm: 0.875rem         │
│  --ds-gray-900: #111827     --ds-font-size-md: 1rem             │
│  --ds-white:    #FFFFFF     --ds-font-size-lg: 1.125rem         │
└──────────────────────┬───────────────────────────────────────────┘
                       │ referenced by
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  TIER 2: ALIAS TOKENS (Semantic)                                 │
│  Intent-based — "what it means" not "what it looks like"         │
│                                                                  │
│  --ds-color-primary-500:   var(--ds-blue-500)                    │
│  --ds-color-on-primary:    var(--ds-white)                       │
│  --ds-color-danger-500:    var(--ds-red-500)                     │
│  --ds-color-bg-surface:    var(--ds-white)          ← light mode │
│  --ds-color-bg-surface:    var(--ds-gray-900)       ← dark mode  │
│  --ds-color-text-primary:  var(--ds-gray-900)                    │
│  --ds-color-focus-ring:    var(--ds-blue-500)                    │
│  --ds-radius-md:           0.375rem                              │
│  --ds-shadow-lg:           0 10px 15px -3px rgb(0 0 0 / 0.1)    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ referenced by
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  TIER 3: COMPONENT TOKENS (Scoped)                               │
│  Component-specific overrides — maximum flexibility               │
│                                                                  │
│  --ds-button-bg:       var(--ds-color-primary-500)               │
│  --ds-button-color:    var(--ds-color-on-primary)                │
│  --ds-button-radius:   var(--ds-radius-md)                       │
│  --ds-button-padding-x: var(--ds-spacing-4)                     │
│  --ds-card-bg:         var(--ds-color-bg-surface)                │
│  --ds-card-shadow:     var(--ds-shadow-lg)                       │
│  --ds-card-radius:     var(--ds-radius-lg)                       │
│  --ds-input-border:    var(--ds-color-border-default)            │
│  --ds-input-focus:     var(--ds-color-focus-ring)                │
└──────────────────────────────────────────────────────────────────┘
```

**Why three tiers?**

| Scenario | Without tiers | With tiers |
|----------|--------------|------------|
| Rebrand (blue → purple) | Find/replace 200+ files | Change 1 global token |
| Dark mode | Duplicate all component styles | Swap alias tokens at `:root` |
| One-off button override | `!important` hacks | Set `--ds-button-bg` on parent |
| New brand/white-label | Fork entire library | New alias token set |

### Versioning & Semver Strategy

```
Package Structure (Nx Monorepo):
─────────────────────────────────

@ds/tokens     → 1.4.0   (design tokens — CSS, SCSS, TS)
@ds/core       → 2.1.0   (Lit web components)
@ds/angular    → 2.1.0   (Angular wrappers — version-locked to core)
@ds/react      → 2.1.0   (React wrappers — version-locked to core)
@ds/vue        → 2.1.0   (Vue wrappers — version-locked to core)
@ds/icons      → 1.2.0   (SVG icon package)
@ds/storybook  → 2.1.0   (Storybook config + stories)

Versioning Rules:
─────────────────
• @ds/core, @ds/angular, @ds/react, @ds/vue share the SAME major.minor
• @ds/tokens is independently versioned (token changes ≠ component changes)
• @ds/icons is independently versioned
• Wrapper packages have peerDependency on @ds/core (same major.minor)
```

```json
// packages/angular/package.json
{
  "name": "@ds/angular",
  "version": "2.1.0",
  "peerDependencies": {
    "@ds/core": "~2.1.0",
    "@ds/tokens": "^1.0.0",
    "@angular/core": "^17.0.0 || ^18.0.0",
    "@angular/common": "^17.0.0 || ^18.0.0"
  }
}
```

### Storybook-Driven Documentation

```typescript
// packages/storybook/src/stories/ds-button.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '@ds/core/ds-button';

const meta: Meta = {
  title: 'Components/Button',
  component: 'ds-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: 'ButtonVariant' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/file/xxx/DS?node-id=123:456',
    },
    docs: {
      description: {
        component: `
## Usage

The Button component supports multiple variants, sizes, and states.
It uses CSS custom properties for theming and can be customized at
the component token level.

### Angular
\`\`\`html
<ds-button variant="primary" (dsClick)="save()">Save</ds-button>
\`\`\`

### React
\`\`\`tsx
<DsButton variant="primary" onClick={save}>Save</DsButton>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  args: { variant: 'primary', size: 'md' },
  render: (args) => html`
    <ds-button variant=${args.variant} size=${args.size}>
      Click Me
    </ds-button>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <ds-button variant="primary">Primary</ds-button>
      <ds-button variant="secondary">Secondary</ds-button>
      <ds-button variant="ghost">Ghost</ds-button>
      <ds-button variant="danger">Danger</ds-button>
    </div>
  `,
};

export const Loading: Story = {
  render: () => html`
    <ds-button variant="primary" loading>Saving...</ds-button>
  `,
};
```

### Tree-Shaking via Secondary Entry Points

> **Problem:** If a team only uses `<ds-button>`, they shouldn't download the code for
> `<ds-modal>`, `<ds-data-table>`, and 40 other components.
>
> **Solution:** Secondary entry points. Each component is a separate importable path.

```
Package Structure:
──────────────────

@ds/core/
├── package.json          ← Main entry (re-exports everything)
├── ds-button/
│   ├── package.json      ← Secondary entry point
│   └── index.js          ← Only button code
├── ds-input/
│   ├── package.json
│   └── index.js
├── ds-modal/
│   ├── package.json
│   └── index.js
└── ds-card/
    ├── package.json
    └── index.js
```

```json
// packages/core/package.json
{
  "name": "@ds/core",
  "version": "2.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./ds-button": {
      "types": "./dist/components/ds-button/index.d.ts",
      "default": "./dist/components/ds-button/index.js"
    },
    "./ds-input": {
      "types": "./dist/components/ds-input/index.d.ts",
      "default": "./dist/components/ds-input/index.js"
    },
    "./ds-modal": {
      "types": "./dist/components/ds-modal/index.d.ts",
      "default": "./dist/components/ds-modal/index.js"
    }
  },
  "sideEffects": [
    "./dist/components/*/index.js"
  ]
}
```

```typescript
// ─── Tree-shakeable import (GOOD) ───
// Only loads button code (~2KB)
import '@ds/core/ds-button';

// ─── Full import (BAD for bundle size) ───
// Loads ALL components (~150KB)
import '@ds/core';
```

```json
// packages/angular/package.json — Angular uses ng-packagr secondary entry points
{
  "name": "@ds/angular",
  "exports": {
    "./button": {
      "types": "./button/index.d.ts",
      "default": "./fesm2022/ds-angular-button.mjs"
    },
    "./input": {
      "types": "./input/index.d.ts",
      "default": "./fesm2022/ds-angular-input.mjs"
    }
  }
}
```

```typescript
// Angular consumer — tree-shakeable
import { DsButtonComponent } from '@ds/angular/button';
import { DsInputComponent } from '@ds/angular/input';
// Only button + input code is bundled. Modal, card, etc. are excluded.
```

### Architect's Verdict (Q4)

> **Recommended approach:** Lit-based Web Components with thin framework wrappers.
>
> **Why:** With 3+ frameworks in play, maintaining a single source of truth is non-negotiable.
> The ~15% wrapper overhead is dramatically cheaper than 3× code duplication. The wrapper pattern
> gives you 90% native DX with 30% of the maintenance cost.
>
> **Key decisions:**
> - Lit for core (5KB runtime, reactive properties, Shadow DOM)
> - Three-tier token system (global → alias → component) for theming flexibility
> - Secondary entry points for tree-shaking (teams only pay for what they use)
> - Storybook as the single documentation hub with Figma integration
> - Version-lock wrapper packages to core (same major.minor)
> - Invest in wrapper quality: TypeScript types, form integration, event bridging
>
> **The 80/20 rule:** 80% of the effort goes into the Lit core. 20% goes into wrappers.
> If you find yourself writing significant logic in wrappers, your core abstraction is wrong.

---
