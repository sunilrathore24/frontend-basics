# Pagination Component - System Design Document (Angular)

## Executive Summary - Complete Flow Execution

**High-Level Architecture Overview:**

This pagination component implements a reusable, accessible navigation system for paginated data using Angular's reactive programming model. The component manages pagination state through Input properties (currentPage, totalItems, itemsPerPage) and emits page changes via an EventEmitter to the parent component, following Angular's unidirectional data flow pattern. When initialized, the component calculates the total number of pages by dividing totalItems by itemsPerPage, then generates an array of page numbers to display based on a configurable maxVisiblePages setting.

The core interaction flow begins when a user clicks a page number, previous/next button, or first/last button. Each action triggers the onPageChange() method, which validates the requested page number against boundaries (1 to totalPages), updates the internal state, and emits a pageChange event to the parent component. The parent component receives this event, fetches the appropriate data slice, and passes the new currentPage back down as an Input, completing the reactive cycle. The component intelligently handles page number display using an ellipsis algorithm - when total pages exceed maxVisiblePages, it shows a sliding window of pages around the current page with ellipsis indicators for hidden ranges.

Keyboard navigation is implemented through standard button elements with proper focus management, allowing users to tab through pagination controls and activate them with Enter or Space keys. The component uses OnPush change detection strategy for optimal performance, recalculating page arrays only when inputs change. Accessibility is ensured through semantic HTML (nav element with aria-label), disabled states for boundary buttons, aria-current for the active page, and aria-label attributes describing each button's action.

The component supports multiple display modes (full, compact, simple) and size variants (small, medium, large) through Input properties, making it adaptable to different UI contexts. It handles edge cases like single-page results, zero items, and dynamic total count changes gracefully. The styling follows Atlassian Design System principles with clear visual hierarchy, hover states, and responsive behavior for mobile devices where it automatically switches to a more compact layout.

---

## 1. Overview

### 1.1 Purpose
Design and implement a reusable pagination component for Angular applications that provides intuitive navigation through large datasets, suitable for Atlassian product interfaces like Jira and Confluence.

### 1.2 Goals
- Create a flexible, reusable pagination component
- Support multiple display modes and configurations
- Provide keyboard and mouse navigation
- Follow Atlassian Design System (ADS) principles
- Ensure WCAG 2.1 AA accessibility compliance
- Handle edge cases gracefully
- Optimize for performance with large datasets

### 1.3 Non-Goals
- Server-side pagination logic (handled by parent)
- Data fetching or caching
- Infinite scroll implementation
- Virtual scrolling
- Analytics tracking

---

## 2. Architecture

### 2.1 Component Hierarchy

```
PaginationComponent (Smart Component)
├── PageNumbersComponent (Presentation)
│   ├── PageButton (x N)
│   └── Ellipsis Indicator
├── NavigationButtonsComponent (Presentation)
│   ├── First Button
│   ├── Previous Button
│   ├── Next Button
│   └── Last Button
└── PageSizeSelector (Optional)
    └── Dropdown
```

### 2.2 Technology Stack
- **Framework**: Angular 16+ (with TypeScript)
- **Styling**: SCSS with BEM methodology
- **State Management**: Input/Output properties
- **Forms**: Reactive Forms (for page size selector)
- **Design System**: Atlassian Design System principles
- **Testing**: Jasmine + Karma / Jest

---

## 3. Detailed Component Design

### 3.1 PaginationComponent (Main Component)

**Responsibilities:**
- Manage pagination state and calculations
- Generate page number arrays with ellipsis logic
- Handle page change events
- Validate page boundaries
- Emit events to parent component

**Component Decorator:**
```typescript
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Input/Output Properties:**
```typescript
@Input() currentPage: number = 1;
@Input() totalItems: number = 0;
@Input() itemsPerPage: number = 10;
@Input() maxVisiblePages: number = 7;
@Input() showFirstLast: boolean = true;
@Input() showPrevNext: boolean = true;
@Input() showPageSize: boolean = false;
@Input() pageSizeOptions: number[] = [10, 25, 50, 100];
@Input() size: 'small' | 'medium' | 'large' = 'medium';
@Input() mode: 'full' | 'compact' | 'simple' = 'full';
@Input() disabled: boolean = false;

@Output() pageChange = new EventEmitter<number>();
@Output() pageSizeChange = new EventEmitter<number>();

export interface PaginationConfig {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}
```

**Component Properties:**
```typescript
totalPages: number = 0;
visiblePages: number[] = [];
startIndex: number = 0;
endIndex: number = 0;
```

**Core Methods:**
```typescript
ngOnInit(): void {
  this.calculatePagination();
}

