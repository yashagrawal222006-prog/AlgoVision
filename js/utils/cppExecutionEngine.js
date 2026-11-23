/**
 * AlgoVision — Step-by-Step C++ Execution Engine & Variable Inspector
 * Provides:
 * 1. Lightweight Prism.js C++ syntax highlighting with robust offline tokenizer fallback.
 * 2. Synchronized C++ source code rendering with line gutters and active line highlighting.
 * 3. Dynamic Variable Inspector with memory snapshot tiles and change detection animations.
 * 4. Split-screen execution metadata helpers (current operation, iteration, beginning/completion states).
 */

/**
 * Tokenizes C++ source code into styled HTML elements.
 * Uses window.Prism if available, otherwise runs an internal tokenizer.
 * 
 * @param {string} codeLine - Single line or block of C++ code
 * @returns {string} HTML string with syntax highlighting token spans
 */
export function highlightCppCode(codeLine) {
  if (!codeLine) return '&nbsp;';

  // 1. Try Prism.js if loaded in window
  if (typeof window !== 'undefined' && window.Prism && window.Prism.languages && window.Prism.languages.cpp) {
    try {
      return window.Prism.highlight(codeLine, window.Prism.languages.cpp, 'cpp');
    } catch {
      // Fallback to internal tokenizer if Prism throws
    }
  }

  // 2. Offline / Standalone Tokenizer Fallback (Produces Prism-compatible classes)
  return tokenizeCppLine(codeLine);
}

/**
 * Robust internal C++ tokenizer producing Prism-compatible token classes.
 */
function tokenizeCppLine(line) {
  // Escape HTML entities first
  let escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Preprocessor directives: #include <...>
  if (/^\s*#\w+/.test(escaped)) {
    return escaped.replace(/^(#\w+)(\s*)(&lt;.*&gt;|".*")?/, (m, dir, space, path) => {
      let out = `<span class="token directive keyword">${dir}</span>${space || ''}`;
      if (path) {
        out += `<span class="token string">${path}</span>`;
      }
      return out;
    });
  }

  // Single line comments
  if (escaped.includes('//')) {
    const parts = escaped.split('//');
    const codePart = parts[0];
    const commentPart = '//' + parts.slice(1).join('//');
    return tokenizeCppLine(codePart) + `<span class="token comment">${commentPart}</span>`;
  }

  // String literals
  escaped = escaped.replace(/"([^"\\]|\\.)*"/g, '<span class="token string">$&</span>');

  // Keywords
  const keywords = [
    'void', 'int', 'bool', 'char', 'float', 'double', 'long', 'auto', 'const',
    'for', 'while', 'if', 'else', 'return', 'break', 'continue', 'switch', 'case',
    'class', 'struct', 'public', 'private', 'protected', 'namespace', 'using',
    'new', 'delete', 'nullptr', 'true', 'false', 'sizeof'
  ];
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  escaped = escaped.replace(keywordRegex, '<span class="token keyword">$1</span>');

  // Standard library types & containers
  const stdTypes = ['vector', 'queue', 'stack', 'pair', 'priority_queue', 'greater', 'less', 'string', 'Node', 'Edge', 'DSU'];
  const typeRegex = new RegExp(`\\b(${stdTypes.join('|')})\\b`, 'g');
  escaped = escaped.replace(typeRegex, '<span class="token class-name">$1</span>');

  // Common standard functions
  const stdFuncs = ['swap', 'push', 'pop', 'front', 'top', 'size', 'empty', 'isEmpty', 'isFull', 'sort', 'find', 'unite', 'max', 'min', 'begin', 'end', 'push_back', 'pop_back', 'clear'];
  const funcRegex = new RegExp(`\\b(${stdFuncs.join('|')})(?=\\s*\\()`, 'g');
  escaped = escaped.replace(funcRegex, '<span class="token function">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');

  // Operators
  escaped = escaped.replace(/(&amp;&amp;|\|\||==|!=|&lt;=|&gt;=|-&gt;|\+\+|--|[+\-*\/=])/g, '<span class="token operator">$1</span>');

  return escaped;
}

/**
 * Renders C++ code lines into a target container.
 * 
 * @param {HTMLElement} container - DOM container element
 * @param {string[]} codeLines - Array of code strings
 * @param {number|null} activeLineNumber - 1-based line number to highlight
 */
export function renderCppSource(container, codeLines, activeLineNumber = null) {
  if (!container || !Array.isArray(codeLines)) return;

  container.innerHTML = '';
  codeLines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const row = document.createElement('div');
    row.className = 'cpp-line-row';
    row.setAttribute('data-line', lineNum);

    if (activeLineNumber === lineNum) {
      row.classList.add('active');
    }

    const numSpan = document.createElement('span');
    numSpan.className = 'cpp-line-num';
    numSpan.textContent = lineNum;

    const pointerSpan = document.createElement('span');
    pointerSpan.className = 'cpp-line-pointer';
    pointerSpan.textContent = '▶';

    const codeSpan = document.createElement('span');
    codeSpan.className = 'cpp-line-code';
    codeSpan.innerHTML = highlightCppCode(rawLine);

    row.appendChild(numSpan);
    row.appendChild(pointerSpan);
    row.appendChild(codeSpan);
    container.appendChild(row);
  });

  if (activeLineNumber) {
    highlightLineInContainer(container, activeLineNumber);
  }
}

