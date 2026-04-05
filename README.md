# Angular Search Bar Component with Suggestions

A fully-featured, accessible search bar component with real-time suggestions for Angular applications, designed following Atlassian Design System principles.

## Features

✅ **Real-time Suggestions** - Autocomplete as you type with debouncing
✅ **Keyboard Navigation** - Full keyboard support (Arrow keys, Enter, Escape, Tab)
✅ **Click Outside Detection** - Closes dropdown when clicking outside
✅ **Highlight Matching Text** - Visual feedback for search matches
✅ **Loading States** - Shows loading indicator during search
✅ **Clear Button** - Quick clear functionality
✅ **Accessibility** - WCAG 2.1 AA compliant with ARIA attributes
✅ **Responsive Design** - Mobile-friendly layout
✅ **Customizable** - Configurable debounce, max results, min characters
✅ **TypeScript** - Full type safety
✅ **Standalone Components** - Angular 16+ standalone architecture

## Installation

1. Copy the following files to your Angular project:
   - `search-bar.component.ts`
   - `search-bar.component.html`
   - `search-bar.component.scss`
   - `click-outside.directive.ts`
   - `highlight.pipe.ts`

2. Import the component in your app:

```typescript
import { SearchBarComponent } from './search-bar.component';

@Component({
  imports: [SearchBarComponent]
})
```

## Usage

### Basic Example

```typescript
import { Component } from '@angular/core';
import { SearchBarComponent, SearchItem } from './search-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SearchBarComponent],
  template: `
    <app-search-bar
      [mockData]="searchData"
      (search)="onSearch($event)"
      (select)="onSelect($event)"
    ></app-search-bar>
  `
})
export class AppComponent {
  searchData: SearchItem[] = [
    { id: '1', title: 'Create Issue', description: 'Create a new issue', category: 'Actions' },
    { id: '2', title: 'View Dashboard', description: 'Go to dashboard', category: 'Navigation' }
  ];

  onSearch(query: string): void {
    console.log('Search:', query);
  }

  onSelect(item: SearchItem): void {
    console.log('Selected:', item);
  }
}
```

### Advanced Configuration

```typescript
<app-search-bar
  [placeholder]="'Search for anything...'"
  [debounceMs]="500"
  [maxSuggestions]="15"
  [minCharsForSuggestions]="2"
  [mockData]="searchData"
  (search)="onSearch($event)"
  (select)="onSelect($event)"
></app-search-bar>
```

## Component API

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `maxSuggestions` | `number` | `10` | Maximum suggestions to display |
| `minCharsForSuggestions` | `number` | `1` | Minimum characters before showing suggestions |
| `mockData` | `SearchItem[]` | `[]` | Array of searchable items |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `search` | `EventEmitter<string>` | Emitted when search is executed |
| `select` | `EventEmitter<SearchItem>` | Emitted when suggestion is selected |

### SearchItem Interface

```typescript
interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
}
```

## Keyboard Shortcuts

- **Arrow Down** - Navigate to next suggestion
- **Arrow Up** - Navigate to previous suggestion
- **Enter** - Select highlighted suggestion or execute search
- **Escape** - Close suggestions dropdown
- **Tab** - Close dropdown and move focus

## Accessibility Features

- Full keyboard navigation support
- ARIA attributes for screen readers
- Focus management
- Semantic HTML structure
- High contrast support
- Screen reader announcements

## Customization

### Styling

Override SCSS variables or classes in your global styles:

```scss
app-search-bar {
  .search-input {
    border-color: #your-color;
  }
  
  .suggestion-item.selected {
    background: #your-highlight-color;
  }
}
```

### Custom Filtering

Extend the component and override the `filterSuggestions` method:

```typescript
export class CustomSearchBarComponent extends SearchBarComponent {
  override filterSuggestions(query: string): void {
    // Your custom filtering logic
  }
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