ngOnChanges(changes: SimpleChanges): void {
  if (changes['currentPage'] || changes['totalItems'] || changes['itemsPerPage']) {
    this.calculatePagination();
  }
}

calculatePagination(): void {
  this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
  this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  this.visiblePages = this.generatePageNumbers();
}

generatePageNumbers(): number[] {
  // Ellipsis algorithm implementation
}

onPageChange(page: number): void {
  if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
    this.pageChange.emit(page);
  }
}

goToFirstPage(): void {
  this.onPageChange(1);
}

goToLastPage(): void {
  this.onPageChange(this.totalPages);
}

goToPreviousPage(): void {
  this.onPageChange(this.currentPage - 1);
}

goToNextPage(): void {
  this.onPageChange(this.currentPage + 1);
}

onPageSizeChange(size: number): void {
  this.pageSizeChange.emit(size);
}
```

---

## 4. Data Flow

### 4.1 Initialization Flow
```
Component Init → Calculate Total Pages
  ↓
Calculate Start/End Index
  ↓
Generate Visible Page Numbers (with ellipsis)
  ↓
Render Pagination UI
```

### 4.2 Page Change Flow
```
User Clicks Page Button → Validate Page Number
  ↓
Emit pageChange Event
  ↓
Parent Component Receives Event
  ↓
Parent Fetches New Data
  ↓
Parent Updates currentPage Input
  ↓
Component Recalculates Pagination
  ↓
UI Updates with New State
```

### 4.3 Page Size Change Flow
```
User Selects New Page Size → Emit pageSizeChange Event
  ↓
Parent Updates itemsPerPage
  ↓
Reset to Page 1
  ↓
