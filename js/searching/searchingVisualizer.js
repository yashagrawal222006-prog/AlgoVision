/**
 * AlgoVision — Searching Visualizer Workspace Controller
 * Orchestrates trace execution, array visualization with pointer tracking,
 * statistics updates, C++ code highlighting, input validation, and interactive playback.
 */

import { SEARCH_ALGORITHM_INFO, getSearchTrace, isArraySorted } from './algorithms.js';

export class SearchingVisualizer {
  constructor() {
    this.currentAlgo = 'linear';
    this.rawArray = [12, 24, 35, 47, 53, 68, 72, 85, 91, 104];
    this.target = 53;
    this.trace = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.timer = null;
    this.speed = 350;

    this.cacheDomElements();
    this.init();
  }

  cacheDomElements() {
    this.canvas = document.getElementById('searchingBarsCanvas');
    this.stepExplanation = document.getElementById('searchingStepExplanation');
    this.cppCodeContainer = document.getElementById('searchingCppCode');

    // Controls
    this.startBtn = document.getElementById('searchStartBtn');
    this.pauseBtn = document.getElementById('searchPauseBtn');
    this.resumeBtn = document.getElementById('searchResumeBtn');
    this.resetBtn = document.getElementById('searchResetBtn');
    this.prevBtn = document.getElementById('searchPrevBtn');
    this.nextBtn = document.getElementById('searchNextBtn');
    this.randomBtn = document.getElementById('searchRandomBtn');
    this.applyCustomBtn = document.getElementById('searchApplyCustomBtn');
    this.sortArrayBtn = document.getElementById('searchSortArrayBtn');
    this.customInput = document.getElementById('searchCustomInput');
    this.targetInput = document.getElementById('searchTargetInput');
    this.applyTargetBtn = document.getElementById('searchApplyTargetBtn');
    this.customInputError = document.getElementById('searchCustomInputError');

    // Algorithm Selection Tabs & Dropdown
    this.algoTabs = document.querySelectorAll('.search-algo-tab-btn');
    this.algoSelectDropdown = document.getElementById('searchAlgoSelect');

    // Speed Slider
    this.speedSlider = document.getElementById('searchSpeedSlider');
    this.speedLabel = document.getElementById('searchSpeedLabel');

    // Meta & Complexities
    this.algoTitle = document.getElementById('searchAlgoTitle');
    this.algoCategory = document.getElementById('searchAlgoCategory');
    this.algoDesc = document.getElementById('searchAlgoDesc');
    this.timeBest = document.getElementById('searchCompTimeBest');
    this.timeAvg = document.getElementById('searchCompTimeAvg');
    this.timeWorst = document.getElementById('searchCompTimeWorst');
    this.spaceComp = document.getElementById('searchCompSpace');

    // Statistics
    this.statComparisons = document.getElementById('searchStatComparisons');
    this.statSteps = document.getElementById('searchStatSteps');
    this.statCurrentIndex = document.getElementById('searchStatCurrentIndex');
    this.statSearchRange = document.getElementById('searchStatSearchRange');
    this.statTargetStatus = document.getElementById('searchStatTargetStatus');
    this.statFinalIndex = document.getElementById('searchStatFinalIndex');
    this.statStepCounter = document.getElementById('searchStepCounter');
    this.statusBadge = document.getElementById('searchStatusBadge');
  }

