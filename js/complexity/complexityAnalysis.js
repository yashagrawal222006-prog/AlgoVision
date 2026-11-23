/**
 * AlgoVision — Complexity Analysis Module
 * Renders the Big-O guide, growth chart, and per-algorithm complexity table.
 *
 * Complexity values are read from the same data objects the visualizers use,
 * so this page can never drift out of sync with the algorithm pages.
 * This module is read-only: it does not touch any algorithm logic.
 */

import { ALGORITHM_INFO } from '../sorting/algorithms.js';
import { SEARCH_ALGORITHM_INFO } from '../searching/algorithms.js';
import { GRAPH_ALGORITHM_INFO } from '../graphs/algorithms.js';
import { STRUCTURE_INFO } from '../datastructures/operations.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* The five growth classes shown in the chart and the beginner guide. */
const GROWTH_CLASSES = [
  {
    id: 'c1', label: 'O(1)', name: 'Constant',
    fn: () => 1,
    text: 'Same effort no matter how big the input is.',
    example: 'Reading arr[3], stack push'
  },
  {
    id: 'c2', label: 'O(log N)', name: 'Logarithmic',
    fn: (n) => Math.log2(n),
    text: 'Cuts the problem in half each step. Grows very slowly.',
    example: 'Binary search'
  },
  {
    id: 'c3', label: 'O(N)', name: 'Linear',
    fn: (n) => n,
    text: 'Work grows in step with the input. Double the data, double the work.',
    example: 'Linear search'
  },
  {
    id: 'c4', label: 'O(N log N)', name: 'Linearithmic',
    fn: (n) => n * Math.log2(n),
    text: 'A bit worse than linear. The best you can do for comparison sorting.',
    example: 'Merge sort, quick sort (average)'
  },
  {
    id: 'c5', label: 'O(N²)', name: 'Quadratic',
    fn: (n) => n * n,
    text: 'Nested loops. Double the data, four times the work.',
    example: 'Bubble sort, selection sort'
  }
];

/* Category metadata: dot color, label, and the view to open. */
const GROUPS = {
  sorting: { label: 'Sorting', dot: 'purple', view: 'sorting' },
  searching: { label: 'Searching', dot: 'cyan', view: 'searching' },
  graphs: { label: 'Graphs', dot: 'blue', view: 'graphs' },
  'data-structures': { label: 'Data Structures', dot: 'emerald', view: 'data-structures' }
};

