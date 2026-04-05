import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ClickOutsideDirective } from './click-outside.directive';
import { HighlightPipe } from './highlight.pipe';

export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClickOutsideDirective, HighlightPipe],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Search...';
  @Input() debounceMs: number = 300;
  @Input() maxSuggestions: number = 10;
  @Input() minCharsForSuggestions: number = 1;
  @Input() mockData: SearchItem[] = [];
  
  @Output() search = new EventEmitter<string>();
  @Output() select = new EventEmitter<SearchItem>();

  searchControl = new FormControl('');
  suggestions: SearchItem[] = [];
  filteredSuggestions: SearchItem[] = [];
  isOpen = false;
  selectedIndex = -1;
  isLoading = false;

  private destroy$ = new Subject<void>();

  // Default mock data if none provided
  private defaultMockData: SearchItem[] = [
    { id: '1', title: 'Create Issue', description: 'Create a new Jira issue', category: 'Actions', icon: '➕' },
    { id: '2', title: 'View Dashboard', description: 'Navigate to your dashboard', category: 'Navigation', icon: '📊' },
    { id: '3', title: 'Project Settings', description: 'Configure project settings', category: 'Settings', icon: '⚙️' },
    { id: '4', title: 'Create Project', description: 'Start a new project', category: 'Actions', icon: '🚀' },
    { id: '5', title: 'View Reports', description: 'Access project reports', category: 'Navigation', icon: '📈' },
    { id: '6', title: 'Team Members', description: 'Manage team members', category: 'Settings', icon: '👥' },
    { id: '7', title: 'Create Sprint', description: 'Create a new sprint', category: 'Actions', icon: '🏃' },
    { id: '8', title: 'View Backlog', description: 'View product backlog', category: 'Navigation', icon: '📋' },
    { id: '9', title: 'Board Settings', description: 'Configure board settings', category: 'Settings', icon: '🎯' },
    { id: '10', title: 'Create Epic', description: 'Create a new epic', category: 'Actions', icon: '⭐' }
  ];

  ngOnInit(): void {
    // Use provided mock data or default
    if (this.mockData.length === 0) {
      this.mockData = this.defaultMockData;
    }

    // Listen to input changes with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        tap(() => this.isLoading = true),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.filterSuggestions(query || '');
        this.isLoading = false;
      });
  }

  // Show suggestions when input is clicked
  onInputClick(): void {
    const query = this.searchControl.value || '';
    if (query.trim().length > 0) {
      this.filterSuggestions(query);
      this.isOpen = true;
    }
  }

  // Show suggestions when input is focused
  onInputFocus(): void {
    const query = this.searchControl.value || '';
    if (query.trim().length > 0) {
      this.filterSuggestions(query);
      this.isOpen = true;
    }
  }

  // Filter suggestions based on query
  filterSuggestions(query: string): void {
    if (!query.trim() || query.trim().length < this.minCharsForSuggestions) {
      this.suggestions = [];
      this.filteredSuggestions = [];
      this.isOpen = false;
      this.selectedIndex = -1;
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.suggestions = this.mockData.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.category?.toLowerCase().includes(lowerQuery)
    );

    // Limit to max suggestions
    this.filteredSuggestions = this.suggestions.slice(0, this.maxSuggestions);
    this.isOpen = this.filteredSuggestions.length > 0;
    this.selectedIndex = -1;
  }

  // Select a suggestion
  selectSuggestion(item: SearchItem): void {
    this.searchControl.setValue(item.title, { emitEvent: false });
    this.isOpen = false;
    this.selectedIndex = -1;
    this.select.emit(item);
    this.search.emit(item.title);
  }

  // Clear search input
  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.suggestions = [];
    this.filteredSuggestions = [];
    this.isOpen = false;
    this.selectedIndex = -1;
    this.search.emit('');
  }

  // Get current search query
  get currentQuery(): string {
    return this.searchControl.value || '';
  }

  // Track by function for performance
  trackByFn(index: number, item: SearchItem): string {
    return item.id;
  }

  // Close suggestions when clicking outside
  onClickOutside(): void {
    this.isOpen = false;
  }

  // Keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen && event.key !== 'Enter') return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredSuggestions.length - 1);
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.isOpen && this.selectedIndex >= 0) {
          this.selectSuggestion(this.filteredSuggestions[this.selectedIndex]);
        } else if (this.currentQuery.trim()) {
          this.search.emit(this.currentQuery);
          this.isOpen = false;
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.isOpen = false;
        this.selectedIndex = -1;
        break;
      case 'Tab':
        this.isOpen = false;
        break;
    }
  }

  // Scroll to selected item in dropdown
  private scrollToSelected(): void {
    setTimeout(() => {
      const selectedElement = document.querySelector('.suggestion-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
