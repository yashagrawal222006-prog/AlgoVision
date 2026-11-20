/**
 * AlgoVision — Navigation Controller Module
 * Handles SPA section transitions, sidebar collapse/expand, and responsive mobile drawers.
 */

const SIDEBAR_STORAGE_KEY = 'algovision_sidebar_collapsed';

export class NavigationController {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.backdrop = document.getElementById('sidebarBackdrop');
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    this.settingsCompactBtn = document.getElementById('settingsCompactToggle');
    this.breadcrumbCurrent = document.getElementById('currentBreadcrumb');
    
    this.navLinks = document.querySelectorAll('.nav-link[data-target]');
    this.views = document.querySelectorAll('.content-view');
    
    this.sectionTitles = {
      'dashboard': 'Dashboard',
      'sorting': 'Sorting Algorithms',
      'searching': 'Searching Algorithms',
      'graphs': 'Graph Algorithms',
      'data-structures': 'Data Structures',
      'complexity': 'Complexity Analysis',
      'settings': 'Settings & Preferences'
    };

    this.init();
  }

  /**
   * Initialize navigation state, load initial view from URL hash, and bind listeners.
   */
  init() {
    this.initSidebarState();
    this.bindSidebarEvents();
    this.bindViewNavigation();
    this.handleInitialRoute();
  }

  /**
   * Restore collapsed sidebar state from LocalStorage on desktop.
   */
  initSidebarState() {
    const isCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    if (isCollapsed && window.innerWidth > 768) {
      this.sidebar?.classList.add('collapsed');
    }
  }

  /**
   * Toggle sidebar collapsed state on desktop.
   */
  toggleSidebar() {
    if (!this.sidebar) return;
    const isNowCollapsed = this.sidebar.classList.toggle('collapsed');
    localStorage.setItem(SIDEBAR_STORAGE_KEY, isNowCollapsed ? 'true' : 'false');
  }

  /**
   * Open mobile navigation drawer.
   */
  openMobileSidebar() {
    this.sidebar?.classList.add('mobile-open');
    this.backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile navigation drawer.
   */
  closeMobileSidebar() {
    this.sidebar?.classList.remove('mobile-open');
    this.backdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Switch the active content view without page reload.
   */
  navigateTo(targetId) {
    if (!targetId || !this.sectionTitles[targetId]) {
      targetId = 'dashboard';
    }

    // 1. Update Content View Visibility with smooth transitions
    this.views.forEach(view => {
      if (view.id === targetId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // 2. Update Sidebar Active Link
    this.navLinks.forEach(link => {
      const isTarget = link.getAttribute('data-target') === targetId;
      link.classList.toggle('active', isTarget);
      if (isTarget) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // 3. Update Breadcrumb Text
    if (this.breadcrumbCurrent) {
      this.breadcrumbCurrent.textContent = this.sectionTitles[targetId] || 'Dashboard';
    }

    // 4. Update URL Hash without reload
    if (window.location.hash.slice(1) !== targetId) {
      window.history.pushState(null, '', `#${targetId}`);
    }

    // 5. Scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 6. Close mobile drawer if open
    this.closeMobileSidebar();

    // 7. Dispatch viewChanged event for subsystem controllers
    window.dispatchEvent(new CustomEvent('viewChanged', { detail: { targetId } }));
  }

  /**
   * Determine initial section from URL hash or fallback to 'dashboard'.
   */
  handleInitialRoute() {
    const hash = window.location.hash.slice(1);
    if (hash && this.sectionTitles[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }
  }

  /**
   * Bind event listeners for sidebar toggling, collapse, and mobile overlay.
   */
  bindSidebarEvents() {
    // Desktop collapse button
    this.sidebarCollapseBtn?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Settings view compact toggle button
    this.settingsCompactBtn?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Mobile hamburger menu button
    this.mobileMenuBtn?.addEventListener('click', () => {
      this.openMobileSidebar();
    });

    // Mobile backdrop click to close
    this.backdrop?.addEventListener('click', () => {
      this.closeMobileSidebar();
    });

    // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  /**
   * Bind navigation clicks for sidebar links, category cards, and in-page buttons.
   */
  bindViewNavigation() {
    // 1. Sidebar Links
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.navigateTo(target);
      });
    });

    // 2. Any in-page trigger buttons (e.g. Hero buttons, Recent table buttons, Empty state return buttons)
    document.querySelectorAll('[data-navigate]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const target = button.getAttribute('data-navigate');
        this.navigateTo(target);
      });
    });

    // 3. Category cards on dashboard (clicking the whole card navigates to the section)
    document.querySelectorAll('.category-card[data-navigate]').forEach(card => {
      card.addEventListener('click', (e) => {
        const target = card.getAttribute('data-navigate');
        this.navigateTo(target);
      });
    });

    // 4. Handle browser back / forward navigation
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1);
      this.navigateTo(hash || 'dashboard');
    });
  }
}