Recalculate Pagination
```

---

## 5. Page Number Generation Algorithm

### 5.1 Ellipsis Logic

**Scenario 1: Total pages ≤ maxVisiblePages**
```
Display all pages: [1] [2] [3] [4] [5]
```

**Scenario 2: Current page near start**
```
[1] [2] [3] [4] [5] ... [20]
```

**Scenario 3: Current page in middle**
```
[1] ... [8] [9] [10] [11] [12] ... [20]
```

**Scenario 4: Current page near end**
```
[1] ... [16] [17] [18] [19] [20]
```

### 5.2 Implementation
```typescript
generatePageNumbers(): number[] {
  const pages: number[] = [];
  const totalPages = this.totalPages;
  const current = this.currentPage;
  const max = this.maxVisiblePages;

  if (totalPages <= max) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    const leftOffset = Math.floor(max / 2);
    const rightOffset = Math.ceil(max / 2) - 1;

    if (current <= leftOffset + 1) {
      // Near start
      for (let i = 1; i <= max - 2; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis marker
      pages.push(totalPages);
    } else if (current >= totalPages - rightOffset) {
      // Near end
      pages.push(1);
      pages.push(-1); // Ellipsis marker
      for (let i = totalPages - (max - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle
      pages.push(1);
      pages.push(-1); // Ellipsis marker
      for (let i = current - leftOffset + 2; i <= current + rightOffset - 2; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis marker
      pages.push(totalPages);
    }
  }

  return pages;
}
```

---

## 6. Key Features & Interactions

### 6.1 Mouse Interactions
- **Click Page Number**: Navigate to specific page
- **Click Previous/Next**: Navigate one page backward/forward
- **Click First/Last**: Jump to first/last page
- **Hover**: Show hover state on interactive elements
- **Click Page Size**: Open dropdown to change items per page

### 6.2 Keyboard Navigation
- **Tab**: Move focus through pagination controls
- **Shift + Tab**: Move focus backward
- **Enter/Space**: Activate focused button
- **Arrow Keys**: Navigate through page numbers (optional enhancement)

### 6.3 Display Modes

**Full Mode:**
- Shows all navigation buttons
- Shows page numbers with ellipsis
- Shows page size selector
- Shows info text (e.g., "Showing 1-10 of 100")

**Compact Mode:**
- Shows only prev/next buttons
- Shows current page indicator
- No page size selector

**Simple Mode:**
- Shows only page numbers
- No navigation buttons
- Minimal styling

### 6.4 Accessibility (WCAG 2.1 AA)
- Semantic `<nav>` element with `aria-label="Pagination"`
- `aria-current="page"` for active page
- `aria-label` for all buttons describing their action
- `disabled` attribute for boundary buttons
- Sufficient color contrast (4.5:1 minimum)
- Focus visible indicators
- Screen reader announcements for page changes

---

## 7. Performance Considerations

### 7.1 Optimization Strategies
- **OnPush Change Detection**: Minimize unnecessary re-renders
- **Pure Calculations**: Page number generation is deterministic
- **Memoization**: Cache page arrays when inputs don't change
- **TrackBy Function**: Optimize ngFor rendering
- **Lazy Evaluation**: Only calculate visible pages

### 7.2 Performance Metrics
- Initial Render: < 50ms
- Page Change Response: < 16ms (60fps)
- Memory Footprint: < 1MB for component instance

### 7.3 Change Detection Strategy
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  // Component uses OnPush for optimal performance
}
```

---

## 8. Styling & Design

### 8.1 Visual Design Principles
- Follow Atlassian Design System guidelines
- Clear visual hierarchy
- Consistent spacing and sizing
- Hover and active states
- Disabled state styling
- Responsive breakpoints

### 8.2 Component States
- **Default**: Normal pagination state
- **Active**: Current page highlighted
- **Hover**: Interactive element hover
- **Disabled**: Boundary buttons or entire component
- **Focus**: Keyboard focus indicator
- **Loading**: Optional loading state during data fetch

### 8.3 SCSS Structure
```scss
// pagination.component.scss
:host {
  display: block;
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  &.size-small {
    font-size: 12px;
    
    .page-button {
      min-width: 28px;
      height: 28px;
    }
  }
  
  &.size-medium {
    font-size: 14px;
    
    .page-button {
      min-width: 32px;
      height: 32px;
    }
  }
  
  &.size-large {
    font-size: 16px;
    
    .page-button {
      min-width: 40px;
      height: 40px;
    }
  }
}

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  background: white;
  color: #172b4d;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: #f4f5f7;
    border-color: #c1c7d0;
  }
  
  &:active:not(:disabled) {
    background: #ebecf0;
  }
  
  &.active {
    background: #0052cc;
    color: white;
    border-color: #0052cc;
    cursor: default;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid #0052cc;
    outline-offset: 2px;
  }
}

.nav-button {
  @extend .page-button;
  
  svg {
    width: 16px;
    height: 16px;
  }
}

.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  color: #5e6c84;
  user-select: none;
}

.page-info {
  margin: 0 16px;
  color: #5e6c84;
  font-size: 14px;
  white-space: nowrap;
}

.page-size-selector {
  margin-left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    color: #5e6c84;
    font-size: 14px;
  }
  
  select {
    padding: 4px 8px;
    border: 1px solid #dfe1e6;
    border-radius: 3px;
    background: white;
    cursor: pointer;
    
    &:focus {
      outline: 2px solid #0052cc;
      outline-offset: 1px;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .pagination-container {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .page-info {
    width: 100%;
    text-align: center;
    margin: 8px 0;
  }
  
  .page-size-selector {
    width: 100%;
    justify-content: center;
    margin: 8px 0 0 0;
  }
}
```

---

## 9. Error Handling & Edge Cases

### 9.1 Edge Cases
- **Zero Items**: Display "No items" message, hide pagination
- **Single Page**: Hide pagination or show disabled state
- **Invalid Current Page**: Auto-correct to valid range
- **Negative Values**: Validate and default to safe values
- **Non-integer Values**: Round to nearest integer
- **Dynamic Total Changes**: Recalculate and adjust current page if needed
- **Page Size Larger Than Total**: Show all items on one page

### 9.2 Validation Logic
```typescript
private validateInputs(): void {
  this.currentPage = Math.max(1, Math.floor(this.currentPage));
  this.totalItems = Math.max(0, Math.floor(this.totalItems));
  this.itemsPerPage = Math.max(1, Math.floor(this.itemsPerPage));
  this.maxVisiblePages = Math.max(3, Math.floor(this.maxVisiblePages));
  
  // Adjust current page if it exceeds total pages
  if (this.currentPage > this.totalPages && this.totalPages > 0) {
    this.currentPage = this.totalPages;
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Jasmine/Jest)
```typescript
describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaginationComponent]
    });
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });
  
  it('should calculate total pages correctly', () => {
    component.totalItems = 100;
    component.itemsPerPage = 10;
    component.ngOnInit();
    expect(component.totalPages).toBe(10);
  });
  
  it('should generate correct page numbers with ellipsis', () => {
    component.totalItems = 200;
    component.itemsPerPage = 10;
    component.currentPage = 10;
    component.maxVisiblePages = 7;
    component.ngOnInit();
    expect(component.visiblePages).toContain(-1); // Ellipsis marker
  });
  
  it('should emit pageChange event on page click', () => {
    spyOn(component.pageChange, 'emit');
    component.onPageChange(5);
    expect(component.pageChange.emit).toHaveBeenCalledWith(5);
  });
  
  it('should not allow navigation beyond boundaries', () => {
    component.totalPages = 10;
    component.currentPage = 10;
    spyOn(component.pageChange, 'emit');
    component.goToNextPage();
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });
});
```

### 10.2 Integration Tests
- Full pagination flow with parent component
- Page size change updates pagination
- Keyboard navigation works correctly
- Accessibility attributes present

### 10.3 E2E Tests (Cypress/Playwright)
- Visual regression testing
- Responsive behavior on different screen sizes
- User interaction flows

---

## 11. Implementation Phases

### Phase 1: Core Functionality (Week 1)
- Basic pagination component structure
- Page number generation algorithm
- Previous/Next navigation
- Page change event emission

### Phase 2: Advanced Features (Week 1)
- First/Last buttons
- Ellipsis logic for large page counts
- Page size selector
- Info text display

### Phase 3: Polish & Accessibility (Week 2)
- ARIA attributes
- Keyboard navigation
- Focus management
- Disabled states
- Loading states

### Phase 4: Testing & Documentation (Week 2)
- Unit tests
- Integration tests
- Component documentation
- Usage examples
- Storybook stories

---

## 12. Future Enhancements

### 12.1 Potential Features
- Jump to page input field
- Configurable button icons
- Custom templates for buttons
- Animation transitions
- Scroll to top on page change
- URL query parameter sync
- Localization support
- RTL (Right-to-Left) support
- Touch gestures for mobile
- Infinite scroll mode toggle

### 12.2 Scalability Considerations
- Server-side pagination integration
- Virtual scrolling compatibility
- State management integration (NgRx, Akita)
- Lazy loading support
- Progressive enhancement

---

## 13. Dependencies

### 13.1 Required Packages
```json
{
  "dependencies": {
    "@angular/core": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/forms": "^16.0.0"
  },
  "devDependencies": {
    "@angular/cli": "^16.0.0",
    "jasmine-core": "^4.6.0",
    "karma": "^6.4.0",
    "typescript": "~5.0.0"
  }
}
```

### 13.2 Angular Modules
```typescript
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
```

---

## 14. API Reference

### 14.1 Component Usage
```typescript
// app.component.html
<app-pagination
  [currentPage]="currentPage"
  [totalItems]="totalItems"
  [itemsPerPage]="itemsPerPage"
  [maxVisiblePages]="7"
  [showFirstLast]="true"
  [showPrevNext]="true"
  [showPageSize]="true"
  [pageSizeOptions]="[10, 25, 50, 100]"
  [size]="'medium'"
  [mode]="'full'"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>

