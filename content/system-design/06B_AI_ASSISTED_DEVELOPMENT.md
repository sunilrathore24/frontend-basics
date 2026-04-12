# 06B — AI-Assisted Development & Agentic Workflows

## Principal/Architect-Level Frontend System Design — Question 16

> This document covers the design of AI-assisted development workflows for enterprise Angular teams,
> including MCP server architecture, code review guardrails, prompt engineering standards,
> and productivity measurement frameworks.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [High-Level Architecture — AI-Assisted Development Stack](#high-level-architecture)
3. [IDE Integration — Copilot, Amazon Q, and Kiro](#ide-integration)
4. [MCP Server Architecture for Codebase Context](#mcp-server-architecture)
5. [AI Code Review Pipeline Design](#ai-code-review-pipeline-design)
6. [Guardrails — What AI Can and Cannot Do](#guardrails)
7. [Prompt Engineering Standards](#prompt-engineering-standards)
8. [Productivity Measurement Framework](#productivity-measurement-framework)
9. [Adoption Strategy — Phased Rollout](#adoption-strategy)
10. [Trade-Offs Table](#trade-offs-table)
11. [Architect's Verdict](#architects-verdict)

---

## Problem Statement

> **Q16**: You are tasked with integrating an Agentic AI development workflow into an Angular
> engineering team of 20. Design the tooling, guardrails, and adoption strategy.

The team operates an Nx monorepo with 12 libraries, 4 micro-frontends, and a shared design
system. The codebase has 350K+ lines of TypeScript, strict ESLint rules, 78% test coverage,
and a mature CI/CD pipeline. Leadership wants measurable productivity gains without
compromising code quality, security posture, or developer autonomy.

This is not a "turn on Copilot and hope for the best" problem. It requires:
- Structured codebase context delivery to LLMs (MCP servers)
- Guardrails that catch AI hallucinations before they reach production
- Prompt engineering standards so 20 developers get consistent AI output
- A measurement framework that separates signal from noise
- A phased rollout that builds trust incrementally

---

## High-Level Architecture

The AI-assisted development stack operates across five layers. Each layer addresses a
different failure mode of naive AI integration:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                  AI-ASSISTED DEVELOPMENT — FIVE-LAYER STACK                      │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 5: GOVERNANCE & MEASUREMENT                                        │  │
│  │  • Productivity dashboards       • A/B sprint comparisons                 │  │
│  │  • AI code ratio tracking        • Developer satisfaction surveys         │  │
│  │  • ROI reporting to leadership   • Quarterly policy reviews               │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                     ▲                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: CI/CD VALIDATION GATES                                          │  │
│  │  • AI-specific lint rules        • Contract testing (hallucination catch)  │  │
│  │  • Bundle size delta checks      • Mandatory human review enforcement     │  │
│  │  • Security scanning (SAST)      • AI-generated code labeling             │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                     ▲                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: AGENTIC WORKFLOWS                                               │  │
│  │  • Component scaffolding agent   • Test generation agent                  │  │
│  │  • Migration agent (v18→v19)     • Documentation agent                    │  │
│  │  • PR description agent          • Code review assistant agent            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                     ▲                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: MCP SERVERS (Codebase Context)                                  │  │
│  │  • Component registry + APIs     • Design token definitions               │  │
│  │  • OpenAPI contract schemas      • Nx project graph + dependencies        │  │
│  │  • Architecture Decision Records • ESLint/Prettier configurations         │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                     ▲                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: IDE INTEGRATION                                                 │  │
│  │  • GitHub Copilot (completions)  • Amazon Q Developer (AWS-aware)         │  │
│  │  • Kiro (spec-driven features)   • VS Code workspace settings             │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Why five layers**: Each layer catches a different class of failure. Layer 1 catches
productivity friction (wrong tool for the task). Layer 2 catches context starvation
(AI generates generic code instead of project-specific code). Layer 3 catches workflow
gaps (repetitive tasks that should be automated). Layer 4 catches quality regressions
(hallucinated APIs, security issues). Layer 5 catches organizational blind spots
(are we actually faster, or just generating more code to review?).

---

## IDE Integration

### Tool Selection Matrix

The team doesn't pick one AI tool — they layer them by use case:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    IDE TOOL SELECTION BY USE CASE                             │
│                                                                              │
│  Use Case                    │ Primary Tool    │ Why                         │
│  ────────────────────────────┼─────────────────┼──────────────────────────── │
│  Inline completions          │ GitHub Copilot  │ Best autocomplete UX        │
│  Boilerplate (services, etc) │ GitHub Copilot  │ Pattern recognition          │
│  New feature (spec → code)   │ Kiro            │ Requirements traceability    │
│  Codebase-wide refactoring   │ Amazon Q / Kiro │ Full-repo context window     │
│  AWS service integration     │ Amazon Q        │ AWS SDK expertise            │
│  Test generation             │ Copilot + Kiro  │ Both strong at test patterns │
│  Documentation               │ Kiro            │ Spec-driven doc generation   │
│  Debugging                   │ Amazon Q        │ CloudWatch + log analysis    │
│  Code review assistance      │ Amazon Q        │ Security scanning built-in   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Team-Wide VS Code Configuration

```json
// .vscode/settings.json — Checked into repo, enforced for all 20 developers
{
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "yaml": true,
    "json": true
  },
  "github.copilot.advanced": {
    "inlineSuggestCount": 3
  },

  "amazon-q.telemetry": false,
  "amazon-q.shareContentWithAWS": false,

  "editor.inlineSuggest.enabled": true,
  "editor.inlineSuggest.showToolbar": "onHover",

  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.component.ts": "${capture}.component.html,${capture}.component.scss,${capture}.component.spec.ts",
    "*.service.ts": "${capture}.service.spec.ts"
  },

  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  }
}
```

### GitHub Copilot Custom Instructions

```markdown
<!-- .github/copilot-instructions.md — Repository-level Copilot context -->
# Project Context for GitHub Copilot

This is an Angular 19+ enterprise platform built as an Nx monorepo.

## Mandatory Patterns
- ALL components use `ChangeDetectionStrategy.OnPush`
- ALL components are `standalone: true`
- Use signal-based inputs: `input()`, `input.required()`
- Use signal-based outputs: `output()`
- Use `inject()` for DI — never constructor injection
- Use design tokens via CSS custom properties: `var(--ds-*)`
- Include `data-testid` attributes on interactive elements
- Include ARIA attributes for accessibility

## Forbidden Patterns
- Never use `any` type — use `unknown` with type guards
- Never use `subscribe()` in components — use `async` pipe or `toSignal()`
- Never hardcode colors, spacing, or font sizes — use design tokens
- Never import from relative paths outside the current library boundary
- Never use `console.log` in production code — use the LoggerService

## Project Structure
- `apps/` — Micro-frontend applications (shell, catalog, checkout, account)
- `libs/design-system/` — Shared UI components with design tokens
- `libs/shared/models/` — Interfaces, DTOs, enums
- `libs/shared/data-access/` — Base HTTP services, API clients
- `libs/shared/util/` — Pure functions, pipes, validators
- `libs/features/` — Domain-specific feature libraries

## Testing
- Jest for unit tests, Angular Testing Library for component tests
- Playwright for E2E tests
- Minimum 80% coverage per library
- Use `render()` + `screen` from @testing-library/angular
```

### Amazon Q Developer Configuration

```json
// .amazonq/configuration.json — Team-wide Amazon Q settings
{
  "version": "1.0",
  "project": {
    "name": "enterprise-angular-platform",
    "framework": "angular",
    "language": "typescript",
    "buildTool": "nx"
  },
  "codeReferences": {
    "enabled": true,
    "action": "BLOCK"
  },
  "security": {
    "scanOnSave": true,
    "scanOnOpen": false,
    "severityThreshold": "MEDIUM"
  },
  "customizations": {
    "profileArn": "arn:aws:codewhisperer:us-east-1:123456789:profile/angular-team"
  }
}
```

**Why Amazon Q alongside Copilot**: Amazon Q provides security scanning (SAST) that Copilot
doesn't. For teams deploying to AWS (CloudFront, S3, Lambda@Edge for SSR), Q understands
AWS SDK patterns and IAM policies. Copilot is better at general TypeScript/Angular completions.
They complement each other — Q for infrastructure-adjacent code, Copilot for application code.

---

## MCP Server Architecture

MCP (Model Context Protocol) servers solve the #1 problem with AI code generation:
**context starvation**. Without structured context, AI tools generate generic Angular code.
With MCP, they generate code that follows your team's specific patterns, uses your design
tokens, and matches your API contracts.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        MCP SERVER ARCHITECTURE                                   │
│                                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                                │
│  │ Dev IDE  │     │ Dev IDE  │     │ Dev IDE  │    20 developers                │
│  │ (Kiro)   │     │ (Copilot)│     │ (Q Dev)  │                                │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘                                │
│       │                │                │                                        │
│       └────────────────┼────────────────┘                                        │
│                        │ stdio / SSE                                             │
│                        ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    MCP SERVER CLUSTER                                       │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │ │
│  │  │  angular-components │  │  design-tokens       │  │  api-contracts    │  │ │
│  │  │  ─────────────────  │  │  ─────────────────   │  │  ───────────────  │  │ │
│  │  │  Tools:             │  │  Tools:              │  │  Tools:           │  │ │
│  │  │  • getComponentAPI  │  │  • getTokens         │  │  • getEndpoint    │  │ │
│  │  │  • getComponentDeps │  │  • getTokenUsage     │  │  • getSchema      │  │ │
│  │  │  • searchComponents │  │  • validateTokenUse  │  │  • validateTypes  │  │ │
│  │  │  • getTemplateSlots │  │  • getBreakpoints    │  │  • listEndpoints  │  │ │
│  │  └─────────┬───────────┘  └─────────┬───────────┘  └────────┬──────────┘  │ │
│  │            │                        │                       │              │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │ │
│  │  │  nx-workspace       │  │  architecture-docs  │  │  code-patterns    │  │ │
│  │  │  ─────────────────  │  │  ─────────────────  │  │  ───────────────  │  │ │
│  │  │  Tools:             │  │  Tools:             │  │  Tools:           │  │ │
│  │  │  • getProjectGraph  │  │  • getADR           │  │  • getPattern     │  │ │
│  │  │  • getAffectedLibs  │  │  • searchDocs       │  │  • searchExamples │  │ │
│  │  │  • getLibBoundaries │  │  • getStyleGuide    │  │  • getAntiPattern │  │ │
│  │  └─────────┬───────────┘  └─────────┬───────────┘  └────────┬──────────┘  │ │
│  │            │                        │                       │              │ │
│  └────────────┴────────────────────────┴───────────────────────┴──────────────┘ │
│                                        │                                         │
│                        ┌───────────────▼───────────────────┐                    │
│                        │  Angular Nx Monorepo (350K+ LoC)  │                    │
│                        │  ├─ apps/ (4 MFEs)                │                    │
│                        │  ├─ libs/ (12 libraries)          │                    │
│                        │  ├─ docs/ (ADRs, style guides)    │                    │
│                        │  └─ tools/ (scripts, MCP servers) │                    │
│                        └───────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### MCP Server Implementation — Component Registry

```typescript
// tools/mcp-servers/component-registry/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'fast-glob';

const WORKSPACE = process.env['WORKSPACE_ROOT'] || process.cwd();

const server = new McpServer({
  name: 'angular-component-registry',
  version: '2.0.0',
  description: 'Provides structured Angular component metadata to AI tools'
});

// ── Tool: Get component public API with full type information ──
server.tool(
  'getComponentAPI',
  'Returns inputs, outputs, selectors, and dependency info for an Angular component',
  {
    componentName: z.string().describe('PascalCase name, e.g. DataTableComponent'),
    includeTemplate: z.boolean().optional().describe('Include template structure')
  },
  async ({ componentName, includeTemplate }) => {
    const kebab = toKebabCase(componentName);
    const files = await glob.glob(
      `libs/**/src/**/${kebab}.component.ts`,
      { cwd: WORKSPACE, absolute: true }
    );

    if (files.length === 0) {
      return { content: [{ type: 'text', text: `Component "${componentName}" not found in libs/` }] };
    }

    const source = fs.readFileSync(files[0], 'utf-8');
    const dir = path.dirname(files[0]);

    // Extract component metadata
    const selectorMatch = source.match(/selector:\s*['"]([^'"]+)['"]/);
    const inputs = extractSignalInputs(source);
    const outputs = extractSignalOutputs(source);
    const injections = extractInjections(source);
    const imports = extractStandaloneImports(source);

    let templateInfo = '';
    if (includeTemplate) {
      const templateFile = path.join(dir, `${kebab}.component.html`);
      if (fs.existsSync(templateFile)) {
        templateInfo = fs.readFileSync(templateFile, 'utf-8');
      }
    }

    const result: Record<string, unknown> = {
      component: componentName,
      selector: selectorMatch?.[1] || 'unknown',
      file: path.relative(WORKSPACE, files[0]),
      inputs,
      outputs,
      injectedServices: injections,
      standaloneImports: imports,
      changeDetection: 'OnPush',
      guidelines: [
        'Use the exact selector shown above in templates',
        'Pass required inputs — component will throw if missing',
        'Use design tokens for any styling overrides',
        'Add data-testid for test selectors'
      ]
    };

    if (templateInfo) {
      result['template'] = templateInfo;
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }
);

// ── Tool: Search components by capability ──
server.tool(
  'searchComponents',
  'Find components by description, tag, or capability',
  {
    query: z.string().describe('Search term, e.g. "table", "modal", "form field"'),
    library: z.string().optional().describe('Limit to specific library, e.g. "design-system"')
  },
  async ({ query, library }) => {
    const pattern = library
      ? `libs/${library}/**/src/**/*.component.ts`
      : `libs/**/src/**/*.component.ts`;

    const files = await glob.glob(pattern, { cwd: WORKSPACE, absolute: true });
    const matches: Array<{ name: string; selector: string; file: string }> = [];

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file, '.component.ts');

      if (
        fileName.includes(query.toLowerCase()) ||
        source.toLowerCase().includes(query.toLowerCase())
      ) {
        const selectorMatch = source.match(/selector:\s*['"]([^'"]+)['"]/);
        matches.push({
          name: toPascalCase(fileName) + 'Component',
          selector: selectorMatch?.[1] || 'unknown',
          file: path.relative(WORKSPACE, file)
        });
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          results: matches,
          count: matches.length,
          tip: 'Use getComponentAPI with the component name for full details'
        }, null, 2)
      }]
    };
  }
);

// ── Tool: Get library dependency boundaries ──
server.tool(
  'getLibraryBoundaries',
  'Returns which libraries can import from which — prevents AI from generating invalid imports',
  { libraryName: z.string().describe('Library name, e.g. "design-system" or "features/catalog"') },
  async ({ libraryName }) => {
    const projectJsonPath = path.join(WORKSPACE, `libs/${libraryName}/project.json`);
    if (!fs.existsSync(projectJsonPath)) {
      return { content: [{ type: 'text', text: `Library "${libraryName}" not found` }] };
    }

    const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    const tags = projectJson.tags || [];

    // Nx enforce-module-boundaries rules
    const eslintPath = path.join(WORKSPACE, '.eslintrc.json');
    const eslint = JSON.parse(fs.readFileSync(eslintPath, 'utf-8'));
    const boundaries = eslint.overrides?.find(
      (o: any) => o.rules?.['@nx/enforce-module-boundaries']
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          library: libraryName,
          tags,
          boundaries: boundaries?.rules?.['@nx/enforce-module-boundaries']?.[1] || {},
          warning: 'AI-generated imports MUST respect these boundaries. Cross-boundary imports will fail lint.'
        }, null, 2)
      }]
    };
  }
);

// ── Resource: Expose full component catalog ──
server.resource(
  'component-catalog',
  'components://catalog',
  async (uri) => {
    const files = await glob.glob(
      'libs/**/src/**/!(*.spec|*.stories).component.ts',
      { cwd: WORKSPACE }
    );

    const catalog = files.map(f => ({
      name: toPascalCase(path.basename(f, '.component.ts')) + 'Component',
      path: f,
      library: f.split('/')[1]
    }));

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({ components: catalog, total: catalog.length }, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);

// ── Helpers ──
function toKebabCase(str: string): string {
  return str.replace(/Component$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function extractSignalInputs(source: string): Array<{ name: string; type: string; required: boolean }> {
  const inputs: Array<{ name: string; type: string; required: boolean }> = [];

  // Signal inputs: name = input<Type>() or input.required<Type>()
  const signalPattern = /(\w+)\s*=\s*input(?:\.required)?<([^>]+)>\(/g;
  for (const match of source.matchAll(signalPattern)) {
    inputs.push({
      name: match[1],
      type: match[2],
      required: match[0].includes('.required')
    });
  }

  // Decorator inputs: @Input() name: Type
  const decoratorPattern = /@Input\(\)\s+(\w+)\s*[?!]?\s*:\s*([^;=]+)/g;
  for (const match of source.matchAll(decoratorPattern)) {
    inputs.push({ name: match[1], type: match[2].trim(), required: !match[0].includes('?') });
  }

  return inputs;
}

function extractSignalOutputs(source: string): Array<{ name: string; eventType: string }> {
  const outputs: Array<{ name: string; eventType: string }> = [];

  const signalPattern = /(\w+)\s*=\s*output<([^>]*)>\(/g;
  for (const match of source.matchAll(signalPattern)) {
    outputs.push({ name: match[1], eventType: match[2] || 'void' });
  }

  const decoratorPattern = /@Output\(\)\s+(\w+)\s*=\s*new\s+EventEmitter<([^>]*)>/g;
  for (const match of source.matchAll(decoratorPattern)) {
    outputs.push({ name: match[1], eventType: match[2] || 'void' });
  }

  return outputs;
}

function extractInjections(source: string): string[] {
  const pattern = /inject\((\w+)\)/g;
  return [...source.matchAll(pattern)].map(m => m[1]);
}

function extractStandaloneImports(source: string): string[] {
  const importsMatch = source.match(/imports:\s*\[([^\]]+)\]/);
  if (!importsMatch) return [];
  return importsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
}

// ── Start ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### MCP Server — Design Token Provider

```typescript
// tools/mcp-servers/design-tokens/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE = process.env['WORKSPACE_ROOT'] || process.cwd();
const TOKEN_PATH = process.env['TOKEN_FILE'] || 'libs/design-system/src/tokens/tokens.json';

const server = new McpServer({
  name: 'design-token-provider',
  version: '1.0.0'
});

server.tool(
  'getDesignTokens',
  'Returns design tokens for consistent styling — AI must use these instead of hardcoded values',
  {
    category: z.enum(['colors', 'spacing', 'typography', 'breakpoints', 'elevation', 'motion', 'all']),
    variant: z.string().optional().describe('Specific variant, e.g. "primary", "error", "heading"')
  },
  async ({ category, variant }) => {
    const tokenFile = path.join(WORKSPACE, TOKEN_PATH);
    const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));

    let result = category === 'all' ? tokens : tokens[category];
    if (variant && result) {
      result = result[variant] || result;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tokens: result,
          usage: {
            css: 'var(--ds-color-primary)',
            scss: '$ds-color-primary (mapped from tokens)',
            typescript: "inject(DesignTokenService).getToken('color.primary')"
          },
          rules: [
            'NEVER hardcode hex/rgb values — always use var(--ds-*)',
            'NEVER hardcode px values for spacing — use var(--ds-space-*)',
            'NEVER hardcode font sizes — use var(--ds-font-size-*)',
            'Breakpoints use the BreakpointObserver from @angular/cdk/layout'
          ]
        }, null, 2)
      }]
    };
  }
);

server.tool(
  'validateTokenUsage',
  'Checks if a CSS/SCSS snippet uses design tokens correctly',
  { cssContent: z.string().describe('CSS or SCSS content to validate') },
  async ({ cssContent }) => {
    const violations: string[] = [];

    // Check for hardcoded colors
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
    const rgbPattern = /rgba?\([^)]+\)/g;
    const hslPattern = /hsla?\([^)]+\)/g;

    for (const match of cssContent.matchAll(hexPattern)) {
      violations.push(`Hardcoded color "${match[0]}" — use var(--ds-color-*) instead`);
    }
    for (const match of cssContent.matchAll(rgbPattern)) {
      violations.push(`Hardcoded color "${match[0]}" — use var(--ds-color-*) instead`);
    }
    for (const match of cssContent.matchAll(hslPattern)) {
      violations.push(`Hardcoded color "${match[0]}" — use var(--ds-color-*) instead`);
    }

    // Check for hardcoded spacing (px values not in var())
    const pxPattern = /(?<!var\([^)]*)\b\d+px\b/g;
    for (const match of cssContent.matchAll(pxPattern)) {
      if (!match[0].startsWith('0') && match[0] !== '1px') {
        violations.push(`Hardcoded spacing "${match[0]}" — use var(--ds-space-*) instead`);
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: violations.length === 0,
          violations,
          suggestion: violations.length > 0
            ? 'Replace hardcoded values with design tokens from getDesignTokens tool'
            : 'All values use design tokens correctly'
        }, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### MCP Configuration — Workspace Setup

```json
// .kiro/mcp.json — Connects all MCP servers to AI tools
{
  "mcpServers": {
    "angular-components": {
      "command": "npx",
      "args": ["tsx", "tools/mcp-servers/component-registry/src/index.ts"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}"
      }
    },
    "design-tokens": {
      "command": "npx",
      "args": ["tsx", "tools/mcp-servers/design-tokens/src/index.ts"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "TOKEN_FILE": "libs/design-system/src/tokens/tokens.json"
      }
    },
    "api-contracts": {
      "command": "npx",
      "args": ["tsx", "tools/mcp-servers/api-contracts/src/index.ts"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "OPENAPI_SPEC": "libs/shared/api-contracts/openapi.yaml"
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
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```


### MCP Security Policy

```typescript
// tools/mcp-servers/shared/security.ts
// Centralized security policy for all MCP servers

export const MCP_SECURITY_POLICY = {
  // ✅ SAFE TO EXPOSE — improves AI output quality
  allowedPaths: [
    'libs/**/src/**/*.ts',           // Component source code
    'libs/**/src/**/*.html',         // Templates
    'libs/**/src/**/*.scss',         // Styles (for token validation)
    'libs/**/src/**/index.ts',       // Public API barrels
    'libs/**/project.json',          // Nx project configs
    'docs/**/*.md',                  // Architecture docs, ADRs
    'tools/prompts/**',              // Prompt templates
    '.eslintrc.json',               // Lint rules
    '.prettierrc',                   // Format rules
    'tsconfig.base.json'            // TS config
  ],

  // ❌ NEVER EXPOSE — security and compliance risk
  blockedPaths: [
    '**/.env*',                      // Environment variables
    '**/secrets*',                   // Secret files
    '**/*.pem',                      // Certificates
    '**/*.key',                      // Private keys
    '**/credentials*',               // Credential files
    'infrastructure/**',             // IaC with potential secrets
    'cypress/fixtures/users*',       // Test data with PII patterns
    '**/docker-compose*prod*'        // Production configs
  ],

  // ⚠️ CONDITIONAL — expose structure, mask values
  maskedPaths: [
    { path: 'angular.json', mask: ['architect.*.configurations.production'] },
    { path: '**/environment.prod.ts', mask: ['apiUrl', 'sentryDsn'] },
    { path: '.github/workflows/*.yml', mask: ['env.*', 'secrets.*'] }
  ]
};

export function isPathAllowed(filePath: string): boolean {
  const blocked = MCP_SECURITY_POLICY.blockedPaths.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
  return !blocked;
}
```

---

## AI Code Review Pipeline Design

The AI code review pipeline operates as a three-stage gate in the CI/CD process.
AI-generated code gets the same checks as human code, plus additional validation
layers that catch LLM-specific failure modes.

### Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    AI CODE REVIEW PIPELINE                                       │
│                                                                                  │
│  Developer pushes PR                                                             │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  STAGE 1: AUTOMATED STATIC ANALYSIS (2-3 min)                              │ │
│  │  ├─ TypeScript strict compilation (--noEmit --strict)                       │ │
│  │  ├─ ESLint with AI-specific rules (no-any, no-hardcoded-urls)              │ │
│  │  ├─ Prettier format check                                                  │ │
│  │  ├─ Nx library boundary enforcement                                        │ │
│  │  └─ AI code labeling (detect + tag AI-generated files)                     │ │
│  └──────────────────────────────┬──────────────────────────────────────────────┘ │
│                                 │ Pass?                                           │
│                                 ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  STAGE 2: SEMANTIC VALIDATION (5-8 min)                                    │ │
│  │  ├─ API contract validation (OpenAPI schema match)                         │ │
│  │  ├─ Design token compliance (no hardcoded colors/spacing)                  │ │
│  │  ├─ Affected unit tests (nx affected -t test)                              │ │
│  │  ├─ Bundle size delta check (max +5KB per PR)                              │ │
│  │  ├─ Accessibility audit (axe-core on affected components)                  │ │
│  │  └─ Security scan (Amazon Q / Snyk for dependency vulnerabilities)         │ │
│  └──────────────────────────────┬──────────────────────────────────────────────┘ │
│                                 │ Pass?                                           │
│                                 ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  STAGE 3: HUMAN REVIEW GATE (mandatory)                                    │ │
│  │  ├─ AI-generated code flagged with 🤖 label                               │ │
│  │  ├─ PR summary auto-generated from diff                                    │ │
│  │  ├─ Minimum 1 human approval required                                      │ │
│  │  ├─ AI code ratio displayed (e.g., "62% AI-generated")                     │ │
│  │  └─ If >70% AI code → requires 2 human approvals                          │ │
│  └──────────────────────────────┬──────────────────────────────────────────────┘ │
│                                 │ Approved?                                       │
│                                 ▼                                                │
│                          ┌──────────────┐                                        │
│                          │    MERGE      │                                        │
│                          └──────────────┘                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflow — AI Validation Gate

```yaml
# .github/workflows/ai-code-validation.yml
name: AI Code Validation Gate
on:
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  # ── Stage 1: Static Analysis ──
  static-analysis:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: TypeScript Strict Check
        run: npx tsc --noEmit --strict

      - name: ESLint (affected libraries)
        run: npx nx affected -t lint --base=origin/main --parallel=5

      - name: Prettier Format Check
        run: npx prettier --check "libs/**/*.{ts,html,scss}" "apps/**/*.{ts,html,scss}"

      - name: Nx Library Boundary Check
        run: npx nx lint --rule '@nx/enforce-module-boundaries'

      - name: Label AI-Generated Code
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const diff = execSync('git diff origin/main --name-only').toString();
            const files = diff.trim().split('\n');

            // Heuristic: check for AI generation markers in commit messages
            const commits = execSync('git log origin/main..HEAD --oneline').toString();
            const aiIndicators = ['copilot', 'ai-generated', 'kiro', 'amazon-q', 'agentic'];
            const isAIAssisted = aiIndicators.some(i => commits.toLowerCase().includes(i));

            if (isAIAssisted) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: ['ai-assisted', 'needs-human-review']
              });
            }

  # ── Stage 2: Semantic Validation ──
  semantic-validation:
    needs: static-analysis
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: API Contract Validation
        run: |
          node tools/scripts/validate-api-contracts.js \
            --spec libs/shared/api-contracts/openapi.yaml \
            --changed-files "$(git diff origin/main --name-only | grep '\.service\.ts$')"

      - name: Design Token Compliance
        run: |
          node tools/scripts/validate-design-tokens.js \
            --token-file libs/design-system/src/tokens/tokens.json \
            --changed-files "$(git diff origin/main --name-only | grep '\.scss$')"

      - name: Affected Unit Tests
        run: npx nx affected -t test --base=origin/main --parallel=5

      - name: Bundle Size Check
        run: |
          npx nx build shell --configuration=production
          node tools/scripts/check-bundle-size.js --max-delta=5kb --base=origin/main

      - name: Accessibility Audit
        run: |
          npx nx affected -t a11y-audit --base=origin/main || true

      - name: Security Scan
        run: npx snyk test --severity-threshold=high

  # ── Stage 3: Human Review Enforcement ──
  human-review-gate:
    needs: semantic-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Calculate AI Code Ratio
        id: ai-ratio
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const diff = execSync('git diff origin/main --stat').toString();
            const totalLines = parseInt(diff.match(/(\d+) insertions/)?.[1] || '0');

            // Check AI markers in changed files
            const changedFiles = execSync('git diff origin/main --name-only').toString().trim().split('\n');
            let aiLines = 0;

            for (const file of changedFiles) {
              try {
                const content = require('fs').readFileSync(file, 'utf-8');
                if (content.includes('// AI-generated') || content.includes('// Generated by')) {
                  const lines = content.split('\n').length;
                  aiLines += lines;
                }
              } catch {}
            }

            const ratio = totalLines > 0 ? Math.round((aiLines / totalLines) * 100) : 0;
            core.setOutput('ratio', ratio);
            core.setOutput('requires-extra-review', ratio > 70);

            // Post comment with AI ratio
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 AI Code Analysis\n\n` +
                    `**AI-generated code ratio**: ${ratio}%\n` +
                    `**Total insertions**: ${totalLines} lines\n` +
                    `**Review requirement**: ${ratio > 70 ? '⚠️ 2 approvals required (>70% AI code)' : '✅ 1 approval required'}\n`
            });

      - name: Enforce Review Policy
        if: steps.ai-ratio.outputs.requires-extra-review == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              team_reviewers: ['frontend-architects']
            });
```

### API Contract Validation Script

```typescript
// tools/scripts/validate-api-contracts.ts
// Catches the #1 AI hallucination: inventing API endpoints that don't exist

import * as fs from 'fs';
import * as yaml from 'js-yaml';

interface ContractViolation {
  file: string;
  line: number;
  method: string;
  url: string;
  issue: string;
}

export function validateServiceAgainstSpec(
  serviceFilePath: string,
  openApiSpecPath: string
): ContractViolation[] {
  const spec: any = yaml.load(fs.readFileSync(openApiSpecPath, 'utf-8'));
  const source = fs.readFileSync(serviceFilePath, 'utf-8');
  const lines = source.split('\n');
  const violations: ContractViolation[] = [];

  // Match HTTP calls: this.http.get<Type>('/api/...')
  const httpPattern = /this\.http\.(get|post|put|patch|delete)<[^>]*>\(\s*[`'"]([^`'"]+)[`'"]/g;

  for (const match of source.matchAll(httpPattern)) {
    const method = match[1];
    const url = match[2];
    const line = lines.findIndex(l => l.includes(match[0])) + 1;

    // Normalize URL: replace ${id} with {id} for OpenAPI matching
    const normalizedUrl = url.replace(/\$\{[^}]+\}/g, '{id}');

    const specPath = spec.paths?.[normalizedUrl];
    if (!specPath) {
      violations.push({
        file: serviceFilePath,
        line,
        method: method.toUpperCase(),
        url,
        issue: `HALLUCINATED ENDPOINT: ${method.toUpperCase()} ${url} does not exist in OpenAPI spec`
      });
      continue;
    }

    if (!specPath[method]) {
      violations.push({
        file: serviceFilePath,
        line,
        method: method.toUpperCase(),
        url,
        issue: `WRONG METHOD: ${method.toUpperCase()} not allowed on ${url} (allowed: ${Object.keys(specPath).join(', ')})`
      });
    }
  }

  return violations;
}
```

---

## Guardrails

Clear boundaries prevent AI from generating code in high-risk areas while maximizing
its value in low-risk, high-volume tasks.

### What AI Can Do (Green Zone)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✅ GREEN ZONE — AI generates freely, human reviews normally                 │
│                                                                              │
│  • UI components (templates, styles, component classes)                      │
│  • Unit tests and component tests                                            │
│  • Data transformation pipes and utility functions                           │
│  • Service boilerplate (HTTP calls matching OpenAPI spec)                    │
│  • Documentation (JSDoc, README updates, PR descriptions)                   │
│  • CSS/SCSS using design tokens                                              │
│  • Storybook stories                                                         │
│  • Simple form validators                                                    │
│  • Nx generator schematics                                                   │
│  • Migration scripts (e.g., v18 → v19 signal migration)                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### What AI Can Do With Extra Review (Yellow Zone)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ YELLOW ZONE — AI generates, senior engineer must review + approve        │
│                                                                              │
│  • Route guards and authentication logic                                     │
│  • State management (NgRx effects, signal stores)                           │
│  • Complex RxJS operator chains (race conditions risk)                       │
│  • Error handling and retry logic                                            │
│  • Interceptors (auth headers, error handling)                               │
│  • Performance-critical code (virtual scrolling, lazy loading)               │
│  • Shared library public APIs (breaking change risk)                         │
│  • Database query builders or ORM interactions                               │
│  • WebSocket connection management                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### What AI Cannot Do (Red Zone)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🚫 RED ZONE — Human-only, AI must not generate or modify                    │
│                                                                              │
│  • Security configurations (CSP headers, CORS policies)                      │
│  • Cryptographic operations (hashing, encryption, token signing)             │
│  • OAuth/OIDC flow implementations                                           │
│  • PII handling logic (data masking, GDPR compliance)                        │
│  • Infrastructure-as-code (Terraform, CloudFormation)                        │
│  • Production environment configurations                                     │
│  • Secret management (vault configs, key rotation)                           │
│  • Compliance-critical business logic (financial calculations, audit trails) │
│  • CI/CD pipeline security steps (signing, attestation)                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Guardrail Enforcement via ESLint

```json
// .eslintrc.ai-guardrails.json — Additional rules for AI-generated code
{
  "overrides": [
    {
      "files": ["**/*.ts"],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "TSTypeReference[typeName.name='any']",
            "message": "AI-generated code must not use 'any'. Use 'unknown' with type guards."
          },
          {
            "selector": "CallExpression[callee.property.name='subscribe']",
            "message": "Avoid .subscribe() in components. Use async pipe or toSignal()."
          }
        ],
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              {
                "group": ["**/environment*"],
                "message": "Do not import environment files directly. Use ConfigService."
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["**/security/**/*.ts", "**/auth/**/*.ts", "**/crypto/**/*.ts"],
      "rules": {
        "ai-guardrails/no-ai-generation": "error"
      }
    }
  ]
}
```

```typescript
// tools/eslint-rules/no-ai-generation.ts
// Custom ESLint rule that flags AI-generated markers in security-critical files

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => `https://internal.docs/rules/${name}`);