  init() {
    if (!this.canvas) return;

    this.bindEvents();
    this.updateAlgorithmMeta(this.currentAlgo);
    this.updateInputFields();
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

    // 6. Target Value Input
    this.applyTargetBtn?.addEventListener('click', () => {
      this.applyTargetValue();
    });

    this.targetInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.applyTargetValue();
      }
    });

    // 7. Sort Array Button (Offered when binary search detects unsorted array)
    this.sortArrayBtn?.addEventListener('click', () => {
      this.sortCurrentArray();
    });

    // 8. Preset Chips
    document.querySelectorAll('.search-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.getAttribute('data-preset');
        this.applyPreset(preset);
      });
    });

    // 9. Speed Slider
    this.speedSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.speed = Math.round(900 - (val / 100) * 820);
      if (this.speedLabel) {
        this.speedLabel.textContent = `${(val / 10).toFixed(1)}x`;
      }
    });
  }

  updateInputFields() {
    if (this.customInput) {
      this.customInput.value = this.rawArray.join(', ');
    }
    if (this.targetInput) {
      this.targetInput.value = this.target;
    }
  }

  setAlgorithm(algoKey) {
    if (!SEARCH_ALGORITHM_INFO[algoKey]) return;
    this.pause();
    this.currentAlgo = algoKey;

    this.algoTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-algo') === algoKey);
    });

    if (this.algoSelectDropdown) {
      this.algoSelectDropdown.value = algoKey;
    }

    this.updateAlgorithmMeta(algoKey);
    this.checkBinarySearchSortingRequirement();
    this.recomputeTrace();
  }

  updateAlgorithmMeta(algoKey) {
    const info = SEARCH_ALGORITHM_INFO[algoKey];
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

  checkBinarySearchSortingRequirement() {
    if (this.currentAlgo === 'binary') {
      const sorted = isArraySorted(this.rawArray);
      if (!sorted && this.rawArray.length > 1) {
        this.showError('Binary Search requires a sorted array in ascending order.', true);
        return false;
      }
    }
    this.clearError();
    return true;
  }

  showError(msg, showSortOption = false) {
    if (this.customInputError) {
      this.customInputError.innerHTML = '';
      const textSpan = document.createElement('span');
      textSpan.textContent = msg;
      this.customInputError.appendChild(textSpan);

      if (showSortOption && this.sortArrayBtn) {
        this.sortArrayBtn.style.display = 'inline-flex';
      }
      this.customInputError.style.display = 'flex';
    }
  }

  clearError() {
    if (this.customInputError) {
      this.customInputError.textContent = '';
      this.customInputError.style.display = 'none';
      if (this.sortArrayBtn) {
        this.sortArrayBtn.style.display = 'none';
      }
    }
  }

  sortCurrentArray() {
    this.rawArray = [...this.rawArray].sort((a, b) => a - b);
    this.updateInputFields();
    this.clearError();
    this.recomputeTrace();
  }

  generateNewArray() {
    this.pause();
    this.clearError();

    const size = 10;
    const isBinary = this.currentAlgo === 'binary';
    const arr = [];
    const min = 5;
    const max = 95;

    for (let i = 0; i < size; i++) {
      const val = Math.floor(Math.random() * (max - min + 1)) + min;
      arr.push(val);
    }

    if (isBinary) {
      arr.sort((a, b) => a - b);
    }

    this.rawArray = arr;
    // Pick a random target (either an existing item or external item)
    if (Math.random() > 0.3 && arr.length > 0) {
      this.target = arr[Math.floor(Math.random() * arr.length)];
    } else {
      this.target = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    this.updateInputFields();
    this.recomputeTrace();
  }

  applyPreset(presetType) {
    this.pause();
    this.clearError();

    switch (presetType) {
      case 'found':
        this.rawArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        this.target = 70;
        break;
      case 'notfound':
        this.rawArray = [14, 25, 33, 48, 52, 67, 79, 88, 95];
        this.target = 50;
        break;
      case 'duplicates':
        this.rawArray = [12, 25, 25, 25, 40, 55, 60, 75];
        this.target = 25;
        break;
      case 'negatives':
        this.rawArray = [-35, -20, -8, 0, 15, 28, 44, 60];
        this.target = -8;
        break;
      case 'single':
        this.rawArray = [42];
        this.target = 42;
        break;
      case 'empty':
        this.rawArray = [];
        this.target = 10;
        break;
      default:
        this.rawArray = [10, 25, 38, 45, 60, 72, 88, 95];
        this.target = 45;
    }

    if (this.currentAlgo !== 'binary' && presetType === 'duplicates') {
      this.rawArray = [40, 25, 60, 25, 12, 75, 25, 55];
    }

    this.updateInputFields();
    this.checkBinarySearchSortingRequirement();
    this.recomputeTrace();
  }

  applyCustomArray() {
    const rawStr = this.customInput?.value || '';
    if (!rawStr.trim()) {
      this.rawArray = [];
      this.updateInputFields();
      this.recomputeTrace();
      return;
    }

    const tokens = rawStr.split(/[\s,]+/).filter(t => t.length > 0);
    const parsed = [];

    for (const token of tokens) {
      const num = Number(token);
      if (isNaN(num)) {
        this.showError(`Invalid number: "${token}". Only valid numbers allowed.`);
        return;
      }
      parsed.push(Math.round(num));
    }

    if (parsed.length > 40) {
      this.showError('Maximum 40 elements allowed for optimal visualization.');
      return;
    }

    this.clearError();
    this.pause();
    this.rawArray = parsed;
    this.checkBinarySearchSortingRequirement();
    this.recomputeTrace();
  }

  applyTargetValue() {
    const rawVal = this.targetInput?.value;
    const num = Number(rawVal);
    if (isNaN(num) || rawVal === '') {
      this.showError('Please enter a valid numeric target value.');
      return;
    }

    this.clearError();
    this.pause();
    this.target = Math.round(num);
    this.recomputeTrace();
  }

  recomputeTrace() {
    this.trace = getSearchTrace(this.currentAlgo, this.rawArray, this.target);
    this.currentStep = 0;
    this.renderCurrentStep();
    this.updateControlsState();
  }

  renderCurrentStep() {
    if (!this.trace || this.trace.length === 0) return;
    const step = this.trace[this.currentStep];
    if (!step) return;

    this.renderVisuals(step);
    this.updateStats(step);
    this.highlightCppLine(step.line);

    if (this.stepExplanation) {
      this.stepExplanation.textContent = step.explanation;
    }
  }

  renderVisuals(step) {
    if (!this.canvas) return;
    this.canvas.innerHTML = '';

    const arr = step.array;
    const n = arr.length;

    if (n === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'search-empty-canvas-msg';
      emptyMsg.textContent = 'Array is empty. Add elements above to search.';
      this.canvas.appendChild(emptyMsg);
      return;
    }

    // Dynamic Range calculation for vertical bars
    let minVal = Math.min(...arr);
    let maxVal = Math.max(...arr);
    const hasNegatives = minVal < 0;
    if (minVal > 0) minVal = 0;
    if (maxVal < 0) maxVal = 0;
    const span = Math.max(1, maxVal - minVal);
    const zeroPercent = ((0 - minVal) / span) * 100;

    if (hasNegatives) {
      const zeroLine = document.createElement('div');
      zeroLine.className = 'canvas-zero-line';
      zeroLine.style.bottom = `${zeroPercent}%`;
      this.canvas.appendChild(zeroLine);
    }

    const isBinary = this.currentAlgo === 'binary';
    const eliminatedSet = new Set(step.eliminatedIndices || []);

    arr.forEach((val, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'search-item-wrapper';

      // Pointer Labels (for Low, High, Mid)
      const pointerContainer = document.createElement('div');
      pointerContainer.className = 'search-pointer-container';

      if (isBinary) {
        if (step.low === idx && step.high === idx && step.mid === idx) {
          const badge = document.createElement('span');
          badge.className = 'pointer-badge all';
          badge.textContent = 'L/M/H';
          pointerContainer.appendChild(badge);
        } else {
          if (step.low === idx) {
            const badge = document.createElement('span');
            badge.className = 'pointer-badge low';
            badge.textContent = 'LOW';
            pointerContainer.appendChild(badge);
          }
          if (step.mid === idx) {
            const badge = document.createElement('span');
            badge.className = 'pointer-badge mid';
            badge.textContent = 'MID';
            pointerContainer.appendChild(badge);
          }
          if (step.high === idx) {
            const badge = document.createElement('span');
            badge.className = 'pointer-badge high';
            badge.textContent = 'HIGH';
            pointerContainer.appendChild(badge);
          }
        }
      } else {
        if (step.currentIndex === idx) {
          const badge = document.createElement('span');
          badge.className = 'pointer-badge current';
          badge.textContent = 'CUR';
          pointerContainer.appendChild(badge);
        }
      }

      // Bar Pillar
      const pillar = document.createElement('div');
      pillar.className = 'search-bar-pillar';

      // Class assignment based on step status
      if (step.foundIndex === idx) {
        pillar.classList.add('search-found');
      } else if (step.currentIndex === idx || (isBinary && step.mid === idx)) {
        pillar.classList.add('search-active');
      } else if (eliminatedSet.has(idx)) {
        pillar.classList.add('search-eliminated');
      } else if (isBinary && step.low !== null && step.high !== null && idx >= step.low && idx <= step.high) {
        pillar.classList.add('search-in-range');
      } else {
        pillar.classList.add('search-normal');
      }

      // Height
      const valPercent = (Math.abs(val) / span) * 100;
      const finalHeight = `max(24px, ${valPercent * 0.85}%)`;

      if (val >= 0) {
        pillar.style.bottom = `${zeroPercent}%`;
        pillar.style.height = finalHeight;
        pillar.classList.add('positive');
      } else {
        pillar.style.top = `${100 - zeroPercent}%`;
        pillar.style.height = finalHeight;
        pillar.classList.add('negative');
      }

      // Value Label inside bar
      const valLabel = document.createElement('span');
      valLabel.className = 'search-val-label';
      valLabel.textContent = val;
      pillar.appendChild(valLabel);

      // Index Label at bottom
      const idxLabel = document.createElement('span');
      idxLabel.className = 'search-idx-label';
      idxLabel.textContent = idx;

      wrapper.appendChild(pointerContainer);
      wrapper.appendChild(pillar);
      wrapper.appendChild(idxLabel);
      this.canvas.appendChild(wrapper);
    });
  }

  updateStats(step) {
    if (this.statComparisons) this.statComparisons.textContent = step.comparisonCount;
    if (this.statSteps) this.statSteps.textContent = this.currentStep;

    // Current Index
    if (this.statCurrentIndex) {
      if (this.currentAlgo === 'binary') {
        this.statCurrentIndex.textContent = step.mid !== null ? `mid=${step.mid}` : 'None';
      } else {
        this.statCurrentIndex.textContent = step.currentIndex !== null ? `i=${step.currentIndex}` : 'None';
      }
    }

    // Search Range
    if (this.statSearchRange) {
      if (this.currentAlgo === 'binary') {
        this.statSearchRange.textContent = (step.low !== null && step.high !== null)
          ? `[${step.low} .. ${step.high}]`
          : 'None';
      } else {
        const total = step.array.length;
        this.statSearchRange.textContent = step.currentIndex !== null
          ? `${step.currentIndex + 1} / ${total}`
          : `0 / ${total}`;
      }
    }

    // Target Status & Final Index
    if (this.statTargetStatus) {
      if (step.isFound) {
        this.statTargetStatus.textContent = 'Found';
        this.statTargetStatus.className = 'stat-chip success';
      } else if (step.type === 'not-found') {
        this.statTargetStatus.textContent = 'Not Found';
        this.statTargetStatus.className = 'stat-chip failure';
      } else {
        this.statTargetStatus.textContent = 'Searching...';
        this.statTargetStatus.className = 'stat-chip searching';
      }
    }

    if (this.statFinalIndex) {
      if (step.foundIndex !== null && step.foundIndex !== -1) {
        this.statFinalIndex.textContent = `Index ${step.foundIndex}`;
      } else if (step.type === 'not-found') {
        this.statFinalIndex.textContent = '-1';
      } else {
        this.statFinalIndex.textContent = 'Pending';
      }
    }

    const totalSteps = this.trace.length;
    if (this.statStepCounter) {
      this.statStepCounter.textContent = `Step ${this.currentStep + 1} of ${totalSteps}`;
    }

    // Status Badge
    if (this.statusBadge) {
      if (step.isFound) {
        this.statusBadge.textContent = 'Target Found';
        this.statusBadge.className = 'status-badge-chip ready';
      } else if (step.type === 'not-found') {
        this.statusBadge.textContent = 'Completed (Not Found)';
        this.statusBadge.className = 'status-badge-chip in-progress';
      } else if (this.isPlaying) {
        this.statusBadge.textContent = 'Searching';
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
        labelSpan.textContent = isAtEnd ? 'Restart Search' : 'Start Search';
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
