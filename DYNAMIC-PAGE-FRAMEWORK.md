# Dynamic Page Framework

## Overview

The Dynamic Page Framework is a generic, configuration-driven rendering engine built on Angular. It allows entire pages to be composed at runtime from a JSON configuration — no hardcoded component trees in templates. This means a backend API or a static config can fully drive what appears on a page, how components are wired, and how they communicate.

It lives in `libs/core/platform/src/lib/dynamic-page/` and is exported from `@torque/core/platform`.

---

## Architecture

### Core Building Blocks

| File | Role |
|------|------|
| `dynamic-page.model.ts` | Interfaces — `TrqDynamicPage`, `TrqDynamicComponent`, `TrqDynamicComponentDetails`, `TrqDynamicComponentMapping` |
| `dynamic-page.component.ts` | `<trq-dynamic-page>` — the entry point component that takes a config and renders the component tree |
| `dynamic-component.service.ts` | The engine — resolves selectors, lazy-loads components, assigns inputs/outputs, handles slots and events |
| `dynamic-component.directive.ts` | Structural directive that loads a single component into the DOM via the service |
| `dynamic-placeholder.directive.ts` | Provides a `ViewContainerRef` for slot content projection |
| `dynamic-page.config.ts` | `TRQ_DYNAMIC_COMPONENT_MAPPING_TOKEN` — DI token for the component registry |
| `dynamic-page.provider.ts` | `withDynamicPage()` and `provideDynamicPage()` — provider functions to register the framework |

### Data Model

```typescript
// A page: a flat list of components with optional layout classes
interface TrqDynamicPage {
  classNames?: string;
  components: TrqDynamicComponent[];
}

// A single component descriptor
interface TrqDynamicComponent {
  id: string;
  classNames?: string;
  details: TrqDynamicComponentDetails;
}

// What to render and how to wire it
interface TrqDynamicComponentDetails {
  selector: string;       // key in the component registry
  meta?: {
    inputs: Record<string, any>;    // bound to @Input() properties
    outputs: Record<string, any>;   // subscribed to @Output() EventEmitters
    slots: Record<string, any>;     // projected into <ng-content>
  };
}

// The registry: maps selector strings to lazy-loadable component classes
type TrqDynamicComponentMapping = Record<string, {
  importName: string;
  importPromise: () => Promise<any>;
}>;
```

### Rendering Pipeline

```
TrqDynamicPage config
  │
  ▼
<trq-dynamic-page [config]="...">
  │
  ├── @for component of config.components
  │     │
  │     ▼
  │   [trqDynamicComponent] directive
  │     │
  │     ▼
  │   TrqDynamicComponentService.loadComponent()
  │     │
  │     ├── 1. Look up selector in TrqDynamicComponentMapping
  │     ├── 2. Await importPromise() → get component class
  │     ├── 3. Resolve slots (text / template / nested components / dynamic hooks)
  │     ├── 4. ViewContainerRef.createComponent(componentClass, { projectableNodes })
  │     ├── 5. Assign inputs + trigger ngOnChanges manually
  │     └── 6. Subscribe to outputs → forward to shared events$ stream
  │
  └── events$ observable emits { id, data } for all child output events
```

### Key Capabilities

- **Lazy loading** — components are loaded on demand via dynamic `import()`, so you only pay for what's rendered
- **Recursive nesting** — a dynamic page can contain a component (e.g. tabs) that itself renders another `<trq-dynamic-page>`, enabling deeply nested layouts
- **Slot projection** — supports plain text, `TemplateRef`, nested component arrays, and HTML strings with embedded component selectors (via `ngx-dynamic-hooks`)
- **Decoupled event bus** — all `@Output()` events flow through a shared `events$` observable as `{ id, data }`, so parent components don't need direct references to children
- **Layout via CSS classes** — `classNames` on both page and component levels allow grid/layout control without touching templates

---

## Core Rendering Logic — How Components Are Dynamically Created

This is the heart of the framework. It uses Angular's built-in dynamic component APIs — `ViewContainerRef`, `createComponent`, `reflectComponentType`, `SimpleChanges`, and `TemplateRef` — to instantiate, wire, and project components entirely at runtime.

### 1. The Host Component — `TrqDynamicPageComponent`

