# Search Bar Component with Suggestions - System Design Document (Angular)

## Executive Summary - Complete Flow Execution

**High-Level Architecture Overview:**

This search bar component implements a real-time autocomplete system using Angular's reactive programming paradigm. The entire flow begins when a user interacts with the search input - either by clicking, focusing, or typing. The component leverages Angular's Reactive Forms with a FormControl that listens to value changes through an RxJS observable stream. As the user types, the input is debounced by 300ms using the `debounceTime` operator to prevent excessive filtering operations, then passed through `distinctUntilChanged` to avoid processing duplicate queries.

The filtering logic runs against a mock data array, performing case-insensitive substring matching across title, description, and category fields. Filtered results are stored in a BehaviorSubject and rendered via the async pipe in the template, ensuring automatic subscription management and change detection. The suggestions dropdown appears conditionally based on an `isOpen` boolean flag, which is controlled by user interactions - opening on input click/focus when there's a query, and closing on selection, Escape key, or click outside (detected via a custom HostListener directive).

Keyboard navigation is implemented through a `selectedIndex` state variable that updates on ArrowUp/ArrowDown key presses, with visual feedback provided by CSS classes. When a user selects a suggestion (via Enter key or mouse click), the component emits the selected item through an EventEmitter to the parent component, updates the input value, and closes the dropdown. The entire system is optimized for performance using OnPush change detection strategy for child components, trackBy functions for ngFor loops, and proper RxJS cleanup with takeUntil on component destruction.

Accessibility is built-in from the ground up with ARIA attributes (role="combobox", aria-expanded, aria-activedescendant), keyboard-only navigation support, and screen reader announcements. The component is fully customizable through Input properties for debounce timing, maximum suggestions, minimum character thresholds, and mock data injection, making it reusable across different contexts while maintaining a consistent user experience aligned with Atlassian Design System principles.

---

## 1. Overview

### 1.1 Purpose
Design and implement a reusable search bar component with real-time suggestions functionality, suitable for Atlassian product interfaces. The component will provide autocomplete suggestions as users type, sourced from a mock data object.

### 1.2 Goals
- Create an accessible, performant search component
- Provide real-time suggestions with keyboard navigation
- Follow Atlassian Design System (ADS) principles
- Ensure responsive and mobile-friendly design
- Implement debouncing for optimal performance

### 1.3 Non-Goals
- Backend API integration (using mock data only)
- Advanced filtering/sorting algorithms
- Multi-language support in initial version
- Analytics tracking

---

## 2. Architecture

### 2.1 Component Hierarchy

```
SearchBarComponent (Smart Component)
├── SearchInputComponent (Presentation)
│   ├── Input Field
│   ├── Search Icon
│   └── Clear Button
└── SuggestionsListComponent (Presentation)
    ├── SuggestionItemComponent (x N)
    └── NoResults Message
```

### 2.2 Technology Stack
- **Framework**: Angular 16+ (with TypeScript)
- **Styling**: SCSS / CSS Modules
- **State Management**: RxJS (BehaviorSubject, Observable)
- **Forms**: Reactive Forms (FormControl)
- **Design System**: Atlassian Design System principles
- **Testing**: Jasmine + Karma / Jest

---

## 3. Detailed Component Design

### 3.1 SearchBarComponent (Smart Component)

**Responsibilities:**
- Manage search state and suggestion visibility
- Handle user input with debouncing using RxJS
- Filter mock data based on search query
- Manage keyboard navigation (Arrow Up/Down, Enter, Escape)
- Handle click outside to close suggestions

**Component Decorator:**
```typescript
@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchInputComponent,
    SuggestionsListComponent
  ]
})
```

**Input/Output Properties:**
```typescript
@Input() placeholder: string = 'Search...';
@Input() debounceMs: number = 300;
@Input() maxSuggestions: number = 10;
@Input() minCharsForSuggestions: number = 2;
@Input() mockData: SearchItem[] = [];

@Output() search = new EventEmitter<string>();
@Output() select = new EventEmitter<SearchItem>();

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  metadata?: Record<string, any>;
}
```

**Component Properties:**
```typescript
searchControl = new FormControl('');
suggestions$ = new BehaviorSubject<SearchItem[]>([]);
isOpen$ = new BehaviorSubject<boolean>(false);
selectedIndex$ = new BehaviorSubject<number>(-1);
isLoading$ = new BehaviorSubject<boolean>(false);

private destroy$ = new Subject<void>();
```

