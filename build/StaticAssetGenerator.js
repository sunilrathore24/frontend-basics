const fs = require('fs');
const path = require('path');

/**
 * StaticAssetGenerator - Generates final static website output
 * 
 * Creates the complete static website by generating HTML, CSS, and JavaScript files
 * in the dist/ directory. Bundles application styles, Prism theme, app logic,
 * Prism library, and embedded content data.
 */
class StaticAssetGenerator {
  /**
   * Generates complete static website
   * @param {string} contentJS - Bundled content JavaScript code
   * @param {string} outputDir - Output directory path (default: './dist')
   */
  generate(contentJS, outputDir = './dist') {
    // Create output directory if it doesn't exist
    this._ensureDirectoryExists(outputDir);
    
    // Generate and write HTML file
    const html = this._generateHTML();
    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf-8');
    
    // Generate and write CSS file
    const css = this._generateCSS();
    fs.writeFileSync(path.join(outputDir, 'styles.css'), css, 'utf-8');
    
    // Generate and write JavaScript file
    const js = this._generateJS(contentJS);
    fs.writeFileSync(path.join(outputDir, 'app.js'), js, 'utf-8');
    
    console.log(`✓ Generated static website in ${outputDir}/`);
  }
  
  /**
   * Ensures output directory exists, creates if necessary
   * @param {string} dirPath - Directory path
   * @private
   */
  _ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  /**
   * Generates HTML structure with tab navigation
   * @returns {string} Complete HTML document
   * @private
   */
  _generateHTML() {
    return `<!DOCTYPE html>
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
</html>`;
  }
  
  /**
   * Generates bundled CSS (application styles + Prism theme)
   * @returns {string} Complete CSS
   * @private
   */
  _generateCSS() {
    // Application styles
    const appStyles = `/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

/* App Container */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background-color: #2c3e50;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-button {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  background-color: transparent;
  color: #ecf0f1;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background-color: #34495e;
}

.tab-button.active {
  background-color: #34495e;
  color: #fff;
  border-bottom-color: #3498db;
}

/* Main Content Area */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Document List Sidebar */
.document-list {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
}

#document-list-container {
  list-style: none;
}

#document-list-container li {
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

#document-list-container li:hover {
  background-color: #f8f9fa;
}

#document-list-container li.active {
  background-color: #e3f2fd;
  border-left: 4px solid #3498db;
  font-weight: 500;
  color: #2c3e50;
}

/* Content Display Area */
.content-area {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #fff;
}

.content-area h1,
.content-area h2,
.content-area h3,
.content-area h4,
.content-area h5,
.content-area h6 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

.content-area h1 { font-size: 2rem; }
.content-area h2 { font-size: 1.75rem; }
.content-area h3 { font-size: 1.5rem; }
.content-area h4 { font-size: 1.25rem; }
.content-area h5 { font-size: 1.1rem; }
.content-area h6 { font-size: 1rem; }

.content-area p {
  margin-bottom: 1rem;
}

.content-area ul,
.content-area ol {
  margin-bottom: 1rem;
  margin-left: 2rem;
}

.content-area li {
  margin-bottom: 0.5rem;
}

.content-area a {
  color: #3498db;
  text-decoration: none;
}

.content-area a:hover {
  text-decoration: underline;
}

.content-area blockquote {
  border-left: 4px solid #3498db;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #555;
  font-style: italic;
}

.content-area table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.content-area table th,
.content-area table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.content-area table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.content-area pre {
  background-color: #f8f9fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.content-area code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
}

.content-area pre code {
  background-color: transparent;
  padding: 0;
}

.content-area :not(pre) > code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  color: #e83e8c;
}

/* Responsive Design */
@media (max-width: 768px) {
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .main-content {
    flex-direction: column;
  }
  
  .document-list {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  
  .content-area {
    padding: 1rem;
  }
  
  .content-area pre {
    font-size: 0.85rem;
  }
}`;
    
    // Prism.js theme (Tomorrow Night)
    const prismTheme = `
/* Prism.js Tomorrow Night Theme */
code[class*="language-"],
pre[class*="language-"] {
  color: #ccc;
  background: none;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 1em;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  line-height: 1.5;
  tab-size: 4;
  hyphens: none;
}

pre[class*="language-"] {
  padding: 1em;
  margin: .5em 0;
  overflow: auto;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
  background: #2d2d2d;
}

:not(pre) > code[class*="language-"] {
  padding: .1em;
  border-radius: .3em;
  white-space: normal;
}

.token.comment,
.token.block-comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #999;
}

.token.punctuation {
  color: #ccc;
}

.token.tag,
.token.attr-name,
.token.namespace,
.token.deleted {
  color: #e2777a;
}

.token.function-name {
  color: #6196cc;
}

.token.boolean,
.token.number,
.token.function {
  color: #f08d49;
}

.token.property,
.token.class-name,
.token.constant,
.token.symbol {
  color: #f8c555;
}

.token.selector,
.token.important,
.token.atrule,
.token.keyword,
.token.builtin {
  color: #cc99cd;
}

.token.string,
.token.char,
.token.attr-value,
.token.regex,
.token.variable {
  color: #7ec699;
}

.token.operator,
.token.entity,
.token.url {
  color: #67cdcc;
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}

.token.inserted {
  color: green;
}`;
    
    return appStyles + '\n' + prismTheme;
  }
  