```typescript
@Component({
  selector: 'trq-dynamic-page',
  template: `
    <!-- 1. Iterate over config and render each component via the directive -->
    <div [ngClass]="config.classNames">
      @for (component of config.components; track component) {
        <div [ngClass]="component.classNames">
          <ng-container [trqDynamicComponent]="component"
                        [placeholder]="placeholder"
                        [hooks]="hooks">
          </ng-container>
        </div>
      }
    </div>

    <!-- 2. Hidden placeholder — a ViewContainerRef used to render slot content off-screen -->
    <ng-template trqDynamicPlaceholder #placeholder="trqDynamicPlaceholder"></ng-template>

    <!-- 3. Hooks template — used when slot content is an HTML string with component selectors -->
    <ng-template #hooks let-data>
      <ngx-dynamic-hooks [content]="data.content" [context]="data.inputs"></ngx-dynamic-hooks>
    </ng-template>
  `
})
export class TrqDynamicPageComponent {
  @Input() config: TrqDynamicPage;
  @Output() events = this.dynamicComponentService.events$;  // exposes the shared event stream

  @ViewChild(TrqDynamicPlaceholderDirective, { static: true }) placeholder;

  constructor(private dynamicComponentService: TrqDynamicComponentService) {}
}
```

Key things happening here:

- The `@for` loop iterates over `config.components` and stamps out an `<ng-container>` for each, bound to the `[trqDynamicComponent]` directive.
- The `placeholder` template provides a hidden `ViewContainerRef` — this is where slot content (projected nodes) gets pre-rendered before being passed into `createComponent()`.
- The `hooks` template wraps `ngx-dynamic-hooks`, which can parse an HTML string and instantiate Angular components found within it.
- The `events` output directly exposes the service's `events$` observable, so the parent can listen to all child component events.

### 2. The Directive — `TrqDynamicComponentDirective`

```typescript
@Directive({ selector: '[trqDynamicComponent]' })
export class TrqDynamicComponentDirective implements OnInit {
  @Input() trqDynamicComponent: TrqDynamicComponent;
  @Input() placeholder: TrqDynamicPlaceholderDirective;
  @Input() hooks: TemplateRef<any>;

  constructor(
    private dynamicComponentService: TrqDynamicComponentService,
    private viewContainerRef: ViewContainerRef   // ← this is WHERE the component gets inserted
  ) {}

  ngOnInit() {
    this.dynamicComponentService.loadComponent(
      this.trqDynamicComponent,
      this.viewContainerRef,          // container to insert the component into
      this.placeholder.viewContainerRef,  // placeholder for rendering slot content
      this.hooks                      // template for dynamic hooks rendering
    );
  }
}
```

The directive is the bridge between the template and the service. Each `<ng-container [trqDynamicComponent]="component">` gets its own `ViewContainerRef` from Angular's DI. On `ngOnInit`, it hands everything to the service: the component config, the container to render into, the placeholder for slots, and the hooks template.

### 3. The Engine — `TrqDynamicComponentService`

This is where all the Angular dynamic rendering APIs come together.

#### 3a. Component Resolution and Instantiation

```typescript
async loadComponent(
  component: TrqDynamicComponent,
  container: ViewContainerRef,
  placeholder?: ViewContainerRef,
  hooks?: TemplateRef<any>
): Promise<ComponentRef<any> | void> {

  const { selector, meta } = component.details;

  // Step 1: Look up the selector in the component registry (injected via DI token)
  const { importName, importPromise } = this.dynamicComponentMappings[selector];

  // Step 2: Lazy-load the component class
  //   importPromise() returns a module, importName picks the export
  //   e.g. import('./chart.component').then(m => m['ChartComponent'])
  const componentClass = await importPromise().then(m => m[importName]);

  // Step 3: Resolve slot content BEFORE creating the component
  //   (createComponent needs projectableNodes at creation time)
  let projectableNodes = [];
  if (meta?.slots && placeholder && hooks) {
    projectableNodes = await this.assignSlots(componentClass, meta.slots, placeholder, hooks, meta.inputs);
  }

  // Step 4: Create the component dynamically using Angular's ViewContainerRef API
  //   This is the core Angular pattern for dynamic components.
  //   container.createComponent() instantiates the component and inserts it into the DOM
  //   at the location of the directive's ViewContainerRef.
  const componentRef = container.createComponent(componentClass, {
    projectableNodes   // pre-rendered DOM nodes for <ng-content> slots
  });

  // Step 5: Wire inputs and outputs
  if (meta?.inputs)  this.assignInputs(componentRef, meta.inputs);
  if (meta?.outputs) this.assignOutputs(componentRef, component.id, meta.outputs);

  return componentRef;
}
```

