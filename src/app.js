// ─── Utility: generate slug matching marked.js TOC link format ───────────────
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
    this._stampHeadingIds();
    this.applySyntaxHighlighting();
    this.container.scrollTop = 0;
  }

  /**
   * marked.js (v11) does NOT add id attributes to headings by default.
   * We stamp each heading with a slug that matches the TOC href format.
   * e.g. "Section 1: Advanced JavaScript" → id="section-1-advanced-javascript"
   */
  _stampHeadingIds() {
    this.container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      h.id = slugify(h.textContent);
    });
  }

  applySyntaxHighlighting() {
    if (typeof Prism !== 'undefined') Prism.highlightAllUnder(this.container);
  }

  /**
   * Intercept #anchor clicks.
   * scrollIntoView() scrolls the viewport — we need to scroll the content div.
   */
  _bindAnchorLinks() {
    this.container.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      e.preventDefault();

      const raw = decodeURIComponent(anchor.getAttribute('href').slice(1));
      const slug = slugify(raw);

      // Try slug first (matches our stamped IDs), then raw
      const target =
        this.container.querySelector('#' + CSS.escape(slug)) ||
        this.container.querySelector('#' + CSS.escape(raw));

      if (target) {
        // Scroll within the content div, not the whole page
        const containerTop = this.container.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        const offset = targetTop - containerTop;
        this.container.scrollBy({ top: offset - 16, behavior: 'smooth' });
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

    this.tabController = new TabNavigationController(this.state.documents);
    this.docListRenderer = new DocumentListRenderer(
      document.getElementById('document-list-container'),
      (docId) => this._onSidebarDocClick(docId)
    );
    this.contentRenderer = new ContentRenderer(
      document.getElementById('content-container')
    );

    this.init();
  }

  init() {
    // Tab button clicks → update URL
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this._applyTab(tab);
        const docs = this.tabController.getActiveDocuments();
        const firstId = docs[0] ? docs[0].id : '';
        if (firstId) this._applyDoc(firstId);  // auto-select first doc
        this._setHash(tab, firstId);
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
    document.getElementById('content-container').addEventListener('click', () => {
      if (this.sidebarOpen) this.closeSidebar();
    });

    // Hash-based routing: back/forward + direct links
    window.addEventListener('hashchange', () => this._loadFromHash(false));

    // Initial load
    this._loadFromHash(true);
  }

  // ── Called when user clicks a doc in the sidebar ──────────────────────────
  _onSidebarDocClick(docId) {
    this._applyDoc(docId);
    this._setHash(this.state.activeTab, docId);
  }

  // ── Update the URL hash without triggering hashchange ─────────────────────
  _setHash(tab, docId) {
    const newHash = '#' + tab + (docId ? '/' + docId : '');
    if (window.location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
  }

  // ── Parse hash and load the right tab + doc ───────────────────────────────
  _loadFromHash(isInitial) {
    const hash = window.location.hash.slice(1);
    const validTabs = ['sailpoint', 'architect', 'other'];

    if (!hash) {
      this._applyTab('sailpoint');
      const docs = this.tabController.getActiveDocuments();
      if (docs.length) this._applyDoc(docs[0].id);
      if (isInitial) this._setHash('sailpoint', docs[0] ? docs[0].id : '');
      return;
    }

    const slashIdx = hash.indexOf('/');
    const tab = slashIdx === -1 ? hash : hash.slice(0, slashIdx);
    const docId = slashIdx === -1 ? '' : hash.slice(slashIdx + 1);

    if (!validTabs.includes(tab)) {
      this._applyTab('sailpoint');
      return;
    }

    this._applyTab(tab);

    if (docId) {
      this._applyDoc(docId);
    } else {
      const docs = this.tabController.getActiveDocuments();
      if (docs.length) this._applyDoc(docs[0].id);
    }
  }

  // ── Apply a tab (UI only, no URL change) ──────────────────────────────────
  _applyTab(tabName) {
    this.state.activeTab = tabName;
    this.tabController.switchTab(tabName);
    const docs = this.tabController.getActiveDocuments();
    this.docListRenderer.render(docs);
  }

  // ── Apply a document (UI only, no URL change) ─────────────────────────────
  _applyDoc(docId) {
    const doc = this.state.documents[this.state.activeTab]?.find(d => d.id === docId);
    if (doc) {
      this.state.activeDocumentId = docId;
      this.docListRenderer.setActiveDocument(docId);
      this.contentRenderer.render(doc);
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
