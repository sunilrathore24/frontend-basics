import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent, SearchItem } from './search-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  template: `
    <div class="app-container">
      <h1>Atlassian Search Bar Demo</h1>
      
      <app-search-bar
        [placeholder]="'Search for actions, pages, or settings...'"
        [debounceMs]="300"
        [maxSuggestions]="8"
        [minCharsForSuggestions]="1"
        [mockData]="mockSearchData"
        (search)="onSearch($event)"
        (select)="onSelect($event)"
      ></app-search-bar>
      
      <div class="results" *ngIf="lastSearch || lastSelected">
        <h3>Results:</h3>
        <div *ngIf="lastSearch" class="result-item">
          <strong>Search Query:</strong> {{ lastSearch }}
        </div>
        <div *ngIf="lastSelected" class="result-item">
          <strong>Selected Item:</strong> {{ lastSelected.title }}
          <span *ngIf="lastSelected.description"> - {{ lastSelected.description }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    h1 {
      color: #172b4d;
      margin-bottom: 32px;
      font-size: 28px;
    }
    
    .results {
      margin-top: 32px;
      padding: 16px;
      background: #f4f5f7;
      border-radius: 3px;
      
      h3 {
        margin-top: 0;
        color: #172b4d;
        font-size: 16px;
      }
      
      .result-item {
        margin-bottom: 8px;
        color: #5e6c84;
        font-size: 14px;
        
        strong {
          color: #172b4d;
        }
      }
    }
  `]
})
export class AppComponent {
  lastSearch: string = '';
  lastSelected: SearchItem | null = null;

  mockSearchData: SearchItem[] = [
    { id: '1', title: 'Create Issue', description: 'Create a new Jira issue', category: 'Actions', icon: '➕' },
    { id: '2', title: 'View Dashboard', description: 'Navigate to your dashboard', category: 'Navigation', icon: '📊' },
    { id: '3', title: 'Project Settings', description: 'Configure project settings', category: 'Settings', icon: '⚙️' },
    { id: '4', title: 'Create Project', description: 'Start a new project', category: 'Actions', icon: '🚀' },
    { id: '5', title: 'View Reports', description: 'Access project reports', category: 'Navigation', icon: '📈' },
    { id: '6', title: 'Team Members', description: 'Manage team members', category: 'Settings', icon: '👥' },
    { id: '7', title: 'Create Sprint', description: 'Create a new sprint', category: 'Actions', icon: '🏃' },
    { id: '8', title: 'View Backlog', description: 'View product backlog', category: 'Navigation', icon: '📋' },
    { id: '9', title: 'Board Settings', description: 'Configure board settings', category: 'Settings', icon: '🎯' },
    { id: '10', title: 'Create Epic', description: 'Create a new epic', category: 'Actions', icon: '⭐' },
    { id: '11', title: 'View Calendar', description: 'View project calendar', category: 'Navigation', icon: '📅' },
    { id: '12', title: 'User Permissions', description: 'Manage user permissions', category: 'Settings', icon: '🔐' },
    { id: '13', title: 'Create Filter', description: 'Create a custom filter', category: 'Actions', icon: '🔍' },
    { id: '14', title: 'View Timeline', description: 'View project timeline', category: 'Navigation', icon: '📉' },
    { id: '15', title: 'Notification Settings', description: 'Configure notifications', category: 'Settings', icon: '🔔' }
  ];

  onSearch(query: string): void {
    this.lastSearch = query;
    console.log('Search executed:', query);
  }

  onSelect(item: SearchItem): void {
    this.lastSelected = item;
    console.log('Item selected:', item);
  }
}