export const noAiGeneration = createRule({
  name: 'no-ai-generation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents AI-generated code in security-critical modules'
    },
    messages: {
      noAiCode: 'This file is in a RED ZONE module ({{module}}). AI-generated code is not allowed here. Remove AI markers and ensure this was written by a human engineer.'
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const source = context.getSourceCode().getText();
        const aiMarkers = [
          '// AI-generated',
          '// Generated by Copilot',
          '// Generated by Amazon Q',
          '// Kiro-generated',
          '@ai-generated'
        ];

        for (const marker of aiMarkers) {
          if (source.includes(marker)) {
            const filePath = context.getFilename();
            const module = filePath.includes('security') ? 'security'
              : filePath.includes('auth') ? 'auth'
              : filePath.includes('crypto') ? 'crypto'
              : 'restricted';

            context.report({
              node,
              messageId: 'noAiCode',
              data: { module }
            });
          }
        }
      }
    };
  }
});
```

---

## Prompt Engineering Standards

Standardized prompts ensure 20 developers get consistent, high-quality AI output.
Prompts are version-controlled, reviewed in PRs, and tested against known inputs.

### Prompt Library Structure

```
tools/prompts/
├── components/
│   ├── generate-component.md        # New standalone component
│   ├── generate-form-component.md   # Reactive form component
│   ├── generate-data-table.md       # Data table with sorting/pagination
│   └── generate-dialog.md           # CDK dialog component
├── services/
│   ├── generate-api-service.md      # HTTP service from OpenAPI spec
│   ├── generate-state-store.md      # Signal-based state store
│   └── generate-resolver.md         # Route resolver
├── testing/
│   ├── generate-unit-tests.md       # Jest unit tests
│   ├── generate-component-tests.md  # Angular Testing Library tests
│   └── generate-e2e-tests.md        # Playwright E2E tests
├── refactoring/
│   ├── migrate-to-signals.md        # @Input → input(), @Output → output()
│   ├── migrate-to-standalone.md     # NgModule → standalone
│   └── extract-to-library.md        # Move code to shared lib
├── documentation/
│   ├── generate-jsdoc.md            # JSDoc for public APIs
│   ├── generate-adr.md              # Architecture Decision Record
│   └── generate-pr-description.md   # PR summary from diff
└── _shared/
    ├── angular-context.md           # Common Angular project context
    ├── forbidden-patterns.md        # What AI must never do
    └── testing-standards.md         # Testing conventions
