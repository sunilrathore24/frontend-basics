# Implementation Plan: Markdown Static Website Generator

## Overview

This implementation plan converts the markdown static website generator design into actionable coding tasks. The system will be built in JavaScript/Node.js with a build-time processing approach that generates a fully static website with embedded content. Implementation follows a bottom-up approach: build system components first, then runtime components, followed by styling and integration.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create package.json with dependencies: marked, prismjs, fast-check (dev), jest (dev)
  - Create directory structure: build/, src/, dist/
  - Set up build script entry point in package.json
  - _Requirements: 7.1, 7.3_

- [ ] 2. Implement FileScanner component
  - [x] 2.1 Create build/FileScanner.js with scanWorkspace method
    - Implement directory reading using Node.js fs module
    - Filter for .md files only
    - Categorize files into sailpoint, architect, and other arrays
    - Sort architect files numerically by prefix (01, 02, 03...)
    - Sort other files alphabetically
    - _Requirements: 2.1, 3.1, 3.2, 4.1, 4.2, 4.3_
  
  - [ ]* 2.2 Write property test for FileScanner
    - **Property 5: Architect files maintain numerical order**
    - **Property 6: Other files maintain alphabetical order**
    - **Validates: Requirements 3.2, 4.3**
  
  - [ ]* 2.3 Write unit tests for FileScanner
    - Test correct identification of 7 sailpoint files
    - Test correct identification of 12 architect files
    - Test correct identification of root markdown files
    - Test exclusion of non-markdown files
    - _Requirements: 2.1, 3.1, 4.1_

- [ ] 3. Implement MarkdownProcessor component
  - [x] 3.1 Create build/MarkdownProcessor.js with processFile method
    - Implement file reading using Node.js fs module
    - Configure marked.js for GitHub Flavored Markdown
    - Parse markdown to HTML using marked.js
    - Generate unique document ID from filename
    - Implement formatTitle method to convert filenames to display titles
    - Return document object with id, title, html, category, originalPath
    - _Requirements: 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 3.2 Write property test for filename formatting
    - **Property 3: Filename formatting transforms separators**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.3 Write property test for markdown parsing
    - **Property 7: Markdown elements convert to HTML**
    - **Property 8: Markdown parsing produces valid HTML**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  
  - [ ]* 3.4 Write unit tests for MarkdownProcessor
    - Test headers (h1-h6) conversion
    - Test lists (ordered and unordered) conversion
    - Test links conversion with href attributes
    - Test bold and italic text conversion
    - Test code blocks wrapped in pre/code elements
    - Test tables conversion to HTML table elements
    - Test blockquotes conversion
    - Test empty file handling
    - Test special characters handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. Implement ContentBundler component
  - [x] 4.1 Create build/ContentBundler.js with bundle method
    - Aggregate all processed documents by category
    - Generate JavaScript constant with embedded content
    - Escape special characters for JavaScript string safety
    - Return JavaScript code string defining SITE_CONTENT
    - _Requirements: 7.2_
  
  - [ ]* 4.2 Write property test for content embedding
    - **Property 11: All documents are embedded in build output**
    - **Validates: Requirements 7.2**
  
  - [ ]* 4.3 Write unit tests for ContentBundler
    - Test valid JavaScript syntax generation
    - Test special character escaping
    - Test all documents included in output
    - _Requirements: 7.2_

- [ ] 5. Implement StaticAssetGenerator component
  - [x] 5.1 Create build/StaticAssetGenerator.js with generate method
    - Create dist/ directory if it doesn't exist
    - Generate index.html with tab navigation structure
    - Bundle CSS (application styles + Prism theme)
    - Bundle JavaScript (app logic + Prism library + content data)
    - Write all files to dist/ directory
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [ ]* 5.2 Write unit tests for StaticAssetGenerator
    - Test all required output files are created
    - Test generated index.html is valid HTML5
    - Test generated CSS is valid
    - Test generated JavaScript has no syntax errors
    - _Requirements: 7.1, 7.3_