**Lifecycle & RxJS Setup:**
```typescript
ngOnInit(): void {
  this.searchControl.valueChanges
    .pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged(),
      tap(() => this.isLoading$.next(true)),
      map(query => this.filterSuggestions(query)),
      tap(() => this.isLoading$.next(false)),
      takeUntil(this.destroy$)
    )
    .subscribe(suggestions => {
      this.suggestions$.next(suggestions);
      this.isOpen$.next(suggestions.length > 0);
    });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 3.2 SearchInputComponent (Presentation Component)

**Responsibilities:**
- Render input field with proper ARIA attributes
- Display search icon and clear button
- Handle input changes and emit events
- Show loading indicator when filtering

**Component Decorator:**
```typescript
@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
```

**Input/Output Properties:**
```typescript
@Input() control!: FormControl;
@Input() placeholder: string = 'Search...';
@Input() isLoading: boolean = false;
@Input() ariaExpanded: boolean = false;
@Input() ariaActiveDescendant: string = '';

@Output() clear = new EventEmitter<void>();
@Output() keydown = new EventEmitter<KeyboardEvent>();
```

### 3.3 SuggestionsListComponent (Presentation Component)

**Responsibilities:**
- Render filtered suggestions
- Highlight matching text
- Handle hover and click events
- Display empty state when no results

**Component Decorator:**
```typescript
@Component({
  selector: 'app-suggestions-list',
  templateUrl: './suggestions-list.component.html',
  styleUrls: ['./suggestions-list.component.scss'],
  standalone: true,
  imports: [CommonModule, SuggestionItemComponent]
})
```

**Input/Output Properties:**
```typescript
@Input() suggestions: SearchItem[] = [];
@Input() query: string = '';
@Input() selectedIndex: number = -1;
@Input() isVisible: boolean = false;