// app.component.ts
export class AppComponent {
  currentPage = 1;
  totalItems = 250;
  itemsPerPage = 10;
  data: any[] = [];
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }
  
  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.loadData();
  }
  
  loadData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.data = this.allData.slice(start, end);
  }
}
```

### 14.2 Helper Functions
```typescript
// Utility function to get pagination config
export function getPaginationConfig(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
): PaginationConfig {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalItems,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex
  };
}
```

---

## 15. Acceptance Criteria

### 15.1 Functional Requirements
✅ User can navigate to any page
✅ Previous/Next buttons work correctly
✅ First/Last buttons jump to boundaries
✅ Page numbers display with ellipsis for large counts
✅ Current page is visually highlighted
✅ Boundary buttons are disabled appropriately
✅ Page size selector changes items per page
✅ Component emits events to parent
✅ Edge cases handled gracefully

### 15.2 Non-Functional Requirements
✅ Component renders in < 50ms
✅ WCAG 2.1 AA compliant
✅ Works on Chrome, Firefox, Safari, Edge
✅ Responsive on mobile devices
✅ 90%+ test coverage
✅ Zero accessibility violations
✅ Supports 1M+ total items without performance issues

---

## 16. Appendix

### 16.1 References
- [Atlassian Design System](https://atlassian.design/)
- [WAI-ARIA Practices - Pagination](https://www.w3.org/WAI/ARIA/apg/)
- [Angular Documentation](https://angular.io/docs)
- [Material Design - Pagination](https://material.io/components/data-tables#behavior)

### 16.2 Glossary
- **Page**: A subset of data items displayed at once
- **Total Items**: Complete count of all items across all pages
- **Items Per Page**: Number of items displayed on each page
- **Ellipsis**: Visual indicator (...) for hidden page numbers
- **Boundary Buttons**: First and Last page navigation buttons

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Author**: System Design Team  
**Status**: Ready for Implementation
