/**
 * AlgoVision — Sorting Visualizer Workspace Controller
 * Orchestrates trace execution, vertical bar canvas rendering,
 * statistics updates, C++ code highlighting, and interactive controls.
 */

import { ALGORITHM_INFO, getAlgorithmTrace } from './algorithms.js';

export class SortingVisualizer {
  constructor() {
    this.currentAlgo = 'bubble';
    this.rawArray = [38, 27, 43, 3, 9, 82, 10, 19, 50, 61, 24, 15];
    this.trace = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.timer = null;
    this.speed = 300; // ms per step

    this.cacheDomElements();
    this.init();
  }

  cacheDomElements() {
    // Canvas & Containers
    this.canvas = document.getElementById('sortingBarsCanvas');
    this.stepExplanation = document.getElementById('sortingStepExplanation');
    this.cppCodeContainer = document.getElementById('sortingCppCode');

    // Controls
    this.startBtn = document.getElementById('sortStartBtn');
    this.pauseBtn = document.getElementById('sortPauseBtn');
    this.resumeBtn = document.getElementById('sortResumeBtn');
    this.resetBtn = document.getElementById('sortResetBtn');
    this.prevBtn = document.getElementById('sortPrevBtn');
    this.nextBtn = document.getElementById('sortNextBtn');
    this.randomBtn = document.getElementById('sortRandomBtn');
    this.applyCustomBtn = document.getElementById('sortApplyCustomBtn');
    this.customInput = document.getElementById('sortCustomInput');
    this.customInputError = document.getElementById('sortCustomInputError');

    // Sliders & Inputs
    this.speedSlider = document.getElementById('sortSpeedSlider');
    this.speedLabel = document.getElementById('sortSpeedLabel');
    this.sizeSlider = document.getElementById('sortSizeSlider');
    this.sizeLabel = document.getElementById('sortSizeLabel');
    this.minValueInput = document.getElementById('sortMinValue');
    this.maxValueInput = document.getElementById('sortMaxValue');
    this.algoSelectDropdown = document.getElementById('sortAlgoSelect');
    this.algoTabs = document.querySelectorAll('.algo-tab-btn');

    // Meta & Complexities
    this.algoTitle = document.getElementById('sortingAlgoTitle');
    this.algoCategory = document.getElementById('sortingAlgoCategory');
    this.algoDesc = document.getElementById('sortingAlgoDesc');
    this.timeBest = document.getElementById('compTimeBest');
    this.timeAvg = document.getElementById('compTimeAvg');
    this.timeWorst = document.getElementById('compTimeWorst');
    this.spaceComp = document.getElementById('compSpace');

    // Stats
    this.statComparisons = document.getElementById('statComparisons');
    this.statSwaps = document.getElementById('statSwaps');
    this.statAccesses = document.getElementById('statAccesses');
    this.statPass = document.getElementById('statPass');
    this.statProgress = document.getElementById('statProgress');
    this.statProgressBar = document.getElementById('statProgressBar');
    this.statStepCounter = document.getElementById('statStepCounter');
    this.statusBadge = document.getElementById('sortingStatusBadge');
  }

