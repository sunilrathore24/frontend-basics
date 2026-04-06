# Design Document: Markdown Static Website Generator

## Overview

This design specifies a static website generator that transforms markdown documentation into a navigable web application. The system will parse markdown files from three distinct locations (sailpoint folder, detailed_architect_level folder, and root directory) and present them through a tabbed interface with document navigation and syntax-highlighted code blocks.

The architecture follows a build-time generation approach where all markdown content is processed during the build phase and embedded into static HTML/CSS/JS files. This eliminates runtime dependencies and enables deployment to any static hosting service.

### Key Design Decisions

1. **Build-time vs Runtime Processing**: We choose build-time processing to generate a fully static site with no backend dependencies, meeting Requirement 7's constraint for static hosting compatibility.

2. **Technology Stack**: 
   - **Markdown Parser**: marked.js - lightweight, fast, and supports GitHub Flavored Markdown
   - **Syntax Highlighter**: Prism.js - comprehensive language support, small bundle size, and works without Node.js runtime
   - **Build Tool**: Node.js script - simple, no framework overhead, direct control over file processing
   - **Frontend**: Vanilla JavaScript - no framework dependencies, minimal bundle size, fast load times

3. **Single Page Application**: The entire site operates as a SPA with client-side routing between documents, avoiding page reloads and providing smooth navigation (Requirement 10.3).

4. **Embedded Content Strategy**: All markdown content is converted to HTML at build time and embedded in a JavaScript data structure, eliminating the need for separate HTTP requests or a backend API.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Build Process                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. File Scanner                                        │ │
│  │     - Reads workspace directory structure               │ │
│  │     - Identifies markdown files in 3 locations          │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  2. Markdown Processor                                  │ │
│  │     - Parses markdown to HTML using marked.js           │ │
│  │     - Extracts metadata (filename, path, category)      │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  3. Content Bundler                                     │ │
│  │     - Organizes content by tab category                 │ │
│  │     - Generates JavaScript data structure               │ │
│  │     - Embeds content in output HTML                     │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  4. Static Asset Generator                              │ │
│  │     - Bundles CSS (styles + Prism theme)                │ │
│  │     - Bundles JS (app logic + Prism)                    │ │
│  │     - Generates final index.html                        │ │
│  └────────────────┬───────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   dist/index.html    │
         │   dist/styles.css    │
         │   dist/app.js        │
         └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Runtime Architecture                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tab Navigation Controller                              │ │
│  │  - Manages active tab state                             │ │
│  │  - Filters document list by category                    │ │
│  │  - Updates UI on tab change                             │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Document List Renderer                                 │ │
│  │  - Displays filtered documents for active tab           │ │
│  │  - Handles document selection                           │ │
│  │  - Highlights active document                           │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Content Renderer                                       │ │
│  │  - Displays selected document HTML                      │ │
│  │  - Applies syntax highlighting via Prism.js             │ │
│  │  - Scrolls to top on document change                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Build Time:**
1. File Scanner reads workspace and identifies markdown files
2. Files are categorized: sailpoint/, detailed_architect_level/, or root
3. Markdown Processor converts each file to HTML using marked.js
4. Content Bundler creates JavaScript object with structure:
   ```javascript
   {
     sailpoint: [{id, title, html}, ...],
     architect: [{id, title, html}, ...],
     other: [{id, title, html}, ...]
   }
   ```
5. Static Asset Generator produces final HTML with embedded content

**Runtime:**
1. User loads index.html (default tab: Sailpoint)
2. Tab Navigation Controller filters documents for active tab
3. Document List Renderer displays available documents
4. User clicks document → Content Renderer displays HTML
5. Prism.js applies syntax highlighting to code blocks
6. User switches tabs → repeat from step 2

## Components and Interfaces

### 1. File Scanner (Build Time)

**Purpose**: Discover and categorize markdown files from the workspace

