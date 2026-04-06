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
 */
class ContentRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this._bindAnchorLinks();
  }

  render(doc) {
    if (!doc) {
      this.container.innerHTML = '<p style="color: #999;">Document not found</p>';
      return;
    }
    this.container.innerHTML = doc.html;
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

  /**
   * Fix Bug 1: intercept anchor clicks and scroll within the content area
   * instead of letting the browser try to navigate the whole page.
   */
  _bindAnchorLinks() {
    this.container.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      e.preventDefault();
      const id = decodeURIComponent(anchor.getAttribute('href').slice(1));
      // Try exact id match first, then a slugified match
      let target = this.container.querySelector('#' + CSS.escape(id));
      if (!target) {
        // marked.js generates ids like "what-is-torque" from heading text
        const slug = id.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        target = this.container.querySelector('#' + CSS.escape(slug));
      }
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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
      documents: SITE_CONTENT
    };
    this.sidebarOpen = true;

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
    // Tab clicks
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Bug 2a: sidebar toggle button
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Bug 2b: clicking anywhere on the content area closes the sidebar
    const contentArea = document.getElementById('content-container');
    if (contentArea) {
      contentArea.addEventListener('click', () => {
        if (this.sidebarOpen) this.closeSidebar();
      });
    }

    this.switchTab('sailpoint');
  }

  toggleSidebar() {
    this.sidebarOpen ? this.closeSidebar() : this.openSidebar();
  }

  openSidebar() {
    this.sidebarOpen = true;
    document.querySelector('.document-list').classList.remove('sidebar-closed');
    const btn = document.getElementById('sidebar-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  closeSidebar() {
    this.sidebarOpen = false;
    document.querySelector('.document-list').classList.add('sidebar-closed');
    const btn = document.getElementById('sidebar-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  switchTab(tabName) {
    this.state.activeTab = tabName;
    this.tabController.switchTab(tabName);
    const docs = this.tabController.getActiveDocuments();
    this.docListRenderer.render(docs);
    if (docs.length > 0) {
      this.selectDocument(docs[0].id);
    } else {
      this.contentRenderer.render(null);
    }
  }

  selectDocument(docId) {
    const doc = this.state.documents[this.state.activeTab].find(d => d.id === docId);
    if (doc) {
      this.state.activeDocumentId = docId;
      this.docListRenderer.setActiveDocument(docId);
      this.contentRenderer.render(doc);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
