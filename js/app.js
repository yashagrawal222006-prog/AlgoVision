/**
 * AlgoVision — Main Application Entry Point
 * Bootstraps the platform, initializes ES6 modules, and sets up global interactions.
 */

import { ThemeManager } from './theme.js';
import { NavigationController } from './navigation.js';
import { SortingVisualizer } from './sorting/sortingVisualizer.js';
import { SearchingVisualizer } from './searching/searchingVisualizer.js';
import { GraphVisualizer } from './graphs/graphVisualizer.js';
import { DataStructuresPlayground } from './datastructures/dataStructuresPlayground.js';
import { ComplexityAnalysis } from './complexity/complexityAnalysis.js';

class AlgoVisionApp {
  constructor() {
    this.themeManager = null;
    this.navigation = null;
    this.sortingVisualizer = null;
    this.searchingVisualizer = null;
    this.graphVisualizer = null;
    this.dataStructures = null;
    this.complexity = null;
  }

  /**
   * Initialize platform subsystems once DOM content is ready.
   */
  init() {
    // 1. Initialize Theme Engine (Dark/Light Mode & LocalStorage)
    this.themeManager = new ThemeManager();

    // 2. Initialize Navigation Controller (Sidebar, Routing & Mobile)
    this.navigation = new NavigationController();

    // 3. Initialize Sorting Algorithms Workspace
    this.sortingVisualizer = new SortingVisualizer();

    // 4. Initialize Searching Algorithms Workspace
    this.searchingVisualizer = new SearchingVisualizer();

    // 5. Initialize Graph Algorithms Workspace
    this.graphVisualizer = new GraphVisualizer();

    // 6. Initialize Data Structures Playground (Stack & Queue)
    this.dataStructures = new DataStructuresPlayground();

    // 6b. Initialize Complexity Analysis (Big-O guide, chart, reference table)
    this.complexity = new ComplexityAnalysis({
      navigate: (viewId) => this.navigation.navigateTo(viewId)
    });

    // 7. Set up Quick Search and Keyboard Shortcuts
    this.setupGlobalSearch();

    // 8. Animate Metric Counters & Progress Bars
    this.setupVisualEnhancements();

    // Pause visualizers automatically if user navigates away
    window.addEventListener('viewChanged', (e) => {
      const view = e.detail?.targetId;
      if (view !== 'sorting') {
        this.sortingVisualizer?.pause();
      }
      if (view !== 'searching') {
        this.searchingVisualizer?.pause();
      }
      if (view !== 'graphs') {
        this.graphVisualizer?.pause();
      }
      if (view !== 'data-structures') {
        this.dataStructures?.pause();
      }
    });

    console.log(
      '%cAlgoVision%c v1.0 Foundation Ready • Modern DSA Learning Platform',
      'background: #8b5cf6; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
      'color: #06b6d4; font-weight: bold; margin-left: 6px;'
    );
  }

  /**
   * Setup Quick Search input and Ctrl+K keyboard shortcut.
   */
  setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    // Keyboard shortcut (Ctrl+K or Cmd+K) to focus search
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    // Real-time table filter for the dashboard Recent Algorithms table
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('.recent-table tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });

    // Escape key blurs search input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.blur();
      }
    });
  }

  /**
   * Initialize smooth visual enhancements and progress bar animations.
   */
  setupVisualEnhancements() {
    // Smooth progress bar fill entrance
    const progressFill = document.querySelector('.progress-bar-fill');
    if (progressFill) {
      const targetWidth = progressFill.style.width;
      progressFill.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => {
          progressFill.style.width = targetWidth;
        }, 150);
      });
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AlgoVisionApp();
  app.init();
});