**Interface**:
```javascript
class FileScanner {
  /**
   * Scans workspace and returns categorized file paths
   * @param {string} workspaceRoot - Root directory path
   * @returns {Object} Categorized file paths
   */
  scanWorkspace(workspaceRoot) {
    return {
      sailpoint: string[],      // Files from sailpoint/
      architect: string[],       // Files from detailed_architect_level/
      other: string[]            // Files from root (excluding above)
    };
  }
}
```

**Responsibilities**:
- Read directory structure using Node.js fs module
- Filter for .md files only
- Categorize files based on path
- Sort architect files numerically (01, 02, 03...)
- Sort other files alphabetically
- Exclude non-markdown files and hidden directories

### 2. Markdown Processor (Build Time)

**Purpose**: Convert markdown files to HTML with metadata

**Interface**:
```javascript
class MarkdownProcessor {
  /**
   * Processes a markdown file into HTML
   * @param {string} filePath - Path to markdown file
   * @param {string} category - Category (sailpoint|architect|other)
   * @returns {Object} Processed document
   */
  processFile(filePath, category) {
    return {
      id: string,           // Unique identifier (filename without extension)
      title: string,        // Display title (formatted filename)
      html: string,         // Rendered HTML content
      category: string,     // Tab category
      originalPath: string  // Source file path
    };
  }
  
  /**
   * Formats filename for display
   * @param {string} filename - Original filename
   * @returns {string} Formatted title
   */
  formatTitle(filename) {
    // Remove extension, replace hyphens/underscores with spaces
    // Capitalize words appropriately
  }
}
```

**Responsibilities**:
- Read markdown file content
- Parse markdown to HTML using marked.js
- Configure marked.js for GitHub Flavored Markdown
- Generate unique document ID from filename
- Format filename into readable title
- Preserve code block language identifiers for syntax highlighting

**marked.js Configuration**:
```javascript
marked.setOptions({
  gfm: true,              // GitHub Flavored Markdown
  breaks: true,           // Convert \n to <br>
  headerIds: true,        // Add IDs to headers
  mangle: false,          // Don't escape autolinked emails
  sanitize: false         // Allow HTML in markdown
});
```

### 3. Content Bundler (Build Time)

**Purpose**: Organize processed documents and generate JavaScript data structure

**Interface**:
```javascript
class ContentBundler {
  /**
   * Bundles all processed documents into JavaScript module
   * @param {Object} documents - Categorized documents
   * @returns {string} JavaScript code defining content object
   */
  bundle(documents) {
    return `const SITE_CONTENT = ${JSON.stringify(documents)};`;
  }
}
```

**Responsibilities**:
- Aggregate all processed documents
- Organize by category (sailpoint, architect, other)
- Generate JavaScript constant with embedded content
- Escape special characters for JavaScript string safety
- Optimize JSON structure for minimal size

### 4. Static Asset Generator (Build Time)

**Purpose**: Generate final HTML, CSS, and JavaScript files

**Interface**:
```javascript
class StaticAssetGenerator {
  /**
   * Generates complete static website
   * @param {string} contentJS - Bundled content JavaScript
   * @param {string} outputDir - Output directory path
   */
  generate(contentJS, outputDir) {
    // Creates index.html, styles.css, app.js in outputDir
  }
}
```

**Responsibilities**:
- Generate index.html with structure for tabs, document list, content area
- Bundle CSS (application styles + Prism theme)
- Bundle JavaScript (app logic + Prism library + content data)
- Inline critical CSS for fast initial render
- Minify assets for production (optional)

### 5. Tab Navigation Controller (Runtime)

**Purpose**: Manage tab state and coordinate UI updates

**Interface**:
```javascript
class TabNavigationController {
  constructor(contentData) {
    this.contentData = contentData;
    this.activeTab = 'sailpoint';  // Default tab
  }
  
  /**
   * Switches to specified tab
   * @param {string} tabName - Tab identifier (sailpoint|architect|other)
   */
  switchTab(tabName) {
    this.activeTab = tabName;
    this.updateTabUI();
    this.renderDocumentList();
  }
  
  /**
   * Gets documents for active tab
   * @returns {Array} Documents for current tab
   */
  getActiveDocuments() {
    return this.contentData[this.activeTab];
  }
}
```