  init() {
    if (!this.canvas) return;

    this.bindEvents();
    this.updateAlgorithmMeta(this.currentAlgo);
    this.generateNewArray();
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

    // 2. Algorithm Dropdown (Mobile / Alternative)
    this.algoSelectDropdown?.addEventListener('change', (e) => {
      this.setAlgorithm(e.target.value);
    });

    // 3. Playback Controls
    this.startBtn?.addEventListener('click', () => this.start());
    this.pauseBtn?.addEventListener('click', () => this.pause());
    this.resumeBtn?.addEventListener('click', () => this.resume());
    this.resetBtn?.addEventListener('click', () => this.reset());
    this.nextBtn?.addEventListener('click', () => this.nextStep());
    this.prevBtn?.addEventListener('click', () => this.prevStep());

    // 4. Random Array Generator
    this.randomBtn?.addEventListener('click', () => {
      this.generateNewArray();
    });

    // 5. Custom Array Input
    this.applyCustomBtn?.addEventListener('click', () => {
      this.applyCustomArray();
    });

    this.customInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.applyCustomArray();
      }
    });

    // Quick Preset Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.getAttribute('data-preset');
        this.applyPreset(preset);
      });
    });

    // 6. Sliders
    this.speedSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      // Map slider (1 to 100) inversely to ms delay (800ms down to 30ms)
      this.speed = Math.round(850 - (val / 100) * 800);
      if (this.speedLabel) {
        this.speedLabel.textContent = `${(val / 10).toFixed(1)}x`;
      }
    });

    this.sizeSlider?.addEventListener('input', (e) => {
      const size = parseInt(e.target.value, 10);
      if (this.sizeLabel) this.sizeLabel.textContent = size;
    });

    this.sizeSlider?.addEventListener('change', () => {
      this.generateNewArray();
    });

    this.minValueInput?.addEventListener('change', () => {
      this.validateMinMax();
      this.generateNewArray();
    });

    this.maxValueInput?.addEventListener('change', () => {
      this.validateMinMax();
      this.generateNewArray();
    });
  }

  validateMinMax() {
    let min = parseInt(this.minValueInput?.value || '-20', 10);
    let max = parseInt(this.maxValueInput?.value || '100', 10);
    if (isNaN(min)) min = 5;
    if (isNaN(max)) max = 100;
    if (min >= max) {
      max = min + 10;
      if (this.maxValueInput) this.maxValueInput.value = max;
    }
  }

  setAlgorithm(algoKey) {
    if (!ALGORITHM_INFO[algoKey]) return;
    this.pause();
    this.currentAlgo = algoKey;

    // Update Tab UI
    this.algoTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-algo') === algoKey);
    });

    // Sync dropdown
    if (this.algoSelectDropdown) {
      this.algoSelectDropdown.value = algoKey;
    }

    this.updateAlgorithmMeta(algoKey);
    this.recomputeTrace();
  }

  updateAlgorithmMeta(algoKey) {
    const info = ALGORITHM_INFO[algoKey];
    if (!info) return;

    if (this.algoTitle) this.algoTitle.textContent = info.name;
    if (this.algoCategory) this.algoCategory.textContent = info.category;
    if (this.algoDesc) this.algoDesc.textContent = info.description;

    if (this.timeBest) this.timeBest.textContent = info.complexities.best;
    if (this.timeAvg) this.timeAvg.textContent = info.complexities.average;
    if (this.timeWorst) this.timeWorst.textContent = info.complexities.worst;
    if (this.spaceComp) this.spaceComp.textContent = info.complexities.space;

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

  generateNewArray() {
    this.pause();
    this.clearError();

    const size = parseInt(this.sizeSlider?.value || '12', 10);
    const min = parseInt(this.minValueInput?.value || '5', 10);
    const max = parseInt(this.maxValueInput?.value || '95', 10);

    const newArr = [];
    for (let i = 0; i < size; i++) {
      const val = Math.floor(Math.random() * (max - min + 1)) + min;
      newArr.push(val);
    }

    this.rawArray = newArr;
    if (this.customInput) {
      this.customInput.value = this.rawArray.join(', ');
    }

    this.recomputeTrace();
  }

  applyPreset(presetType) {
    this.pause();
    this.clearError();

    let arr = [];
    switch (presetType) {
      case 'reverse':
        arr = [90, 75, 62, 50, 42, 33, 25, 18, 9, 2];
        break;
      case 'sorted':
        arr = [3, 8, 15, 22, 34, 48, 59, 70, 85, 96];
        break;
      case 'duplicates':
        arr = [35, 12, 45, 12, 60, 35, 12, 80, 45, 35];
        break;
      case 'negatives':
        arr = [-25, 18, -8, 42, 0, -15, 30, -3, 12, -30];
        break;
      case 'single':
        arr = [42];
        break;
      default:
        arr = [38, 27, 43, 3, 9, 82, 10, 19, 50];
    }

    this.rawArray = arr;
    if (this.customInput) {
      this.customInput.value = this.rawArray.join(', ');
    }
    if (this.sizeSlider) {
      this.sizeSlider.value = arr.length;
      if (this.sizeLabel) this.sizeLabel.textContent = arr.length;
    }

    this.recomputeTrace();
  }

  applyCustomArray() {
    const rawStr = this.customInput?.value || '';
    if (!rawStr.trim()) {
      this.showError('Input cannot be empty. Please enter comma-separated numbers.');
      return;
    }

    const tokens = rawStr.split(/[\s,]+/).filter(t => t.length > 0);
    const parsed = [];

    for (const token of tokens) {
      const num = Number(token);
      if (isNaN(num)) {
        this.showError(`Invalid number: "${token}". Only valid integers/floats allowed.`);
        return;
      }
      parsed.push(Math.round(num));
    }

    if (parsed.length === 0) {
      this.showError('No valid numbers provided.');
      return;
    }

    if (parsed.length > 50) {
      this.showError('Maximum 50 numbers allowed for optimal visualization.');
      return;
    }

    this.clearError();
    this.pause();
    this.rawArray = parsed;
    if (this.sizeSlider) {
      this.sizeSlider.value = parsed.length;
      if (this.sizeLabel) this.sizeLabel.textContent = parsed.length;
    }

    this.recomputeTrace();
  }

  showError(msg) {
    if (this.customInputError) {
      this.customInputError.textContent = msg;
      this.customInputError.style.display = 'block';
    }
  }

  clearError() {
    if (this.customInputError) {
      this.customInputError.textContent = '';
      this.customInputError.style.display = 'none';
    }
  }

  recomputeTrace() {
    this.trace = getAlgorithmTrace(this.currentAlgo, this.rawArray);
    this.currentStep = 0;
    this.renderCurrentStep();
    this.updateControlsState();
  }

  renderCurrentStep() {
    if (!this.trace || this.trace.length === 0) return;
    const step = this.trace[this.currentStep];
    if (!step) return;

    this.renderBars(step);
    this.updateStats(step);
    this.highlightCppLine(step.line);

    if (this.stepExplanation) {
      this.stepExplanation.textContent = step.explanation;
    }
  }

  /**
   * Render Vertical Bars with complete negative and positive number handling.
   */
  renderBars(step) {
    if (!this.canvas) return;
    this.canvas.innerHTML = '';

    const arr = step.array;
    const n = arr.length;
    if (n === 0) return;

    // Calculate dynamic range
    let minVal = Math.min(...arr);
    let maxVal = Math.max(...arr);

    const hasNegatives = minVal < 0;
    if (minVal > 0) minVal = 0; // Baseline at 0 for all-positive arrays
    if (maxVal < 0) maxVal = 0;

    const span = Math.max(1, maxVal - minVal);
    // Percentage from bottom where 0 sits
    const zeroPercent = ((0 - minVal) / span) * 100;

    // Optional zero-baseline guide if negatives exist
    if (hasNegatives) {
      const zeroLine = document.createElement('div');
      zeroLine.className = 'canvas-zero-line';
      zeroLine.style.bottom = `${zeroPercent}%`;
      this.canvas.appendChild(zeroLine);
    }

    const comparedSet = new Set(step.comparedIndices || []);
    const swappedSet = new Set(step.swappedIndices || []);
    const sortedSet = new Set(step.sortedIndices || []);
    const pivot = step.pivotIndex;
    const range = step.rangeIndices; // [start, end]

    // Create bar elements
    arr.forEach((val, idx) => {
      const barWrapper = document.createElement('div');
      barWrapper.className = 'bar-wrapper';

      const barPillar = document.createElement('div');
      barPillar.className = 'bar-pillar';

      // Determine bar status class
      if (pivot === idx) {
        barPillar.classList.add('bar-pivot');
      } else if (swappedSet.has(idx)) {
        barPillar.classList.add('bar-swapped');
      } else if (comparedSet.has(idx)) {
        barPillar.classList.add('bar-compared');
      } else if (sortedSet.has(idx)) {
        barPillar.classList.add('bar-sorted');
      } else if (range && idx >= range[0] && idx <= range[1]) {
        barPillar.classList.add('bar-in-range');
      } else {
        barPillar.classList.add('bar-normal');
      }

      // Height and Positioning calculation
      const valPercent = (Math.abs(val) / span) * 100;
      // Minimum visual height of 18px so value label always fits
      const finalHeight = `max(22px, ${valPercent * 0.85}%)`;

      if (val >= 0) {
        barPillar.style.bottom = `${zeroPercent}%`;
        barPillar.style.height = finalHeight;
        barPillar.classList.add('positive');
      } else {
        barPillar.style.top = `${100 - zeroPercent}%`;
        barPillar.style.height = finalHeight;
        barPillar.classList.add('negative');
      }

      // Value label on bar
      const valLabel = document.createElement('span');
      valLabel.className = 'bar-val-label';
      valLabel.textContent = val;
      barPillar.appendChild(valLabel);

      // Index label below baseline
      const idxLabel = document.createElement('span');
      idxLabel.className = 'bar-idx-label';
      idxLabel.textContent = idx;

      barWrapper.appendChild(barPillar);
      barWrapper.appendChild(idxLabel);
      this.canvas.appendChild(barWrapper);
    });
  }

  updateStats(step) {
    if (this.statComparisons) this.statComparisons.textContent = step.comparisons;
    if (this.statSwaps) this.statSwaps.textContent = step.swaps;
    if (this.statAccesses) this.statAccesses.textContent = step.arrayAccesses;
    if (this.statPass) this.statPass.textContent = step.pass || 1;

    const totalSteps = this.trace.length;
    const progress = totalSteps <= 1 ? 100 : Math.round((this.currentStep / (totalSteps - 1)) * 100);

    if (this.statProgress) this.statProgress.textContent = `${progress}%`;
    if (this.statProgressBar) this.statProgressBar.style.width = `${progress}%`;
    if (this.statStepCounter) {
      this.statStepCounter.textContent = `Step ${this.currentStep + 1} of ${totalSteps}`;
    }

    // Status Badge
    if (this.statusBadge) {
      if (this.currentStep === totalSteps - 1) {
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
