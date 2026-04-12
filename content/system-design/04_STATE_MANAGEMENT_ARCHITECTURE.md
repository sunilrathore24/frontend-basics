# 04 — State Management Architecture: Principal/Architect-Level System Design

> Designing state management for complex workflows and micro frontend architectures.
> Two deep-dive questions covering NgRx, Signals, BehaviorSubjects, and cross-MFE state sharing.

---

## Table of Contents

- [Q10: Multi-Step Workflow State Management Architecture](#q10-multi-step-workflow-state-management-architecture)
  - [Decision Matrix: NgRx vs Signals vs BehaviorSubjects](#decision-matrix-ngrx-vs-signals-vs-behaviorsubjects)
  - [Architecture Overview (ASCII)](#architecture-overview-ascii)
  - [Approach 1: NgRx Store — Full Redux Pattern](#approach-1-ngrx-store--full-redux-pattern)
  - [Approach 2: Angular Signals — Lightweight Reactive State](#approach-2-angular-signals--lightweight-reactive-state)
  - [Approach 3: BehaviorSubject Service Pattern](#approach-3-behaviorsubject-service-pattern)
  - [NgRx SignalStore — The Middle Ground](#ngrx-signalstore--the-middle-ground)
  - [Selector Memoization Deep Dive](#selector-memoization-deep-dive)
  - [Decision Flowchart](#decision-flowchart)
  - [Avoiding Over-Engineering Guidelines](#avoiding-over-engineering-guidelines)
  - [Interview Summary: Key Talking Points](#interview-summary-key-talking-points-q10)
- [Q11: Sharing State Across Micro Frontends](#q11-sharing-state-across-micro-frontends)
  - [The Problem Space](#the-problem-space)
  - [Architecture Overview (ASCII)](#mfe-architecture-overview-ascii)
  - [Pattern 1: Shared Singleton Service via Module Federation](#pattern-1-shared-singleton-service-via-module-federation)
  - [Pattern 2: CustomEvent-Based Pub/Sub](#pattern-2-customevent-based-pubsub)
  - [Pattern 3: BroadcastChannel API](#pattern-3-broadcastchannel-api)
  - [Pattern 4: URL-as-State](#pattern-4-url-as-state)
  - [Pattern 5: Shared State Library via npm Package](#pattern-5-shared-state-library-via-npm-package)
  - [Comprehensive Comparison Table](#comprehensive-comparison-table)
  - [Recommended Architecture by Scenario](#recommended-architecture-by-scenario)
  - [Interview Summary: Key Talking Points](#interview-summary-key-talking-points-q11)

---

## Q10: Multi-Step Workflow State Management Architecture

**Question:** Design the state management architecture for a complex multi-step workflow application (e.g., an LMS course builder) in Angular. When do you choose NgRx vs Signals vs RxJS BehaviorSubjects?

### The Scenario

An LMS course builder with these requirements:
- 5-step wizard: Course Info → Modules → Lessons → Assessments → Review & Publish
- Each step has its own form with validation
- Users can navigate back/forward, and partial state must persist
- Undo/redo support for content editing
- Multiple users may collaborate (optimistic updates)
- Auto-save drafts every 30 seconds
- The wizard state must survive page refreshes

---

### Decision Matrix: NgRx vs Signals vs BehaviorSubjects

| Criteria | NgRx Store | Angular Signals | BehaviorSubject Services |
|---|---|---|---|
| **Complexity threshold** | High (10+ state slices, cross-cutting concerns) | Low-Medium (local/derived state) | Medium (shared service state) |
| **Team size** | Large (5+ devs) — enforced patterns | Any size | Small-Medium (2-5 devs) |
| **Debuggability** | ★★★★★ DevTools, action log, time-travel | ★★☆☆☆ No built-in devtools yet | ★★★☆☆ Manual logging |
| **Boilerplate** | High (actions, reducers, effects, selectors) | Very Low | Low-Medium |
| **Learning curve** | Steep (Redux concepts, RxJS) | Gentle (reactive primitives) | Moderate (RxJS operators) |
| **Undo/Redo** | Native (action replay) | Manual implementation | Manual implementation |
| **Server sync** | Effects pattern (structured side effects) | Manual or with rxResource | Manual with RxJS |
| **Performance** | Memoized selectors, OnPush friendly | Fine-grained reactivity, glitch-free | Requires manual optimization |
| **Testability** | ★★★★★ Pure functions, marble testing | ★★★★☆ Simple unit tests | ★★★★☆ Mock services |
| **Bundle size impact** | ~15-20KB gzipped (store+effects) | 0KB (built into Angular) | 0KB (RxJS already included) |
| **When to pick** | Enterprise apps, audit trails, complex async | Component-local state, derived computations | Mid-size apps, simple shared state |

---

### Architecture Overview (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LMS COURSE BUILDER WIZARD                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┐│
│  │ Step 1   │→ │ Step 2   │→ │ Step 3   │→ │ Step 4   │→ │ 5  ││
│  │ Course   │  │ Modules  │  │ Lessons  │  │ Assess.  │  │Rev.││
│  │ Info     │  │          │  │          │  │          │  │    ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬─┘│
│       │              │              │              │            │  │
│       ▼              ▼              ▼              ▼            ▼  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              STATE MANAGEMENT LAYER                         │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │  │
│  │  │ Actions │→ │ Reducer  │→ │  Store   │→ │ Selectors  │ │  │
│  │  └─────────┘  └──────────┘  └──────────┘  └────────────┘ │  │
│  │       │                                                    │  │
│  │       ▼                                                    │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐│  │
│  │  │ Effects  │→ │ API Service  │→ │ Auto-Save / Persist  ││  │
│  │  └──────────┘  └──────────────┘  └──────────────────────┘│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  UNDO/REDO STACK    │  localStorage Persistence           │  │
│  │  past[] ← current → future[]  │  Crash recovery           │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Approach 1: NgRx Store — Full Redux Pattern

This is the heavyweight approach. Best when you need time-travel debugging, strict action logging, and enforced unidirectional data flow across a large team.

**When to use:** Enterprise apps with 5+ developers, complex async workflows, audit trail requirements, or when you need DevTools time-travel debugging.

#### State Interface

```typescript
// course-builder.state.ts
export interface CourseBuilderState {
  currentStep: number;
  totalSteps: number;
  course: CourseInfo;
  modules: Module[];
  lessons: Record<string, Lesson[]>; // moduleId -> lessons
  assessments: Assessment[];
  validation: StepValidation;
  ui: {
    isSaving: boolean;
    lastSavedAt: string | null;
    isDirty: boolean;
    errors: Record<string, string[]>;
  };
  history: {
    past: CourseBuilderSnapshot[];
    future: CourseBuilderSnapshot[];
  };
}

export interface CourseInfo {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: 'video' | 'text' | 'interactive';
  duration: number;
  order: number;
}

export interface Assessment {
  id: string;
  moduleId: string;
  questions: Question[];
  passingScore: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface StepValidation {
  [step: number]: { valid: boolean; touched: boolean };
}

export type CourseBuilderSnapshot = Omit<CourseBuilderState, 'history' | 'ui'>;

export const initialCourseBuilderState: CourseBuilderState = {
  currentStep: 0,
  totalSteps: 5,
  course: {
    title: '', description: '', category: '',
    difficulty: 'beginner', thumbnailUrl: '',
  },
  modules: [],
  lessons: {},
  assessments: [],
  validation: {},
  ui: { isSaving: false, lastSavedAt: null, isDirty: false, errors: {} },
  history: { past: [], future: [] },
};
```

#### Actions (createActionGroup for clean organization)

```typescript
// course-builder.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CourseInfo, Module, Lesson, Assessment } from './course-builder.state';

export const WizardActions = createActionGroup({
  source: 'Course Wizard',
  events: {
    // Navigation
    'Go To Step': props<{ step: number }>(),
    'Next Step': emptyProps(),
    'Previous Step': emptyProps(),

    // Course Info (Step 1)
    'Update Course Info': props<{ course: Partial<CourseInfo> }>(),

    // Modules (Step 2)
    'Add Module': props<{ module: Module }>(),
    'Update Module': props<{ id: string; changes: Partial<Module> }>(),
    'Remove Module': props<{ id: string }>(),
    'Reorder Modules': props<{ modules: Module[] }>(),

    // Lessons (Step 3)
    'Add Lesson': props<{ lesson: Lesson }>(),
    'Update Lesson': props<{ id: string; changes: Partial<Lesson> }>(),
    'Remove Lesson': props<{ moduleId: string; lessonId: string }>(),

    // Assessments (Step 4)
    'Add Assessment': props<{ assessment: Assessment }>(),
    'Update Assessment': props<{ id: string; changes: Partial<Assessment> }>(),

    // Persistence
    'Auto Save': emptyProps(),
    'Auto Save Success': props<{ savedAt: string }>(),
    'Auto Save Failure': props<{ error: string }>(),
    'Load Draft': props<{ courseId: string }>(),
    'Load Draft Success': props<{ state: Partial<CourseBuilderState> }>(),

    // Publish
    'Publish Course': emptyProps(),
    'Publish Course Success': props<{ courseId: string }>(),
    'Publish Course Failure': props<{ error: string }>(),

    // Undo/Redo
    'Undo': emptyProps(),
    'Redo': emptyProps(),
  },
});
```

**Interview Insight:** `createActionGroup` (NgRx 14+) eliminates the boilerplate of individual `createAction()` calls. The `source` tag groups actions in DevTools for easy filtering.

#### Reducer (Pure Functions, Immutable Updates)

```typescript
// course-builder.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { WizardActions } from './course-builder.actions';
import {
  CourseBuilderState, CourseBuilderSnapshot, initialCourseBuilderState,
} from './course-builder.state';

// Helper: capture snapshot for undo history (keeps last 50 states)
function pushSnapshot(state: CourseBuilderState): CourseBuilderState {
  const snapshot: CourseBuilderSnapshot = {
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    course: state.course,
    modules: state.modules,
    lessons: state.lessons,
    assessments: state.assessments,
    validation: state.validation,
  };
  return {
    ...state,
    history: {
      past: [...state.history.past.slice(-49), snapshot],
      future: [], // clear redo stack on new action
    },
  };
}

export const courseBuilderReducer = createReducer(
  initialCourseBuilderState,

  // ─── Navigation ───
  on(WizardActions.nextStep, (state) => ({
    ...state,
    currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
  })),

  on(WizardActions.previousStep, (state) => ({
    ...state,
    currentStep: Math.max(state.currentStep - 1, 0),
  })),

  on(WizardActions.goToStep, (state, { step }) => ({
    ...state,
    currentStep: Math.max(0, Math.min(step, state.totalSteps - 1)),
  })),

  // ─── Course Info ───
  on(WizardActions.updateCourseInfo, (state, { course }) => {
    const updated = pushSnapshot(state);
    return {
      ...updated,
      course: { ...updated.course, ...course },
      ui: { ...updated.ui, isDirty: true },
      validation: {
        ...updated.validation,
        0: {
          valid: !!(course.title || updated.course.title) &&
                 !!(course.description || updated.course.description),
          touched: true,
        },
      },
    };
  }),

  // ─── Modules ───
  on(WizardActions.addModule, (state, { module }) => {
    const updated = pushSnapshot(state);
    return {
      ...updated,
      modules: [...updated.modules, module],
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  on(WizardActions.updateModule, (state, { id, changes }) => {
    const updated = pushSnapshot(state);
    return {
      ...updated,
      modules: updated.modules.map((m) =>
        m.id === id ? { ...m, ...changes } : m
      ),
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  on(WizardActions.removeModule, (state, { id }) => {
    const updated = pushSnapshot(state);
    const { [id]: _, ...remainingLessons } = updated.lessons;
    return {
      ...updated,
      modules: updated.modules.filter((m) => m.id !== id),
      lessons: remainingLessons,
      assessments: updated.assessments.filter((a) => a.moduleId !== id),
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  on(WizardActions.reorderModules, (state, { modules }) => {
    const updated = pushSnapshot(state);
    return { ...updated, modules, ui: { ...updated.ui, isDirty: true } };
  }),

  // ─── Lessons ───
  on(WizardActions.addLesson, (state, { lesson }) => {
    const updated = pushSnapshot(state);
    const moduleLessons = updated.lessons[lesson.moduleId] || [];
    return {
      ...updated,
      lessons: {
        ...updated.lessons,
        [lesson.moduleId]: [...moduleLessons, lesson],
      },
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  on(WizardActions.removeLesson, (state, { moduleId, lessonId }) => {
    const updated = pushSnapshot(state);
    return {
      ...updated,
      lessons: {
        ...updated.lessons,
        [moduleId]: (updated.lessons[moduleId] || []).filter(
          (l) => l.id !== lessonId
        ),
      },
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  // ─── Assessments ───
  on(WizardActions.addAssessment, (state, { assessment }) => {
    const updated = pushSnapshot(state);
    return {
      ...updated,
      assessments: [...updated.assessments, assessment],
      ui: { ...updated.ui, isDirty: true },
    };
  }),

  // ─── Auto Save ───
  on(WizardActions.autoSave, (state) => ({
    ...state,
    ui: { ...state.ui, isSaving: true },
  })),

  on(WizardActions.autoSaveSuccess, (state, { savedAt }) => ({
    ...state,
    ui: { ...state.ui, isSaving: false, lastSavedAt: savedAt, isDirty: false },
  })),

  on(WizardActions.autoSaveFailure, (state, { error }) => ({
    ...state,
    ui: {
      ...state.ui,
      isSaving: false,
      errors: { ...state.ui.errors, save: [error] },
    },
  })),

  // ─── Load Draft ───
  on(WizardActions.loadDraftSuccess, (state, { state: draft }) => ({
    ...state,
    ...draft,
    ui: { ...state.ui, isDirty: false },
  })),

  // ─── Undo / Redo ───
  on(WizardActions.undo, (state) => {
    if (state.history.past.length === 0) return state;
    const previous = state.history.past[state.history.past.length - 1];
    const currentSnapshot: CourseBuilderSnapshot = {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      course: state.course,
      modules: state.modules,
      lessons: state.lessons,
      assessments: state.assessments,
      validation: state.validation,
    };
    return {
      ...state,
      ...previous,
      history: {
        past: state.history.past.slice(0, -1),
        future: [currentSnapshot, ...state.history.future],
      },
    };
  }),

  on(WizardActions.redo, (state) => {
    if (state.history.future.length === 0) return state;
    const next = state.history.future[0];
    const currentSnapshot: CourseBuilderSnapshot = {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      course: state.course,
      modules: state.modules,
      lessons: state.lessons,
      assessments: state.assessments,
      validation: state.validation,
    };
    return {
      ...state,
      ...next,
      history: {
        past: [...state.history.past, currentSnapshot],
        future: state.history.future.slice(1),
      },
    };
  }),
);
```


#### Selectors (Memoized Derived State)

```typescript
// course-builder.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CourseBuilderState } from './course-builder.state';

// Feature selector — entry point for all other selectors
export const selectCourseBuilder =
  createFeatureSelector<CourseBuilderState>('courseBuilder');

// ─── Atomic Selectors ───
export const selectCurrentStep = createSelector(
  selectCourseBuilder,
  (state) => state.currentStep
);

export const selectCourse = createSelector(
  selectCourseBuilder,
  (state) => state.course
);

export const selectModules = createSelector(
  selectCourseBuilder,
  (state) => state.modules
);

export const selectAllLessons = createSelector(
  selectCourseBuilder,
  (state) => state.lessons
);

export const selectAssessments = createSelector(
  selectCourseBuilder,
  (state) => state.assessments
);

export const selectUI = createSelector(
  selectCourseBuilder,
  (state) => state.ui
);

// ─── Parameterized Selector (factory pattern) ───
export const selectLessonsByModule = (moduleId: string) =>
  createSelector(selectAllLessons, (lessons) => lessons[moduleId] || []);

// ─── Composed / Derived Selectors ───
// These demonstrate memoization — they only recompute when inputs change

export const selectTotalLessonCount = createSelector(
  selectAllLessons,
  (lessons) =>
    Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0)
);

export const selectModulesWithLessonCounts = createSelector(
  selectModules,
  selectAllLessons,
  (modules, lessons) =>
    modules.map((m) => ({
      ...m,
      lessonCount: (lessons[m.id] || []).length,
    }))
);

export const selectCompletionPercentage = createSelector(
  selectCourseBuilder,
  (state) => {
    const steps = state.totalSteps;
    const validSteps = Object.values(state.validation)
      .filter((v) => v.valid).length;
    return Math.round((validSteps / steps) * 100);
  }
);

export const selectCanProceed = createSelector(
  selectCourseBuilder,
  (state) => state.validation[state.currentStep]?.valid ?? false
);

export const selectIsSaving = createSelector(
  selectUI,
  (ui) => ui.isSaving
);

export const selectLastSavedAt = createSelector(
  selectUI,
  (ui) => ui.lastSavedAt
);

export const selectCanUndo = createSelector(
  selectCourseBuilder,
  (state) => state.history.past.length > 0
);

export const selectCanRedo = createSelector(
  selectCourseBuilder,
  (state) => state.history.future.length > 0
);

// ─── View Model Selector (compose everything a component needs) ───
export const selectWizardViewModel = createSelector(
  selectCurrentStep,
  selectCompletionPercentage,
  selectCanProceed,
  selectCanUndo,
  selectCanRedo,
  selectIsSaving,
  selectLastSavedAt,
  (currentStep, completionPct, canProceed, canUndo, canRedo, isSaving, lastSavedAt) => ({
    currentStep,
    completionPct,
    canProceed,
    canUndo,
    canRedo,
    isSaving,
    lastSavedAt: lastSavedAt ?? 'Not saved yet',
  })
);
```

**Interview Insight:** The `selectWizardViewModel` pattern is key — it composes multiple selectors into a single view model. The component subscribes once, and NgRx's memoization ensures recomputation only when actual inputs change. This is far more efficient than multiple individual subscriptions.

#### Effects (Structured Side Effects)

```typescript
// course-builder.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  switchMap, map, catchError, withLatestFrom,
  debounceTime, filter, tap, exhaustMap,
} from 'rxjs/operators';
import { of, interval } from 'rxjs';
import { WizardActions } from './course-builder.actions';
import { selectCourseBuilder } from './course-builder.selectors';
import { CourseApiService } from '../services/course-api.service';

@Injectable()
export class CourseBuilderEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private api = inject(CourseApiService);

  // Auto-save: triggers every 30s when state is dirty
  autoSave$ = createEffect(() =>
    interval(30_000).pipe(
      withLatestFrom(this.store.select(selectCourseBuilder)),
      filter(([_, state]) => state.ui.isDirty && !state.ui.isSaving),
      map(() => WizardActions.autoSave())
    )
  );

  // Perform the actual save API call
  // Uses exhaustMap to ignore overlapping save requests
  saveToServer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WizardActions.autoSave),
      withLatestFrom(this.store.select(selectCourseBuilder)),
      exhaustMap(([_, state]) =>
        this.api.saveDraft(state).pipe(
          map(() =>
            WizardActions.autoSaveSuccess({
              savedAt: new Date().toISOString(),
            })
          ),
          catchError((error) =>
            of(WizardActions.autoSaveFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load draft on initialization
  loadDraft$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WizardActions.loadDraft),
      switchMap(({ courseId }) =>
        this.api.loadDraft(courseId).pipe(
          map((state) => WizardActions.loadDraftSuccess({ state })),
          catchError(() =>
            of(WizardActions.autoSaveFailure({
              error: 'Failed to load draft',
            }))
          )
        )
      )
    )
  );

  // Publish course — exhaustMap prevents double-submit
  publish$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WizardActions.publishCourse),
      withLatestFrom(this.store.select(selectCourseBuilder)),
      exhaustMap(([_, state]) =>
        this.api.publishCourse(state).pipe(
          map((res) =>
            WizardActions.publishCourseSuccess({ courseId: res.id })
          ),
          catchError((error) =>
            of(WizardActions.publishCourseFailure({
              error: error.message,
            }))
          )
        )
      )
    )
  );

  // Persist to localStorage on every mutation for crash recovery
  persistToStorage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          WizardActions.updateCourseInfo,
          WizardActions.addModule,
          WizardActions.removeModule,
          WizardActions.reorderModules,
          WizardActions.addLesson,
          WizardActions.removeLesson,
          WizardActions.addAssessment,
        ),
        debounceTime(1000), // batch rapid changes
        withLatestFrom(this.store.select(selectCourseBuilder)),
        tap(([_, state]) => {
          try {
            const { history, ...persistable } = state;
            localStorage.setItem(
              'courseBuilder_draft',
              JSON.stringify(persistable)
            );
          } catch (e) {
            console.warn('localStorage persistence failed:', e);
          }
        })
      ),
    { dispatch: false } // side-effect only, no action dispatched
  );
}
```

**Interview Insight:** Note the deliberate choice of flattening operators:
- `exhaustMap` for save/publish — ignores new requests while one is in-flight (prevents double-submit)
- `switchMap` for load — cancels previous load if a new one comes in
- `debounceTime` for localStorage — batches rapid changes

#### Component Usage (NgRx + Signals Integration)

```typescript
// course-wizard.component.ts
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { WizardActions } from './state/course-builder.actions';
import {
  selectWizardViewModel,
  selectCourse,
  selectModules,
} from './state/course-builder.selectors';

@Component({
  selector: 'app-course-wizard',
  template: `
    <div class="wizard-container">
      <app-step-indicator
        [currentStep]="vm().currentStep"
        [totalSteps]="5"
        [completionPct]="vm().completionPct"
      />

      @switch (vm().currentStep) {
        @case (0) { <app-course-info-step /> }
        @case (1) { <app-modules-step /> }
        @case (2) { <app-lessons-step /> }
        @case (3) { <app-assessments-step /> }
        @case (4) { <app-review-step /> }
      }

      <div class="wizard-nav">
        <button (click)="prev()" [disabled]="vm().currentStep === 0">
          ← Back
        </button>
        <button (click)="undo()" [disabled]="!vm().canUndo">↩ Undo</button>
        <button (click)="redo()" [disabled]="!vm().canRedo">↪ Redo</button>

        <span class="save-status" [class.saving]="vm().isSaving">
          @if (vm().isSaving) {
            ⏳ Saving...
          } @else {
            ✓ {{ vm().lastSavedAt }}
          }
        </span>

        @if (vm().currentStep === 4) {
          <button (click)="publish()" class="btn-primary"
                  [disabled]="!vm().canProceed">
            🚀 Publish Course
          </button>
        } @else {
          <button (click)="next()" [disabled]="!vm().canProceed">
            Next →
          </button>
        }
      </div>
    </div>
  `,
})
export class CourseWizardComponent {
  private store = inject(Store);

  // Single view model signal — one subscription, all derived data
  vm = this.store.selectSignal(selectWizardViewModel);

  next()    { this.store.dispatch(WizardActions.nextStep()); }
  prev()    { this.store.dispatch(WizardActions.previousStep()); }
  undo()    { this.store.dispatch(WizardActions.undo()); }
  redo()    { this.store.dispatch(WizardActions.redo()); }
  publish() { this.store.dispatch(WizardActions.publishCourse()); }
}
```

---

### Approach 2: Angular Signals — Lightweight Reactive State

Best for component-local state, derived computations, and apps where NgRx overhead isn't justified. Signals provide fine-grained reactivity without RxJS complexity.

**When to use:** Small-to-medium apps, component-scoped state, when you want zero additional dependencies, or for derived/computed values within a feature.

```typescript
// course-builder-signal.service.ts
import { Injectable, computed, signal, effect } from '@angular/core';
import { CourseInfo, Module, Lesson, Assessment } from './models';

@Injectable({ providedIn: 'root' })
export class CourseBuilderSignalService {
  // ─── Core State Signals ───
  readonly currentStep = signal(0);
  readonly course = signal<CourseInfo>({
    title: '', description: '', category: '',
    difficulty: 'beginner', thumbnailUrl: '',
  });
  readonly modules = signal<Module[]>([]);
  readonly lessons = signal<Record<string, Lesson[]>>({});
  readonly assessments = signal<Assessment[]>([]);
  readonly isSaving = signal(false);
  readonly lastSavedAt = signal<string | null>(null);
  readonly isDirty = signal(false);

  // ─── Undo/Redo via snapshot arrays ───
  private pastSnapshots = signal<string[]>([]);
  private futureSnapshots = signal<string[]>([]);

  // ─── Derived State (computed — automatically memoized) ───
  readonly totalSteps = 5;

  readonly totalLessons = computed(() =>
    Object.values(this.lessons()).reduce(
      (sum, arr) => sum + arr.length, 0
    )
  );

  readonly modulesWithCounts = computed(() =>
    this.modules().map((m) => ({
      ...m,
      lessonCount: (this.lessons()[m.id] || []).length,
    }))
  );

  readonly completionPercentage = computed(() => {
    let valid = 0;
    if (this.course().title && this.course().description) valid++;
    if (this.modules().length > 0) valid++;
    if (this.totalLessons() > 0) valid++;
    if (this.assessments().length > 0) valid++;
    return Math.round((valid / this.totalSteps) * 100);
  });

  readonly canProceed = computed(() => {
    switch (this.currentStep()) {
      case 0: return !!this.course().title && !!this.course().description;
      case 1: return this.modules().length > 0;
      case 2: return this.totalLessons() > 0;
      case 3: return this.assessments().length > 0;
      case 4: return this.completionPercentage() === 100;
      default: return false;
    }
  });

  readonly canUndo = computed(() => this.pastSnapshots().length > 0);
  readonly canRedo = computed(() => this.futureSnapshots().length > 0);

  // ─── Auto-persist to localStorage via effect ───
  constructor() {
    effect(() => {
      const snapshot = {
        course: this.course(),
        modules: this.modules(),
        lessons: this.lessons(),
        assessments: this.assessments(),
        currentStep: this.currentStep(),
      };
      localStorage.setItem('courseBuilder_draft', JSON.stringify(snapshot));
    });
  }

  // ─── Snapshot helpers ───
  private captureSnapshot(): string {
    return JSON.stringify({
      course: this.course(),
      modules: this.modules(),
      lessons: this.lessons(),
      assessments: this.assessments(),
    });
  }

  private pushUndo(): void {
    this.pastSnapshots.update((past) => [
      ...past.slice(-49),
      this.captureSnapshot(),
    ]);
    this.futureSnapshots.set([]);
    this.isDirty.set(true);
  }

  // ─── Navigation ───
  nextStep(): void {
    this.currentStep.update((s) => Math.min(s + 1, this.totalSteps - 1));
  }

  previousStep(): void {
    this.currentStep.update((s) => Math.max(s - 1, 0));
  }

  goToStep(step: number): void {
    this.currentStep.set(Math.max(0, Math.min(step, this.totalSteps - 1)));
  }

  // ─── Mutations ───
  updateCourseInfo(partial: Partial<CourseInfo>): void {
    this.pushUndo();
    this.course.update((c) => ({ ...c, ...partial }));
  }

  addModule(module: Module): void {
    this.pushUndo();
    this.modules.update((m) => [...m, module]);
  }

  removeModule(id: string): void {
    this.pushUndo();
    this.modules.update((m) => m.filter((mod) => mod.id !== id));
    this.lessons.update((l) => {
      const { [id]: _, ...rest } = l;
      return rest;
    });
    this.assessments.update((a) =>
      a.filter((assess) => assess.moduleId !== id)
    );
  }

  addLesson(lesson: Lesson): void {
    this.pushUndo();
    this.lessons.update((l) => ({
      ...l,
      [lesson.moduleId]: [...(l[lesson.moduleId] || []), lesson],
    }));
  }

  removeLesson(moduleId: string, lessonId: string): void {
    this.pushUndo();
    this.lessons.update((l) => ({
      ...l,
      [moduleId]: (l[moduleId] || []).filter((les) => les.id !== lessonId),
    }));
  }

  // ─── Undo / Redo ───
  undo(): void {
    const past = this.pastSnapshots();
    if (past.length === 0) return;
    const current = this.captureSnapshot();
    const previous = JSON.parse(past[past.length - 1]);
    this.pastSnapshots.update((p) => p.slice(0, -1));
    this.futureSnapshots.update((f) => [current, ...f]);
    this.course.set(previous.course);
    this.modules.set(previous.modules);
    this.lessons.set(previous.lessons);
    this.assessments.set(previous.assessments);
  }

  redo(): void {
    const future = this.futureSnapshots();
    if (future.length === 0) return;
    const current = this.captureSnapshot();
    const next = JSON.parse(future[0]);
    this.futureSnapshots.update((f) => f.slice(1));
    this.pastSnapshots.update((p) => [...p, current]);
    this.course.set(next.course);
    this.modules.set(next.modules);
    this.lessons.set(next.lessons);
    this.assessments.set(next.assessments);
  }

  // ─── Restore from localStorage ───
  restoreDraft(): boolean {
    const raw = localStorage.getItem('courseBuilder_draft');
    if (!raw) return false;
    try {
      const snapshot = JSON.parse(raw);
      this.course.set(snapshot.course);
      this.modules.set(snapshot.modules);
      this.lessons.set(snapshot.lessons);
      this.assessments.set(snapshot.assessments);
      this.currentStep.set(snapshot.currentStep);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Component Usage with Signals

```typescript
// course-wizard-signals.component.ts
@Component({
  selector: 'app-course-wizard',
  template: `
    <app-step-indicator
      [currentStep]="svc.currentStep()"
      [completionPct]="svc.completionPercentage()"
    />

    @switch (svc.currentStep()) {
      @case (0) {
        <app-course-info-step
          [course]="svc.course()"
          (update)="svc.updateCourseInfo($event)"
        />
      }
      @case (1) {
        <app-modules-step
          [modules]="svc.modulesWithCounts()"
          (add)="svc.addModule($event)"
          (remove)="svc.removeModule($event)"
        />
      }
      @case (2) {
        <app-lessons-step
          [lessons]="svc.lessons()"
          (add)="svc.addLesson($event)"
        />
      }
      @case (3) { <app-assessments-step [assessments]="svc.assessments()" /> }
      @case (4) { <app-review-step /> }
    }

    <div class="wizard-nav">
      <button (click)="svc.previousStep()" [disabled]="svc.currentStep() === 0">
        ← Back
      </button>
      <button (click)="svc.undo()" [disabled]="!svc.canUndo()">↩ Undo</button>
      <button (click)="svc.redo()" [disabled]="!svc.canRedo()">↪ Redo</button>
      <button (click)="svc.nextStep()" [disabled]="!svc.canProceed()">
        Next →
      </button>
    </div>
  `,
})
export class CourseWizardSignalsComponent {
  readonly svc = inject(CourseBuilderSignalService);
}
```

**Trade-offs vs NgRx:**
- ✅ Zero boilerplate, zero additional dependencies
- ✅ `computed()` is automatically memoized (like NgRx selectors)
- ✅ `effect()` replaces NgRx Effects for simple side effects
- ❌ No DevTools, no action log, no time-travel debugging
- ❌ No enforced patterns — discipline falls on the team
- ❌ Undo/redo requires manual snapshot management


---

### Approach 3: BehaviorSubject Service Pattern

The "vanilla Angular" approach. No additional libraries, just RxJS (already bundled with Angular). Good for mid-size apps where you want observable state without NgRx ceremony.

**When to use:** Teams comfortable with RxJS, mid-size apps (2-5 devs), when you want observable state without the NgRx learning curve, or as a stepping stone before adopting NgRx.

```typescript
// course-builder-bs.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, interval } from 'rxjs';
import {
  map, distinctUntilChanged, filter, switchMap,
  debounceTime, tap, catchError,
} from 'rxjs/operators';
import { CourseInfo, Module, Lesson, Assessment } from './models';
import { CourseApiService } from './course-api.service';

interface WizardState {
  currentStep: number;
  course: CourseInfo;
  modules: Module[];
  lessons: Record<string, Lesson[]>;
  assessments: Assessment[];
  isSaving: boolean;
  lastSavedAt: string | null;
  isDirty: boolean;
}

@Injectable({ providedIn: 'root' })
export class CourseBuilderBSService {
  // ─── Single BehaviorSubject for entire state ───
  private readonly state$ = new BehaviorSubject<WizardState>({
    currentStep: 0,
    course: {
      title: '', description: '', category: '',
      difficulty: 'beginner', thumbnailUrl: '',
    },
    modules: [],
    lessons: {},
    assessments: [],
    isSaving: false,
    lastSavedAt: null,
    isDirty: false,
  });

  // ─── Undo/Redo stacks ───
  private past: WizardState[] = [];
  private future: WizardState[] = [];

  // ─── Public Observables (select slices with distinctUntilChanged) ───
  readonly currentStep$ = this.select((s) => s.currentStep);
  readonly course$ = this.select((s) => s.course);
  readonly modules$ = this.select((s) => s.modules);
  readonly lessons$ = this.select((s) => s.lessons);
  readonly assessments$ = this.select((s) => s.assessments);
  readonly isSaving$ = this.select((s) => s.isSaving);
  readonly lastSavedAt$ = this.select((s) => s.lastSavedAt);

  // ─── Derived Observables ───
  readonly totalLessons$ = this.lessons$.pipe(
    map((lessons) =>
      Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0)
    )
  );

  readonly completionPercentage$ = combineLatest([
    this.course$,
    this.modules$,
    this.totalLessons$,
    this.assessments$,
  ]).pipe(
    map(([course, modules, totalLessons, assessments]) => {
      let valid = 0;
      if (course.title && course.description) valid++;
      if (modules.length > 0) valid++;
      if (totalLessons > 0) valid++;
      if (assessments.length > 0) valid++;
      return Math.round((valid / 5) * 100);
    }),
    distinctUntilChanged()
  );

  readonly canUndo$ = new BehaviorSubject(false);
  readonly canRedo$ = new BehaviorSubject(false);

  constructor(private api: CourseApiService) {
    this.setupAutoSave();
    this.setupLocalStoragePersistence();
  }

  // ─── Generic selector helper ───
  private select<T>(selector: (state: WizardState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // ─── State snapshot ───
  get snapshot(): WizardState {
    return this.state$.getValue();
  }

  // ─── Private state update with undo tracking ───
  private setState(
    updater: (state: WizardState) => WizardState,
    trackUndo = true
  ): void {
    const current = this.snapshot;
    if (trackUndo) {
      this.past.push({ ...current });
      this.future = [];
      if (this.past.length > 50) this.past.shift();
      this.canUndo$.next(true);
      this.canRedo$.next(false);
    }
    this.state$.next(updater(current));
  }

  // ─── Navigation ───
  nextStep(): void {
    this.setState(
      (s) => ({
        ...s,
        currentStep: Math.min(s.currentStep + 1, 4),
      }),
      false // navigation doesn't need undo
    );
  }

  previousStep(): void {
    this.setState(
      (s) => ({
        ...s,
        currentStep: Math.max(s.currentStep - 1, 0),
      }),
      false
    );
  }

  // ─── Mutations ───
  updateCourseInfo(partial: Partial<CourseInfo>): void {
    this.setState((s) => ({
      ...s,
      course: { ...s.course, ...partial },
      isDirty: true,
    }));
  }

  addModule(module: Module): void {
    this.setState((s) => ({
      ...s,
      modules: [...s.modules, module],
      isDirty: true,
    }));
  }

  removeModule(id: string): void {
    this.setState((s) => {
      const { [id]: _, ...remainingLessons } = s.lessons;
      return {
        ...s,
        modules: s.modules.filter((m) => m.id !== id),
        lessons: remainingLessons,
        assessments: s.assessments.filter((a) => a.moduleId !== id),
        isDirty: true,
      };
    });
  }

  addLesson(lesson: Lesson): void {
    this.setState((s) => ({
      ...s,
      lessons: {
        ...s.lessons,
        [lesson.moduleId]: [...(s.lessons[lesson.moduleId] || []), lesson],
      },
      isDirty: true,
    }));
  }

  // ─── Undo / Redo ───
  undo(): void {
    if (this.past.length === 0) return;
    const current = this.snapshot;
    const previous = this.past.pop()!;
    this.future.unshift(current);
    this.state$.next(previous);
    this.canUndo$.next(this.past.length > 0);
    this.canRedo$.next(true);
  }

  redo(): void {
    if (this.future.length === 0) return;
    const current = this.snapshot;
    const next = this.future.shift()!;
    this.past.push(current);
    this.state$.next(next);
    this.canUndo$.next(true);
    this.canRedo$.next(this.future.length > 0);
  }

  // ─── Auto-save every 30s ───
  private setupAutoSave(): void {
    interval(30_000)
      .pipe(
        filter(() => this.snapshot.isDirty && !this.snapshot.isSaving),
        tap(() =>
          this.state$.next({ ...this.snapshot, isSaving: true })
        ),
        switchMap(() =>
          this.api.saveDraft(this.snapshot).pipe(
            tap(() =>
              this.state$.next({
                ...this.snapshot,
                isSaving: false,
                isDirty: false,
                lastSavedAt: new Date().toISOString(),
              })
            ),
            catchError((err) => {
              this.state$.next({ ...this.snapshot, isSaving: false });
              console.error('Auto-save failed:', err);
              return [];
            })
          )
        )
      )
      .subscribe();
  }

  // ─── localStorage persistence ───
  private setupLocalStoragePersistence(): void {
    this.state$
      .pipe(debounceTime(1000))
      .subscribe((state) => {
        try {
          localStorage.setItem(
            'courseBuilder_draft',
            JSON.stringify(state)
          );
        } catch (e) {
          console.warn('localStorage write failed:', e);
        }
      });
  }

  restoreDraft(): boolean {
    const raw = localStorage.getItem('courseBuilder_draft');
    if (!raw) return false;
    try {
      this.state$.next(JSON.parse(raw));
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Component Usage with BehaviorSubject Service

```typescript
// course-wizard-bs.component.ts
@Component({
  selector: 'app-course-wizard',
  template: `
    @if (state$ | async; as state) {
      <app-step-indicator
        [currentStep]="state.currentStep"
        [completionPct]="completionPct$ | async"
      />

      <!-- Step content based on currentStep -->

      <div class="wizard-nav">
        <button (click)="svc.previousStep()"
                [disabled]="state.currentStep === 0">← Back</button>
        <button (click)="svc.undo()"
                [disabled]="!(canUndo$ | async)">↩ Undo</button>
        <button (click)="svc.redo()"
                [disabled]="!(canRedo$ | async)">↪ Redo</button>
        <button (click)="svc.nextStep()"
                [disabled]="state.currentStep === 4">Next →</button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseWizardBSComponent {
  readonly svc = inject(CourseBuilderBSService);
  readonly state$ = this.svc['state$'].asObservable();
  readonly completionPct$ = this.svc.completionPercentage$;
  readonly canUndo$ = this.svc.canUndo$;
  readonly canRedo$ = this.svc.canRedo$;
}
```

**Trade-offs vs NgRx and Signals:**
- ✅ No additional dependencies beyond RxJS
- ✅ Familiar to Angular developers who know RxJS
- ✅ `distinctUntilChanged()` provides basic memoization
- ✅ Easy to test with marble testing
- ❌ No enforced patterns — state mutations can happen anywhere
- ❌ No DevTools integration
- ❌ Manual subscription management (use `async` pipe or `takeUntilDestroyed`)
- ❌ `getValue()` is a code smell — prefer reactive chains

---

### NgRx SignalStore — The Middle Ground

NgRx SignalStore bridges the gap: it gives you structured state management with Signals (no RxJS required for reads), built-in DevTools support, and far less boilerplate than full NgRx Store.

**When to use:** When you want more structure than raw Signals but less ceremony than NgRx Store. Great for feature-level state management.

```typescript
// course-builder.store.ts
import {
  signalStore, withState, withComputed, withMethods,
  withHooks, patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, interval, filter } from 'rxjs';
import { CourseInfo, Module, Lesson, Assessment } from './models';
import { CourseApiService } from './course-api.service';

// State shape
interface CourseBuilderState {
  currentStep: number;
  course: CourseInfo;
  modules: Module[];
  lessons: Record<string, Lesson[]>;
  assessments: Assessment[];
  isSaving: boolean;
  lastSavedAt: string | null;
  isDirty: boolean;
}

const initialState: CourseBuilderState = {
  currentStep: 0,
  course: {
    title: '', description: '', category: '',
    difficulty: 'beginner', thumbnailUrl: '',
  },
  modules: [],
  lessons: {},
  assessments: [],
  isSaving: false,
  lastSavedAt: null,
  isDirty: false,
};

export const CourseBuilderStore = signalStore(
  { providedIn: 'root' },

  // ─── State ───
  withState(initialState),

  // ─── Computed (auto-memoized, like NgRx selectors) ───
  withComputed((store) => ({
    totalLessons: computed(() =>
      Object.values(store.lessons()).reduce(
        (sum, arr) => sum + arr.length, 0
      )
    ),
    modulesWithCounts: computed(() =>
      store.modules().map((m) => ({
        ...m,
        lessonCount: (store.lessons()[m.id] || []).length,
      }))
    ),
    completionPercentage: computed(() => {
      let valid = 0;
      if (store.course().title && store.course().description) valid++;
      if (store.modules().length > 0) valid++;
      const totalLessons = Object.values(store.lessons())
        .reduce((sum, arr) => sum + arr.length, 0);
      if (totalLessons > 0) valid++;
      if (store.assessments().length > 0) valid++;
      return Math.round((valid / 5) * 100);
    }),
    canProceed: computed(() => {
      const step = store.currentStep();
      switch (step) {
        case 0:
          return !!store.course().title && !!store.course().description;
        case 1: return store.modules().length > 0;
        case 2:
          return Object.values(store.lessons())
            .reduce((s, a) => s + a.length, 0) > 0;
        case 3: return store.assessments().length > 0;
        case 4: return true;
        default: return false;
      }
    }),
  })),

  // ─── Methods (mutations + side effects) ───
  withMethods((store, api = inject(CourseApiService)) => ({
    // Navigation
    nextStep() {
      patchState(store, (s) => ({
        currentStep: Math.min(s.currentStep + 1, 4),
      }));
    },
    previousStep() {
      patchState(store, (s) => ({
        currentStep: Math.max(s.currentStep - 1, 0),
      }));
    },
    goToStep(step: number) {
      patchState(store, { currentStep: Math.max(0, Math.min(step, 4)) });
    },

    // Mutations
    updateCourseInfo(partial: Partial<CourseInfo>) {
      patchState(store, (s) => ({
        course: { ...s.course, ...partial },
        isDirty: true,
      }));
    },
    addModule(module: Module) {
      patchState(store, (s) => ({
        modules: [...s.modules, module],
        isDirty: true,
      }));
    },
    removeModule(id: string) {
      patchState(store, (s) => {
        const { [id]: _, ...rest } = s.lessons;
        return {
          modules: s.modules.filter((m) => m.id !== id),
          lessons: rest,
          assessments: s.assessments.filter((a) => a.moduleId !== id),
          isDirty: true,
        };
      });
    },
    addLesson(lesson: Lesson) {
      patchState(store, (s) => ({
        lessons: {
          ...s.lessons,
          [lesson.moduleId]: [
            ...(s.lessons[lesson.moduleId] || []),
            lesson,
          ],
        },
        isDirty: true,
      }));
    },

    // Async: save draft via rxMethod (RxJS interop)
    saveDraft: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(() =>
          api.saveDraft(store).pipe(
            tap(() =>
              patchState(store, {
                isSaving: false,
                isDirty: false,
                lastSavedAt: new Date().toISOString(),
              })
            )
          )
        )
      )
    ),
  })),

  // ─── Lifecycle Hooks ───
  withHooks({
    onInit(store) {
      // Restore from localStorage on init
      const raw = localStorage.getItem('courseBuilder_draft');
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          patchState(store, saved);
        } catch { /* ignore corrupt data */ }
      }
    },
  })
);
```

#### Component Usage with SignalStore

```typescript
// course-wizard-signalstore.component.ts
@Component({
  selector: 'app-course-wizard',
  template: `
    <app-step-indicator
      [currentStep]="store.currentStep()"
      [completionPct]="store.completionPercentage()"
    />

    @switch (store.currentStep()) {
      @case (0) {
        <app-course-info-step
          [course]="store.course()"
          (update)="store.updateCourseInfo($event)"
        />
      }
      @case (1) {
        <app-modules-step
          [modules]="store.modulesWithCounts()"
          (add)="store.addModule($event)"
          (remove)="store.removeModule($event)"
        />
      }
    }

    <div class="wizard-nav">
      <button (click)="store.previousStep()">← Back</button>
      <button (click)="store.nextStep()"
              [disabled]="!store.canProceed()">Next →</button>
    </div>
  `,
})
export class CourseWizardSignalStoreComponent {
  readonly store = inject(CourseBuilderStore);
}
```

**Why SignalStore is the "middle ground":**

| Aspect | NgRx Store | SignalStore | Raw Signals |
|---|---|---|---|
| Boilerplate | High | Low | Very Low |
| Structure | Strict (actions/reducers) | Moderate (withMethods) | None |
| DevTools | ✅ Full | ✅ Partial | ❌ |
| RxJS required | Yes (effects) | Optional (rxMethod) | No |
| Testability | Excellent | Good | Good |
| Bundle size | ~15-20KB | ~5KB | 0KB |

---

### Selector Memoization Deep Dive

Memoization is critical for performance in state management. Here's how each approach handles it:

```
┌─────────────────────────────────────────────────────────────┐
│                  MEMOIZATION COMPARISON                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NgRx createSelector():                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Input A  │───→│          │    │          │               │
│  └──────────┘    │ Selector │───→│  Result  │ (cached)      │
│  ┌──────────┐    │ Function │    │          │               │
│  │ Input B  │───→│          │    │          │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│  Only recomputes when Input A or Input B reference changes   │
│                                                              │
│  Signals computed():                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Signal A │───→│          │    │          │               │
│  └──────────┘    │ computed │───→│  Result  │ (cached)      │
│  ┌──────────┐    │          │    │          │               │
│  │ Signal B │───→│          │    │          │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│  Tracks dependencies automatically, lazy evaluation          │
│                                                              │
│  BehaviorSubject + distinctUntilChanged():                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ State$   │───→│   map    │───→│ distinct │───→ Output    │
│  └──────────┘    └──────────┘    └──────────┘               │
│  Still recomputes map(), just suppresses duplicate emissions  │
│  NOT true memoization — use shareReplay(1) for caching       │
└─────────────────────────────────────────────────────────────┘
```

#### NgRx Selector Memoization — How It Works

```typescript
// NgRx selectors use reference equality by default
const selectExpensiveComputation = createSelector(
  selectModules,
  selectAllLessons,
  (modules, lessons) => {
    // This ONLY runs when modules or lessons reference changes
    console.log('Recomputing...'); // won't fire on unrelated state changes
    return modules.map((m) => ({
      ...m,
      lessons: lessons[m.id] || [],
      totalDuration: (lessons[m.id] || []).reduce(
        (sum, l) => sum + l.duration, 0
      ),
    }));
  }
);

// Custom equality for deep comparison (rare, use carefully)
const selectWithCustomEquality = createSelector(
  selectModules,
  (modules) => modules.filter((m) => m.order > 0),
  {
    memoize: resultMemoize,
    memoizeOptions: {
      resultEqualityCheck: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    },
  }
);
```

#### Signals Computed — Automatic Dependency Tracking

```typescript
// Signals track dependencies automatically — no need to declare inputs
const totalDuration = computed(() => {
  // Angular tracks that this reads modules() and lessons()
  // It will ONLY recompute when either signal changes
  return modules().reduce((total, m) => {
    const moduleLessons = lessons()[m.id] || [];
    return total + moduleLessons.reduce((sum, l) => sum + l.duration, 0);
  }, 0);
});

// Computed signals are LAZY — they don't compute until first read
// And they cache until a dependency changes
```

#### BehaviorSubject — Manual Memoization

```typescript
// BehaviorSubject requires manual memoization with shareReplay
readonly expensiveData$ = this.state$.pipe(
  map((state) => {
    // This runs on EVERY state emission, even unrelated changes
    return computeExpensiveResult(state);
  }),
  distinctUntilChanged(
    (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
  ),
  shareReplay(1) // cache the last result for late subscribers
);

// Better: select only the slice you need FIRST
readonly expensiveData$ = combineLatest([
  this.select((s) => s.modules),
  this.select((s) => s.lessons),
]).pipe(
  map(([modules, lessons]) => computeExpensiveResult(modules, lessons)),
  shareReplay(1)
);
```


---

### Decision Flowchart

```
                        ┌─────────────────────┐
                        │  New Angular Feature │
                        │  Needs State Mgmt?   │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ Is state shared across       │
                    │ multiple unrelated features?  │
                    └──────┬──────────────┬────────┘
                           │ YES          │ NO
                           ▼              ▼
                ┌──────────────┐  ┌──────────────────┐
                │ Global Store │  │ Is it component-  │
                │ Needed       │  │ local state only? │
                └──────┬───────┘  └───┬──────────┬───┘
                       │              │ YES      │ NO
                       ▼              ▼          ▼
            ┌──────────────┐  ┌──────────┐  ┌──────────────┐
            │ Team > 5 devs│  │ Angular  │  │ Feature-level│
            │ Need DevTools│  │ Signals  │  │ shared state │
            │ Audit trail? │  │ (local)  │  └──────┬───────┘
            └──┬───────┬───┘  └──────────┘         │
               │ YES   │ NO                        ▼
               ▼       ▼              ┌────────────────────┐
        ┌──────────┐ ┌──────────┐     │ Complex async?     │
        │  NgRx    │ │  NgRx    │     │ Multiple effects?  │
        │  Store   │ │ Signal   │     └──┬─────────┬───────┘
        │ (full)   │ │ Store    │        │ YES     │ NO
        └──────────┘ └──────────┘        ▼         ▼
                                  ┌──────────┐ ┌──────────────┐
                                  │  NgRx    │ │ BehaviorSubj │
                                  │ Signal   │ │ Service      │
                                  │ Store    │ │ Pattern      │
                                  └──────────┘ └──────────────┘
```

**Key Decision Points:**
1. **Component-local only?** → Signals. No contest.
2. **Feature-level, moderate complexity?** → SignalStore or BehaviorSubject service.
3. **Enterprise, 5+ devs, need audit trail?** → Full NgRx Store.
4. **Complex async orchestration?** → NgRx Effects or SignalStore with rxMethod.

---

### Avoiding Over-Engineering Guidelines

```
┌─────────────────────────────────────────────────────────────┐
│              OVER-ENGINEERING WARNING SIGNS                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🚩 You're putting form field values in NgRx Store           │
│     → Use Reactive Forms. Forms are local state.             │
│                                                              │
│  🚩 Every component dispatches actions for UI toggles        │
│     → Use component signals for isOpen, isExpanded, etc.     │
│                                                              │
│  🚩 You have more NgRx boilerplate files than feature files  │
│     → Consider SignalStore or BehaviorSubject service.        │
│                                                              │
│  🚩 Your selectors just return state slices without          │
│     transformation                                           │
│     → You might not need NgRx. A service would suffice.      │
│                                                              │
│  🚩 You're using NgRx for a CRUD app with 3 entities         │
│     → BehaviorSubject service or SignalStore is enough.       │
│                                                              │
│  🚩 Only 1-2 developers on the project                       │
│     → NgRx's enforced patterns add overhead without benefit. │
└─────────────────────────────────────────────────────────────┘
```

**The Pragmatic Rule:**
> "Start with the simplest approach that meets your requirements. Migrate up only when you hit a wall."

| Start With | Migrate To | When |
|---|---|---|
| Component Signals | Signal Service | State shared across siblings |
| Signal Service | SignalStore | Need structure, DevTools, rxMethod |
| SignalStore | NgRx Store | Need full action log, time-travel, complex effects |
| BehaviorSubject | SignalStore | Want to reduce RxJS complexity |

---

### Interview Summary: Key Talking Points (Q10)

1. **Lead with the decision matrix** — show you evaluate trade-offs, not just pick a favorite.
2. **NgRx is not always the answer** — over-engineering is a real risk. Mention it proactively.
3. **Signals are the future** — Angular is moving toward Signals. Show you're current.
4. **SignalStore is the pragmatic middle ground** — less boilerplate, still structured.
5. **Memoization matters** — explain how each approach handles it differently.
6. **Undo/redo is a differentiator** — NgRx gets it "for free" via action replay; others need manual work.
7. **Auto-save pattern** — show you think about persistence, crash recovery, and user experience.

---
---

## Q11: Sharing State Across Micro Frontends

**Question:** In a Micro Frontend setup, how do you share state (e.g., authenticated user, cart, theme) across independently deployed Angular MFEs without tight coupling?

### The Problem Space

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER TAB                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SHELL / HOST APP                       │   │
│  │  (Angular 17, independently deployed)                     │   │
│  │  Owns: Auth state, Theme, Navigation                      │   │
│  └──────────┬──────────────────────────────────┬─────────────┘   │
│             │                                  │                 │
│  ┌──────────▼──────────┐  ┌───────────────────▼──────────────┐  │
│  │   MFE: Product      │  │   MFE: Cart                      │  │
│  │   Catalog            │  │   (Angular 16)                   │  │
│  │   (Angular 17)       │  │   Needs: user, cart items,       │  │
│  │   Needs: user, theme │  │          theme                   │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │   MFE: Checkout (React 18 — yes, different framework!)     ││
│  │   Needs: user, cart, theme                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  CHALLENGE: These are independently built, deployed, and        │
│  versioned. They CANNOT import each other's internal state.     │
└─────────────────────────────────────────────────────────────────┘
```

**Core Constraints:**
- MFEs are independently deployed (different CI/CD pipelines)
- May use different Angular versions (or even different frameworks)
- Cannot share runtime Angular modules directly
- Must avoid tight coupling — one MFE's deployment shouldn't break another
- State must be consistent across all MFEs in real-time

---

### Pattern 1: Shared Singleton Service via Module Federation

**Concept:** Use Webpack Module Federation's `singleton: true` to ensure all MFEs share the same instance of a state service at runtime.

**How it works:**
```
┌─────────────────────────────────────────────────────┐
│  Webpack Module Federation Runtime                   │
│                                                      │
│  shared: {                                           │
│    '@myorg/shared-state': { singleton: true }        │
│  }                                                   │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  Shell  │  │  MFE-A  │  │  MFE-B  │             │
│  │         │  │         │  │         │             │
│  │  inject │  │  inject │  │  inject │             │
│  │  Auth   │  │  Auth   │  │  Auth   │             │
│  │  Svc ───┼──┼── Svc ──┼──┼── Svc   │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│       │              │              │                │
│       └──────────────┼──────────────┘                │
│                      ▼                               │
│            ┌──────────────────┐                      │
│            │  SAME INSTANCE   │                      │
│            │  in memory       │                      │
│            └──────────────────┘                      │
└─────────────────────────────────────────────────────┘
```

#### Step 1: Create the Shared State Library

```typescript
// libs/shared-state/src/lib/auth-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  avatarUrl: string;
  token: string;
}

export interface SharedAppState {
  user: AuthUser | null;
  theme: 'light' | 'dark';
  locale: string;
  cartItemCount: number;
}

@Injectable({ providedIn: 'root' })
export class SharedStateService {
  private readonly state$ = new BehaviorSubject<SharedAppState>({
    user: null,
    theme: 'light',
    locale: 'en',
    cartItemCount: 0,
  });

  // ─── Public Selectors ───
  readonly user$: Observable<AuthUser | null> = this.state$.pipe(
    map((s) => s.user),
    distinctUntilChanged()
  );

  readonly isAuthenticated$: Observable<boolean> = this.user$.pipe(
    map((user) => user !== null)
  );

  readonly theme$: Observable<'light' | 'dark'> = this.state$.pipe(
    map((s) => s.theme),
    distinctUntilChanged()
  );

  readonly cartItemCount$: Observable<number> = this.state$.pipe(
    map((s) => s.cartItemCount),
    distinctUntilChanged()
  );

  // ─── Mutations ───
  setUser(user: AuthUser | null): void {
    this.updateState({ user });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }

  setCartItemCount(count: number): void {
    this.updateState({ cartItemCount: count });
  }

  setLocale(locale: string): void {
    this.updateState({ locale });
  }

  // ─── Snapshot (for non-reactive reads) ───
  getSnapshot(): SharedAppState {
    return this.state$.getValue();
  }

  private updateState(partial: Partial<SharedAppState>): void {
    this.state$.next({ ...this.state$.getValue(), ...partial });
  }
}
```

#### Step 2: Webpack Module Federation Config (Shell)

```javascript
// webpack.config.js (Shell / Host)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        productCatalog: 'productCatalog@http://localhost:4201/remoteEntry.js',
        cart: 'cart@http://localhost:4202/remoteEntry.js',
        checkout: 'checkout@http://localhost:4203/remoteEntry.js',
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true },
        '@angular/router': { singleton: true, strictVersion: true },
        rxjs: { singleton: true, strictVersion: false },

        // ⭐ THE KEY: shared state as singleton
        '@myorg/shared-state': {
          singleton: true,       // ONE instance across all MFEs
          strictVersion: false,  // allow minor version mismatches
          requiredVersion: '^1.0.0',
          eager: true,           // load immediately, not lazy
        },
      },
    }),
  ],
};
```

#### Step 3: Webpack Config (Remote MFE)

```javascript
// webpack.config.js (Product Catalog MFE)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'productCatalog',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductModule': './src/app/product/product.module.ts',
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true },
        rxjs: { singleton: true },

        // Same shared state config — Module Federation ensures
        // only ONE instance is loaded at runtime
        '@myorg/shared-state': {
          singleton: true,
          strictVersion: false,
          requiredVersion: '^1.0.0',
        },
      },
    }),
  ],
};
```

#### Step 4: Usage in Remote MFE

```typescript
// product-catalog MFE — product-list.component.ts
import { Component, inject } from '@angular/core';
import { SharedStateService } from '@myorg/shared-state';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-list',
  template: `
    @if (isAuthenticated()) {
      <p>Welcome, {{ user()?.displayName }}!</p>
      <p>Theme: {{ theme() }}</p>
      <p>Cart items: {{ cartCount() }}</p>
    } @else {
      <p>Please log in to see personalized products.</p>
    }
  `,
})
export class ProductListComponent {
  private shared = inject(SharedStateService);

  user = toSignal(this.shared.user$);
  isAuthenticated = toSignal(this.shared.isAuthenticated$, {
    initialValue: false,
  });
  theme = toSignal(this.shared.theme$, { initialValue: 'light' });
  cartCount = toSignal(this.shared.cartItemCount$, { initialValue: 0 });
}
```

**Trade-offs:**
| Pros | Cons |
|---|---|
| ✅ Type-safe (shared TypeScript interfaces) | ❌ Tight coupling to Angular (all MFEs must use Angular) |
| ✅ Real-time reactivity (BehaviorSubject) | ❌ Version conflicts if MFEs use different Angular versions |
| ✅ Familiar DI pattern | ❌ `singleton: true` can cause subtle bugs if versions mismatch |
| ✅ No serialization overhead | ❌ Requires careful Webpack config coordination |
| ✅ Works with existing Angular patterns | ❌ Doesn't work cross-framework (React, Vue MFEs) |

---

### Pattern 2: CustomEvent-Based Pub/Sub

**Concept:** Use the browser's native `CustomEvent` API as a framework-agnostic message bus. Any MFE (Angular, React, Vue, vanilla JS) can publish and subscribe.

**How it works:**
```
┌─────────────────────────────────────────────────────┐
│                    window (DOM)                       │
│                                                      │
│  ┌─────────┐     CustomEvent        ┌─────────┐    │
│  │  Shell  │ ──dispatchEvent()────→ │  MFE-A  │    │
│  │         │                        │  (listen)│    │
│  └─────────┘                        └─────────┘    │
│       │                                    │         │
│       │         CustomEvent                │         │
│       └────dispatchEvent()────→ ┌─────────┐│         │
│                                 │  MFE-B  ││         │
│                                 │  (listen)││         │
│                                 └─────────┘│         │
│                                             │         │
│  addEventListener('mfe:auth-changed', ...)  │         │
│  addEventListener('mfe:theme-changed', ...) │         │
│  addEventListener('mfe:cart-updated', ...)   │         │
└─────────────────────────────────────────────────────┘
```

#### Full TypeScript Implementation

```typescript
// shared/mfe-event-bus.ts
// Framework-agnostic — can be used in Angular, React, Vue, or vanilla JS

// ─── Event Type Definitions ───
export interface MfeEventMap {
  'mfe:auth-changed': { user: AuthUser | null };
  'mfe:theme-changed': { theme: 'light' | 'dark' };
  'mfe:cart-updated': { itemCount: number; total: number };
  'mfe:locale-changed': { locale: string };
  'mfe:navigation': { path: string; params?: Record<string, string> };
  'mfe:notification': { type: 'info' | 'warn' | 'error'; message: string };
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  token: string;
}

type MfeEventName = keyof MfeEventMap;

// ─── Type-Safe Event Bus ───
export class MfeEventBus {
  /**
   * Publish an event to all MFEs
   * @param eventName - Typed event name from MfeEventMap
   * @param detail - Typed payload matching the event
   */
  static publish<K extends MfeEventName>(
    eventName: K,
    detail: MfeEventMap[K]
  ): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,    // bubble up through DOM
      composed: true,   // cross shadow DOM boundaries
    });
    window.dispatchEvent(event);

    // Optional: log for debugging in dev mode
    if ((window as any).__MFE_DEBUG__) {
      console.log(`[MFE Event] ${eventName}`, detail);
    }
  }

  /**
   * Subscribe to an event from any MFE
   * @returns Cleanup function to remove the listener
   */
  static subscribe<K extends MfeEventName>(
    eventName: K,
    handler: (detail: MfeEventMap[K]) => void
  ): () => void {
    const listener = (event: Event) => {
      handler((event as CustomEvent<MfeEventMap[K]>).detail);
    };
    window.addEventListener(eventName, listener);

    // Return unsubscribe function
    return () => window.removeEventListener(eventName, listener);
  }

  /**
   * Subscribe to an event, but only receive the first emission
   */
  static once<K extends MfeEventName>(
    eventName: K,
    handler: (detail: MfeEventMap[K]) => void
  ): void {
    const listener = (event: Event) => {
      handler((event as CustomEvent<MfeEventMap[K]>).detail);
      window.removeEventListener(eventName, listener);
    };
    window.addEventListener(eventName, listener);
  }
}
```

#### Angular Wrapper Service (for DI and lifecycle management)

```typescript
// mfe-event-bus.service.ts
import { Injectable, OnDestroy, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MfeEventBus, MfeEventMap, MfeEventName } from './mfe-event-bus';

@Injectable({ providedIn: 'root' })
export class MfeEventBusService implements OnDestroy {
  private ngZone = inject(NgZone);
  private cleanupFns: (() => void)[] = [];

  /**
   * Publish event (runs outside Angular zone for performance)
   */
  publish<K extends MfeEventName>(
    eventName: K,
    detail: MfeEventMap[K]
  ): void {
    this.ngZone.runOutsideAngular(() => {
      MfeEventBus.publish(eventName, detail);
    });
  }

  /**
   * Subscribe and return an Observable (runs inside Angular zone)
   */
  on<K extends MfeEventName>(eventName: K): Observable<MfeEventMap[K]> {
    return new Observable<MfeEventMap[K]>((subscriber) => {
      const cleanup = MfeEventBus.subscribe(eventName, (detail) => {
        // Run inside Angular zone to trigger change detection
        this.ngZone.run(() => subscriber.next(detail));
      });
      this.cleanupFns.push(cleanup);
      return () => cleanup();
    });
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }
}
```

#### Usage: Shell publishes auth state

```typescript
// shell — auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private eventBus = inject(MfeEventBusService);

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthUser>('/api/auth/login', credentials).pipe(
      tap((user) => {
        // Publish to all MFEs
        this.eventBus.publish('mfe:auth-changed', { user });
      })
    );
  }

  logout() {
    this.eventBus.publish('mfe:auth-changed', { user: null });
  }

  toggleTheme(theme: 'light' | 'dark') {
    this.eventBus.publish('mfe:theme-changed', { theme });
  }
}
```

#### Usage: Remote MFE subscribes

```typescript
// cart MFE — cart-header.component.ts
@Component({
  selector: 'app-cart-header',
  template: `
    @if (user(); as u) {
      <span>{{ u.displayName }}'s Cart</span>
    }
    <span class="theme-indicator">{{ theme() }}</span>
  `,
})
export class CartHeaderComponent {
  private eventBus = inject(MfeEventBusService);

  user = toSignal(
    this.eventBus.on('mfe:auth-changed').pipe(map((e) => e.user)),
    { initialValue: null }
  );

  theme = toSignal(
    this.eventBus.on('mfe:theme-changed').pipe(map((e) => e.theme)),
    { initialValue: 'light' as const }
  );
}
```

#### Usage from React MFE (framework-agnostic)

```typescript
// checkout MFE (React) — useAuthState.ts
import { useState, useEffect } from 'react';
import { MfeEventBus, AuthUser } from '@myorg/mfe-event-bus';

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const cleanup = MfeEventBus.subscribe('mfe:auth-changed', ({ user }) => {
      setUser(user);
    });
    return cleanup; // auto-cleanup on unmount
  }, []);

  return user;
}
```

**Trade-offs:**
| Pros | Cons |
|---|---|
| ✅ Framework-agnostic (Angular + React + Vue) | ❌ No initial state — late subscribers miss events |
| ✅ Zero dependencies | ❌ No persistence (page refresh loses state) |
| ✅ Fully decoupled (no shared npm packages required) | ❌ Debugging is harder (no DevTools) |
| ✅ Works across shadow DOM boundaries | ❌ Type safety only if all MFEs share the type definitions |
| ✅ Native browser API, very fast | ❌ No guaranteed delivery order |

---

### Pattern 3: BroadcastChannel API

**Concept:** `BroadcastChannel` enables communication between different browsing contexts (tabs, iframes, workers) on the same origin. Unlike CustomEvent, it works across browser tabs.

**How it works:**
```
┌─────────────────────────────────────────────────────┐
│  Same Origin: https://myapp.com                      │
│                                                      │
│  ┌─────────────┐  BroadcastChannel  ┌────────────┐ │
│  │  Tab 1      │ ←───────────────→  │  Tab 2     │ │
│  │  Shell+MFEs │    'app-state'     │  Shell+MFEs│ │
│  └─────────────┘                    └────────────┘ │
│         │                                  │        │
│         │         BroadcastChannel         │        │
│         └────────────────────────→ ┌──────────────┐│
│                                    │  Web Worker  ││
│                                    │  (optional)  ││
│                                    └──────────────┘│
│                                                      │
│  USE CASE: User logs out in Tab 1 → Tab 2 also      │
│  logs out immediately. Theme change syncs across     │
│  all tabs.                                           │
└─────────────────────────────────────────────────────┘
```

#### Full Implementation

```typescript
// shared/broadcast-state.service.ts
export interface BroadcastMessage<T = unknown> {
  type: string;
  payload: T;
  source: string;    // which MFE sent it
  timestamp: number;
}

export class BroadcastStateManager {
  private channel: BroadcastChannel;
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private sourceId: string;

  constructor(channelName: string, sourceId: string) {
    this.channel = new BroadcastChannel(channelName);
    this.sourceId = sourceId;

    this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, payload, source } = event.data;

      // Ignore messages from self
      if (source === this.sourceId) return;

      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.forEach((handler) => handler(payload));
      }
    };
  }

  /**
   * Broadcast state change to all other tabs/contexts
   */
  broadcast<T>(type: string, payload: T): void {
    const message: BroadcastMessage<T> = {
      type,
      payload,
      source: this.sourceId,
      timestamp: Date.now(),
    };
    this.channel.postMessage(message);
  }

  /**
   * Listen for state changes from other tabs/contexts
   */
  on<T>(type: string, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  /**
   * Close the channel (cleanup)
   */
  destroy(): void {
    this.channel.close();
    this.listeners.clear();
  }
}
```

#### Angular Service Wrapper

```typescript
// broadcast-state.angular.service.ts
import { Injectable, OnDestroy, NgZone, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { BroadcastStateManager } from './broadcast-state.service';

@Injectable({ providedIn: 'root' })
export class BroadcastStateService implements OnDestroy {
  private ngZone = inject(NgZone);
  private manager = new BroadcastStateManager(
    'myapp-state',
    `mfe-${Math.random().toString(36).slice(2, 8)}`
  );

  // ─── Reactive state subjects (local cache of broadcast state) ───
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  private themeSubject = new BehaviorSubject<'light' | 'dark'>('light');

  readonly user$ = this.userSubject.asObservable();
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    // Listen for broadcasts from other tabs
    this.manager.on<AuthUser | null>('auth', (user) => {
      this.ngZone.run(() => this.userSubject.next(user));
    });

    this.manager.on<'light' | 'dark'>('theme', (theme) => {
      this.ngZone.run(() => this.themeSubject.next(theme));
    });
  }

  /**
   * Set user and broadcast to all tabs
   */
  setUser(user: AuthUser | null): void {
    this.userSubject.next(user);
    this.manager.broadcast('auth', user);
  }

  /**
   * Set theme and broadcast to all tabs
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSubject.next(theme);
    this.manager.broadcast('theme', theme);
  }

  ngOnDestroy(): void {
    this.manager.destroy();
  }
}
```

#### Usage Example

```typescript
// Any MFE component
@Component({
  selector: 'app-user-menu',
  template: `
    <div [class]="'theme-' + theme()">
      @if (user(); as u) {
        <span>{{ u.displayName }}</span>
        <button (click)="logout()">Logout (all tabs)</button>
      }
      <button (click)="toggleTheme()">Toggle Theme (all tabs)</button>
    </div>
  `,
})
export class UserMenuComponent {
  private broadcast = inject(BroadcastStateService);

  user = toSignal(this.broadcast.user$);
  theme = toSignal(this.broadcast.theme$, { initialValue: 'light' });

  logout(): void {
    // This will log out in ALL open tabs
    this.broadcast.setUser(null);
  }

  toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.broadcast.setTheme(next);
  }
}
```

**Trade-offs:**
| Pros | Cons |
|---|---|
| ✅ Cross-tab synchronization (unique capability!) | ❌ Same-origin only |
| ✅ Works with Web Workers and iframes | ❌ No initial state for new subscribers |
| ✅ Native browser API, no dependencies | ❌ Limited browser support in older browsers |
| ✅ Framework-agnostic | ❌ Serialization overhead (structured clone) |
| ✅ Automatic cleanup when tab closes | ❌ Not suitable for high-frequency updates |


---

### Pattern 4: URL-as-State

**Concept:** Encode shared state in URL query parameters or fragments. The URL becomes the single source of truth — any MFE can read it, and changes are automatically reflected in browser history.

**How it works:**
```
┌─────────────────────────────────────────────────────────────┐
│  URL: https://myapp.com/products?theme=dark&locale=en       │
│       &category=electronics&sort=price-asc                   │
│                                                              │
│  ┌─────────┐  reads URL params  ┌─────────┐                │
│  │  Shell  │ ←────────────────→ │  MFE-A  │                │
│  │         │                    │         │                │
│  └─────────┘                    └─────────┘                │
│       │          URL changes          │                     │
│       │    (popstate / pushState)      │                     │
│       ▼                               ▼                     │
│  ┌─────────────────────────────────────────────┐            │
│  │  Browser History / Back-Forward Navigation   │            │
│  │  Every state change is a URL change          │            │
│  │  → Shareable links! Bookmarkable state!      │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

```typescript
// shared/url-state.service.ts
import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, fromEvent, merge } from 'rxjs';
import {
  map, startWith, distinctUntilChanged, shareReplay,
} from 'rxjs/operators';

export interface UrlStateParams {
  theme?: 'light' | 'dark';
  locale?: string;
  category?: string;
  sort?: string;
  page?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UrlStateService {
  private router = inject(Router);

  // ─── Read state from URL ───
  getParam(key: string): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  getAllParams(): UrlStateParams {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result as UrlStateParams;
  }

  // ─── Reactive URL state (listens for popstate + pushState) ───
  param$(key: string): Observable<string | null> {
    return merge(
      fromEvent(window, 'popstate'),
      fromEvent(window, 'pushstate'), // custom event, see below
    ).pipe(
      startWith(null), // emit current value immediately
      map(() => this.getParam(key)),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  // ─── Write state to URL (without full page reload) ───
  setParam(key: string, value: string | null): void {
    const url = new URL(window.location.href);
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    // pushState doesn't trigger popstate, so we dispatch custom event
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('pushstate'));
  }

  setParams(params: Record<string, string | null>): void {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('pushstate'));
  }

  // ─── Replace state (no new history entry) ───
  replaceParam(key: string, value: string | null): void {
    const url = new URL(window.location.href);
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('pushstate'));
  }
}
```

#### Usage in MFE Components

```typescript
// product-catalog MFE — product-filters.component.ts
@Component({
  selector: 'app-product-filters',
  template: `
    <select (change)="onCategoryChange($event)">
      <option value="">All Categories</option>
      <option value="electronics" [selected]="category() === 'electronics'">
        Electronics
      </option>
      <option value="books" [selected]="category() === 'books'">
        Books
      </option>
    </select>

    <select (change)="onSortChange($event)">
      <option value="relevance">Relevance</option>
      <option value="price-asc" [selected]="sort() === 'price-asc'">
        Price: Low → High
      </option>
      <option value="price-desc" [selected]="sort() === 'price-desc'">
        Price: High → Low
      </option>
    </select>

    <button (click)="onThemeToggle()">
      Theme: {{ theme() }}
    </button>
  `,
})
export class ProductFiltersComponent {
  private urlState = inject(UrlStateService);

  // Reactive URL params as signals
  category = toSignal(this.urlState.param$('category'), {
    initialValue: null,
  });
  sort = toSignal(this.urlState.param$('sort'), {
    initialValue: 'relevance',
  });
  theme = toSignal(this.urlState.param$('theme'), {
    initialValue: 'light',
  });

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.urlState.setParam('category', value || null);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.urlState.setParam('sort', value);
  }

  onThemeToggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.urlState.setParam('theme', next);
  }
}
```

**Trade-offs:**
| Pros | Cons |
|---|---|
| ✅ Shareable / bookmarkable state | ❌ URL length limits (~2000 chars) |
| ✅ Browser back/forward navigation works | ❌ Only suitable for simple, serializable state |
| ✅ Framework-agnostic (it's just the URL) | ❌ Cannot store complex objects (user profiles, etc.) |
| ✅ SEO-friendly (search engines can index) | ❌ Sensitive data (tokens) must NEVER go in URLs |
| ✅ Zero dependencies, zero setup | ❌ Noisy URLs with many parameters |
| ✅ Works across tabs (same URL) | ❌ Not suitable for real-time state (cart items) |

**Best for:** Filters, pagination, sort order, theme preference, locale — anything that should be shareable via link.

---

### Pattern 5: Shared State Library via npm Package

**Concept:** Publish a framework-agnostic state management library as an npm package. Each MFE installs it as a dependency. The library uses browser-native APIs (localStorage, sessionStorage, or IndexedDB) as the shared persistence layer.

**How it works:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  npm: @myorg/shared-state-lib (framework-agnostic)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Internal Architecture:                               │   │
│  │                                                       │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────────┐   │   │
│  │  │ In-Memory│───→│ Storage  │───→│ localStorage │   │   │
│  │  │ Cache    │    │ Adapter  │    │ / IndexedDB  │   │   │
│  │  └──────────┘    └──────────┘    └──────────────┘   │   │
│  │       │                                              │   │
│  │       ▼                                              │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Event Emitter (notify subscribers on change) │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Shell  │  │  MFE-A  │  │  MFE-B  │  │  MFE-C  │       │
│  │ (Ang.)  │  │ (Ang.)  │  │ (React) │  │ (Vue)   │       │
│  │ import  │  │ import  │  │ import  │  │ import  │       │
│  │ from    │  │ from    │  │ from    │  │ from    │       │
│  │ @myorg/ │  │ @myorg/ │  │ @myorg/ │  │ @myorg/ │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
│  Each MFE has its OWN instance, but they share state via     │
│  localStorage + storage events for cross-tab sync.           │
└─────────────────────────────────────────────────────────────┘
```

#### The npm Package Implementation

```typescript
// @myorg/shared-state-lib/src/index.ts

type Listener<T> = (value: T) => void;

interface StateSlice<T> {
  key: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

/**
 * Framework-agnostic shared state manager.
 * Uses localStorage for persistence and cross-tab sync.
 * Uses in-memory cache + event emitter for same-tab reactivity.
 */
export class SharedStateLib {
  private cache = new Map<string, any>();
  private listeners = new Map<string, Set<Listener<any>>>();
  private prefix: string;

  constructor(prefix = 'mfe') {
    this.prefix = prefix;

    // Listen for storage events from OTHER tabs
    window.addEventListener('storage', (event) => {
      if (!event.key?.startsWith(this.prefix + ':')) return;
      const sliceKey = event.key.replace(this.prefix + ':', '');
      const newValue = event.newValue
        ? JSON.parse(event.newValue)
        : null;
      this.cache.set(sliceKey, newValue);
      this.notify(sliceKey, newValue);
    });
  }

  /**
   * Define a state slice with type safety
   */
  createSlice<T>(config: StateSlice<T>): {
    get: () => T;
    set: (value: T) => void;
    subscribe: (listener: Listener<T>) => () => void;
    reset: () => void;
  } {
    const storageKey = `${this.prefix}:${config.key}`;
    const serialize = config.serialize ?? JSON.stringify;
    const deserialize = config.deserialize ?? JSON.parse;

    // Initialize from localStorage or default
    const stored = localStorage.getItem(storageKey);
    const initial = stored ? deserialize(stored) : config.defaultValue;
    this.cache.set(config.key, initial);

    return {
      get: () => this.cache.get(config.key) ?? config.defaultValue,

      set: (value: T) => {
        this.cache.set(config.key, value);
        localStorage.setItem(storageKey, serialize(value));
        this.notify(config.key, value);
        // Dispatch storage event for same-tab listeners
        // (native storage event only fires in OTHER tabs)
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: storageKey,
            newValue: serialize(value),
          })
        );
      },

      subscribe: (listener: Listener<T>) => {
        if (!this.listeners.has(config.key)) {
          this.listeners.set(config.key, new Set());
        }
        this.listeners.get(config.key)!.add(listener);
        // Emit current value immediately
        listener(this.cache.get(config.key) ?? config.defaultValue);
        return () => this.listeners.get(config.key)?.delete(listener);
      },

      reset: () => {
        this.cache.set(config.key, config.defaultValue);
        localStorage.removeItem(storageKey);
        this.notify(config.key, config.defaultValue);
      },
    };
  }

  private notify<T>(key: string, value: T): void {
    this.listeners.get(key)?.forEach((listener) => listener(value));
  }

  /**
   * Clear all state (useful for logout)
   */
  clearAll(): void {
    this.cache.clear();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix + ':')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    this.listeners.forEach((handlers, key) => {
      handlers.forEach((handler) => handler(null));
    });
  }
}

// ─── Pre-configured singleton instance ───
export const sharedState = new SharedStateLib('myapp');

// ─── Pre-defined slices ───
export const authSlice = sharedState.createSlice<AuthUser | null>({
  key: 'auth-user',
  defaultValue: null,
});

export const themeSlice = sharedState.createSlice<'light' | 'dark'>({
  key: 'theme',
  defaultValue: 'light',
});

export const cartSlice = sharedState.createSlice<{
  items: CartItem[];
  total: number;
}>({
  key: 'cart',
  defaultValue: { items: [], total: 0 },
});

export const localeSlice = sharedState.createSlice<string>({
  key: 'locale',
  defaultValue: 'en',
});

// ─── Types ───
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  token: string;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
```

#### Angular Adapter

```typescript
// Angular wrapper for the shared state lib
import { Injectable, signal, effect, OnDestroy } from '@angular/core';
import { authSlice, themeSlice, cartSlice, localeSlice } from '@myorg/shared-state-lib';
import type { AuthUser, CartItem } from '@myorg/shared-state-lib';

@Injectable({ providedIn: 'root' })
export class SharedStateAdapter implements OnDestroy {
  // ─── Signals backed by the shared state lib ───
  readonly user = signal<AuthUser | null>(authSlice.get());
  readonly theme = signal<'light' | 'dark'>(themeSlice.get());
  readonly cart = signal<{ items: CartItem[]; total: number }>(cartSlice.get());
  readonly locale = signal<string>(localeSlice.get());

  private cleanups: (() => void)[] = [];

  constructor() {
    // Subscribe to external changes (other MFEs or tabs)
    this.cleanups.push(
      authSlice.subscribe((user) => this.user.set(user)),
      themeSlice.subscribe((theme) => this.theme.set(theme)),
      cartSlice.subscribe((cart) => this.cart.set(cart)),
      localeSlice.subscribe((locale) => this.locale.set(locale)),
    );
  }

  // ─── Mutations (write to shared state) ───
  setUser(user: AuthUser | null): void {
    authSlice.set(user);
  }

  setTheme(theme: 'light' | 'dark'): void {
    themeSlice.set(theme);
  }

  updateCart(items: CartItem[]): void {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    cartSlice.set({ items, total });
  }

  setLocale(locale: string): void {
    localeSlice.set(locale);
  }

  logout(): void {
    authSlice.reset();
    cartSlice.reset();
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
```

#### React Adapter (same npm package, different framework)

```typescript
// React hook for the shared state lib
import { useState, useEffect, useSyncExternalStore } from 'react';
import { authSlice, themeSlice, cartSlice } from '@myorg/shared-state-lib';

// Generic hook for any slice
function useSharedSlice<T>(slice: {
  get: () => T;
  subscribe: (listener: (value: T) => void) => () => void;
}): T {
  return useSyncExternalStore(
    slice.subscribe,
    slice.get
  );
}

// Pre-built hooks
export const useAuth = () => useSharedSlice(authSlice);
export const useTheme = () => useSharedSlice(themeSlice);
export const useCart = () => useSharedSlice(cartSlice);
```

**Trade-offs:**
| Pros | Cons |
|---|---|
| ✅ Framework-agnostic (Angular, React, Vue, vanilla) | ❌ Each MFE has its own instance (not shared memory) |
| ✅ Cross-tab sync via storage events | ❌ Serialization overhead (JSON.stringify/parse) |
| ✅ Persistent state (survives refresh) | ❌ localStorage has ~5MB limit |
| ✅ Type-safe with TypeScript | ❌ Versioning: all MFEs must use compatible versions |
| ✅ Testable (mock localStorage) | ❌ Sensitive data in localStorage is a security concern |
| ✅ Works without Module Federation | ❌ Not real-time (storage events have slight delay) |

---

### Comprehensive Comparison Table

| Criteria | Module Federation Singleton | CustomEvent Pub/Sub | BroadcastChannel | URL-as-State | npm Shared Lib |
|---|---|---|---|---|---|
| **Framework agnostic** | ❌ Angular only | ✅ Any | ✅ Any | ✅ Any | ✅ Any |
| **Cross-tab sync** | ❌ | ❌ | ✅ | ✅ (same URL) | ✅ (storage events) |
| **Survives refresh** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Real-time reactivity** | ✅ Instant | ✅ Instant | ✅ Near-instant | ⚠️ Polling needed | ⚠️ Slight delay |
| **Type safety** | ✅ Full | ⚠️ Shared types needed | ⚠️ Manual | ❌ Strings only | ✅ Full |
| **Coupling level** | 🔴 High | 🟢 Very Low | 🟢 Low | 🟢 None | 🟡 Medium |
| **Setup complexity** | 🔴 High (Webpack config) | 🟢 Trivial | 🟢 Easy | 🟢 Trivial | 🟡 Medium (npm publish) |
| **Debugging** | ✅ Angular DevTools | ⚠️ Console logging | ⚠️ Console logging | ✅ URL visible | ⚠️ Storage inspector |
| **Data size limit** | ♾️ In-memory | ♾️ In-memory | ~128KB per message | ~2KB (URL length) | ~5MB (localStorage) |
| **Security** | ✅ In-memory only | ✅ Same-origin | ✅ Same-origin | ❌ Visible in URL | ⚠️ localStorage accessible |
| **Best for** | Same-framework MFEs | Event notifications | Multi-tab apps | Filters, pagination | Persistent shared state |

---

### Recommended Architecture by Scenario

#### Scenario 1: All Angular MFEs, Same Version
```
Recommended: Module Federation Singleton + CustomEvent fallback

┌─────────────────────────────────────────────┐
│  Primary: @myorg/shared-state (singleton)    │
│  ├── Auth state                              │
│  ├── Theme                                   │
│  └── Cart                                    │
│                                              │
│  Fallback: CustomEvent for loose coupling    │
│  ├── Notifications                           │
│  └── Navigation events                       │
│                                              │
│  Supplement: URL-as-State                    │
│  ├── Filters                                 │
│  └── Pagination                              │
└─────────────────────────────────────────────┘
```

#### Scenario 2: Mixed Frameworks (Angular + React + Vue)
```
Recommended: npm Shared Lib + CustomEvent + BroadcastChannel

┌─────────────────────────────────────────────┐
│  Primary: @myorg/shared-state-lib (npm)      │
│  ├── Auth state (persistent)                 │
│  ├── Theme (persistent)                      │
│  └── Cart (persistent)                       │
│                                              │
│  Real-time: CustomEvent pub/sub              │
│  ├── State change notifications              │
│  └── Cross-MFE commands                      │
│                                              │
│  Cross-tab: BroadcastChannel                 │
│  ├── Logout sync                             │
│  └── Theme sync                              │
│                                              │
│  Shareable: URL-as-State                     │
│  ├── Filters, sort, pagination               │
│  └── Deep links                              │
└─────────────────────────────────────────────┘
```

#### Scenario 3: Simple MFE Setup (2-3 MFEs)
```
Recommended: CustomEvent + URL-as-State (keep it simple)

┌─────────────────────────────────────────────┐
│  CustomEvent for runtime state               │
│  ├── Auth changes                            │
│  └── Theme changes                           │
│                                              │
│  URL for shareable state                     │
│  ├── Filters                                 │
│  └── Navigation context                      │
│                                              │
│  localStorage for persistence                │
│  └── User preferences                        │
└─────────────────────────────────────────────┘
```

---

### Interview Summary: Key Talking Points (Q11)

1. **Start with the constraints** — "First, I'd clarify: are all MFEs Angular? Same version? Do we need cross-tab sync? This determines the approach."

2. **No single silver bullet** — "In practice, I'd combine 2-3 patterns. Module Federation singleton for core state, CustomEvent for loose coupling, URL for shareable state."

3. **Coupling is the enemy** — "The whole point of MFEs is independent deployment. If sharing state creates deployment coupling, we've defeated the purpose."

4. **Security awareness** — "Auth tokens should never go in URLs or localStorage without encryption. In-memory (Module Federation singleton) is safest."

5. **Cross-framework is the hard case** — "If we have React and Angular MFEs, Module Federation singleton won't work. That's when CustomEvent or the npm shared lib pattern shines."

6. **BroadcastChannel is the differentiator** — Most candidates won't mention it. It's the only pattern that handles cross-tab sync natively.

7. **URL-as-State is underrated** — "For filters, pagination, and sort order, the URL is the best state manager. It's shareable, bookmarkable, and SEO-friendly."

---

## Final Architecture Decision Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT DECISION TREE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Q: "What state management should we use?"                       │
│                                                                  │
│  WITHIN a single Angular app:                                    │
│  ├── Component-local state → Signals                             │
│  ├── Feature-level shared state → SignalStore                    │
│  ├── App-wide, complex async → NgRx Store                        │
│  └── Simple shared state → BehaviorSubject service               │
│                                                                  │
│  ACROSS Micro Frontends:                                         │
│  ├── Same framework, same version → Module Federation singleton  │
│  ├── Mixed frameworks → CustomEvent + npm shared lib             │
│  ├── Cross-tab sync needed → BroadcastChannel                    │
│  ├── Shareable/bookmarkable → URL query params                   │
│  └── Persistent preferences → npm shared lib (localStorage)      │
│                                                                  │
│  GOLDEN RULE: Start simple. Migrate up when you hit a wall.      │
└─────────────────────────────────────────────────────────────────┘
```