**Responsibilities**:
- Track active tab state
- Handle tab click events
- Update tab visual indicators (active/inactive)
- Trigger document list refresh on tab change
- Set default tab on page load

### 6. Document List Renderer (Runtime)

**Purpose**: Display and manage document navigation within tabs

**Interface**:
```javascript
class DocumentListRenderer {
  constructor(containerElement, onDocumentSelect) {
    this.container = containerElement;
    this.onDocumentSelect = onDocumentSelect;
    this.activeDocumentId = null;
  }
  
  /**
   * Renders list of documents
   * @param {Array} documents - Documents to display
   */
  render(documents) {
    // Creates clickable list items for each document
  }
  
  /**
   * Highlights selected document
   * @param {string} documentId - ID of active document
   */
  setActiveDocument(documentId) {
    this.activeDocumentId = documentId;
    this.updateHighlight();
  }
}
```

**Responsibilities**:
- Render document list for active tab
- Handle document click events
- Highlight currently selected document
- Provide hover states for interactive feedback
- Maintain scroll position in document list

### 7. Content Renderer (Runtime)

**Purpose**: Display selected document content with syntax highlighting

**Interface**:
```javascript
class ContentRenderer {
  constructor(containerElement) {
    this.container = containerElement;
  }
  
  /**
   * Renders document HTML content
   * @param {Object} document - Document to render
   */
  render(document) {
    this.container.innerHTML = document.html;
    this.applySyntaxHighlighting();
    this.scrollToTop();
  }
  
  /**
   * Applies Prism.js syntax highlighting to code blocks
   */
  applySyntaxHighlighting() {
    Prism.highlightAllUnder(this.container);
  }
  
  /**
   * Scrolls content area to top
   */
  scrollToTop() {
    this.container.scrollTop = 0;
  }
}
```

**Responsibilities**:
- Display document HTML in content area
- Apply Prism.js syntax highlighting after render
- Scroll to top when new document loads
- Handle responsive text sizing
- Ensure code blocks are horizontally scrollable on mobile


## Data Models

### Document Object

Represents a single markdown document with its rendered content:

```typescript
interface Document {
  id: string;           // Unique identifier (filename without .md)
  title: string;        // Display title (formatted from filename)
  html: string;         // Rendered HTML content
  category: string;     // Tab category: 'sailpoint' | 'architect' | 'other'
  originalPath: string; // Source file path for debugging
}
```

### Content Data Structure

The complete site content embedded in JavaScript:

```typescript
interface SiteContent {
  sailpoint: Document[];  // 7 documents from sailpoint/
  architect: Document[];  // 12 documents from detailed_architect_level/
  other: Document[];      // All root-level markdown files
}
```

### Application State

Runtime state managed by the application:

```typescript
interface AppState {
  activeTab: 'sailpoint' | 'architect' | 'other';
  activeDocumentId: string | null;
  documents: SiteContent;
}
```

## File Structure and Organization

### Source Structure (Development)

```
workspace/
├── build/
│   ├── build.js              # Main build script
│   ├── FileScanner.js        # File discovery component
│   ├── MarkdownProcessor.js  # Markdown to HTML converter
│   ├── ContentBundler.js     # Content aggregator
│   └── StaticAssetGenerator.js # Output generator
├── src/
│   ├── index.html            # HTML template
│   ├── styles.css            # Application styles
│   └── app.js                # Runtime application logic
├── dist/                     # Build output (generated)
│   ├── index.html            # Final HTML with embedded content
│   ├── styles.css            # Bundled styles
│   └── app.js                # Bundled JavaScript
├── package.json              # Build dependencies
└── [markdown files]          # Source content
```

### Output Structure (Production)