```

### Prompt Template — Component Generation

```markdown
<!-- tools/prompts/components/generate-component.md -->
# Generate Angular Standalone Component

## System Context
{{include _shared/angular-context.md}}

## Task
Generate a new Angular standalone component with the following specifications.

### Component Details
- **Name**: {{COMPONENT_NAME}}
- **Library**: libs/{{LIBRARY}}/src/lib/{{kebab-name}}/
- **Description**: {{DESCRIPTION}}
- **Selector prefix**: `ds-` (design system) or `app-` (feature)

### Inputs
{{#each INPUTS}}
- `{{name}}`: `{{type}}` {{#if required}}(required){{else}}(optional, default: {{default}}){{/if}}
{{/each}}

### Outputs
{{#each OUTPUTS}}
- `{{name}}`: `{{eventType}}`
{{/each}}

## Mandatory Technical Requirements

1. **Change Detection**: `ChangeDetectionStrategy.OnPush` — no exceptions
2. **Signals**: Use `input()` / `input.required()` for inputs, `output()` for outputs
3. **DI**: Use `inject()` — never constructor injection
4. **Styling**: Only `var(--ds-*)` tokens — zero hardcoded values
5. **Testing**: `data-testid` on every interactive element
6. **A11y**: ARIA attributes on all interactive elements, keyboard navigation support
7. **Imports**: Only from the same library or allowed dependencies per Nx boundaries

## Anti-Patterns (NEVER generate these)

```typescript
// ❌ WRONG: Constructor injection
constructor(private service: MyService) {}

// ✅ CORRECT: inject()
private readonly service = inject(MyService);

// ❌ WRONG: Decorator inputs
@Input() label: string;

// ✅ CORRECT: Signal inputs
label = input.required<string>();

// ❌ WRONG: Hardcoded colors
color: #3b82f6;

// ✅ CORRECT: Design tokens
color: var(--ds-color-primary);

// ❌ WRONG: subscribe in component
ngOnInit() { this.data$.subscribe(d => this.data = d); }

// ✅ CORRECT: toSignal or async pipe
data = toSignal(this.dataService.getData());
```

## Output Format
Generate exactly 4 files:
1. `{{kebab-name}}.component.ts`
2. `{{kebab-name}}.component.html`
3. `{{kebab-name}}.component.scss`
4. `{{kebab-name}}.component.spec.ts`

Also update `libs/{{LIBRARY}}/src/index.ts` to export the new component.
```

### Prompt Template — Test Generation

```markdown
<!-- tools/prompts/testing/generate-unit-tests.md -->
# Generate Unit Tests for Angular Component/Service

## System Context
{{include _shared/testing-standards.md}}

## Target
- **File**: {{FILE_PATH}}
- **Type**: {{component | service | pipe | directive | guard}}

## Testing Framework
- Jest (not Jasmine)
- Angular Testing Library (`@testing-library/angular`) for components
- `render()` + `screen` API — not `TestBed.createComponent` directly

## Coverage Requirements
- Minimum 80% line coverage
- Test all public methods
- Test all input variations (required + optional)
- Test all output emissions
- Test error states and edge cases
- Test keyboard interactions for interactive components
- Test ARIA attribute presence

## Test Structure

```typescript
// Follow this exact structure
import { render, screen, fireEvent } from '@testing-library/angular';
import { {{ComponentName}} } from './{{kebab-name}}.component';

describe('{{ComponentName}}', () => {
  // Group 1: Rendering
  describe('rendering', () => {
    it('should render with required inputs', async () => { ... });
    it('should apply default values for optional inputs', async () => { ... });
  });

  // Group 2: User Interactions
  describe('interactions', () => {
    it('should emit {{output}} when {{action}}', async () => { ... });
    it('should handle keyboard navigation', async () => { ... });
  });

  // Group 3: Accessibility
  describe('accessibility', () => {
    it('should have correct ARIA attributes', async () => { ... });
    it('should be keyboard navigable', async () => { ... });
  });

  // Group 4: Edge Cases
  describe('edge cases', () => {
    it('should handle empty data gracefully', async () => { ... });
    it('should handle loading state', async () => { ... });
  });
});
```

## Anti-Patterns in Tests

```typescript
// ❌ WRONG: Testing implementation details
expect(component.internalState).toBe('loaded');

// ✅ CORRECT: Testing behavior
expect(screen.getByText('Data loaded')).toBeInTheDocument();

// ❌ WRONG: Using TestBed directly for component rendering
const fixture = TestBed.createComponent(MyComponent);

// ✅ CORRECT: Using Angular Testing Library
const { fixture } = await render(MyComponent, {
  inputs: { label: 'Click me' }
});

// ❌ WRONG: Snapshot tests for dynamic content
expect(fixture.nativeElement).toMatchSnapshot();

// ✅ CORRECT: Specific assertions
expect(screen.getByRole('button', { name: 'Click me' })).toBeEnabled();
```
```

### Prompt Review Process

Prompts are treated as code — they go through PR review:

```typescript
// tools/scripts/validate-prompts.ts
// CI check: ensures all prompts follow the team standard

import * as fs from 'fs';
import * as glob from 'fast-glob';

interface PromptValidation {
  file: string;
  valid: boolean;
  issues: string[];
}

function validatePrompt(filePath: string): PromptValidation {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];

  // Required sections
  const requiredSections = [
    '## System Context',
    '## Mandatory Technical Requirements',
    '## Anti-Patterns'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`Missing required section: "${section}"`);
    }
  }

  // Must reference shared context
  if (!content.includes('{{include _shared/')) {
    issues.push('Must include shared context via {{include _shared/...}}');
  }

  // Must specify OnPush
  if (content.includes('component') && !content.includes('OnPush')) {
    issues.push('Component prompts must mention ChangeDetectionStrategy.OnPush');
  }

  // Must mention design tokens
  if (content.includes('.scss') && !content.includes('design token')) {
    issues.push('Style-related prompts must reference design tokens');
  }

  // Must include anti-patterns
  if (!content.includes('❌') || !content.includes('✅')) {
    issues.push('Must include ❌ wrong and ✅ correct examples');
  }

  return { file: filePath, valid: issues.length === 0, issues };
}

async function main() {
  const prompts = await glob.glob('tools/prompts/**/*.md');
  const results = prompts.map(validatePrompt);
  const failures = results.filter(r => !r.valid);

  if (failures.length > 0) {
    console.error('❌ Prompt validation failed:\n');
    for (const f of failures) {
      console.error(`  ${f.file}:`);
      f.issues.forEach(i => console.error(`    - ${i}`));
    }
    process.exit(1);
  }

  console.log(`✅ All ${results.length} prompts validated successfully.`);
}

main();
```


---

## Productivity Measurement Framework

Measuring AI productivity is the hardest part of this design. Lines of code is a vanity
metric. PR count is gameable. The framework below uses a balanced scorecard approach
that tracks velocity, quality, and developer experience together.

### Metrics Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                  PRODUCTIVITY MEASUREMENT FRAMEWORK                              │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  VELOCITY METRICS (are we faster?)                                        │  │
│  │  ├─ PR Cycle Time: median hours from open → merge                         │  │
│  │  ├─ Story Throughput: stories completed per sprint per developer           │  │
│  │  ├─ Time to First Commit: hours from ticket assignment to first push      │  │
│  │  └─ Review Turnaround: hours from PR open to first review                 │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUALITY METRICS (are we still good?)                                     │  │
│  │  ├─ Bug Escape Rate: production bugs per sprint (MUST NOT increase)       │  │
│  │  ├─ Test Coverage Delta: coverage change per sprint                       │  │
│  │  ├─ Type Safety Score: % of files with zero 'any' usage                   │  │
│  │  └─ Revert Rate: % of PRs reverted within 48 hours                       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  AI-SPECIFIC METRICS (is AI helping or hurting?)                           │  │
│  │  ├─ Suggestion Accept Rate: % of AI suggestions accepted (target 25-35%)  │  │
│  │  ├─ AI Code Ratio: % of merged code that was AI-generated                 │  │
│  │  ├─ Hallucination Rate: AI-generated bugs caught in review/CI             │  │
│  │  └─ Context Hit Rate: % of MCP queries that return useful results         │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  DEVELOPER EXPERIENCE (do people like it?)                                │  │
│  │  ├─ DX Satisfaction Score: 1-10 anonymous survey (monthly)                │  │
│  │  ├─ AI Tool Usage: daily active users per tool                            │  │
│  │  ├─ Top Frustrations: free-text survey themes                             │  │
│  │  └─ Flow State Disruption: self-reported interruptions from AI            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Baseline Capture Script

```typescript
// tools/scripts/capture-baseline.ts
// Run BEFORE AI adoption to establish honest comparison points

import { Octokit } from '@octokit/rest';

interface ProductivityBaseline {
  capturedAt: string;
  period: string;
  velocity: {
    prCycleTimeMedianHours: number;
    prCycleTimeP90Hours: number;
    storiesPerSprintPerDev: number;
    timeToFirstCommitMedianHours: number;
  };
  quality: {
    bugEscapeRatePerSprint: number;
    testCoveragePercent: number;
    typeSafetyScore: number;
    revertRatePercent: number;
  };
  experience: {
    dxSatisfactionScore: number;
    topFrustrations: string[];
  };
}

async function captureBaseline(): Promise<ProductivityBaseline> {
  const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });
  const owner = 'your-org';
  const repo = 'enterprise-platform';

  // Fetch last 30 days of merged PRs
  const { data: prs } = await octokit.pulls.list({
    owner, repo,
    state: 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: 100
  });

  const mergedPRs = prs.filter(pr => pr.merged_at);
  const cycleTimes = mergedPRs.map(pr => {
    const created = new Date(pr.created_at).getTime();
    const merged = new Date(pr.merged_at!).getTime();
    return (merged - created) / (1000 * 60 * 60); // hours
  });

  const sorted = [...cycleTimes].sort((a, b) => a - b);

  return {
    capturedAt: new Date().toISOString(),
    period: 'Last 30 days',
    velocity: {
      prCycleTimeMedianHours: percentile(sorted, 50),
      prCycleTimeP90Hours: percentile(sorted, 90),
      storiesPerSprintPerDev: 0, // From Jira API
      timeToFirstCommitMedianHours: 0 // From GitHub commit timestamps
    },
    quality: {
      bugEscapeRatePerSprint: 0, // From Jira: bugs with fixVersion = current
      testCoveragePercent: 0,    // From CI coverage reports
      typeSafetyScore: 0,        // From custom script counting 'any' usage
      revertRatePercent: 0       // From GitHub: reverted PRs / total PRs
    },
    experience: {
      dxSatisfactionScore: 0,    // From anonymous survey
      topFrustrations: []        // From survey free-text analysis
    }
  };
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

captureBaseline().then(baseline => {
  const fs = require('fs');
  fs.writeFileSync(
    'tools/metrics/baseline.json',
    JSON.stringify(baseline, null, 2)
  );
  console.log('Baseline captured:', baseline);
});
```

### A/B Sprint Comparison Dashboard

```typescript
// tools/scripts/ab-sprint-comparison.ts
// Compare sprints with and without AI assistance

interface SprintMetrics {
  sprintName: string;
  aiAssisted: boolean;
  teamSize: number;
  storiesCompleted: number;
  prsMerged: number;
  avgPRCycleHours: number;
  bugsEscaped: number;
  testCoverageChange: number;
  revertCount: number;
}

function comparesprints(
  control: SprintMetrics,
  experiment: SprintMetrics
): string {
  const velocityDelta = (
    (experiment.avgPRCycleHours - control.avgPRCycleHours) / control.avgPRCycleHours * 100
  ).toFixed(1);

  const throughputDelta = (
    (experiment.storiesCompleted - control.storiesCompleted) / control.storiesCompleted * 100
  ).toFixed(1);

  const qualityImpact = experiment.bugsEscaped <= control.bugsEscaped
    ? '✅ No quality regression'
    : '⚠️ Quality regression detected';

  return `
## Sprint Comparison Report

| Metric                  | ${control.sprintName} | ${experiment.sprintName} | Delta    |
|-------------------------|-----------------------|--------------------------|----------|
| Stories Completed       | ${control.storiesCompleted} | ${experiment.storiesCompleted} | ${throughputDelta}% |
| PRs Merged              | ${control.prsMerged}  | ${experiment.prsMerged}  | —        |
| Avg PR Cycle (hours)    | ${control.avgPRCycleHours} | ${experiment.avgPRCycleHours} | ${velocityDelta}% |
| Bugs Escaped            | ${control.bugsEscaped} | ${experiment.bugsEscaped} | ${qualityImpact} |
| Test Coverage Change    | ${control.testCoverageChange}% | ${experiment.testCoverageChange}% | — |
| Reverts                 | ${control.revertCount} | ${experiment.revertCount} | — |

### Analysis
- Velocity: PR cycle time changed by ${velocityDelta}%
- Throughput: Story completion changed by ${throughputDelta}%
- Quality: ${qualityImpact}
- Recommendation: ${parseFloat(velocityDelta) < 0 && experiment.bugsEscaped <= control.bugsEscaped
    ? 'AI adoption is showing positive ROI — continue expansion'
    : 'Review AI workflow — velocity or quality needs attention'}
  `;
}
```

---

## Adoption Strategy

### 90-Day Phased Rollout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    90-DAY AI ADOPTION ROADMAP                                    │
│                                                                                  │
│  PHASE 1: PILOT                PHASE 2: EXPANSION           PHASE 3: SCALE      │
│  Days 1-30                     Days 31-60                    Days 61-90           │
│  ──────────                    ──────────────                ──────────           │
│                                                                                  │
│  WHO:                          WHO:                          WHO:                 │
│  4 senior engineers            All 20 developers             All 20 + CI/CD       │
│  (2 leads + 2 seniors)         (phased onboarding)           (full automation)    │
│                                                                                  │
│  WHAT:                         WHAT:                         WHAT:                │
│  • Install Copilot + Q         • Prompt library v1           • MCP servers live   │
│  • Baseline metrics            • Custom agents (3)           • AI review pipeline │
│  • Document patterns           • Training workshops          • ROI measurement    │
│  • Weekly retros               • Pair programming            • Governance model   │
│  • .github/copilot-            • MCP server dev              • Exec report        │
│    instructions.md             • Bi-weekly retros            • Policy finalized   │
│                                                                                  │
│  SUCCESS GATE:                 SUCCESS GATE:                 SUCCESS GATE:        │
│  3 features shipped            Prompt library with           15% PR cycle time    │
│  with AI assistance,           20+ templates,                reduction,           │
│  zero quality regression       80% team adoption             zero quality drop    │
│                                                                                  │
│  RISK MITIGATION:              RISK MITIGATION:              RISK MITIGATION:     │
│  Rollback plan if              Pair AI-skeptics with         A/B sprint data      │
│  quality drops                 AI-champions                  validates ROI        │
│                                                                                  │
│  BUDGET:                       BUDGET:                       BUDGET:              │
│  4 × Copilot licenses         20 × Copilot licenses         + MCP server         │
│  4 × Amazon Q licenses        20 × Amazon Q licenses        hosting costs        │
│  ~$400/month                   ~$2,000/month                 ~$2,500/month        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Pilot (Days 1-30) — Detailed Plan

**Week 1: Setup**
- Install GitHub Copilot and Amazon Q for 4 pilot engineers
- Create `.github/copilot-instructions.md` with project context
- Create `.amazonq/configuration.json` with security settings
- Capture baseline metrics (PR cycle time, bug rate, coverage, DX score)
- Set up metrics tracking dashboard

**Week 2-3: Experimentation**
- Pilot engineers use AI for daily tasks (components, tests, services)
- Document what works well and what doesn't in a shared Notion page
- Identify the top 5 repetitive tasks where AI saves the most time
- Start drafting prompt templates for those tasks

**Week 4: Assessment**
- Compare pilot sprint metrics against baseline
- Conduct retro: what surprised us? what failed? what do we need?
- Decision gate: proceed to Phase 2 or extend pilot
- Deliverable: "AI Pilot Report" with data and recommendations

### Phase 2: Expansion (Days 31-60) — Detailed Plan

**Week 5-6: Onboarding**
- Roll out licenses to all 20 developers
- Run 2-hour training workshop: "AI-Assisted Angular Development"
- Pair each new user with a pilot engineer for first week
- Publish prompt library v1 with 10+ templates

**Week 7-8: Custom Tooling**
- Build 3 custom AI agents for highest-ROI tasks:
  1. Component scaffolding agent (uses MCP for design tokens)
  2. Test generation agent (uses MCP for component APIs)
  3. PR description agent (uses git diff + Jira context)
- Start MCP server development (component registry + design tokens)
- Run bi-weekly retro focused on friction points

### Phase 3: Scale (Days 61-90) — Detailed Plan

**Week 9-10: CI/CD Integration**
- Deploy MCP servers to all developer machines
- Integrate AI validation gates into GitHub Actions
- Enable AI code labeling and ratio tracking on PRs
- Set up automated A/B sprint comparison reports

**Week 11-12: Governance and ROI**
- Finalize AI code review policy (green/yellow/red zones)
- Establish prompt review process (PRs for new prompts)
- Measure ROI against Phase 1 baseline
- Present executive report with data-backed recommendations
- Publish internal "AI Development Handbook" for the team

### Rollback Plan

```typescript
// tools/scripts/ai-adoption-rollback.ts
// Automated rollback triggers if quality metrics degrade

interface RollbackTrigger {
  metric: string;
  threshold: string;
  action: string;
}

const ROLLBACK_TRIGGERS: RollbackTrigger[] = [
  {
    metric: 'Bug Escape Rate',
    threshold: '>20% increase over baseline for 2 consecutive sprints',
    action: 'Pause AI adoption, conduct root cause analysis, add guardrails'
  },
  {
    metric: 'Revert Rate',
    threshold: '>10% of AI-assisted PRs reverted within 48 hours',
    action: 'Require 2 human approvals for all AI-assisted PRs'
  },
  {
    metric: 'Test Coverage',
    threshold: 'Drops below 75% (baseline: 78%)',
    action: 'Mandate AI-generated tests for every AI-generated component'
  },
  {
    metric: 'Developer Satisfaction',
    threshold: 'DX score drops below 5/10',
    action: 'Conduct 1:1 interviews, identify friction, adjust tooling'
  },
  {
    metric: 'Security Incidents',
    threshold: 'Any security vulnerability traced to AI-generated code',
    action: 'Immediate freeze on AI in yellow/red zones, security audit'
  }
];
```

---

## Trade-Offs Table

| Decision | Trade-off | Interview Talking Point |
|---|---|---|
| **Multiple AI tools** (Copilot + Q + Kiro) | Higher licensing cost (~$50/dev/month), but each tool excels at different tasks | "Copilot for completions, Q for security scanning, Kiro for spec-driven features — they're complementary, not competing" |
| **Custom MCP servers** | 2-3 weeks engineering investment to build, but dramatically improves AI output quality | "Without codebase context, AI generates generic Angular. With MCP, it generates code that follows our exact patterns and uses our design tokens" |
| **Mandatory human review** of all AI code | Slows PR throughput by ~15%, but prevents hallucinated APIs and security issues from reaching production | "AI is a tireless junior developer — you still need a senior to review its work before it ships" |
| **70% max AI code per PR** | Limits theoretical AI productivity ceiling, but ensures developers understand and own what they ship | "If you can't explain every line in the PR during an incident, you shouldn't have merged it" |
| **Phased 90-day rollout** | Slower adoption than "turn it on for everyone day 1", but builds evidence-based case for ROI and catches problems early | "We measured before and after — PR cycle time dropped 22%, bug escape rate stayed flat. That's data, not vibes" |
| **Prompt templates in version control** | Overhead to maintain and review, but ensures consistent AI output across 20 developers with different prompting skills | "Prompt engineering is software engineering — it needs versioning, review, and testing like any other code" |
| **API contract validation in CI** | Adds 2-3 minutes to CI pipeline, but catches the #1 AI failure mode: hallucinated endpoints | "The AI confidently generated a PUT /api/v2/users/:id endpoint that doesn't exist — contract testing caught it before review" |
| **Red/Yellow/Green zone policy** | Restricts AI usage in security-critical code, reducing potential productivity gains in those areas | "We get 80% of the AI benefit from 20% of the codebase — UI components and tests. Security code is human-only, and that's fine" |
| **Design tokens via MCP** | Requires tokens in machine-readable JSON (not just SCSS), adding a build step | "We refactored tokens to JSON source-of-truth with SCSS/CSS generation — both AI and humans benefit from the single source" |
| **A/B sprint comparison** | Requires careful sprint planning to isolate AI impact, and confounding variables exist | "It's not a perfect experiment, but it's better than gut feeling. We control for team size, story complexity, and sprint goals" |
| **ESLint guardrail rules** | Custom ESLint rules require maintenance and can produce false positives | "A false positive that makes a developer think for 10 seconds is better than a hallucinated API that causes a production incident" |
| **Baseline metrics before adoption** | Delays AI rollout by 1-2 sprints while collecting data | "You can't prove ROI without a before picture. Leadership wants numbers, not anecdotes" |

---

## Architect's Verdict

**The 30-second answer**: Integrating AI into a 20-person Angular team requires five layers —
IDE tools for inline assistance (Copilot, Amazon Q), MCP servers for structured codebase context,
agentic workflows for repetitive tasks, CI/CD validation gates to catch hallucinations, and a
governance framework to measure ROI. The critical insight is that AI tools amplify existing
engineering culture. If your team has strong linting, testing, and review practices, AI
accelerates them. If those foundations are weak, AI generates confident-looking code that
silently degrades quality.

**What separates a good answer from a great answer in the interview**:

1. **MCP servers are the differentiator**. Most candidates will mention Copilot. Few will
   explain how to give AI tools structured codebase context via MCP. This is what turns
   generic AI suggestions into project-specific, pattern-compliant code.

2. **Guardrails are not optional**. The red/yellow/green zone framework shows you understand
   that AI is not equally safe for all code. Security-critical modules stay human-only.

3. **Measurement must be balanced**. Tracking velocity without quality is dangerous. The
   balanced scorecard (velocity + quality + AI-specific + DX) prevents gaming.

4. **Adoption is a sociotechnical problem**. The 90-day phased rollout with rollback triggers
   shows you understand that tooling is 40% of the challenge — the other 60% is people,
   process, and trust.

5. **Prompt engineering is software engineering**. Version-controlled prompts with CI validation
   and PR review show you treat AI inputs with the same rigor as code.

**The one thing interviewers remember**: "We don't let AI write security code, we don't let
AI code merge without human review, and we measure everything against a baseline we captured
before we started. AI is a force multiplier, not a replacement for engineering judgment."
