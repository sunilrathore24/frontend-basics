const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

/**
 * MarkdownProcessor - Converts markdown files to HTML with metadata
 * 
 * Processes markdown files using marked.js with GitHub Flavored Markdown support.
 * Generates document objects with unique IDs, formatted titles, and rendered HTML.
 */
class MarkdownProcessor {
  constructor() {
    // Configure marked.js for GitHub Flavored Markdown
    marked.setOptions({
      gfm: true,              // GitHub Flavored Markdown
      breaks: true,           // Convert \n to <br>
      headerIds: true,        // Add IDs to headers
      mangle: false,          // Don't escape autolinked emails
      sanitize: false         // Allow HTML in markdown
    });
  }
  
  /**
   * Processes a markdown file into HTML
   * @param {string} filePath - Path to markdown file (relative to workspace root)
   * @param {string} category - Category (sailpoint|architect|other)
   * @returns {Object} Processed document
   */
  processFile(filePath, category) {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract filename without extension
    const filename = path.basename(filePath, '.md');
    
    // Generate unique document ID
    const id = filename;
    
    // Format filename into display title
    const title = this.formatTitle(filename);
    
    // Parse markdown to HTML
    const html = marked.parse(content);
    
    return {
      id,
      title,
      html,
      category,
      originalPath: filePath
    };
  }
  
  /**
   * Formats filename for display
   * @param {string} filename - Original filename (without extension)
   * @returns {string} Formatted title
   */
  formatTitle(filename) {
    // Replace underscores and hyphens with spaces
    let title = filename.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    title = title.split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    return title;
  }
}

module.exports = MarkdownProcessor;