```
dist/
├── index.html    # Single HTML file with:
│                 #   - Tab navigation structure
│                 #   - Document list container
│                 #   - Content display area
│                 #   - Embedded content data
├── styles.css    # Combined CSS:
│                 #   - Application styles
│                 #   - Prism.js theme
│                 #   - Responsive breakpoints
└── app.js        # Combined JavaScript:
                  #   - Application logic
                  #   - Prism.js library
                  #   - Content data (SITE_CONTENT)
```

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend Documentation</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app-container">
    <!-- Tab Navigation -->
    <nav class="tab-navigation">
      <button class="tab-button active" data-tab="sailpoint">Sailpoint</button>
      <button class="tab-button" data-tab="architect">Architect Level</button>
      <button class="tab-button" data-tab="other">Other Frontend</button>
    </nav>
    
    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Document List Sidebar -->
      <aside class="document-list">
        <ul id="document-list-container">
          <!-- Populated by JavaScript -->
        </ul>
      </aside>
      
      <!-- Content Display -->
      <main class="content-area" id="content-container">
        <!-- Document content rendered here -->
      </main>
    </div>
  </div>
  
  <script src="app.js"></script>
</body>
</html>
```

## Technology Choices

### Markdown Parser: marked.js

**Rationale**:
- Lightweight (~5KB minified + gzipped)
- Full GitHub Flavored Markdown support (tables, task lists, strikethrough)
- Extensible with custom renderers if needed
- No dependencies
- Actively maintained with strong community support
- Meets Requirements 5.1-5.5 for comprehensive markdown support

**Alternatives Considered**:
- markdown-it: More features but larger bundle size
- showdown: Older, less active maintenance
- remark: Requires additional plugins for basic features

### Syntax Highlighter: Prism.js

**Rationale**:
- Modular language support (include only needed languages)
- Small core (~2KB) + language modules
- Automatic language detection
- Extensive theme library
- Works without Node.js runtime (meets Requirement 7.5)
- Supports JavaScript, TypeScript, HTML, CSS, JSON, Markdown (Requirement 6.2)
- Professional color schemes with accessibility support (Requirement 6.4)

**Configuration**:
```javascript
// Include languages: javascript, typescript, css, html, json, markdown
// Theme: prism-tomorrow (dark) or prism-solarizedlight (light)
// Plugins: line-numbers (optional), toolbar (optional)
```

**Alternatives Considered**:
- highlight.js: Automatic detection but larger bundle
- Shiki: Beautiful but requires build-time processing
- CodeMirror: Overkill for read-only display

### Build Tool: Node.js Script

**Rationale**:
- Simple, direct control over build process
- No framework lock-in or configuration complexity
- Easy to understand and modify
- Minimal dependencies (marked, prism, fs, path)
- Fast build times for small to medium documentation sets
- Meets Requirement 7 for static output generation

**Build Process**:
```bash
node build/build.js
# Outputs to dist/ directory
```

**Alternatives Considered**:
- Webpack: Overkill for this use case
- Vite: Adds unnecessary complexity
- Eleventy: Good option but adds framework dependency
- Custom shell script: Less portable across platforms

### Frontend: Vanilla JavaScript

**Rationale**:
- Zero framework overhead
- Fast load times and runtime performance
- No build step required for runtime code
- Easy to debug and understand
- Meets Requirement 7.1 for no runtime dependencies
- Total JavaScript bundle ~15-20KB (app logic + Prism)

**Browser Compatibility**:
- Target: Modern browsers (ES6+)
- Fallback: Not required (documentation site for developers)
- Features used: const/let, arrow functions, template literals, classList API

**Alternatives Considered**:
- React: Unnecessary complexity and bundle size
- Vue: Simpler than React but still adds overhead
- Svelte: Compiles away but adds build complexity

## Implementation Approach

### Phase 1: Build System Setup

1. Initialize Node.js project with package.json
2. Install dependencies: marked, prismjs
3. Create build script structure
4. Implement FileScanner to discover markdown files
5. Test file categorization with workspace structure

### Phase 2: Content Processing

1. Implement MarkdownProcessor with marked.js
2. Configure marked.js for GFM support
3. Implement title formatting logic
4. Process sample files and verify HTML output
5. Handle edge cases (special characters, empty files)

### Phase 3: Build Pipeline

1. Implement ContentBundler to aggregate documents
2. Create JavaScript data structure with all content
3. Implement StaticAssetGenerator
4. Generate index.html from template
5. Bundle CSS (app styles + Prism theme)
6. Bundle JavaScript (app logic + Prism + content)
7. Test complete build process

### Phase 4: Runtime Application

1. Implement TabNavigationController
2. Implement DocumentListRenderer
3. Implement ContentRenderer with Prism integration
4. Wire up event handlers for tab and document clicks
5. Test navigation flow and content display
6. Implement default tab and document selection

### Phase 5: Styling and Responsiveness

1. Create base CSS for layout (flexbox/grid)
2. Style tab navigation with active states
3. Style document list with hover effects
4. Style content area with typography
5. Implement responsive breakpoints for mobile
6. Test on various screen sizes
7. Apply Prism theme for code highlighting

### Phase 6: Testing and Refinement

1. Test with all workspace markdown files
2. Verify all 7 Sailpoint files load correctly
3. Verify all 12 Architect files load correctly
4. Verify root files load correctly
5. Test responsive behavior on mobile devices
6. Verify syntax highlighting for all supported languages
7. Test edge cases (long documents, special characters)
8. Optimize bundle sizes if needed

### Build Script Entry Point

```javascript
// build/build.js
const FileScanner = require('./FileScanner');
const MarkdownProcessor = require('./MarkdownProcessor');
const ContentBundler = require('./ContentBundler');
const StaticAssetGenerator = require('./StaticAssetGenerator');