`ViewContainerRef.createComponent()` is Angular's built-in API for dynamic component creation. It:
- Instantiates the component class
- Creates its view (template + change detection)
- Inserts the host element into the DOM at the container's location
- Accepts `projectableNodes` — pre-rendered DOM nodes that fill `<ng-content>` slots

#### 3b. Input Assignment — Manual `ngOnChanges` Triggering

When you use a component in a template (`<my-comp [title]="x">`), Angular handles input binding and calls `ngOnChanges` automatically. With dynamic components, we bypass the template, so we have to do this manually.

```typescript
private assignInputs(componentRef: ComponentRef<any>, inputs: Record<string, unknown>): void {
  const instance = componentRef.instance;
  const changes: SimpleChanges = {};

  // For each input key in the config...
  keys(inputs).forEach(key => {
    if (instance[key] !== inputs[key]) {
      // Build a SimpleChange object (same shape Angular uses internally)
      changes[key] = {
        previousValue: instance[key],
        currentValue: inputs[key],
        firstChange: instance[key] === undefined,
        isFirstChange: () => instance[key] === undefined
      };
      // Directly assign the value to the component instance property
      instance[key] = inputs[key];
    }
  });

  // Manually call ngOnChanges if the component implements it
  // This ensures the component reacts to inputs the same way it would in a template
  if (typeof instance['ngOnChanges'] === 'function') {
    instance['ngOnChanges'](changes);
  }
}
```

This is critical because many components rely on `ngOnChanges` for initialization logic. Without this manual call, those components would never know their inputs were set.

#### 3c. Output Subscription — Centralized Event Bus

```typescript
private assignOutputs(
  componentRef: ComponentRef<any>,
  id: string,
  outputs: Record<string, unknown>
): void {
  const instance = componentRef.instance;

  each(outputs, (callbackFn, eventName) => {
    const eventEmitter = instance[eventName];

    // Check if the property is actually an EventEmitter
    if (eventEmitter instanceof EventEmitter) {
      eventEmitter
        .pipe(takeUntil(this.destroy$))   // auto-unsubscribe on service destroy
        .subscribe(data => {
          // 1. Call the callback from the config (if provided)
          if (isFunction(callbackFn)) {
            callbackFn(data);
          }
          // 2. Forward to the centralized event stream
          //    Parent components listen to events$ and filter by id
          this.events.next({ id, data });
        });
    }
  });
}
```

Every `@Output()` EventEmitter on the dynamic component is subscribed to. Events are both forwarded to the config-provided callback AND pushed to the shared `events$` Subject. This dual approach means:
- The config can define inline handlers (`outputs: { save: (data) => ... }`)
- The host component can also listen to all events via `(events)="onEvent($event)"` on `<trq-dynamic-page>`

The `takeUntil(this.destroy$)` ensures all subscriptions are cleaned up when the service is destroyed, preventing memory leaks.

#### 3d. Slot Resolution — `reflectComponentType` + Projectable Nodes

This is the most advanced part. Angular's `createComponent` accepts `projectableNodes` — arrays of DOM nodes that fill `<ng-content>` slots. The framework resolves these before component creation.

```typescript
private async assignSlots(
  componentClass: Type<any>,
  slots: Record<string, any>,
  placeholder: ViewContainerRef,
  hooks: TemplateRef<any>,
  inputs: Record<string, unknown> | undefined
): Promise<Array<any[]>> {

  // reflectComponentType() is an Angular API that reads component metadata at runtime
  // It returns the ngContentSelectors — the CSS selectors for each <ng-content> slot
  // e.g. ['*'] for default slot, or ['header', 'footer'] for named slots
  const ngContentSelectors = reflectComponentType(componentClass)?.ngContentSelectors || [];

  const projectableNodes: Array<any[]> = [];

  for (const ngSelector of ngContentSelectors) {
    // Map '*' (default slot) to 'default' key in the config
    const slotName = ngSelector === '*' ? 'default' : ngSelector;

    if (slots[slotName]) {
      const nodes = await this.resolveNgContent(slots[slotName], placeholder, hooks, inputs);
      projectableNodes.push(nodes);
    }
  }

  return projectableNodes;
  // projectableNodes[0] → fills the first <ng-content>
  // projectableNodes[1] → fills the second <ng-content>, etc.
}
```