/**
 * Highlights a specific line in the C++ container and smoothly scrolls it into view.
 */
export function highlightLineInContainer(container, lineNumber) {
  if (!container) return;

  const prevActive = container.querySelectorAll('.cpp-line-row.active');
  prevActive.forEach(el => el.classList.remove('active'));

  if (lineNumber) {
    const target = container.querySelector(`.cpp-line-row[data-line="${lineNumber}"]`);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

/**
 * Formats a variable value for human-friendly display in the Inspector.
 */
function formatVarValue(val) {
  if (val === null || val === undefined) {
    return { text: 'nullptr', type: 'null' };
  }
  if (typeof val === 'boolean') {
    return { text: val ? 'true' : 'false', type: 'boolean' };
  }
  if (typeof val === 'number') {
    return { text: Number.isFinite(val) ? String(val) : (val > 0 ? '∞ (INF)' : '-∞'), type: 'number' };
  }
  if (Array.isArray(val)) {
    return { text: `[${val.join(', ')}]`, type: 'array' };
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val).map(([k, v]) => `${k}:${v === Infinity ? '∞' : v}`);
    return { text: `{ ${entries.join(', ')} }`, type: 'object' };
  }
  return { text: String(val), type: 'string' };
}

/**
 * Dynamically renders the Variable Inspector.
 * Compares current values with previous values to highlight mutated variables.
 * 
 * @param {HTMLElement} container - The DOM container for the inspector
 * @param {Object} variables - Key-value map of variable names to current values
 * @param {Object|null} prevVariables - Key-value map from previous step
 */
export function renderVariableInspector(container, variables = {}, prevVariables = null) {
  if (!container) return;
  container.innerHTML = '';

  const entries = Object.entries(variables || {});
  if (entries.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'var-empty-state';
    emptyState.textContent = 'No variables in active scope for this step.';
    container.appendChild(emptyState);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'var-inspector-grid';

  entries.forEach(([varName, rawVal]) => {
    const card = document.createElement('div');
    card.className = 'var-card';

    const { text, type } = formatVarValue(rawVal);

    // Detect if value changed compared to previous step
    let changed = false;
    if (prevVariables && Object.prototype.hasOwnProperty.call(prevVariables, varName)) {
      const prev = formatVarValue(prevVariables[varName]);
      if (prev.text !== text) {
        changed = true;
      }
    }

    if (changed) {
      card.classList.add('var-changed');
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'var-card-name';
    nameEl.innerHTML = `<span class="var-badge">${varName}</span>`;

    const valEl = document.createElement('div');
    valEl.className = `var-card-val var-${type}`;
    valEl.textContent = text;
    valEl.title = `${varName} = ${text}`;

    card.appendChild(nameEl);
    card.appendChild(valEl);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Helper to compute a meaningful operation type label for step badges.
 */
export function getOperationBadgeInfo(type) {
  switch (type) {
    case 'start':
      return { label: 'EXECUTION START', cls: 'op-start' };
    case 'complete':
      return { label: 'EXECUTION COMPLETE', cls: 'op-complete' };
    case 'compare':
      return { label: 'COMPARE', cls: 'op-compare' };
    case 'swap':
      return { label: 'SWAP / SHIFT', cls: 'op-swap' };
    case 'sorted':
      return { label: 'POSITION LOCKED', cls: 'op-sorted' };
    case 'eliminate':
      return { label: 'HALVE INTERVAL', cls: 'op-eliminate' };
    case 'found':
      return { label: 'TARGET FOUND', cls: 'op-found' };
    case 'not-found':
      return { label: 'NOT FOUND', cls: 'op-not-found' };
    case 'visit':
      return { label: 'VISIT VERTEX', cls: 'op-visit' };
    case 'expand':
      return { label: 'DEQUEUE & EXPAND', cls: 'op-expand' };
    case 'explore':
      return { label: 'EXPLORE EDGE', cls: 'op-explore' };
    case 'relax':
      return { label: 'RELAX EDGE', cls: 'op-relax' };
    case 'push':
    case 'enq':
      return { label: 'INSERT / PUSH', cls: 'op-push' };
    case 'pop':
    case 'deq':
      return { label: 'REMOVE / POP', cls: 'op-pop' };
    default:
      return { label: (type || 'OPERATION').toUpperCase(), cls: 'op-normal' };
  }
}