async function build() {
  console.log('Starting build...');
  
  // 1. Scan workspace for markdown files
  const scanner = new FileScanner();
  const files = scanner.scanWorkspace(process.cwd());
  console.log(`Found ${files.sailpoint.length} Sailpoint files`);
  console.log(`Found ${files.architect.length} Architect files`);
  console.log(`Found ${files.other.length} Other files`);
  
  // 2. Process all markdown files
  const processor = new MarkdownProcessor();
  const documents = {
    sailpoint: files.sailpoint.map(f => processor.processFile(f, 'sailpoint')),
    architect: files.architect.map(f => processor.processFile(f, 'architect')),
    other: files.other.map(f => processor.processFile(f, 'other'))
  };
  
  // 3. Bundle content into JavaScript
  const bundler = new ContentBundler();
  const contentJS = bundler.bundle(documents);
  
  // 4. Generate static assets
  const generator = new StaticAssetGenerator();
  generator.generate(contentJS, './dist');
  
  console.log('Build complete! Output in dist/');
}

build().catch(console.error);
```

### Runtime Application Entry Point

```javascript
// src/app.js
class App {
  constructor() {
    this.state = {
      activeTab: 'sailpoint',
      activeDocumentId: null,
      documents: SITE_CONTENT  // Injected by build process
    };
    
    this.tabController = new TabNavigationController(this.state.documents);
    this.docListRenderer = new DocumentListRenderer(
      document.getElementById('document-list-container'),
      (docId) => this.selectDocument(docId)
    );
    this.contentRenderer = new ContentRenderer(
      document.getElementById('content-container')
    );
    
    this.init();
  }
  
  init() {
    // Set up tab click handlers
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    // Load default tab
    this.switchTab('sailpoint');
  }
  
  switchTab(tabName) {
    this.state.activeTab = tabName;
    this.tabController.switchTab(tabName);
    const docs = this.tabController.getActiveDocuments();
    this.docListRenderer.render(docs);
    
    // Select first document by default
    if (docs.length > 0) {
      this.selectDocument(docs[0].id);
    }
  }
  
