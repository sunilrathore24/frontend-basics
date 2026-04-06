/**
 * TabNavigationController - Manages tab state and UI updates
 * 
 * Handles tab switching, maintains active tab state, and coordinates
 * UI updates for the tab navigation system.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
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
  }
  
  /**
   * Updates tab visual indicators (active/inactive)
   */
  updateTabUI() {
    document.querySelectorAll('.tab-button').forEach(btn => {
      if (btn.dataset.tab === this.activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  /**
   * Gets documents for active tab
   * @returns {Array} Documents for current tab
   */
  getActiveDocuments() {
    return this.contentData[this.activeTab] || [];
  }
}

/**
 * DocumentListRenderer - Displays and manages document navigation
 * 
 * Renders the document list for the active tab, handles document selection,
 * and maintains visual indicators for the active document.
 * 
 * Requirements: 2.1, 3.1, 4.1, 10.1, 10.2, 10.4
 */
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
  
  /**
   * Highlights selected document
   * @param {string} documentId - ID of active document
   */
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

/**
 * ContentRenderer - Displays document content with syntax highlighting
 * 
 * Renders document HTML in the content area, applies Prism.js syntax
 * highlighting, and manages scroll position.
 * 
 * Requirements: 2.3, 3.3, 4.4, 6.1, 6.2, 6.3, 10.3, 10.5
 */
class ContentRenderer {
  constructor(containerElement) {
    this.container = containerElement;
  }
  
  /**
   * Renders document HTML content
   * @param {Object} document - Document to render
   */
  render(document) {
    if (!document) {
      this.container.innerHTML = '<p style="color: #999;">Document not found</p>';
      return;
    }
    
    this.container.innerHTML = document.html;
    this.applySyntaxHighlighting();
    this.scrollToTop();
  }
  
  /**
   * Applies Prism.js syntax highlighting to code blocks
   */
  applySyntaxHighlighting() {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(this.container);
    }
  }
  
  /**
   * Scrolls content area to top
   */
  scrollToTop() {
    this.container.scrollTop = 0;
  }
}

/**
 * App - Main application class
 * 
 * Coordinates all components, manages application state, and handles
 * user interactions for tab switching and document selection.
 * 
 * Requirements: 1.5, 10.3
 */
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
  
  /**
   * Initializes the application
   */
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
  
  /**
   * Switches to specified tab and loads documents
   * @param {string} tabName - Tab identifier
   */
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
  
  /**
   * Selects and displays a document
   * @param {string} docId - Document ID
   */
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