/* Chart geometry (matches the SVG viewBox 720 x 340). */
const CHART = { w: 720, h: 340, l: 52, r: 16, t: 16, b: 40, xMin: 1, xMax: 20, yMax: 100 };

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export class ComplexityAnalysis {
  /**
   * @param {{navigate?: (viewId: string) => void}} options
   */
  constructor({ navigate } = {}) {
    this.navigate = navigate || (() => {});
    this.filter = 'all';
    this.hidden = new Set();
    this.n = 10;

    this.root = document.getElementById('complexity');
    if (!this.root) return;

    this.classList = document.getElementById('cxClassList');
    this.legend = document.getElementById('cxLegend');
    this.chart = document.getElementById('cxChart');
    this.slider = document.getElementById('cxSizeSlider');
    this.sliderLabel = document.getElementById('cxSizeLabel');
    this.readout = document.getElementById('cxReadout');
    this.tabs = document.getElementById('cxTabs');
    this.tableBody = document.getElementById('cxTableBody');
    this.countPill = document.getElementById('cxCountPill');

    this.rows = this.buildRows();

    this.renderClassList();
    this.renderLegend();
    this.drawChart();
    this.renderReadout();
    this.renderTable();
    this.bindEvents();
  }

  /* ------------------------------------------------------------ Data */

  /** Flatten every existing algorithm / data structure into table rows. */
  buildRows() {
    const rows = [];

    for (const info of Object.values(ALGORITHM_INFO)) {
      rows.push({
        group: 'sorting', name: info.name, category: info.category,
        best: info.complexities.best, avg: info.complexities.average,
        worst: info.complexities.worst, space: info.complexities.space
      });
    }

    for (const info of Object.values(SEARCH_ALGORITHM_INFO)) {
      rows.push({
        group: 'searching', name: info.name, category: info.category,
        best: info.complexities.best, avg: info.complexities.average,
        worst: info.complexities.worst, space: info.complexities.space
      });
    }

    for (const info of Object.values(GRAPH_ALGORITHM_INFO)) {
      rows.push({
        group: 'graphs', name: info.name, category: info.category || 'Graph Algorithm',
        allCases: [{ label: '', value: info.complexities.time }],
        space: info.complexities.space
      });
    }

    for (const info of Object.values(STRUCTURE_INFO)) {
      const ops = info.complexities.filter((c) => c.label !== 'Space');
      const space = info.complexities.find((c) => c.label === 'Space');
      rows.push({
        group: 'data-structures', name: info.name, category: info.category,
        allCases: ops.map((c) => ({ label: c.label, value: c.value })),
        space: space ? space.value : '—'
      });
    }

    return rows;
  }

  /* ------------------------------------------------------------ Big-O guide */

  renderClassList() {
    this.classList.innerHTML = GROWTH_CLASSES.map((c) => `
      <div class="cx-class-item">
        <span class="cx-swatch cx-${c.id}"></span>
        <div>
          <div class="cx-class-head"><code class="code-badge">${escapeHtml(c.label)}</code><span>${c.name}</span></div>
          <div class="cx-class-text">${c.text}</div>
          <div class="cx-class-example">e.g. ${c.example}</div>
        </div>
      </div>`).join('');
  }

  /* ------------------------------------------------------------ Chart */

  px(n) {
    return CHART.l + ((n - CHART.xMin) / (CHART.xMax - CHART.xMin)) * (CHART.w - CHART.l - CHART.r);
  }

  py(v) {
    return CHART.h - CHART.b - (v / CHART.yMax) * (CHART.h - CHART.t - CHART.b);
  }

  renderLegend() {
    this.legend.innerHTML = '';
    GROWTH_CLASSES.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cx-legend-btn';
      btn.dataset.cxCurve = c.id;
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = `<span class="cx-swatch cx-${c.id}"></span><span>${escapeHtml(c.label)}</span>`;
      this.legend.appendChild(btn);
    });
  }

  drawChart() {
    const svg = this.chart;
    svg.innerHTML = '';

    const plotLeft = CHART.l;
    const plotRight = CHART.w - CHART.r;
    const plotTop = CHART.t;
    const plotBottom = CHART.h - CHART.b;

    const defs = el('defs');
    const clip = el('clipPath', { id: 'cxClip' });
    clip.appendChild(el('rect', { x: plotLeft, y: plotTop, width: plotRight - plotLeft, height: plotBottom - plotTop }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    // Grid + y-axis labels
    for (let v = 0; v <= CHART.yMax; v += 20) {
      const y = this.py(v);
      svg.appendChild(el('line', { x1: plotLeft, x2: plotRight, y1: y, y2: y, class: 'cx-grid' }));
      svg.appendChild(el('text', { x: plotLeft - 8, y: y + 4, class: 'cx-axis-text', 'text-anchor': 'end' }, String(v)));
    }

    // x-axis labels
    [1, 5, 10, 15, 20].forEach((n) => {
      const x = this.px(n);
      svg.appendChild(el('line', { x1: x, x2: x, y1: plotBottom, y2: plotBottom + 5, class: 'cx-axis-line' }));
      svg.appendChild(el('text', { x, y: plotBottom + 20, class: 'cx-axis-text', 'text-anchor': 'middle' }, String(n)));
    });

    svg.appendChild(el('line', { x1: plotLeft, x2: plotRight, y1: plotBottom, y2: plotBottom, class: 'cx-axis-line' }));
    svg.appendChild(el('line', { x1: plotLeft, x2: plotLeft, y1: plotTop, y2: plotBottom, class: 'cx-axis-line' }));

    svg.appendChild(el('text', {
      x: (plotLeft + plotRight) / 2, y: CHART.h - 6, class: 'cx-axis-title', 'text-anchor': 'middle'
    }, 'Input size (N)'));
    svg.appendChild(el('text', {
      x: 14, y: (plotTop + plotBottom) / 2, class: 'cx-axis-title', 'text-anchor': 'middle',
      transform: `rotate(-90 14 ${(plotTop + plotBottom) / 2})`
    }, 'Steps'));

    // Curves (clipped to the plot area so O(N²) shoots off the top)
    const curves = el('g', { 'clip-path': 'url(#cxClip)' });
    GROWTH_CLASSES.forEach((c) => {
      let d = '';
      for (let n = CHART.xMin; n <= CHART.xMax + 1e-9; n += 0.25) {
        d += `${d ? 'L' : 'M'}${this.px(n).toFixed(1)} ${this.py(c.fn(n)).toFixed(1)} `;
      }
      curves.appendChild(el('path', { d: d.trim(), class: `cx-curve cx-${c.id}`, 'data-cx-curve': c.id }));
    });
    svg.appendChild(curves);

    // Marker for the selected N
    this.marker = el('g', { class: 'cx-marker' });
    this.markerLine = el('line', { y1: plotTop, y2: plotBottom, class: 'cx-marker-line' });
    this.marker.appendChild(this.markerLine);
    this.dots = {};
    GROWTH_CLASSES.forEach((c) => {
      const dot = el('circle', { r: 4.5, class: `cx-dot cx-${c.id}`, 'data-cx-curve': c.id });
      this.dots[c.id] = dot;
      this.marker.appendChild(dot);
    });
    svg.appendChild(this.marker);

    this.updateMarker();
    this.applyVisibility();
  }

  updateMarker() {
    const x = this.px(this.n);
    this.markerLine.setAttribute('x1', x);
    this.markerLine.setAttribute('x2', x);
    GROWTH_CLASSES.forEach((c) => {
      const v = c.fn(this.n);
      const dot = this.dots[c.id];
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', this.py(Math.min(v, CHART.yMax)));
      // Hide the dot if the value is off the chart or the curve is toggled off
      dot.style.display = (v > CHART.yMax || this.hidden.has(c.id)) ? 'none' : '';
    });
  }

  applyVisibility() {
    this.chart.querySelectorAll('.cx-curve').forEach((p) => {
      p.style.display = this.hidden.has(p.dataset.cxCurve) ? 'none' : '';
    });
    this.legend.querySelectorAll('.cx-legend-btn').forEach((btn) => {
      const off = this.hidden.has(btn.dataset.cxCurve);
      btn.classList.toggle('off', off);
      btn.setAttribute('aria-pressed', off ? 'false' : 'true');
    });
    this.updateMarker();
  }

  renderReadout() {
    this.sliderLabel.textContent = String(this.n);
    this.readout.innerHTML = GROWTH_CLASSES.map((c) => {
      const v = Math.round(c.fn(this.n));
      return `
        <div class="cx-readout-item ${this.hidden.has(c.id) ? 'off' : ''}">
          <span class="cx-swatch cx-${c.id}"></span>
          <code>${escapeHtml(c.label)}</code>
          <strong>${v.toLocaleString()}</strong>
          <span class="cx-readout-unit">steps</span>
        </div>`;
    }).join('');
  }

  /* ------------------------------------------------------------ Table */

  renderTable() {
    const visible = this.rows.filter((r) => this.filter === 'all' || r.group === this.filter);

    this.tableBody.innerHTML = visible.map((r) => {
      const g = GROUPS[r.group];
      let caseCells;
      if (r.allCases) {
        const chips = r.allCases.map((c) => `
          <span class="cx-op">${c.label ? `<span class="cx-op-label">${escapeHtml(c.label)}</span>` : ''}
          <code class="complexity-val avg">${escapeHtml(c.value)}</code></span>`).join('');
        caseCells = `<td colspan="3"><div class="cx-allcases"><span class="cx-allcases-tag">All cases</span>${chips}</div></td>`;
      } else {
        caseCells = `
          <td><code class="complexity-val best">${escapeHtml(r.best)}</code></td>
          <td><code class="complexity-val avg">${escapeHtml(r.avg)}</code></td>
          <td><code class="complexity-val worst">${escapeHtml(r.worst)}</code></td>`;
      }
      return `
        <tr>
          <td>
            <div class="algo-identity">
              <div class="algo-type-dot ${g.dot}"></div>
              <div>
                <div class="algo-name">${escapeHtml(r.name)}</div>
                <div class="algo-sub">${escapeHtml(r.category)}</div>
              </div>
            </div>
          </td>
          <td><span class="category-pill">${g.label}</span></td>
          ${caseCells}
          <td><code class="complexity-val space">${escapeHtml(r.space)}</code></td>
          <td><button type="button" class="table-action-btn" data-cx-open="${g.view}">Open</button></td>
        </tr>`;
    }).join('');

    this.countPill.textContent = `${visible.length} ${visible.length === 1 ? 'algorithm' : 'algorithms'}`;
  }

  /* ------------------------------------------------------------ Events */

  bindEvents() {
    this.slider.addEventListener('input', () => {
      this.n = Number(this.slider.value);
      this.updateMarker();
      this.renderReadout();
    });

    this.legend.addEventListener('click', (e) => {
      const btn = e.target.closest('.cx-legend-btn');
      if (!btn) return;
      const id = btn.dataset.cxCurve;
      if (this.hidden.has(id)) this.hidden.delete(id);
      else this.hidden.add(id);
      this.applyVisibility();
      this.renderReadout();
    });

    this.tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cx-filter]');
      if (!btn) return;
      this.filter = btn.dataset.cxFilter;
      this.tabs.querySelectorAll('[data-cx-filter]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      this.renderTable();
    });

    this.tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cx-open]');
      if (btn) this.navigate(btn.dataset.cxOpen);
    });
  }
}