  selectDocument(docId) {
    const doc = this.state.documents[this.state.activeTab]
      .find(d => d.id === docId);
    
    if (doc) {
      this.state.activeDocumentId = docId;
      this.docListRenderer.setActiveDocument(docId);
      this.contentRenderer.render(doc);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tab activation updates UI state

*For any* tab in the navigation system, when clicked, that tab should be visually marked as active and all other tabs should be marked as inactive.

**Validates: Requirements 1.2, 1.3**

### Property 2: Document list filters by active tab

*For any* tab selection, the document list should display only documents belonging to that tab's category (sailpoint, architect, or other) and exclude documents from other categories.

**Validates: Requirements 2.1, 3.1, 4.1, 4.2**

### Property 3: Filename formatting transforms separators

*For any* filename containing underscores or hyphens, the displayed title should have those characters replaced with spaces.

**Validates: Requirements 2.2**

### Property 4: Document selection displays content

*For any* document in the document list, when clicked, the content area should display that document's HTML content.

**Validates: Requirements 2.3, 3.3, 4.4**

### Property 5: Architect files maintain numerical order

*For any* set of files in the architect category with numerical prefixes (01, 02, 03...), they should appear in the document list in ascending numerical order.

**Validates: Requirements 3.2**

### Property 6: Other files maintain alphabetical order

*For any* set of files in the other category, they should appear in the document list in alphabetical order by title.

**Validates: Requirements 4.3**

### Property 7: Markdown elements convert to HTML

*For any* valid markdown content containing headers, lists, links, bold, italic, blockquotes, tables, or code blocks, the parser should produce HTML output with the corresponding HTML elements (h1-h6, ul/ol/li, a, strong, em, blockquote, table, pre/code).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 8: Markdown parsing produces valid HTML

*For any* valid markdown file, the parser should produce HTML output that is well-formed and valid according to HTML5 specifications.

**Validates: Requirements 5.5**

### Property 9: Code blocks with language identifiers get syntax highlighting

*For any* code block in markdown with a language identifier (```javascript, ```typescript, etc.), the rendered HTML should contain syntax highlighting markup (spans with token classes).

**Validates: Requirements 6.1**

### Property 10: Code blocks without language identifiers render as plain text

*For any* code block in markdown without a language identifier, the rendered HTML should contain the code in a pre/code element without syntax highlighting markup.

**Validates: Requirements 6.3**

### Property 11: All documents are embedded in build output

*For any* markdown file in the workspace (sailpoint, architect, or root), the build process should include that file's parsed HTML in the SITE_CONTENT data structure.

**Validates: Requirements 7.2**

### Property 12: Selected document is highlighted in list

*For any* document selection, that document should have an active/selected visual indicator in the document list, and no other document should have that indicator.

**Validates: Requirements 10.1**

### Property 13: Document changes occur without page reload

*For any* document selection change, the content area should update to show the new document without triggering a full page reload (no navigation event, no URL change to external page).

**Validates: Requirements 10.3**

### Property 14: Document changes scroll content to top

*For any* document selection change, the content area should scroll to the top (scrollTop = 0) of the new document.

**Validates: Requirements 10.5**


## Error Handling

### Build-Time Error Handling

**File System Errors**:
- **Missing directories**: If sailpoint/ or detailed_architect_level/ directories don't exist, log a warning and continue with empty arrays for those categories
- **File read errors**: If a markdown file cannot be read (permissions, corruption), log the error with filename and skip that file, continuing with remaining files
- **Invalid markdown**: If marked.js throws an error parsing a file, log the error, include a placeholder error message in the HTML output, and continue processing other files

**Build Process Errors**:
- **Output directory creation**: If dist/ cannot be created, fail the build with a clear error message
- **Asset writing errors**: If HTML/CSS/JS files cannot be written, fail the build with specific file and error details
- **Dependency errors**: If marked.js or prismjs cannot be loaded, fail immediately with installation instructions

**Error Logging Format**:
```javascript
console.error(`[Build Error] ${errorType}: ${message}`);
console.error(`  File: ${filePath}`);
console.error(`  Details: ${error.stack}`);
```

### Runtime Error Handling

**Content Rendering Errors**:
- **Missing document**: If a document ID is requested but not found in SITE_CONTENT, display a "Document not found" message in the content area
- **Syntax highlighting errors**: If Prism.js fails to highlight a code block, display the code as plain text without highlighting
- **HTML injection**: Sanitize is disabled in marked.js to allow HTML in markdown, but this is acceptable for trusted documentation content

**Navigation Errors**:
- **Invalid tab**: If an invalid tab name is provided, default to 'sailpoint' tab
- **Empty document list**: If a tab has no documents, display a "No documents available" message
- **Event handler errors**: Wrap all event handlers in try-catch blocks to prevent UI lockup

**Graceful Degradation**:
- If JavaScript fails to load, display a message: "This site requires JavaScript to function"
- If CSS fails to load, HTML structure should still be readable with browser default styles
- If Prism.js fails to load, code blocks display without syntax highlighting but remain readable

### Error Recovery Strategies

**Build-Time Recovery**:
1. Continue processing remaining files if one file fails
2. Generate partial output if some content is available
3. Include error report in build output for debugging

**Runtime Recovery**:
1. Reset to default state (sailpoint tab, first document) if navigation state becomes invalid
2. Re-render document list if rendering fails
3. Provide user feedback for any errors (toast notifications or inline messages)

## Testing Strategy

### Overview

This feature requires a dual testing approach combining unit tests for specific behaviors and property-based tests for universal correctness guarantees. Unit tests verify concrete examples and edge cases, while property tests ensure correctness across a wide range of inputs through randomization.

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: markdown-static-website, Property {N}: {property description}`

**Property Test Implementation**:

Each correctness property from the design document must be implemented as a property-based test:

1. **Property 1: Tab activation** - Generate random tab selections, verify active state
2. **Property 2: Document filtering** - Generate random document sets, verify filtering by category
3. **Property 3: Filename formatting** - Generate random filenames with separators, verify transformation
4. **Property 4: Document selection** - Generate random document selections, verify content display
5. **Property 5: Numerical ordering** - Generate random numerically-prefixed filenames, verify sort order
6. **Property 6: Alphabetical ordering** - Generate random filenames, verify alphabetical sort
7. **Property 7: Markdown conversion** - Generate random markdown with various elements, verify HTML output
8. **Property 8: Valid HTML output** - Generate random valid markdown, verify HTML validity
9. **Property 9: Syntax highlighting with language** - Generate random code blocks with languages, verify highlighting
10. **Property 10: Plain text without language** - Generate random code blocks without languages, verify plain rendering
11. **Property 11: Content embedding** - Generate random file sets, verify all included in output
12. **Property 12: Document highlighting** - Generate random selections, verify active indicator
13. **Property 13: No page reload** - Generate random document changes, verify SPA behavior
14. **Property 14: Scroll to top** - Generate random document changes, verify scroll position reset

**Example Property Test**:
```javascript
// Feature: markdown-static-website, Property 3: Filename formatting transforms separators
const fc = require('fast-check');

test('filename formatting replaces underscores and hyphens with spaces', () => {
  fc.assert(
    fc.property(
      fc.stringOf(fc.constantFrom('a', 'b', 'c', '_', '-'), { minLength: 1, maxLength: 50 }),
      (filename) => {
        const formatted = formatTitle(filename);
        // Verify no underscores or hyphens remain
        expect(formatted).not.toContain('_');
        expect(formatted).not.toContain('-');
        // Verify spaces are present where separators were
        if (filename.includes('_') || filename.includes('-')) {
          expect(formatted).toContain(' ');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Framework**: Jest (JavaScript testing framework)

**Test Categories**:

1. **Build Process Tests**:
   - FileScanner correctly identifies files in sailpoint/ directory (7 files)
   - FileScanner correctly identifies files in detailed_architect_level/ directory (12 files)
   - FileScanner correctly identifies root markdown files
   - FileScanner excludes non-markdown files
   - MarkdownProcessor handles empty files gracefully
   - ContentBundler generates valid JavaScript syntax
   - StaticAssetGenerator creates all required output files

2. **Markdown Parsing Tests**:
   - Headers (h1-h6) are correctly converted
   - Lists (ordered and unordered) are correctly converted
   - Links are correctly converted with href attributes
   - Bold and italic text are correctly converted
   - Code blocks are wrapped in pre/code elements
   - Tables are converted to HTML table elements
   - Blockquotes are converted to blockquote elements

3. **Syntax Highlighting Tests**:
   - JavaScript code blocks receive syntax highlighting
   - TypeScript code blocks receive syntax highlighting
   - HTML, CSS, JSON, Markdown code blocks receive highlighting
   - Code blocks without language identifiers remain unhighlighted
   - Prism.js is included in the bundle

4. **UI Component Tests**:
   - Three tabs are rendered with correct labels
   - First tab is active on initial load
   - Clicking a tab updates active state
   - Document list renders correct number of items
   - Document list items have click handlers
   - Content area updates when document is selected
   - Hover states are defined in CSS

5. **Edge Cases**:
   - Empty markdown file produces empty content
   - Markdown with special characters (quotes, brackets) is handled correctly
   - Very long document titles are handled gracefully
   - Documents with no code blocks don't break syntax highlighting
   - Switching tabs multiple times maintains correct state
   - Selecting the same document twice doesn't cause errors

6. **Integration Tests**:
   - Complete build process runs without errors
   - Generated index.html is valid HTML5
   - Generated CSS is valid
   - Generated JavaScript has no syntax errors
   - All three tabs function correctly in generated output
   - All documents are accessible in generated output

### Test Coverage Goals

- **Build components**: 90%+ code coverage
- **Runtime components**: 85%+ code coverage
- **Critical paths** (tab switching, document selection): 100% coverage
- **Error handling**: All error paths tested

### Manual Testing Checklist

While automated tests cover functional correctness, manual testing is required for:

1. **Visual Design**:
   - Professional appearance and color scheme
   - Consistent spacing and typography
   - Readable font sizes and line heights
   - Appropriate contrast for accessibility

2. **Responsive Design**:
   - Test on mobile devices (phone, tablet)
   - Test at various screen widths (320px, 768px, 1024px, 1920px)
   - Verify touch interactions work correctly
   - Verify horizontal scrolling for wide code blocks

3. **Browser Compatibility**:
   - Test on Chrome, Firefox, Safari, Edge
   - Verify syntax highlighting works in all browsers
   - Verify tab navigation works in all browsers

4. **Performance**:
   - Page load time under 2 seconds
   - Smooth tab switching with no lag
   - Smooth document switching with no lag
   - Syntax highlighting doesn't cause visible delay

5. **Accessibility**:
   - Keyboard navigation works (Tab, Enter, Arrow keys)
   - Screen reader compatibility (ARIA labels if needed)
   - Sufficient color contrast (WCAG AA minimum)
   - Focus indicators are visible

### Testing Workflow

1. **Development**: Run unit tests on file save (watch mode)
2. **Pre-commit**: Run all unit tests and property tests
3. **Build**: Run build process and verify output
4. **Pre-deployment**: Run integration tests on generated output
5. **Post-deployment**: Manual smoke test of deployed site

### Test Data

**Sample Markdown Files**:
Create test fixtures with various markdown features:
- `test-headers.md` - All header levels
- `test-lists.md` - Ordered, unordered, nested lists
- `test-code.md` - Code blocks with various languages
- `test-tables.md` - Simple and complex tables
- `test-links.md` - Internal and external links
- `test-formatting.md` - Bold, italic, strikethrough
- `test-mixed.md` - Combination of all features
- `test-empty.md` - Empty file
- `test-special-chars.md` - Special characters and unicode

**Mock File Structure**:
```
test-workspace/
├── sailpoint/
│   ├── doc1.md
│   ├── doc2.md
│   └── doc3.md
├── detailed_architect_level/
│   ├── 01_first.md
│   ├── 02_second.md
│   └── 03_third.md
├── root-doc1.md
└── root-doc2.md
```

This test structure allows verification of file discovery, categorization, and ordering logic.