@Output() selectItem = new EventEmitter<SearchItem>();
@Output() hoverItem = new EventEmitter<number>();
```

### 3.4 SuggestionItemComponent (Presentation Component)

**Responsibilities:**
- Render individual suggestion with highlighting
- Show category/metadata if available
- Handle selection state styling

**Component Decorator:**
```typescript
@Component({
  selector: 'app-suggestion-item',
  templateUrl: './suggestion-item.component.html',
  styleUrls: ['./suggestion-item.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
```

**Input/Output Properties:**
```typescript
@Input() item!: SearchItem;
@Input() query: string = '';
@Input() isSelected: boolean = false;

@Output() itemClick = new EventEmitter<void>();
@Output() itemHover = new EventEmitter<void>();
```

---

## 4. Data Flow

### 4.1 User Input Flow (RxJS Stream)
```
User Types → FormControl.valueChanges
  ↓
debounceTime(300ms)
  ↓
distinctUntilChanged()
  ↓
Filter Mock Data (map operator)
  ↓
Update BehaviorSubject (suggestions$)
  ↓
Template subscribes via async pipe
  ↓
Render Suggestions List
```

### 4.2 Selection Flow
```
User Selects (Click/Enter)
  ↓
Emit select EventEmitter
  ↓
Parent component receives event
  ↓
Update FormControl value
  ↓
Close Suggestions (isOpen$ = false)
  ↓
Emit search EventEmitter
```

### 4.3 RxJS Observable Chain
```typescript
searchControl.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => this.isLoading$.next(true)),
    map(query => this.filterSuggestions(query)),
    tap(() => this.isLoading$.next(false)),
    takeUntil(this.destroy$)
  )
  .subscribe(suggestions => {
    this.suggestions$.next(suggestions);
    this.isOpen$.next(suggestions.length > 0);
  });
```

---

## 5. Mock Data Structure

### 5.1 Sample Mock Data
```typescript
const mockSearchData: SearchItem[] = [
  {
    id: '1',
    title: 'Create Issue',
    description: 'Create a new Jira issue',
    category: 'Actions',
    icon: 'add-circle'
  },
  {
    id: '2',
    title: 'View Dashboard',
    description: 'Navigate to your dashboard',
    category: 'Navigation',
    icon: 'dashboard'
  },
  {
    id: '3',
    title: 'Project Settings',
    description: 'Configure project settings',
    category: 'Settings',
    icon: 'settings'
  },
  // ... more items
];
```

### 5.2 Filtering Algorithm (Service Method)
```typescript
// search.service.ts
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  filterSuggestions(
    data: SearchItem[],
    query: string | null,
    maxResults: number = 10
  ): SearchItem[] {
    if (!query || !query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    
    return data
      .filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, maxResults);
  }
}
```

---

## 6. Key Features & Interactions

### 6.1 Keyboard Navigation
- **Arrow Down**: Move to next suggestion
- **Arrow Up**: Move to previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown
- **Tab**: Close suggestions and move focus

### 6.2 Mouse Interactions
- **Click Input**: Open suggestions if query exists
- **Click Suggestion**: Select and execute
- **Hover Suggestion**: Highlight item
- **Click Outside**: Close suggestions (using HostListener)

### 6.3 Debouncing with RxJS
- Use `debounceTime(300)` operator on FormControl.valueChanges
- Prevent excessive filtering operations
- Use `distinctUntilChanged()` to avoid duplicate queries
- Show loading indicator during debounce period
- Automatic cleanup with `takeUntil(destroy$)`

### 6.4 Accessibility (WCAG 2.1 AA)
- ARIA attributes: `role="combobox"`, `aria-expanded`, `aria-autocomplete`
- Proper focus management with `@ViewChild` and `ElementRef`
- Screen reader announcements for results count using `aria-live`
- Keyboard-only navigation support
- Sufficient color contrast ratios
- `aria-activedescendant` for selected item

---

## 7. Performance Considerations

### 7.1 Optimization Strategies
- **Debouncing**: Use RxJS `debounceTime` operator
- **Change Detection**: Use `OnPush` strategy for presentation components
- **Virtual Scrolling**: Use `@angular/cdk/scrolling` for large lists (>100 items)
- **TrackBy Function**: Optimize *ngFor rendering with trackBy
- **Async Pipe**: Automatic subscription management, no memory leaks
- **Pure Pipes**: Create custom pipes for text highlighting

### 7.2 Performance Metrics
- Time to Interactive: < 100ms
- Input Lag: < 50ms (with debouncing)
- Suggestion Render: < 16ms (60fps)

### 7.3 Change Detection Strategy
```typescript
@Component({
  selector: 'app-suggestions-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class SuggestionsListComponent {
  trackByFn(index: number, item: SearchItem): string {
    return item.id;
  }
}
```

---

## 8. Styling & Design

### 8.1 Visual Design Principles
- Follow Atlassian Design System guidelines
- Use elevation for dropdown (box-shadow)
- Smooth transitions and animations
- Responsive breakpoints for mobile

### 8.2 Component States
- **Default**: Normal input state
- **Focus**: Blue border, show suggestions
- **Hover**: Highlight suggestion item
- **Selected**: Active suggestion styling
- **Loading**: Show spinner icon
- **Error**: Red border (if validation needed)
- **Disabled**: Grayed out, non-interactive

### 8.3 SCSS Structure
```scss
// search-bar.component.scss
:host {
  display: block;
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-bar-container {
  position: relative;
  width: 100%;
}

// search-input.component.scss
.search-input-wrapper {
  position: relative;
  
  input {
    width: 100%;
    padding: 8px 40px 8px 12px;
    border: 2px solid #dfe1e6;
    border-radius: 3px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #0052cc;
    }
  }
  
  .search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }
}

// suggestions-list.component.scss
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  margin-top: 4px;
  z-index: 1000;
}

// suggestion-item.component.scss
:host {
  display: block;
  
  &.selected {
    background: #f4f5f7;
  }
}

