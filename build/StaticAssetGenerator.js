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
      <!-- Sidebar toggle button -->
      <button id="sidebar-toggle" class="sidebar-toggle" aria-expanded="true" aria-label="Toggle sidebar">&#9664;</button>

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
    // Read app styles from src/styles.css so it stays in sync
    const appStyles = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf-8');

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
    
    // Application logic — read from src/app.js so it stays in sync
    const appLogic = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf-8');
    
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