  /**
   * Generates bundled JavaScript (app logic + Prism library + content data)
   * @param {string} contentJS - Content data JavaScript
   * @returns {string} Complete JavaScript
   * @private
   */
  _generateJS(contentJS) {
    // Prism.js core and language modules (minified version)
    const prismJS = this._getPrismJS();
    
    // Application logic
    const appLogic = `
// Application Logic
class TabNavigationController {
  constructor(contentData) {
    this.contentData = contentData;
    this.activeTab = 'sailpoint';
  }
  
  switchTab(tabName) {
    this.activeTab = tabName;
    this.updateTabUI();
  }
  
  updateTabUI() {
    document.querySelectorAll('.tab-button').forEach(btn => {
      if (btn.dataset.tab === this.activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  getActiveDocuments() {
    return this.contentData[this.activeTab] || [];
  }
}

class DocumentListRenderer {
  constructor(containerElement, onDocumentSelect) {
    this.container = containerElement;
    this.onDocumentSelect = onDocumentSelect;
    this.activeDocumentId = null;
  }
  
  render(documents) {
    this.container.innerHTML = '';
    
    if (documents.length === 0) {
      this.container.innerHTML = '<li style="padding: 1rem; color: #999;">No documents available</li>';
      return;
    }
    
    documents.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.title;
      li.dataset.docId = doc.id;
      
      if (doc.id === this.activeDocumentId) {
        li.classList.add('active');
      }
      
      li.addEventListener('click', () => {
        this.onDocumentSelect(doc.id);
      });
      
      this.container.appendChild(li);
    });
  }
  
  setActiveDocument(documentId) {
    this.activeDocumentId = documentId;
    
    this.container.querySelectorAll('li').forEach(li => {
      if (li.dataset.docId === documentId) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });
  }
}

class ContentRenderer {
  constructor(containerElement) {
    this.container = containerElement;
  }
  
  render(document) {
    if (!document) {
      this.container.innerHTML = '<p style="color: #999;">Document not found</p>';
      return;
    }
    
    this.container.innerHTML = document.html;
    this.applySyntaxHighlighting();
    this.scrollToTop();
  }
  
  applySyntaxHighlighting() {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(this.container);
    }
  }
  
  scrollToTop() {
    this.container.scrollTop = 0;
  }
}

class App {
  constructor() {
    this.state = {
      activeTab: 'sailpoint',
      activeDocumentId: null,
      documents: SITE_CONTENT
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
    } else {
      this.contentRenderer.render(null);
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
});`;
    
    // Combine all JavaScript: content data + Prism + app logic
    return contentJS + '\n\n' + prismJS + '\n\n' + appLogic;
  }
  
  /**
   * Returns Prism.js library code with language support
   * @returns {string} Prism.js code
   * @private
   */
  _getPrismJS() {
    // Load Prism.js from node_modules
    const prismPath = require.resolve('prismjs');
    const prismCore = fs.readFileSync(prismPath, 'utf-8');
    
    // Load language components
    const languages = ['javascript', 'typescript', 'css', 'markup', 'json', 'markdown'];
    const languageCode = languages.map(lang => {
      try {
        const langPath = require.resolve(`prismjs/components/prism-${lang}.js`);
        return fs.readFileSync(langPath, 'utf-8');
      } catch (error) {
        console.warn(`Warning: Could not load Prism language: ${lang}`);
        return '';
      }
    }).join('\n');
    
    return prismCore + '\n' + languageCode;
  }
}

module.exports = StaticAssetGenerator;