.suggestion-item {
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f4f5f7;
  }
}
```

---

## 9. Error Handling & Edge Cases

### 9.1 Edge Cases
- Empty query handling
- No results found
- Special characters in search
- Very long search queries (>100 chars)
- Rapid typing/deletion
- Network delays (simulated for mock data)

### 9.2 Error States
- Display "No results found" message
- Handle undefined/null data gracefully
- Fallback UI for missing icons/images

---

## 10. Testing Strategy

### 10.1 Unit Tests (Jasmine/Jest)
```typescript
describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchBarComponent, ReactiveFormsModule]
    });
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
  });
  
  it('should debounce input changes', fakeAsync(() => {
    component.searchControl.setValue('test');
    tick(200);
    expect(component.isLoading$.value).toBe(true);
    tick(100);
    expect(component.suggestions$.value.length).toBeGreaterThan(0);
  }));
  
  it('should filter suggestions correctly', () => {
    const result = component.filterSuggestions('create');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title.toLowerCase()).toContain('create');
  });
});
```

### 10.2 Integration Tests
- Full user flow: type → see suggestions → select
- Keyboard navigation end-to-end using `dispatchEvent`
- Click outside closes dropdown with `HostListener`
- Accessibility attributes present using `DebugElement`

### 10.3 E2E Tests (Cypress/Playwright)
- Component renders correctly in different states
- Responsive design on mobile/tablet/desktop
- Theme variations (light/dark mode)
- Real user interactions

---

## 11. Implementation Phases

### Phase 1: Core Functionality (Week 1)
- Basic input component
- Mock data structure
- Simple filtering logic
- Suggestions dropdown rendering

### Phase 2: Interactions (Week 1)
- Keyboard navigation
- Mouse interactions
- Debouncing implementation
- Click outside handling

### Phase 3: Polish & Accessibility (Week 2)
- ARIA attributes
- Focus management
- Loading states
- Error handling

### Phase 4: Testing & Documentation (Week 2)
- Unit tests
- Integration tests
- Component documentation
- Storybook stories

---

## 12. Future Enhancements

### 12.1 Potential Features
- Recent searches history
- Search categories/filters
- Fuzzy matching algorithm
- Highlighting matched text
- Voice search integration
- Search analytics
- Multi-select suggestions
- Custom suggestion templates
- API integration support

### 12.2 Scalability Considerations
- Backend API integration
- Caching strategy
- Pagination for large datasets
- Server-side filtering
- Real-time updates via WebSocket

---

## 13. Dependencies

### 13.1 Required Packages
```json
{
  "dependencies": {
    "@angular/core": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/cdk": "^16.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^16.0.0",
    "@angular-devkit/build-angular": "^16.0.0",
    "jasmine-core": "^4.6.0",
    "karma": "^6.4.0",
    "karma-jasmine": "^5.1.0",
    "@types/jasmine": "^4.3.0",
    "typescript": "~5.0.0"
  }
}
```

### 13.2 Angular Modules
```typescript
// app.module.ts or standalone imports
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
```

---

## 14. API Reference

### 14.1 Component Usage
```typescript
// app.component.html
<app-search-bar
  [placeholder]="'Search...'"
  [debounceMs]="300"
  [maxSuggestions]="10"
  [minCharsForSuggestions]="2"
  [mockData]="mockSearchData"
  (search)="onSearch($event)"
  (select)="onSelect($event)">
</app-search-bar>

// app.component.ts
export class AppComponent {
  mockSearchData: SearchItem[] = [...];
  
  onSearch(query: string): void {
    console.log('Search:', query);
  }
  
  onSelect(item: SearchItem): void {
    console.log('Selected:', item);
  }
}
```

### 14.2 Services & Directives
```typescript
// SearchService
@Injectable({ providedIn: 'root' })
export class SearchService {
  filterSuggestions(data: SearchItem[], query: string): SearchItem[];
  highlightText(text: string, query: string): string;
}

// ClickOutsideDirective
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void { }
}

// HighlightPipe
@Pipe({
  name: 'highlight',
  standalone: true,
  pure: true
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string { }
}
```

---

## 15. Acceptance Criteria

### 15.1 Functional Requirements
✅ User can type in search input
✅ Suggestions appear after minimum characters threshold
✅ Suggestions filter based on query
✅ User can navigate suggestions with keyboard
✅ User can select suggestion with click or Enter
✅ Dropdown closes on Escape or click outside
✅ Clear button resets search

### 15.2 Non-Functional Requirements
✅ Component loads in < 100ms
✅ Input lag < 50ms with debouncing
✅ WCAG 2.1 AA compliant
✅ Works on Chrome, Firefox, Safari, Edge
✅ Responsive on mobile devices
✅ 90%+ test coverage

---

## 16. Appendix

### 16.1 References
- [Atlassian Design System](https://atlassian.design/)
- [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular CDK](https://material.angular.io/cdk/categories)

### 16.2 Glossary
- **Debouncing**: Delaying function execution until after a specified time
- **ARIA**: Accessible Rich Internet Applications
- **Combobox**: Combined input and dropdown component
- **Virtual Scrolling**: Rendering only visible items in a list

---

**Document Version**: 1.0  
**Last Updated**: January 14, 2026  
**Author**: System Design Team  
**Status**: Ready for Implementation
