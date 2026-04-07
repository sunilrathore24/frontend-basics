// ─── Utility: generate the same slug marked.js uses for heading IDs ───────────
function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w-]/g, '');
}

// ─── TabNavigationController ──────────────────────────────────────────────────
class TabNavigationController {
  constructor(contentData) {
    this.contentData = contentData;
    this.activeTab = 'sailpoint';
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
  }

  getActiveDocuments() {
    return this.contentData[this.activeTab] || [];
  }
}

// ─── DocumentListRenderer ─────────────────────────────────────────────────────
class DocumentListRenderer {
  constructor(containerElement, onDocumentSelect) {
    this.container = containerElement;
    this.onDocumentSelect = onDocumentSelect;
    this.activeDocumentId = null;
  }

  render(documents) {
    this.container.innerHTML = '';
    if (!documents.length) {
      this.container.innerHTML = '<li style="padding:1rem;color:#999">No documents available</li>';
      return;
    }
    documents.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.title;
      li.dataset.docId = doc.id;
      if (doc.id === this.activeDocumentId) li.classList.add('active');
      li.addEventListener('click', () => this.onDocumentSelect(doc.id));
      this.container.appendChild(li);
    });
  }

  setActiveDocument(documentId) {
    this.activeDocumentId = documentId;
    this.container.querySelectorAll('li').forEach(li => {
      li.classList.toggle('active', li.dataset.docId === documentId);
    });
  }
}

// ─── ContentRenderer ──────────────────────────────────────────────────────────
class ContentRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this._bindAnchorLinks();
  }

  render(doc) {
    if (!doc) {
      this.container.innerHTML = '<p style="color:#999">Document not found</p>';
      return;
    }
    this.container.innerHTML = doc.html;
    this._fixHeadingIds();
    this.applySyntaxHighlighting();
    this.scrollToTop();
  }

  /**
   * marked.js sometimes generates IDs with extra chars or inconsistent casing.
   * Re-stamp every heading with a clean, predictable slug so TOC links work.
   */
  _fixHeadingIds() {
    this.container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      const slug = slugify(h.textContent);
      h.id = slug;
    });
  }

  applySyntaxHighlighting() {
    if (typeof Prism !== 'undefined') Prism.highlightAllUnder(this.container);
  }

  scrollToTop() {
    this.container.scrollTop = 0;
  }

  /**
   * Intercept #anchor clicks and scroll within the content area.
   * Also handles TOC links that use heading text as the fragment.
   */
  _bindAnchorLinks() {
    this.container.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      e.preventDefault();
      const raw = decodeURIComponent(anchor.getAttribute('href').slice(1));
      const slug = slugify(raw);

      // Try slug first, then raw id
      const target =
        this.container.querySelector('#' + CSS.escape(slug)) ||
        this.container.querySelector('#' + CSS.escape(raw));

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
class App {
  constructor() {
    this.state = {
      activeTab: 'sailpoint',
      activeDocumentId: null,
      documents: SITE_CONTENT
    };
    this.sidebarOpen = true;
    this._skipHashUpdate = false; // prevent loop when we set hash ourselves

    this.tabController = new TabNavigationController(this.state.documents);
    this.docListRenderer = new DocumentListRenderer(
      document.getElementById('document-list-container'),
      (docId) => this.selectDocument(docId, true)
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
        this.switchTab(e.target.dataset.tab, true);
      });
    });

    // Sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Auto-close sidebar on content click
    const contentArea = document.getElementById('content-container');
    if (contentArea) {
      contentArea.addEventListener('click', () => {
        if (this.sidebarOpen) this.closeSidebar();
      });
    }

    // ── URL routing: listen for hash changes (back/forward, direct links) ──
    window.addEventListener('hashchange', () => this._loadFromHash());

    // Load from URL hash on startup, or default to first tab/doc
    this._loadFromHash();
  }

  // ── Hash format:  #tab/docId   e.g.  #sailpoint/SAILPOINT_SENIOR_STAFF...
  _loadFromHash() {
    const hash = window.location.hash.slice(1); // strip leading #
    if (!hash) {
      this._switchTabInternal('sailpoint');
      return;
    }
    const [tab, ...rest] = hash.split('/');
    const docId = rest.join('/'); // doc IDs may contain slashes (unlikely but safe)
    const validTabs = ['sailpoint', 'architect', 'other'];

    if (validTabs.includes(tab)) {
      this._switchTabInternal(tab);
      if (docId) {
        this._selectDocumentInternal(docId);
      }
    } else {
      this._switchTabInternal('sailpoint');
    }
  }

  _updateHash(tab, docId) {
    const newHash = '#' + tab + (docId ? '/' + docId : '');
    if (window.location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
  }

  // Internal switch — does NOT push to history (called from hashchange)
  _switchTabInternal(tabName) {
    this.state.activeTab = tabName;
    this.tabController.switchTab(tabName);
    const docs = this.tabController.getActiveDocuments();
    this.docListRenderer.render(docs);
    if (docs.length > 0) {
      this._selectDocumentInternal(docs[0].id);
    } else {
      this.contentRenderer.render(null);
    }
  }

  // Internal select — does NOT push to history (called from hashchange)
  _selectDocumentInternal(docId) {
    const doc = this.state.documents[this.state.activeTab]?.find(d => d.id === docId);
    if (doc) {
      this.state.activeDocumentId = docId;
      this.docListRenderer.setActiveDocument(docId);
      this.contentRenderer.render(doc);
    }
  }

  // Public switch — pushes to history (called from tab button clicks)
  switchTab(tabName, updateUrl = false) {
    this._switchTabInternal(tabName);
    if (updateUrl) {
      const docs = this.tabController.getActiveDocuments();
      this._updateHash(tabName, docs[0]?.id || '');
    }
  }

  // Public select — pushes to history (called from sidebar clicks)
  selectDocument(docId, updateUrl = false) {
    this._selectDocumentInternal(docId);
    if (updateUrl) {
      this._updateHash(this.state.activeTab, docId);
    }
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
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