`reflectComponentType()` is key here — it reads the component's metadata at runtime to discover how many `<ng-content>` slots it has and what their selectors are. This lets the framework match config slot names to actual component slots.

#### 3e. Content Resolution — Four Strategies

```typescript
private async resolveNgContent(content, placeholder, hooks, inputs): Promise<any[]> {

  // Strategy 1: String with curly braces → dynamic hooks (HTML with component selectors)
  //   e.g. "{ <trq-datagrid [columns]='context.cols'></trq-datagrid> }"
  //   The regex extracts the inner HTML, and ngx-dynamic-hooks parses + instantiates it
  if (typeof content === 'string') {
    const match = content.match(/\{([\s\S]*?)\}/);
    if (match && hooks instanceof TemplateRef) {
      const viewRef = placeholder.createEmbeddedView(hooks, {
        $implicit: { content: match[1].trim(), inputs }
      });
      return viewRef.rootNodes;
    }
    // Strategy 2: Plain string → text node
    return [document.createTextNode(content)];
  }

  // Strategy 3: TemplateRef → embedded view
  if (content instanceof TemplateRef) {
    const viewRef = placeholder.createEmbeddedView(content, { $implicit: inputs });
    return viewRef.rootNodes;
  }

  // Strategy 4: Array of component descriptors → recursive dynamic loading
  //   Each item is a TrqDynamicComponentDetails, loaded via loadComponent() recursively
  if (isArray(content) && placeholder) {
    const nestedComponents = [];
    for (const item of content) {
      const ref = await this.loadComponent({ id: 'nested', details: item }, placeholder);
      if (ref) nestedComponents.push(ref.location.nativeElement);
    }
    return nestedComponents;
  }

  return [];
}
```

The placeholder `ViewContainerRef` is used as a staging area — embedded views and nested components are created there first, then their root DOM nodes are extracted and passed as `projectableNodes` to `createComponent()`. This is necessary because Angular needs actual DOM nodes at component creation time for `<ng-content>` projection.

### 4. Dependency Injection — The Glue

```typescript
// InjectionToken for the component registry
const TRQ_DYNAMIC_COMPONENT_MAPPING_TOKEN = new InjectionToken<TrqDynamicComponentMapping>(...);

// The service receives the mapping via DI
@Injectable()
export class TrqDynamicComponentService {
  constructor(
    @Optional() @Inject(TRQ_DYNAMIC_COMPONENT_MAPPING_TOKEN)
    private dynamicComponentMappings: TrqDynamicComponentMapping
  ) {
    if (!this.dynamicComponentMappings) {
      throw new Error('Dynamic Component Mappings Token is not provided.');
    }
  }
}

// Provider functions register the mapping + service together
export function withDynamicPage(mapping: TrqDynamicComponentMapping): TrqCoreFeature {
  return {
    kind: TrqCoreFeatureKind.DYNAMIC_PAGE,
    providers: [
      { provide: TRQ_DYNAMIC_COMPONENT_MAPPING_TOKEN, useValue: mapping },
      TrqDynamicComponentService
    ]
  };
}
```

Each consuming feature provides its own mapping via `withDynamicPage()`. The service is scoped to the component's injector (not root), so different pages can have different component registries without conflicts.

### 5. Lifecycle and Cleanup

```typescript
export class TrqDynamicComponentService implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();     // signals all takeUntil operators
    this.destroy$.complete();  // completes the subject
  }
}
```

All output subscriptions use `takeUntil(this.destroy$)`, so when the service is destroyed (when the host component is destroyed), every subscription is automatically cleaned up. No manual unsubscribe needed.

### Angular APIs Used — Summary

| Angular API | Where Used | Purpose |
|-------------|-----------|---------|
| `ViewContainerRef.createComponent()` | `loadComponent()` | Instantiate a component class and insert it into the DOM |
| `ViewContainerRef.createEmbeddedView()` | `resolveNgContent()` | Render a `TemplateRef` into DOM nodes for slot projection |
| `reflectComponentType()` | `assignSlots()` | Read component metadata at runtime to discover `<ng-content>` selectors |
| `SimpleChanges` | `assignInputs()` | Manually construct change objects to trigger `ngOnChanges` |
| `ComponentRef.instance` | `assignInputs()`, `assignOutputs()` | Direct access to the component instance for property assignment and event subscription |
| `InjectionToken` | `TRQ_DYNAMIC_COMPONENT_MAPPING_TOKEN` | Type-safe DI token for the component registry |
| `TemplateRef` | Hooks template, slot resolution | Reusable template for rendering dynamic hooks content |