- [ ] 6. Create build script entry point
  - [x] 6.1 Create build/build.js main script
    - Instantiate FileScanner and scan workspace
    - Instantiate MarkdownProcessor and process all files
    - Instantiate ContentBundler and bundle content
    - Instantiate StaticAssetGenerator and generate output
    - Add error handling for build process
    - Add logging for build progress
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 6.2 Write integration test for complete build process
    - Test build runs without errors
    - Test all output files are created
    - Test output contains all expected documents
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Checkpoint - Ensure build system works
  - Run build script on actual workspace
  - Verify all markdown files are discovered
  - Verify HTML output is generated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement TabNavigationController runtime component
  - [x] 8.1 Create src/app.js with TabNavigationController class
    - Implement constructor to initialize state with default tab
    - Implement switchTab method to change active tab
    - Implement getActiveDocuments method to filter by category
    - Implement updateTabUI method to update visual indicators
    - Add event handlers for tab click events
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ]* 8.2 Write property test for tab activation
    - **Property 1: Tab activation updates UI state**
    - **Property 2: Document list filters by active tab**
    - **Validates: Requirements 1.2, 1.3, 2.1, 3.1, 4.1, 4.2**
  
  - [ ]* 8.3 Write unit tests for TabNavigationController
    - Test three tabs are rendered with correct labels
    - Test first tab is active on initial load
    - Test clicking a tab updates active state
    - Test switching tabs multiple times maintains correct state
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 9. Implement DocumentListRenderer runtime component
  - [x] 9.1 Add DocumentListRenderer class to src/app.js
    - Implement constructor with container element and callback
    - Implement render method to display document list
    - Implement setActiveDocument method to highlight selected document
    - Add click handlers for document selection
    - _Requirements: 2.1, 3.1, 4.1, 10.1, 10.2, 10.4_
  
  - [ ]* 9.2 Write property test for document selection
    - **Property 4: Document selection displays content**
    - **Property 12: Selected document is highlighted in list**
    - **Validates: Requirements 2.3, 3.3, 4.4, 10.1**
  
  - [ ]* 9.3 Write unit tests for DocumentListRenderer
    - Test document list renders correct number of items
    - Test document list items have click handlers
    - Test selected document has active indicator
    - Test only one document is highlighted at a time
    - _Requirements: 10.1, 10.2, 10.4_

- [ ] 10. Implement ContentRenderer runtime component
  - [x] 10.1 Add ContentRenderer class to src/app.js
    - Implement constructor with container element
    - Implement render method to display document HTML
    - Implement applySyntaxHighlighting method using Prism.js
    - Implement scrollToTop method to reset scroll position
    - _Requirements: 2.3, 3.3, 4.4, 6.1, 6.2, 6.3, 10.3, 10.5_
  
  - [ ]* 10.2 Write property test for syntax highlighting
    - **Property 9: Code blocks with language identifiers get syntax highlighting**
    - **Property 10: Code blocks without language identifiers render as plain text**
    - **Validates: Requirements 6.1, 6.3**
  
  - [ ]* 10.3 Write property test for document changes
    - **Property 13: Document changes occur without page reload**
    - **Property 14: Document changes scroll content to top**
    - **Validates: Requirements 10.3, 10.5**
  
  - [ ]* 10.4 Write unit tests for ContentRenderer
    - Test content area updates when document is selected
    - Test Prism.js is applied after render
    - Test scroll position resets to top
    - Test selecting same document twice doesn't cause errors
    - _Requirements: 2.3, 3.3, 4.4, 10.3, 10.5_

- [ ] 11. Implement App class and wire components together
  - [x] 11.1 Add App class to src/app.js
    - Implement constructor to initialize all components
    - Implement init method to set up event handlers
    - Implement switchTab method to coordinate tab changes
    - Implement selectDocument method to coordinate document selection
    - Add DOMContentLoaded event listener to initialize app
    - Set default tab to 'sailpoint' and select first document
    - _Requirements: 1.5, 10.3_
  
  - [ ]* 11.2 Write integration tests for App class
    - Test all three tabs function correctly
    - Test all documents are accessible
    - Test tab switching updates document list
    - Test document selection updates content area
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 10.3_

- [x] 12. Checkpoint - Ensure runtime components work
  - Test app initialization
  - Test tab navigation
  - Test document selection
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Create HTML template
  - [x] 13.1 Create src/index.html with complete structure
    - Add DOCTYPE, html, head, and body elements
    - Add meta tags for charset and viewport
    - Add title element
    - Create tab navigation structure with three buttons
    - Create main content area with document list sidebar and content display
    - Add script and link tags for CSS and JavaScript
    - _Requirements: 1.1, 1.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_
  
  - [ ]* 13.2 Write unit test for HTML template
    - Test generated HTML is valid HTML5
    - Test all required elements are present
    - _Requirements: 8.1_

