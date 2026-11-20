/**
 * AlgoVision — Theme Manager Module
 * Manages Dark/Light mode, LocalStorage persistence, and UI synchronization.
 */

const THEME_STORAGE_KEY = 'algovision_theme';

export class ThemeManager {
  constructor() {
    this.currentTheme = this.getInitialTheme();
    this.init();
  }

  /**
   * Determine the initial theme from LocalStorage or system preference.
   */
  getInitialTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Default to dark theme as per design specification
    return 'dark';
  }

  /**
   * Initialize theme attributes and event listeners.
   */
  init() {
    this.applyTheme(this.currentTheme);
    this.bindEvents();
  }

  /**
   * Apply theme to DOM and update switches/aria labels.
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Update sidebar switch state
    const sidebarSwitch = document.getElementById('themeToggleBtn');
    if (sidebarSwitch) {
      const isDark = theme === 'dark';
      sidebarSwitch.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }

    // Update theme indicator text in sidebar footer
    const themeText = document.querySelector('.theme-text');
    if (themeText) {
      themeText.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }

    // Dispatch custom event for any listening components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  /**
   * Toggle between dark and light themes.
   */
  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  /**
   * Bind click handlers to all theme toggle buttons across the UI.
   */
  bindEvents() {
    // 1. Sidebar switch
    const sidebarSwitch = document.getElementById('themeToggleBtn');
    if (sidebarSwitch) {
      sidebarSwitch.addEventListener('click', () => this.toggleTheme());
    }

    // 2. Desktop top header button
    const headerBtn = document.getElementById('headerThemeBtn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => this.toggleTheme());
    }

    // 3. Mobile header button
    const mobileBtn = document.getElementById('mobileThemeToggle');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => this.toggleTheme());
    }

    // 4. Settings view button
    const settingsBtn = document.getElementById('settingsThemeToggle');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Listen for OS theme preference changes if user hasn't explicitly set one
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
