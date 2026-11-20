/**
 * AlgoVision — Graph Workspace & Interactive SVG Canvas Controller
 * Implements interactive graph editing (click-to-add, click-to-connect, drag, weight input, delete),
 * algorithm execution (BFS, DFS, Dijkstra, Bellman-Ford, Kruskal), C++ code highlighting, and panels.
 */

import {
  GRAPH_ALGORITHM_INFO,
  generateBFSTrace,
  generateDFSTrace,
  generateDijkstraTrace,
  generateBellmanFordTrace,
  generateKruskalTrace
} from './algorithms.js';

export class GraphVisualizer {
  constructor() {
    this.currentAlgo = 'bfs';
    this.isDirected = false;
    this.sourceNode = 0;
    this.destNode = 4;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.editorMode = 'add-node'; // 'add-node' | 'add-edge' | 'select' | 'delete'

    // Node & Edge Data
    this.nodes = [];
    this.edges = [];
    this.nextNodeId = 0;
    this.nextEdgeId = 0;

    // Dragging state
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };

    // Execution trace state
    this.trace = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.timer = null;
    this.speed = 450;

    this.cacheDomElements();
    this.init();
  }

  cacheDomElements() {
    this.svg = document.getElementById('graphSvgCanvas');
    this.stepExplanation = document.getElementById('graphStepExplanation');
    this.cppCodeContainer = document.getElementById('graphCppCode');

    // Controls
    this.startBtn = document.getElementById('graphStartBtn');
    this.pauseBtn = document.getElementById('graphPauseBtn');
    this.resumeBtn = document.getElementById('graphResumeBtn');
    this.resetBtn = document.getElementById('graphResetBtn');
    this.prevBtn = document.getElementById('graphPrevBtn');
    this.nextBtn = document.getElementById('graphNextBtn');
    this.sampleBtn = document.getElementById('graphSampleBtn');
    this.clearBtn = document.getElementById('graphClearBtn');

    // Editor Tool Buttons
    this.modeAddNodeBtn = document.getElementById('toolAddNode');
    this.modeAddEdgeBtn = document.getElementById('toolAddEdge');
    this.modeSelectBtn = document.getElementById('toolSelect');
    this.modeDeleteBtn = document.getElementById('toolDelete');

    // Graph Settings
    this.directedToggle = document.getElementById('graphDirectedToggle');
    this.sourceSelect = document.getElementById('graphSourceSelect');
    this.destSelect = document.getElementById('graphDestSelect');
    this.edgeWeightInput = document.getElementById('graphEdgeWeightInput');
    this.applyWeightBtn = document.getElementById('graphApplyWeightBtn');

    // Algo Selection
    this.algoTabs = document.querySelectorAll('.graph-algo-tab-btn');
    this.algoDropdown = document.getElementById('graphAlgoSelect');

    // Speed Slider
    this.speedSlider = document.getElementById('graphSpeedSlider');
    this.speedLabel = document.getElementById('graphSpeedLabel');

    // Algorithm Info & Complexities
    this.algoTitle = document.getElementById('graphAlgoTitle');
    this.algoCategory = document.getElementById('graphAlgoCategory');
    this.algoDesc = document.getElementById('graphAlgoDesc');
    this.timeComplexity = document.getElementById('graphTimeComp');
    this.spaceComplexity = document.getElementById('graphSpaceComp');

    // Panels
    this.statVisitedNodes = document.getElementById('graphStatVisited');
    this.statTraversalOrder = document.getElementById('graphStatOrder');
    this.statQueueOrStack = document.getElementById('graphStatStructure');
    this.statStructureLabel = document.getElementById('graphStructureLabel');
    this.statDistanceArray = document.getElementById('graphStatDistances');
    this.statParentArray = document.getElementById('graphStatParents');
    this.statCurrentEdge = document.getElementById('graphStatCurrentEdge');
    this.statResultSummary = document.getElementById('graphStatResultSummary');
    this.statStepCounter = document.getElementById('graphStepCounter');
    this.statusBadge = document.getElementById('graphStatusBadge');
    this.errorBanner = document.getElementById('graphErrorBanner');
  }

  init() {
    if (!this.svg) return;

    this.bindEvents();
    this.loadSampleGraph('default');
    this.updateAlgorithmMeta(this.currentAlgo);
    this.recomputeTrace();
  }

  bindEvents() {
    // 1. Algorithm Selection Tabs
    this.algoTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const algo = tab.getAttribute('data-algo');
        if (algo && algo !== this.currentAlgo) {
          this.setAlgorithm(algo);
        }
      });
    });

    // 2. Algorithm Dropdown (Mobile)
    this.algoDropdown?.addEventListener('change', (e) => {
      this.setAlgorithm(e.target.value);
    });

    // 3. Playback Controls
    this.startBtn?.addEventListener('click', () => this.start());
    this.pauseBtn?.addEventListener('click', () => this.pause());
    this.resumeBtn?.addEventListener('click', () => this.resume());
    this.resetBtn?.addEventListener('click', () => this.reset());
    this.nextBtn?.addEventListener('click', () => this.nextStep());
    this.prevBtn?.addEventListener('click', () => this.prevStep());

    // 4. Sample and Clear
    this.sampleBtn?.addEventListener('click', () => {
      this.loadSampleGraph(this.currentAlgo === 'kruskal' ? 'kruskal' : 'default');
    });

    this.clearBtn?.addEventListener('click', () => {
      this.clearGraph();
    });

    // 5. Editor Mode Selection
    this.modeAddNodeBtn?.addEventListener('click', () => this.setEditorMode('add-node'));
    this.modeAddEdgeBtn?.addEventListener('click', () => this.setEditorMode('add-edge'));
    this.modeSelectBtn?.addEventListener('click', () => this.setEditorMode('select'));
    this.modeDeleteBtn?.addEventListener('click', () => this.setEditorMode('delete'));

    // 6. Directed / Undirected Toggle
    this.directedToggle?.addEventListener('change', (e) => {
      this.isDirected = e.target.checked;
      this.renderGraph();
      this.recomputeTrace();
    });

    // 7. Source & Destination selection
    this.sourceSelect?.addEventListener('change', (e) => {
      this.sourceNode = Number(e.target.value);
      this.recomputeTrace();
    });

    this.destSelect?.addEventListener('change', (e) => {
      this.destNode = e.target.value === '' ? null : Number(e.target.value);
      this.recomputeTrace();
    });

    // 8. Edge Weight Update
    this.applyWeightBtn?.addEventListener('click', () => {
      this.applySelectedEdgeWeight();
    });

    // 9. Speed Slider
    this.speedSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.speed = Math.round(950 - (val / 100) * 850);
      if (this.speedLabel) {
        this.speedLabel.textContent = `${(val / 10).toFixed(1)}x`;
      }
    });

    // 10. Canvas SVG Mouse Interaction
    this.svg.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());

    // 11. Delete Key shortcut
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT') return;
        this.deleteSelection();
      }
    });
  }

  setEditorMode(mode) {
    this.editorMode = mode;
    [this.modeAddNodeBtn, this.modeAddEdgeBtn, this.modeSelectBtn, this.modeDeleteBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (mode === 'add-node') this.modeAddNodeBtn?.classList.add('active');
    if (mode === 'add-edge') this.modeAddEdgeBtn?.classList.add('active');
    if (mode === 'select') this.modeSelectBtn?.classList.add('active');
    if (mode === 'delete') this.modeDeleteBtn?.classList.add('active');
  }

  setAlgorithm(algoKey) {
    if (!GRAPH_ALGORITHM_INFO[algoKey]) return;
    this.pause();
    this.currentAlgo = algoKey;

    this.algoTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-algo') === algoKey);
    });

    if (this.algoDropdown) {
      this.algoDropdown.value = algoKey;
    }

    // Force undirected for Kruskal if needed
    if (algoKey === 'kruskal' && this.directedToggle) {
      this.directedToggle.checked = false;
      this.isDirected = false;
    }

    this.updateAlgorithmMeta(algoKey);
    this.recomputeTrace();
  }

  updateAlgorithmMeta(algoKey) {
    const info = GRAPH_ALGORITHM_INFO[algoKey];
    if (!info) return;

    if (this.algoTitle) this.algoTitle.textContent = info.name;
    if (this.algoCategory) this.algoCategory.textContent = info.category;
    if (this.algoDesc) this.algoDesc.textContent = info.description;
    if (this.timeComplexity) this.timeComplexity.textContent = info.complexities.time;
    if (this.spaceComplexity) this.spaceComplexity.textContent = info.complexities.space;

    // Show/hide source/dest pickers depending on algo
    const srcGroup = document.getElementById('graphSourceGroup');
    const destGroup = document.getElementById('graphDestGroup');
    if (srcGroup) srcGroup.style.display = info.requiresSource ? 'flex' : 'none';
    if (destGroup) destGroup.style.display = info.requiresDestination ? 'flex' : 'none';

    this.renderCppCode(info.cppCode);
  }

  renderCppCode(codeLines) {
    if (!this.cppCodeContainer) return;
    this.cppCodeContainer.innerHTML = '';

    codeLines.forEach((line, index) => {
      const lineNum = index + 1;
      const row = document.createElement('div');
      row.className = 'cpp-line-row';
      row.setAttribute('data-line', lineNum);

      const numSpan = document.createElement('span');
      numSpan.className = 'cpp-line-num';
      numSpan.textContent = lineNum;

      const codeSpan = document.createElement('span');
      codeSpan.className = 'cpp-line-code';
      codeSpan.textContent = line;

      row.appendChild(numSpan);
      row.appendChild(codeSpan);
      this.cppCodeContainer.appendChild(row);
    });
  }

  highlightCppLine(lineNumber) {
    if (!this.cppCodeContainer) return;
    const prevActive = this.cppCodeContainer.querySelectorAll('.cpp-line-row.active');
    prevActive.forEach(el => el.classList.remove('active'));

    if (lineNumber) {
      const targetRow = this.cppCodeContainer.querySelector(`.cpp-line-row[data-line="${lineNumber}"]`);
      if (targetRow) {
        targetRow.classList.add('active');
        targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /* --------------------------------------------------------------------------
     Graph Data & Interactive Editing
     -------------------------------------------------------------------------- */

  loadSampleGraph(type = 'default') {
    this.pause();
    this.clearError();

    if (type === 'kruskal') {
      this.nodes = [
        { id: 0, x: 120, y: 110, label: '0' },
        { id: 1, x: 300, y: 80, label: '1' },
        { id: 2, x: 480, y: 120, label: '2' },
        { id: 3, x: 130, y: 280, label: '3' },
        { id: 4, x: 310, y: 310, label: '4' },
        { id: 5, x: 490, y: 280, label: '5' }
      ];
      this.edges = [
        { id: 0, source: 0, target: 1, weight: 4 },
        { id: 1, source: 0, target: 3, weight: 3 },
        { id: 2, source: 1, target: 2, weight: 2 },
        { id: 3, source: 1, target: 4, weight: 4 },
        { id: 4, source: 2, target: 5, weight: 2 },
        { id: 5, source: 3, target: 4, weight: 5 },
        { id: 6, source: 4, target: 5, weight: 7 },
        { id: 7, source: 1, target: 3, weight: 1 }
      ];
      this.nextNodeId = 6;
      this.nextEdgeId = 8;
      this.isDirected = false;
    } else {
      this.nodes = [
        { id: 0, x: 100, y: 180, label: '0' },
        { id: 1, x: 260, y: 90, label: '1' },
        { id: 2, x: 260, y: 270, label: '2' },
        { id: 3, x: 420, y: 90, label: '3' },
        { id: 4, x: 420, y: 270, label: '4' },
        { id: 5, x: 560, y: 180, label: '5' }
      ];
      this.edges = [
        { id: 0, source: 0, target: 1, weight: 4 },
        { id: 1, source: 0, target: 2, weight: 2 },
        { id: 2, source: 1, target: 2, weight: 1 },
        { id: 3, source: 1, target: 3, weight: 5 },
        { id: 4, source: 2, target: 4, weight: 8 },
        { id: 5, source: 2, target: 3, weight: 10 },
        { id: 6, source: 3, target: 5, weight: 6 },
        { id: 7, source: 4, target: 5, weight: 3 },
        { id: 8, source: 3, target: 4, weight: 2 }
      ];
      this.nextNodeId = 6;
      this.nextEdgeId = 9;
      this.isDirected = false;
    }

    if (this.directedToggle) this.directedToggle.checked = this.isDirected;
    this.sourceNode = 0;
    this.destNode = 5;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;

    this.updateNodeSelects();
    this.renderGraph();
    this.recomputeTrace();
  }

  clearGraph() {
    this.pause();
    this.nodes = [];
    this.edges = [];
    this.nextNodeId = 0;
    this.nextEdgeId = 0;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.sourceNode = 0;
    this.destNode = null;

    this.updateNodeSelects();
    this.renderGraph();
    this.recomputeTrace();
  }

  updateNodeSelects() {
    const prevSrc = this.sourceNode;
    const prevDest = this.destNode;

    if (this.sourceSelect) {
      this.sourceSelect.innerHTML = '';
      this.nodes.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = `Node ${n.label || n.id}`;
        this.sourceSelect.appendChild(opt);
      });
      if (this.nodes.some(n => n.id === prevSrc)) {
        this.sourceSelect.value = prevSrc;
      } else if (this.nodes.length > 0) {
        this.sourceNode = this.nodes[0].id;
        this.sourceSelect.value = this.sourceNode;
      }
    }

    if (this.destSelect) {
      this.destSelect.innerHTML = '<option value="">None (All Reachable)</option>';
      this.nodes.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = `Node ${n.label || n.id}`;
        this.destSelect.appendChild(opt);
      });
      if (this.nodes.some(n => n.id === prevDest)) {
        this.destSelect.value = prevDest;
      } else {
        this.destNode = this.nodes.length > 1 ? this.nodes[this.nodes.length - 1].id : null;
        this.destSelect.value = this.destNode !== null ? this.destNode : '';
      }
    }
  }

  handleCanvasClick(e) {
    if (e.target !== this.svg) return; // Node or edge clicked separately

    if (this.editorMode === 'add-node') {
      const rect = this.svg.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      const id = this.nextNodeId++;
      this.nodes.push({ id, x, y, label: String(id) });
      this.updateNodeSelects();
      this.renderGraph();
      this.recomputeTrace();
    } else {
      // Clear selection
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.renderGraph();
    }
  }

  handleNodeClick(nodeId, e) {
    e.stopPropagation();

    if (this.editorMode === 'delete') {
      this.deleteNode(nodeId);
      return;
    }

    if (this.editorMode === 'add-edge') {
      if (this.selectedNodeId === null) {
        this.selectedNodeId = nodeId;
      } else if (this.selectedNodeId !== nodeId) {
        // Create edge from selectedNodeId to nodeId
        this.addEdge(this.selectedNodeId, nodeId, 1);
        this.selectedNodeId = null;
      } else {
        this.selectedNodeId = null;
      }
      this.renderGraph();
      return;
    }

    // Default select
    this.selectedNodeId = nodeId;
    this.selectedEdgeId = null;
    this.renderGraph();
  }

  handleEdgeClick(edgeId, e) {
    e.stopPropagation();

    if (this.editorMode === 'delete') {
      this.deleteEdge(edgeId);
      return;
    }

    this.selectedEdgeId = edgeId;
    this.selectedNodeId = null;

    const edge = this.edges.find(e => e.id === edgeId);
    if (edge && this.edgeWeightInput) {
      this.edgeWeightInput.value = edge.weight;
    }
    this.renderGraph();
  }

  handleNodeMouseDown(nodeId, e) {
    e.stopPropagation();
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.draggedNode = node;
    const rect = this.svg.getBoundingClientRect();
    this.dragOffset = {
      x: (e.clientX - rect.left) - node.x,
      y: (e.clientY - rect.top) - node.y
    };
  }

  handleMouseMove(e) {
    if (!this.draggedNode) return;
    const rect = this.svg.getBoundingClientRect();
    const x = Math.max(25, Math.min(rect.width - 25, (e.clientX - rect.left) - this.dragOffset.x));
    const y = Math.max(25, Math.min(rect.height - 25, (e.clientY - rect.top) - this.dragOffset.y));

    this.draggedNode.x = Math.round(x);
    this.draggedNode.y = Math.round(y);
    this.renderGraph();
  }

  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode = null;
      this.recomputeTrace();
    }
  }

  addEdge(sourceId, targetId, weight = 1) {
    // Check if edge already exists
    const exists = this.edges.some(e =>
      (e.source === sourceId && e.target === targetId) ||
      (!this.isDirected && e.source === targetId && e.target === sourceId)
    );
    if (exists) return;

    const id = this.nextEdgeId++;
    this.edges.push({ id, source: sourceId, target: targetId, weight });
    this.renderGraph();
    this.recomputeTrace();
  }

  deleteNode(nodeId) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    if (this.selectedNodeId === nodeId) this.selectedNodeId = null;
    this.updateNodeSelects();
    this.renderGraph();
    this.recomputeTrace();
  }

  deleteEdge(edgeId) {
    this.edges = this.edges.filter(e => e.id !== edgeId);
    if (this.selectedEdgeId === edgeId) this.selectedEdgeId = null;
    this.renderGraph();
    this.recomputeTrace();
  }

  deleteSelection() {
    if (this.selectedNodeId !== null) {
      this.deleteNode(this.selectedNodeId);
    } else if (this.selectedEdgeId !== null) {
      this.deleteEdge(this.selectedEdgeId);
    }
  }

  applySelectedEdgeWeight() {
    if (this.selectedEdgeId === null || !this.edgeWeightInput) return;
    const w = Number(this.edgeWeightInput.value);
    if (isNaN(w)) return;

    const edge = this.edges.find(e => e.id === this.selectedEdgeId);
    if (edge) {
      edge.weight = w;
      this.renderGraph();
      this.recomputeTrace();
    }
  }

  showError(msg) {
    if (this.errorBanner) {
      this.errorBanner.textContent = msg;
      this.errorBanner.style.display = 'block';
    }
  }

  clearError() {
    if (this.errorBanner) {
      this.errorBanner.textContent = '';
      this.errorBanner.style.display = 'none';
    }
  }

  /* --------------------------------------------------------------------------
     Trace Generation & Execution
     -------------------------------------------------------------------------- */

  recomputeTrace() {
    this.clearError();

    if (this.nodes.length === 0) {
      this.trace = [];
      this.currentStep = 0;
      this.renderCurrentStep();
      this.updateControlsState();
      return;
    }

    // Ensure valid source node
    if (!this.nodes.some(n => n.id === this.sourceNode)) {
      this.sourceNode = this.nodes[0].id;
    }

    try {
      switch (this.currentAlgo) {
        case 'bfs':
          this.trace = generateBFSTrace(this.nodes, this.edges, this.isDirected, this.sourceNode);
          break;
        case 'dfs':
          this.trace = generateDFSTrace(this.nodes, this.edges, this.isDirected, this.sourceNode);
          break;
        case 'dijkstra':
          this.trace = generateDijkstraTrace(this.nodes, this.edges, this.isDirected, this.sourceNode, this.destNode);
          break;
        case 'bellman':
          this.trace = generateBellmanFordTrace(this.nodes, this.edges, this.isDirected, this.sourceNode, this.destNode);
          break;
        case 'kruskal':
          this.trace = generateKruskalTrace(this.nodes, this.edges);
          break;
        default:
          this.trace = generateBFSTrace(this.nodes, this.edges, this.isDirected, this.sourceNode);
      }
    } catch (err) {
      console.error('Error generating trace:', err);
      this.showError(`Error running ${this.currentAlgo}: ${err.message}`);
      this.trace = [];
    }

    this.currentStep = 0;
    this.renderCurrentStep();
    this.updateControlsState();
  }

  renderCurrentStep() {
    if (!this.trace || this.trace.length === 0) {
      this.renderGraph();
      this.clearStats();
      return;
    }

    const step = this.trace[this.currentStep];
    if (!step) return;

    this.renderGraph(step);
    this.updateStats(step);
    this.highlightCppLine(step.line);

    if (this.stepExplanation) {
      this.stepExplanation.textContent = step.explanation;
    }
  }

  /* --------------------------------------------------------------------------
     SVG Canvas Rendering
     -------------------------------------------------------------------------- */

  renderGraph(step = null) {
    if (!this.svg) return;
    this.svg.innerHTML = '';

    // Defs for Arrowhead Markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrow-default" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
      </marker>
      <marker id="arrow-active" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#06b6d4" />
      </marker>
      <marker id="arrow-path" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
      </marker>
    `;
    this.svg.appendChild(defs);

    const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgesGroup.className.baseVal = 'graph-edges-layer';
    this.svg.appendChild(edgesGroup);

    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.className.baseVal = 'graph-nodes-layer';
    this.svg.appendChild(nodesGroup);

    // Active visual sets from step
    const visitedSet = new Set(step?.visitedNodes || []);
    const currentNode = step?.currentNode;
    const currentEdge = step?.currentEdge;
    const acceptedEdgeSet = new Set(step?.acceptedEdges || []);
    const rejectedEdgeSet = new Set(step?.rejectedEdges || []);
    const pathNodes = step?.highlightedPath || [];

    // Helper map of nodes
    const nodeMap = new Map();
    this.nodes.forEach(n => nodeMap.set(n.id, n));

    // 1. Render Edges
    this.edges.forEach(edge => {
      const u = nodeMap.get(edge.source);
      const v = nodeMap.get(edge.target);
      if (!u || !v) return;

      const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      edgeGroup.className.baseVal = 'graph-edge-item';
      edgeGroup.addEventListener('click', (e) => this.handleEdgeClick(edge.id, e));

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', u.x);
      line.setAttribute('y1', u.y);
      line.setAttribute('x2', v.x);
      line.setAttribute('y2', v.y);

      // Determine Edge Styling
      let edgeClass = 'edge-line';
      let markerId = 'arrow-default';

      const isCurrent = currentEdge &&
        ((currentEdge.source === edge.source && currentEdge.target === edge.target) ||
         (!this.isDirected && currentEdge.source === edge.target && currentEdge.target === edge.source));

      const isPathEdge = pathNodes.length > 1 && pathNodes.some((pNode, pIdx) => {
        if (pIdx === 0) return false;
        const prev = pathNodes[pIdx - 1];
        return (prev === edge.source && pNode === edge.target) ||
               (!this.isDirected && prev === edge.target && pNode === edge.source);
      });

      if (acceptedEdgeSet.has(edge.id) || isPathEdge) {
        edgeClass += ' edge-accepted';
        markerId = 'arrow-path';
      } else if (rejectedEdgeSet.has(edge.id)) {
        edgeClass += ' edge-rejected';
      } else if (isCurrent) {
        edgeClass += ' edge-current';
        markerId = 'arrow-active';
      } else if (this.selectedEdgeId === edge.id) {
        edgeClass += ' edge-selected';
      }

      line.setAttribute('class', edgeClass);
      if (this.isDirected) {
        line.setAttribute('marker-end', `url(#${markerId})`);
      }
      edgeGroup.appendChild(line);

      // Edge Weight Label
      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;

      // Small background for readability
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', midX - 11);
      labelBg.setAttribute('y', midY - 9);
      labelBg.setAttribute('width', 22);
      labelBg.setAttribute('height', 16);
      labelBg.setAttribute('rx', 3);
      labelBg.setAttribute('class', 'edge-weight-bg');
      edgeGroup.appendChild(labelBg);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', midX);
      text.setAttribute('y', midY + 3);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'edge-weight-text');
      text.textContent = edge.weight;
      edgeGroup.appendChild(text);

      edgesGroup.appendChild(edgeGroup);
    });

    // 2. Render Nodes
    this.nodes.forEach(node => {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      nodeGroup.className.baseVal = 'graph-node-item';

      nodeGroup.addEventListener('click', (e) => this.handleNodeClick(node.id, e));
      nodeGroup.addEventListener('mousedown', (e) => this.handleNodeMouseDown(node.id, e));

      // Node Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', 18);

      let circleClass = 'node-circle';
      if (pathNodes.includes(node.id)) {
        circleClass += ' node-path';
      } else if (node.id === currentNode) {
        circleClass += ' node-current';
      } else if (visitedSet.has(node.id)) {
        circleClass += ' node-visited';
      } else if (this.selectedNodeId === node.id) {
        circleClass += ' node-selected';
      } else if (node.id === this.sourceNode) {
        circleClass += ' node-source';
      }

      circle.setAttribute('class', circleClass);
      nodeGroup.appendChild(circle);

      // Node Text Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', 5);
      text.setAttribute('class', 'node-label');
      text.textContent = node.label || node.id;
      nodeGroup.appendChild(text);

      // Distance Badge above node (for Dijkstra/Bellman)
      if (step?.distances && step.distances[node.id] !== undefined) {
        const d = step.distances[node.id];
        const distBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        distBadge.setAttribute('text-anchor', 'middle');
        distBadge.setAttribute('y', -24);
        distBadge.setAttribute('class', 'node-dist-badge');
        distBadge.textContent = d === Infinity ? '∞' : d;
        nodeGroup.appendChild(distBadge);
      }

      nodesGroup.appendChild(nodeGroup);
    });
  }

  updateStats(step) {
    if (!step) return;

    if (this.statVisitedNodes) {
      this.statVisitedNodes.textContent = step.visitedNodes.length > 0 ? step.visitedNodes.join(', ') : 'None';
    }

    if (this.statTraversalOrder) {
      this.statTraversalOrder.textContent = step.traversalOrder.length > 0 ? step.traversalOrder.join(' → ') : 'None';
    }

    if (this.statStructureLabel) {
      this.statStructureLabel.textContent = step.structureType || 'Data Structure';
    }

    if (this.statQueueOrStack) {
      this.statQueueOrStack.textContent = step.queueOrStack.length > 0 ? step.queueOrStack.join(' | ') : 'Empty';
    }

    if (this.statCurrentEdge) {
      if (step.currentEdge) {
        this.statCurrentEdge.textContent = `(${step.currentEdge.source} → ${step.currentEdge.target}, w=${step.currentEdge.weight})`;
      } else {
        this.statCurrentEdge.textContent = 'None';
      }
    }

    // Distance Array display
    if (this.statDistanceArray) {
      if (step.distances && Object.keys(step.distances).length > 0) {
        const items = Object.entries(step.distances).map(([id, d]) => `${id}: ${d === Infinity ? '∞' : d}`);
        this.statDistanceArray.textContent = `{ ${items.join(', ')} }`;
      } else {
        this.statDistanceArray.textContent = 'N/A';
      }
    }

    // Parent Array display
    if (this.statParentArray) {
      if (step.parents && Object.keys(step.parents).length > 0) {
        const items = Object.entries(step.parents).map(([id, p]) => `${id}: ${p === null ? 'null' : p}`);
        this.statParentArray.textContent = `{ ${items.join(', ')} }`;
      } else {
        this.statParentArray.textContent = 'N/A';
      }
    }

    if (this.statResultSummary) {
      this.statResultSummary.textContent = step.resultSummary || step.explanation;
    }

    const totalSteps = this.trace.length;
    if (this.statStepCounter) {
      this.statStepCounter.textContent = `Step ${this.currentStep + 1} of ${totalSteps}`;
    }

    if (this.statusBadge) {
      if (step.hasNegativeCycle) {
        this.statusBadge.textContent = 'Negative Cycle Detected';
        this.statusBadge.className = 'status-badge-chip failure';
      } else if (step.type === 'complete') {
        this.statusBadge.textContent = 'Completed';
        this.statusBadge.className = 'status-badge-chip ready';
      } else if (this.isPlaying) {
        this.statusBadge.textContent = 'Running';
        this.statusBadge.className = 'status-badge-chip in-progress';
      } else if (this.currentStep > 0) {
        this.statusBadge.textContent = 'Paused';
        this.statusBadge.className = 'status-badge-chip reviewed';
      } else {
        this.statusBadge.textContent = 'Ready';
        this.statusBadge.className = 'status-badge-chip reviewed';
      }
    }
  }

  clearStats() {
    if (this.statVisitedNodes) this.statVisitedNodes.textContent = 'None';
    if (this.statTraversalOrder) this.statTraversalOrder.textContent = 'None';
    if (this.statQueueOrStack) this.statQueueOrStack.textContent = 'Empty';
    if (this.statCurrentEdge) this.statCurrentEdge.textContent = 'None';
    if (this.statDistanceArray) this.statDistanceArray.textContent = 'N/A';
    if (this.statParentArray) this.statParentArray.textContent = 'N/A';
    if (this.statResultSummary) this.statResultSummary.textContent = 'Draw or load a graph to begin.';
    if (this.statStepCounter) this.statStepCounter.textContent = 'Step 0 of 0';
  }

  updateControlsState() {
    const isAtStart = this.currentStep === 0;
    const isAtEnd = this.currentStep >= this.trace.length - 1;

    if (this.startBtn) {
      this.startBtn.style.display = (!this.isPlaying && (isAtStart || isAtEnd)) ? 'inline-flex' : 'none';
      const labelSpan = this.startBtn.querySelector('span');
      if (labelSpan) {
        labelSpan.textContent = isAtEnd ? 'Restart' : 'Start';
      }
    }

    if (this.pauseBtn) this.pauseBtn.style.display = this.isPlaying ? 'inline-flex' : 'none';
    if (this.resumeBtn) this.resumeBtn.style.display = (!this.isPlaying && !isAtStart && !isAtEnd) ? 'inline-flex' : 'none';

    if (this.prevBtn) this.prevBtn.disabled = this.isPlaying || isAtStart;
    if (this.nextBtn) this.nextBtn.disabled = this.isPlaying || isAtEnd;
    if (this.resetBtn) this.resetBtn.disabled = (!this.isPlaying && isAtStart);
  }

  start() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.trace.length - 1) {
      this.currentStep = 0;
    }
    this.isPlaying = true;
    this.updateControlsState();
    this.tick();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateControlsState();
    const step = this.trace[this.currentStep];
    if (step) this.updateStats(step);
  }

  resume() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.trace.length - 1) {
      this.currentStep = 0;
    }
    this.isPlaying = true;
    this.updateControlsState();
    this.tick();
  }

  reset() {
    this.pause();
    this.currentStep = 0;
    this.renderCurrentStep();
    this.updateControlsState();
  }

  nextStep() {
    if (this.currentStep < this.trace.length - 1) {
      this.currentStep++;
      this.renderCurrentStep();
      this.updateControlsState();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderCurrentStep();
      this.updateControlsState();
    }
  }

  tick() {
    if (!this.isPlaying) return;

    if (this.currentStep < this.trace.length - 1) {
      this.currentStep++;
      this.renderCurrentStep();
      this.updateControlsState();

      this.timer = setTimeout(() => {
        this.tick();
      }, this.speed);
    } else {
      this.pause();
      this.updateControlsState();
    }
  }
}