- [ ] 14. Create CSS styles
  - [x] 14.1 Create src/styles.css with application styles
    - Style tab navigation with active states and visual hierarchy
    - Style document list with hover effects and active indicators
    - Style content area with readable typography
    - Apply consistent spacing between elements
    - Use professional color scheme throughout
    - Add Prism.js theme for syntax highlighting
    - _Requirements: 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 14.2 Add responsive CSS for mobile devices
    - Add media query for screens less than 768px
    - Adjust tab navigation for mobile
    - Adjust document list layout for mobile
    - Adjust content area text width and code blocks for mobile
    - Ensure touch interactions work correctly
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 14.3 Write unit tests for CSS
    - Test CSS is valid
    - Test hover states are defined
    - Test responsive breakpoints are defined
    - _Requirements: 8.4, 9.4_

- [ ] 15. Integrate Prism.js for syntax highlighting
  - [x] 15.1 Add Prism.js to build process
    - Include Prism.js core library in JavaScript bundle
    - Include language modules: javascript, typescript, css, html, json, markdown
    - Include Prism.js theme in CSS bundle
    - Configure Prism.js to work with dynamically loaded content
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.3_
  
  - [ ]* 15.2 Write unit tests for Prism.js integration
    - Test JavaScript code blocks receive syntax highlighting
    - Test TypeScript code blocks receive syntax highlighting
    - Test HTML, CSS, JSON, Markdown code blocks receive highlighting
    - Test code blocks without language identifiers remain unhighlighted
    - Test Prism.js is included in the bundle
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 16. Add error handling to build process
  - [x] 16.1 Add error handling to build/build.js
    - Handle missing directories (log warning, continue with empty arrays)
    - Handle file read errors (log error, skip file, continue)
    - Handle invalid markdown (log error, include placeholder, continue)
    - Handle output directory creation errors (fail build with message)
    - Handle asset writing errors (fail build with details)
    - Add error logging with clear format
    - _Requirements: 7.1_
  
  - [ ]* 16.2 Write unit tests for error handling
    - Test build continues when file read fails
    - Test build continues when markdown parsing fails
    - Test build fails when output directory cannot be created
    - _Requirements: 7.1_

- [ ] 17. Add error handling to runtime application
  - [x] 17.1 Add error handling to src/app.js
    - Handle missing document (display "Document not found" message)
    - Handle syntax highlighting errors (display code as plain text)
    - Handle invalid tab (default to 'sailpoint')
    - Handle empty document list (display "No documents available" message)
    - Wrap all event handlers in try-catch blocks
    - _Requirements: 1.5, 10.3_
  
  - [ ]* 17.2 Write unit tests for runtime error handling
    - Test invalid tab defaults to sailpoint
    - Test missing document displays error message
    - Test empty document list displays message
    - _Requirements: 1.5_

- [ ] 18. Final integration and testing
  - [x] 18.1 Run complete build on actual workspace
    - Build with all markdown files from workspace
    - Verify all 7 Sailpoint files are included
    - Verify all 12 Architect files are included
    - Verify all root markdown files are included
    - Test generated site in browser
    - _Requirements: 2.4, 3.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 18.2 Test responsive behavior
    - Test on mobile screen widths (320px, 375px, 414px)
    - Test on tablet screen widths (768px, 1024px)
    - Test on desktop screen widths (1280px, 1920px)
    - Test touch interactions on touch devices
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 18.3 Test syntax highlighting for all languages
    - Test JavaScript code blocks
    - Test TypeScript code blocks
    - Test HTML code blocks
    - Test CSS code blocks
    - Test JSON code blocks
    - Test Markdown code blocks
    - Test code blocks without language identifiers
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 18.4 Test edge cases
    - Test empty markdown file
    - Test markdown with special characters
    - Test very long document titles
    - Test documents with no code blocks
    - Test rapid tab switching
    - Test rapid document selection
    - _Requirements: 5.5, 10.3_

- [x] 19. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Verify build output is complete
  - Verify site functions correctly in browser
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- Unit tests use Jest framework
- Build system uses Node.js with marked.js and Prism.js
- Runtime application uses vanilla JavaScript (no framework)
- All code examples and implementation should be in JavaScript
- Checkpoints ensure incremental validation at key milestones
