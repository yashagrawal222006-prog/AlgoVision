/**
 * AlgoVision — Data Structures Playground (Stack & Queue)
 *
 * UI controller. It owns no data of its own: every operation is executed on a real
 * Stack/Queue (structures.js) via runOperation() (operations.js), which returns a
 * list of steps. All steps of all operations go onto ONE timeline per structure,
 * and a single cursor points at the step being displayed:
 *
 *   - Auto-play moves the cursor forward on a timer,
 *   - Next / Prev move it by hand,
 *   - clicking an item in the history moves it to the end of that operation.
 *
 * Because every mode only moves the same cursor over the same timeline, automatic
 * and manual playback can never disagree. Starting a new operation first jumps the
 * cursor to the end of the timeline, so the display always matches the real data.
 */

import {
  createStructure, runOperation, parseElement, parseCapacity, makeIdleStep,
  STRUCTURE_INFO, lineIndexForKey
} from './operations.js';

const READY_TEXT = {
  stack: 'Ready. Push a value, or use Pop and Peek to see how an empty stack reports underflow.',
  queue: 'Ready. Enqueue a value, or use Dequeue and Front to see how an empty queue reports underflow.'
};

/** One independent playground per structure, so switching tabs never loses work. */
class Session {
  constructor(kind, capacity = 0, note = '') {
    this.kind = kind;
    this.capacity = capacity;
    this.struct = createStructure(kind, capacity);
    this.steps = [makeIdleStep(this.struct, note || READY_TEXT[kind])];
    this.cursor = 0;
    this.history = []; // { n, label, start, end, status, resultText }
  }
}

export class DataStructuresPlayground {
  constructor() {
    this.root = document.getElementById('data-structures');
    if (!this.root) return;

    this.kind = 'stack';
    this.sessions = { stack: new Session('stack'), queue: new Session('queue') };
    this.playing = false;
    this.timer = null;
    this.delay = 800;

    this.cacheDom();
    this.bindEvents();
    this.updateSpeed();
    this.selectStructure('stack');
  }

  get session() { return this.sessions[this.kind]; }
  get step() { return this.session.steps[this.session.cursor]; }

  /* ------------------------------------------------------------ setup */

  cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.tabs = this.root.querySelectorAll('.ds-tab-btn');
    this.select = $('dsStructureSelect');
    this.infoTitle = $('dsInfoTitle');
    this.infoCategory = $('dsInfoCategory');
    this.infoDesc = $('dsInfoDesc');
    this.stageTitle = $('dsStageTitle');
    this.stepPill = $('dsStepPill');
    this.statusBadge = $('dsStatusBadge');
    this.opLabel = $('dsOpLabel');
    this.opStep = $('dsOpStep');
    this.explainBanner = $('dsExplainBanner');
    this.explain = $('dsExplain');
    this.canvas = $('dsCanvas');
    this.elementsLabel = $('dsElementsLabel');
    this.elements = $('dsElements');
    this.sizePill = $('dsSizePill');
    this.valueInput = $('dsValueInput');
    this.opButtons = $('dsOpButtons');
    this.capacityInput = $('dsCapacityInput');
    this.applyCapacityBtn = $('dsApplyCapacityBtn');
    this.errorBox = $('dsInputError');
    this.prevBtn = $('dsPrevBtn');
    this.playBtn = $('dsPlayBtn');
    this.pauseBtn = $('dsPauseBtn');
    this.nextBtn = $('dsNextBtn');
    this.resetBtn = $('dsResetBtn');
    this.autoPlay = $('dsAutoPlay');
    this.speedSlider = $('dsSpeedSlider');
    this.speedLabel = $('dsSpeedLabel');
    this.varsBox = $('dsVars');
    this.historyList = $('dsHistory');
    this.historyCount = $('dsHistoryCount');
    this.codeBox = $('dsCppCode');
    this.codeScroll = $('dsCodeScroll');
  }

  bindEvents() {
    this.tabs.forEach(tab => tab.addEventListener('click', () => {
      const kind = tab.getAttribute('data-ds');
      if (kind !== this.kind) this.selectStructure(kind);
    }));
    this.select?.addEventListener('change', (e) => this.selectStructure(e.target.value));

    // Operation buttons are rebuilt per structure, so delegate.
    this.opButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-op]');
      if (btn) this.handleOperation(btn.getAttribute('data-op'));
    });

    this.valueInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleOperation(STRUCTURE_INFO[this.kind].ops[0].op);
      }
    });
    this.valueInput.addEventListener('input', () => this.clearError());

    this.capacityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.applyCapacity(); }
    });
    this.capacityInput.addEventListener('input', () => this.clearError());
    this.applyCapacityBtn.addEventListener('click', () => this.applyCapacity());

    this.prevBtn.addEventListener('click', () => this.prevStep());
    this.nextBtn.addEventListener('click', () => this.nextStep());
    this.playBtn.addEventListener('click', () => this.play());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.resetCurrent());
    this.speedSlider.addEventListener('input', () => this.updateSpeed());

    this.historyList.addEventListener('click', (e) => {
      const item = e.target.closest('button[data-hist]');
      if (item) this.jumpToHistory(Number(item.getAttribute('data-hist')));
    });
  }

  updateSpeed() {
    const v = Number(this.speedSlider.value);
    this.delay = Math.round(1300 - v * 11.5);        // 1 -> ~1290ms, 100 -> 150ms
    this.speedLabel.textContent = `${(800 / this.delay).toFixed(1)}x`;
  }

  /* ------------------------------------------------------------ structure switching */

  selectStructure(kind) {
    if (!STRUCTURE_INFO[kind]) return;
    this.pause(false);
    this.kind = kind;
    const info = STRUCTURE_INFO[kind];

    this.tabs.forEach(tab => {
      const on = tab.getAttribute('data-ds') === kind;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (this.select) this.select.value = kind;

    this.infoTitle.textContent = info.name;
    this.infoCategory.textContent = info.category;
    this.infoDesc.textContent = info.description;
    info.complexities.forEach((c, i) => {
      document.getElementById(`dsComp${i}Label`).textContent = c.label;
      document.getElementById(`dsComp${i}Val`).textContent = c.value;
    });
    this.stageTitle.textContent = `${info.name} Visualizer`;
    this.elementsLabel.textContent = kind === 'stack' ? 'Stack (bottom → top)' : 'Queue (front → rear)';
    this.valueInput.placeholder = info.inputPlaceholder;
    this.valueInput.value = '';
    this.capacityInput.value = this.session.capacity > 0 ? String(this.session.capacity) : '';
    this.clearError();

    this.buildOpButtons(info);
    this.buildCode(info);
    this.render({ animate: false });
  }

  buildOpButtons(info) {
    const icon = {
      push: '<polyline points="18 15 12 9 6 15"></polyline>',
      enqueue: '<polyline points="9 18 15 12 9 6"></polyline>',
      pop: '<polyline points="6 9 12 15 18 9"></polyline>',
      dequeue: '<polyline points="15 18 9 12 15 6"></polyline>',
      peek: '<circle cx="12" cy="12" r="3"></circle><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>',
      front: '<circle cx="12" cy="12" r="3"></circle><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>',
      clear: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>'
    };
    const btn = (op, label, cls, title) => `
      <button class="btn ${cls}" data-op="${op}" title="${title}">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon[op]}</svg>
        <span>${label}</span>
      </button>`;
    const titles = {
      push: 'Add the value on top of the stack', pop: 'Remove the top element',
      peek: 'Read the top element without removing it',
      enqueue: 'Add the value at the rear of the queue', dequeue: 'Remove the front element',
      front: 'Read the front element without removing it'
    };
    this.opButtons.innerHTML =
      info.ops.map((o, i) => btn(o.op, o.label, i === 0 ? 'btn-primary' : 'btn-secondary', titles[o.op])).join('') +
      btn('clear', 'Clear', 'btn-ghost', 'Remove every element');
  }

  buildCode(info) {
    this.codeBox.innerHTML = '';
    info.code.forEach(([text], i) => {
      const row = document.createElement('div');
      row.className = 'cpp-line-row';
      row.setAttribute('data-line', i + 1);
      const num = document.createElement('span');
      num.className = 'cpp-line-num';
      num.textContent = i + 1;
      const code = document.createElement('span');
      code.className = 'cpp-line-code';
      code.textContent = text;
      row.append(num, code);
      this.codeBox.appendChild(row);
    });
  }

  /* ------------------------------------------------------------ operations */

  handleOperation(opName) {
    this.clearError();
    const info = STRUCTURE_INFO[this.kind];
    const def = info.ops.find(o => o.op === opName);
    const isClear = opName === 'clear';
    if (!def && !isClear) return;

    let value;
    if (def?.needsValue) {
      const parsed = parseElement(this.valueInput.value);
      if (!parsed.ok) {
        this.showError(parsed.error);
        this.valueInput.focus();
        this.valueInput.select();
        return;
      }
      value = parsed.value;
    }

    // Finish whatever is on screen first, so the display equals the real structure
    // before the next operation changes it.
    this.pause(false);
    const s = this.session;
    s.cursor = s.steps.length - 1;

    let result;
    try {
      result = runOperation(s.struct, opName, value);
    } catch (err) {
      this.showError(err.message);
      this.render({ animate: false });
      return;
    }

    const start = s.steps.length;
    s.steps.push(...result.steps);
    s.history.push({
      n: s.history.length + 1,
      label: result.label,
      start,
      end: s.steps.length - 1,
      status: result.status,
      resultText: result.status === 'error'
        ? result.error
        : (result.result !== null && result.result !== undefined ? `→ ${result.result}` : 'done')
    });

    s.cursor = start;
    if (def?.needsValue && result.status === 'success') this.valueInput.select();
    this.render({ animate: true });
    if (this.autoPlay.checked && s.cursor < s.steps.length - 1) this.play();
  }

  applyCapacity() {
    this.clearError();
    const parsed = parseCapacity(this.capacityInput.value);
    if (!parsed.ok) {
      this.showError(parsed.error);
      this.capacityInput.focus();
      return;
    }
    this.pause(false);
    const cap = parsed.value;
    const name = STRUCTURE_INFO[this.kind].name.toLowerCase();
    const note = cap > 0
      ? `Capacity set to ${cap}. The ${name} was reset, and an operation that would exceed ${cap} elements will report overflow.`
      : `Capacity set to unlimited. The ${name} was reset.`;
    this.sessions[this.kind] = new Session(this.kind, cap, note);
    this.render({ animate: false });
  }

  resetCurrent() {
    this.pause(false);
    this.sessions[this.kind] = new Session(this.kind);
    this.valueInput.value = '';
    this.capacityInput.value = '';
    this.clearError();
    this.render({ animate: false });
  }

  /* ------------------------------------------------------------ playback (one cursor, one timeline) */

  play() {
    const s = this.session;
    if (this.playing || s.cursor >= s.steps.length - 1) return;
    this.playing = true;
    this.scheduleTick();
    this.updateControls();
  }

  scheduleTick() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), this.delay);
  }

  tick() {
    if (!this.playing) return;
    const s = this.session;
    if (s.cursor < s.steps.length - 1) {
      s.cursor++;
      this.render({ animate: true });
    }
    if (s.cursor < s.steps.length - 1) this.scheduleTick();
    else this.pause();
  }

  /** @param {boolean} [refresh=true] re-render controls/status after stopping */
  pause(refresh = true) {
    this.playing = false;
    clearTimeout(this.timer);
    this.timer = null;
    if (refresh && this.root) this.updateControls();
  }

  nextStep() {
    this.pause(false);
    const s = this.session;
    if (s.cursor < s.steps.length - 1) { s.cursor++; this.render({ animate: true }); }
  }

  prevStep() {
    this.pause(false);
    const s = this.session;
    if (s.cursor > 0) { s.cursor--; this.render({ animate: false }); }
  }

  jumpToHistory(i) {
    const entry = this.session.history[i];
    if (!entry) return;
    this.pause(false);
    this.session.cursor = entry.end;
    this.render({ animate: false });
  }

  /* ------------------------------------------------------------ errors */

  showError(msg) {
    this.errorBox.textContent = msg;
    this.errorBox.style.display = 'block';
  }
  clearError() {
    this.errorBox.textContent = '';
    this.errorBox.style.display = 'none';
  }

  /* ------------------------------------------------------------ rendering */

  render({ animate }) {
    const s = this.session;
    const step = this.step;
    const prevStep = s.cursor > 0 ? s.steps[s.cursor - 1] : null;

    this.renderHeader(step);
    this.renderStage(step, animate, prevStep);
    this.renderElements(step);
    this.renderVars(step, prevStep);
    this.renderCode(step);
    this.renderHistory();
    this.updateControls();
  }

  renderHeader(step) {
    this.explain.textContent = step.desc;
    this.explainBanner.classList.toggle('ds-banner-error', step.status === 'error');
    this.explainBanner.classList.toggle('ds-banner-success', step.status === 'success');

    if (step.idle) {
      this.opLabel.textContent = 'No operation running';
      this.opStep.textContent = 'Choose an operation below';
      this.stepPill.textContent = 'Idle';
    } else {
      this.opLabel.textContent = step.opLabel;
      this.opStep.textContent = step.title;
      this.stepPill.textContent = `Step ${step.index + 1} of ${step.total}`;
    }
  }

  renderStage(step, animate, prevStep) {
    this.canvas.innerHTML = step.state.kind === 'stack'
      ? this.stackHtml(step, animate)
      : this.queueHtml(step, animate, prevStep);
  }

  stackHtml(step, animate) {
    const st = step.state;
    const cap = st.capacity;
    const n = st.slots.length;
    const ghost = animate && step.ghost ? step.ghost : null;
    const focusAll = !!(step.focus && step.focus.all);
    const rows = [];

    // Free slots drawn above the stack when a capacity is set. A ghost (element being
    // popped) takes one of them while it fades out, so the stack never jumps.
    const free = cap > 0 ? Math.max(0, cap - n - (ghost ? 1 : 0)) : 0;
    for (let i = 0; i < free; i++) {
      const idx = cap - 1 - i;
      rows.push(`<div class="ds-srow"><span class="ds-sidx">${idx}</span><div class="ds-cell is-free"></div><span class="ds-sptr"></span></div>`);
    }
    if (ghost) {
      rows.push(`<div class="ds-srow ds-exit-row"><span class="ds-sidx">${ghost.index}</span><div class="ds-cell is-removing">${ghost.value}</div><span class="ds-sptr"></span></div>`);
    }
    for (let i = n - 1; i >= 0; i--) {
      const v = st.slots[i];
      const cls = ['ds-cell'];
      if (v === null) cls.push('is-allocated');
      if (focusAll || (step.focus && step.focus.index === i)) cls.push('is-focus');
      if (step.enter === i) cls.push('is-new');
      if (animate && step.enter === i) cls.push('ds-enter');
      const ptr = i === st.top ? '<span class="ds-sptr"><span class="ds-tag ds-tag-top">TOP</span></span>' : '<span class="ds-sptr"></span>';
      rows.push(`<div class="ds-srow"><span class="ds-sidx">${i}</span><div class="${cls.join(' ')}">${v === null ? '?' : v}</div>${ptr}</div>`);
    }

    const emptyNote = n === 0 && cap === 0 && !ghost
      ? '<div class="ds-empty-note">Empty stack</div>' : '';
    const topEmpty = st.top === -1
      ? '<div class="ds-srow ds-srow-base"><span class="ds-sidx"></span><div class="ds-top-empty">top = -1</div><span class="ds-sptr"><span class="ds-tag ds-tag-top">TOP</span></span></div>'
      : '';

    return `<div class="ds-stack-wrap">
      <div class="ds-stack-body">${emptyNote}${rows.join('')}${topEmpty}</div>
      <div class="ds-stack-floor"></div>
      <div class="ds-stack-cap">${cap > 0 ? `capacity ${cap}` : 'unlimited capacity'}</div>
    </div>`;
  }

  queueHtml(step, animate, prevStep) {
    const st = step.state;
    const cap = st.capacity;
    const items = st.items;
    const n = items.length;
    const ghost = animate && step.ghost ? step.ghost : null;
    const pending = step.pending;
    const focusAll = !!(step.focus && step.focus.all);
    const parts = [];

    const link = (extra = '') => `<span class="ds-qlink ${extra}" aria-hidden="true"><svg viewBox="0 0 28 12"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17 1 23 6 17 11"></polyline></svg></span>`;
    const tag = (cls, text) => `<span class="ds-tag ${cls}">${text}</span>`;

    if (ghost) {
      parts.push(`<div class="ds-qitem ds-exit-item"><div class="ds-qtop"></div><div class="ds-cell is-removing">${ghost.value}</div><div class="ds-qbottom">${step.tempPtr ? tag('ds-tag-temp', 'temp') : ''}</div></div>${link('ds-qlink-ghost')}`);
    }

    items.forEach((v, i) => {
      const cls = ['ds-cell'];
      if (focusAll || (step.focus && step.focus.index === i)) cls.push('is-focus');
      if (step.enter === i) cls.push('is-new');
      if (animate && step.enter === i) cls.push('ds-enter-x');
      const top = i === 0 ? tag('ds-tag-front', 'FRONT') : '';
      const bottom = [
        i === n - 1 ? tag('ds-tag-rear', 'REAR') : '',
        !ghost && step.tempPtr && i === 0 ? tag('ds-tag-temp', 'temp') : ''
      ].join('');
      parts.push(`<div class="ds-qitem"><div class="ds-qtop">${top}</div><div class="${cls.join(' ')}">${v}</div><div class="ds-qbottom">${bottom}</div></div>`);
      // Arrow to the next node. After the rear it only appears for a not-yet-linked pending node.
      if (i < n - 1) parts.push(link());
      else if (pending) parts.push(link('ds-qlink-pending'));
    });

    if (n > 0 && !pending) {
      parts.push(link(), '<div class="ds-qnull">null</div>');
    }

    if (pending) {
      // Only animate the node in on the step that creates it, not on every step it stays pending.
      const popIn = animate && !(prevStep && prevStep.pending);
      parts.push(`<div class="ds-qitem is-pending"><div class="ds-qtop">${tag('ds-tag-new', 'new node')}</div><div class="ds-cell is-allocated${popIn ? ' ds-enter-x' : ''}">${pending.value}</div><div class="ds-qbottom"></div></div>`);
    }

    if (n === 0 && !pending) {
      parts.push(`<div class="ds-qempty">
        <div class="ds-qempty-ptrs">${tag('ds-tag-front', 'FRONT')}<span class="ds-null-val">nullptr</span>${tag('ds-tag-rear', 'REAR')}<span class="ds-null-val">nullptr</span></div>
        <div class="ds-empty-note">Empty queue</div></div>`);
    }

    // Free capacity slots after the rear
    if (cap > 0) {
      const free = Math.max(0, cap - n - (pending ? 1 : 0) - (ghost ? 1 : 0));
      for (let i = 0; i < free; i++) {
        parts.push('<div class="ds-qitem is-free-slot"><div class="ds-qtop"></div><div class="ds-cell is-free"></div><div class="ds-qbottom"></div></div>');
      }
    }

    return `<div class="ds-queue-wrap"><div class="ds-queue-row">${parts.join('')}</div>
      <div class="ds-stack-cap">${cap > 0 ? `capacity ${cap}` : 'unlimited capacity'}</div></div>`;
  }

  renderElements(step) {
    const st = step.state;
    const vals = st.kind === 'stack' ? st.slots : st.items;
    this.elements.innerHTML = vals.length === 0
      ? '<span class="ds-el-empty">empty</span>'
      : vals.map((v, i) => {
          const role = st.kind === 'stack'
            ? (i === vals.length - 1 ? ' is-edge' : '')
            : (i === 0 || i === vals.length - 1 ? ' is-edge' : '');
          return `<span class="ds-el-chip${role}">${v === null ? '?' : v}</span>`;
        }).join('');
    this.sizePill.textContent = `Size ${st.size}${st.capacity > 0 ? ` / ${st.capacity}` : ''}`;
  }

  renderVars(step, prevStep) {
    const prevMap = new Map();
    if (prevStep) {
      [...prevStep.vars.members, ...prevStep.vars.locals].forEach(([k, v]) => prevMap.set(k, v));
    }
    const row = ([k, v]) => {
      const changed = !step.idle && prevMap.get(k) !== v;
      return `<div class="ds-var${changed ? ' is-changed' : ''}"><code class="ds-var-name">${k}</code><code class="ds-var-val">${v}</code></div>`;
    };
    const locals = step.vars.locals.length
      ? `<div class="ds-var-group-label">Local variables</div>${step.vars.locals.map(row).join('')}`
      : '';
    this.varsBox.innerHTML =
      `<div class="ds-var-group-label">Members</div>${step.vars.members.map(row).join('')}${locals}`;
  }

  renderCode(step) {
    const code = STRUCTURE_INFO[this.kind].code;
    this.codeBox.querySelectorAll('.cpp-line-row.active').forEach(el => el.classList.remove('active'));
    let first = null;
    step.keys.forEach(key => {
      const idx = lineIndexForKey(code, key);
      if (idx < 0) return;
      const row = this.codeBox.children[idx];
      row.classList.add('active');
      if (!first) first = row;
    });
    // Scroll only the code panel (never the page).
    if (first && this.codeScroll) {
      const target = first.offsetTop - this.codeScroll.clientHeight / 2 + first.offsetHeight / 2;
      this.codeScroll.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }

  renderHistory() {
    const s = this.session;
    const activeIdx = s.history.findIndex(h => s.cursor >= h.start && s.cursor <= h.end);
    this.historyCount.textContent = `${s.history.length} operation${s.history.length === 1 ? '' : 's'}`;
    if (s.history.length === 0) {
      this.historyList.innerHTML = '<li class="ds-history-empty">Operations you run will be listed here. Select one to jump to its final state.</li>';
      return;
    }
    this.historyList.innerHTML = s.history.map((h, i) => `
      <li><button class="ds-history-item ${h.status}${i === activeIdx ? ' is-active' : ''}" data-hist="${i}"
          title="Show the state after ${h.label}">
        <span class="ds-hist-n">${h.n}</span>
        <code class="ds-hist-label">${h.label}</code>
        <span class="ds-hist-result">${h.resultText}</span>
      </button></li>`).reverse().join('');
  }

  updateControls() {
    const s = this.session;
    const atStart = s.cursor <= 0;
    const atEnd = s.cursor >= s.steps.length - 1;
    this.prevBtn.disabled = atStart;
    this.nextBtn.disabled = atEnd;
    this.playBtn.disabled = atEnd;
    this.playBtn.style.display = this.playing ? 'none' : '';
    this.pauseBtn.style.display = this.playing ? '' : 'none';

    const step = this.step;
    let label = 'Ready', cls = 'ready';
    if (this.playing) { label = 'Running'; cls = 'in-progress'; }
    else if (step.idle) { label = 'Ready'; cls = 'ready'; }
    else if (step.final) { label = step.status === 'error' ? 'Error' : 'Done'; cls = step.status === 'error' ? 'error' : 'reviewed'; }
    else { label = 'Paused'; cls = 'in-progress'; }
    this.statusBadge.textContent = label;
    this.statusBadge.className = `status-badge-chip ${cls}`;
  }
}
