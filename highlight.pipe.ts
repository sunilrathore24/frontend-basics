import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  standalone: true,
  pure: true
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string {
    if (!query || !text) {
      return text;
    }

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create case-insensitive regex
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Replace matches with highlighted version
    return text.replace(regex, '<mark>$1</mark>');
  }
}