---

## How to Use

### Step 1: Create a Component Registry

Map string selectors to component classes. Supports both eager and lazy loading.

```typescript
import { TrqDynamicComponentMapping } from '@torque/core/platform';

export const myComponentMapping: TrqDynamicComponentMapping = {
  // Eager — component is already imported
  'my-section': {
    importName: 'MySectionComponent',
    importPromise: () => Promise.resolve({ MySectionComponent })
  },

  // Lazy — component is loaded on demand
  'my-chart': {
    importName: 'MyChartComponent',
    importPromise: () => import('./my-chart.component').then(m => m)
  }
};
```

### Step 2: Build a Page Config

```typescript
import { TrqDynamicPage } from '@torque/core/platform';

const pageConfig: TrqDynamicPage = {
  classNames: 'trq-g align-gutters',
  components: [
    {
      id: 'section-1',
      classNames: 'trq-u-1 trq-u-md-1-2',
      details: {
        selector: 'my-section',
        meta: {
          inputs: { title: 'Hello', description: 'World' },
          outputs: { save: (data) => console.log('saved', data) }
        }
      }
    }
  ]
};
```

### Step 3: Render

```typescript
import { TrqDynamicPageComponent, withDynamicPage } from '@torque/core/platform';

@Component({
  imports: [TrqDynamicPageComponent],
  template: `<trq-dynamic-page [config]="pageConfig" (events)="onEvent($event)"></trq-dynamic-page>`,
  providers: [withDynamicPage(myComponentMapping).providers]
})
export class MyPageComponent {
  pageConfig = pageConfig;

  onEvent(event: { id: string; data: any }) {
    console.log(`Component ${event.id} emitted:`, event.data);
  }
}
```

---

## Use Case 1: Dynamic Forms with Formly

In this scenario, the framework renders form sections dynamically, and each section uses `@ngx-formly` internally for field rendering. The page config drives which form sections appear, what fields they contain, and how they're laid out.

### How It Works

1. A form section component (e.g. `PlaySectionComponent`) accepts `fields: FormlyFieldConfig[]` as an `@Input()`
2. The dynamic page config passes Formly field definitions through `meta.inputs.fields`
3. The section component renders `<formly-form>` with those fields
4. Field changes emit through `@Output() fieldChange`, which flows into the framework's `events$` stream

### Config Example

```typescript
const formPageConfig: TrqDynamicPage = {
  classNames: 'trq-g align-gutters',
  components: [
    {
      id: 'locale',
      classNames: 'trq-u-1 trq-u-md-1-2',
      details: {
        selector: 'my-form-section',
        meta: {
          inputs: {
            title: 'Locale',
            description: 'Locale changes apply after re-login',
            formLayout: 'VERTICAL',
            fields: [
              {
                key: 'locale',
                type: 'trq-select',
                defaultValue: ['en-US'],
                props: {
                  fieldLabel: 'Set Locale',
                  config: {
                    options: [
                      { label: 'English', value: 'en-US' },
                      { label: 'Arabic', value: 'en-AR' }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    },
    {
      id: 'notifications',
      classNames: 'trq-u-1',
      details: {
        selector: 'my-form-section',
        meta: {
          inputs: {
            title: 'Email Notifications',
            fields: [
              {
                key: 'disable-emails',
                type: 'trq-checkbox',
                defaultValue: false,
                props: { label: 'Disable system-generated email notifications' }
              }
            ]
          }
        }
      }
    }
  ]
};
```

### What Makes This Powerful

- The same form section component is reused across the page with different field configs
- Formly field definitions are pure data — they can come from an API response
- Adding a new form section requires zero template changes — just add an entry to the config array
- Form resets are handled via the event bus: `dynamicComponentService.emitEvent({ id: '*', data: { type: 'form:reset' } })`
- Tabs can wrap groups of form sections, and each tab is itself a nested `TrqDynamicPage`

### Nested Tabs + Forms Pattern

```
TrqDynamicPage (root)
  └── TabsComponent (inputs: tabs[])
        ├── Tab "General"
        │     └── TrqDynamicPage
        │           ├── FormSection "Locale"      (fields: [...])
        │           ├── FormSection "Accessibility" (fields: [...])
        │           └── FormSection "Password"     (fields: [...])
        ├── Tab "Proxy"
        │     └── TrqDynamicPage
        │           └── FormSection "Proxy For"   (slots: { default: <datagrid> })
        └── Tab "Learning"
              └── TrqDynamicPage
                    └── FormSection "Preferences" (fields: [...])
```

---

## Use Case 2: Simple Dynamic Page Rendering from API JSON

In this scenario, the framework renders arbitrary UI components based on a JSON response from an API. No forms involved — just layout and data display.

### How It Works

1. An API returns a JSON structure conforming to `TrqDynamicPage`
2. The frontend maps the API response to the `TrqDynamicPage` model (a thin mapping layer handles any shape differences)
3. The `<trq-dynamic-page>` component renders the page

### API Response → Page Config Flow

```
API Response (JSON)
  │
  ▼
Mapping Function (normalize selectors, inputs, slots)
  │
  ▼
TrqDynamicPage config
  │
  ▼
<trq-dynamic-page [config]="pageConfig">
```

### Config Example

```typescript
// Imagine this comes from an API
const apiResponse = {
  layout: 'trq-g align-gutters',
  sections: [
    {
      id: 'user-profile',
      type: 'info-card',
      grid: 'trq-u-1 trq-u-md-1-2',
      data: { name: 'John', role: 'Admin', avatar: '/img/john.png' }
    },
    {
      id: 'activity-log',
      type: 'data-table',
      grid: 'trq-u-1',
      data: { columns: [...], rows: [...] }
    }
  ]
};

// Map to TrqDynamicPage
function mapApiToPage(response): TrqDynamicPage {
  return {
    classNames: response.layout,
    components: response.sections.map(section => ({
      id: section.id,
      classNames: section.grid,
      details: {
        selector: section.type,
        meta: { inputs: section.data }
      }
    }))
  };
}
```

### What Makes This Powerful

- The UI is fully server-driven — the backend controls what components appear and with what data
- New component types can be added to the registry without changing the rendering logic
- Layout (grid classes) is controlled by the API, enabling A/B testing or role-based layouts
- Slot projection allows the API to define nested content, including embedded component markup in HTML strings

---

## Slot Projection Deep Dive

The framework supports four types of slot content:

| Type | Example | How It's Resolved |
|------|---------|-------------------|
| Plain text | `"Hello World"` | `document.createTextNode()` |
| Dynamic hooks string | `"{ <my-comp [data]='context.items'> }"` | Parsed by `ngx-dynamic-hooks`, components in the HTML are instantiated |
| Nested components array | `[{ selector: 'child', meta: {...} }]` | Recursively loaded via `loadComponent()` |
| TemplateRef | Angular `TemplateRef` instance | `createEmbeddedView()` |

The curly-brace syntax `{ ... }` is detected by a regex and routed through `ngx-dynamic-hooks`, which parses the HTML string and instantiates any component selectors found within it. The `context` variable inside the hooks template maps to `meta.inputs`, so the projected content has access to the parent's input data.

---

## Interview Talking Points

1. **Why build this?** — To avoid duplicating page templates across features. A single rendering engine handles all dynamic pages, and the config can come from anywhere (API, static file, feature module).

2. **Lazy loading** — Components are loaded on demand via `importPromise()`. If a tab is never opened, its components are never loaded.

3. **Recursive composition** — The framework supports nesting. A tabs component can render `<trq-dynamic-page>` inside each tab, which in turn renders more dynamic components. This enables complex layouts from flat configs.

4. **Input/Output wiring** — Inputs are assigned directly to component instances with manual `ngOnChanges` triggering. Outputs are subscribed to and forwarded through a centralized `events$` observable, decoupling parent-child communication.

5. **Slot projection** — The most advanced feature. Supports projecting text, templates, nested components, or even HTML strings with embedded Angular components (via `ngx-dynamic-hooks`). This enables server-driven content injection.

6. **Two use cases, one framework** — The same engine powers both Formly-based dynamic forms (where field configs drive form rendering) and simple API-driven page rendering (where a JSON response drives the entire UI). The abstraction is the `TrqDynamicPage` model — what sits behind each selector is up to the consuming application.

7. **Provider pattern** — `withDynamicPage(mapping)` follows Angular's `withFeature()` pattern, making it composable and tree-shakeable. Each feature module can register its own component mapping.

8. **Event bus** — Instead of tight parent-child coupling, all dynamic component outputs flow through a shared observable. This makes cross-component communication (like form resets) clean and centralized.
