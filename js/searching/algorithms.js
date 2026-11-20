/**
 * AlgoVision — Searching Algorithms & Execution Trace Generator
 * Supports: Linear Search, Binary Search.
 * Generates an immutable, step-by-step ordered execution trace.
 */

export const SEARCH_ALGORITHM_INFO = {
  linear: {
    id: 'linear',
    name: 'Linear Search',
    category: 'Sequential Search',
    description: 'Sequentially checks each element of the list in order until a match is found or the whole list has been searched. Does not require the array to be sorted.',
    complexities: {
      best: 'O(1)',
      average: 'O(N)',
      worst: 'O(N)',
      space: 'O(1)'
    },
    cppCode: [
      'int linearSearch(const vector<int>& arr, int target) {',
      '    int n = arr.size();',
      '    for (int i = 0; i < n; i++) {',
      '        if (arr[i] == target) {',
      '            return i; // Target found',
      '        }',
      '    }',
      '    return -1; // Target not found',
      '}'
    ]
  },
  binary: {
    id: 'binary',
    name: 'Binary Search',
    category: 'Interval Search (Divide and Conquer)',
    description: 'Repeatedly divides the search interval in half on a sorted collection. Compares the target to the middle element and eliminates half of the remaining elements at each step.',
    complexities: {
      best: 'O(1)',
      average: 'O(log N)',
      worst: 'O(log N)',
      space: 'O(1)'
    },
    cppCode: [
      'int binarySearch(const vector<int>& arr, int target) {',
      '    int low = 0;',
      '    int high = arr.size() - 1;',
      '    while (low <= high) {',
      '        int mid = low + (high - low) / 2;',
      '        if (arr[mid] == target)',
      '            return mid; // Target found',
      '        if (arr[mid] < target)',
      '            low = mid + 1; // Discard left half',
      '        else',
      '            high = mid - 1; // Discard right half',
      '    }',
      '    return -1; // Target not found',
      '}'
    ]
  }
};

/**
 * Creates an immutable trace step object for searching.
 */
function createSearchStep({
  array,
  target,
  currentIndex = null,
  low = null,
  high = null,
  mid = null,
  eliminatedIndices = [],
  foundIndex = null,
  isFound = false,
  comparisonCount = 0,
  comparisonResult = null, // 'equal' | 'less' | 'greater' | 'none'
  type = 'normal', // 'start' | 'compare' | 'eliminate' | 'found' | 'not-found'
  explanation = '',
  line = 1
}) {
  return {
    array: [...array],
    target,
    currentIndex,
    low,
    high,
    mid,
    eliminatedIndices: [...eliminatedIndices],
    foundIndex,
    isFound,
    comparisonCount,
    comparisonResult,
    type,
    explanation,
    line
  };
}

/**
 * 1. Linear Search Trace Generator
 */
export function generateLinearSearchTrace(initialArray, target) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisonCount = 0;

  trace.push(createSearchStep({
    array: arr,
    target,
    explanation: n === 0 ? 'Array is empty. Target cannot be found.' : `Starting Linear Search for target ${target}.`,
    line: 1,
    type: 'start'
  }));

  if (n === 0) {
    trace.push(createSearchStep({
      array: arr,
      target,
      isFound: false,
      foundIndex: -1,
      explanation: `Target ${target} was not found (array is empty).`,
      line: 8,
      type: 'not-found'
    }));
    return trace;
  }

  for (let i = 0; i < n; i++) {
    comparisonCount++;
    const currentVal = arr[i];
    const isMatch = currentVal === target;

    trace.push(createSearchStep({
      array: arr,
      target,
      currentIndex: i,
      comparisonCount,
      comparisonResult: isMatch ? 'equal' : 'not-equal',
      type: 'compare',
      explanation: `Index ${i}: Comparing element ${currentVal} with target ${target}.`,
      line: 4
    }));

    if (isMatch) {
      trace.push(createSearchStep({
        array: arr,
        target,
        currentIndex: i,
        foundIndex: i,
        isFound: true,
        comparisonCount,
        comparisonResult: 'equal',
        type: 'found',
        explanation: `Target ${target} successfully found at index ${i}!`,
        line: 5
      }));
      return trace;
    }
  }

  trace.push(createSearchStep({
    array: arr,
    target,
    isFound: false,
    foundIndex: -1,
    comparisonCount,
    type: 'not-found',
    explanation: `Target ${target} was not found after checking all ${n} elements.`,
    line: 8
  }));

  return trace;
}

/**
 * 2. Binary Search Trace Generator
 */
export function generateBinarySearchTrace(initialArray, target) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisonCount = 0;
  let low = 0;
  let high = n - 1;
  const eliminated = new Set();

  trace.push(createSearchStep({
    array: arr,
    target,
    low: n > 0 ? 0 : null,
    high: n > 0 ? n - 1 : null,
    explanation: n === 0 ? 'Array is empty. Cannot perform Binary Search.' : `Starting Binary Search for target ${target}. Initial range [0..${n - 1}].`,
    line: 1,
    type: 'start'
  }));

  if (n === 0) {
    trace.push(createSearchStep({
      array: arr,
      target,
      isFound: false,
      foundIndex: -1,
      explanation: `Target ${target} not found in empty array.`,
      line: 13,
      type: 'not-found'
    }));
    return trace;
  }

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const midVal = arr[mid];

    trace.push(createSearchStep({
      array: arr,
      target,
      low,
      high,
      mid,
      eliminatedIndices: Array.from(eliminated),
      comparisonCount,
      type: 'range',
      explanation: `Active search interval [low=${low}, high=${high}]. Middle index chosen: mid=${mid} (value: ${midVal}).`,
      line: 5
    }));

    comparisonCount++;

    if (midVal === target) {
      trace.push(createSearchStep({
        array: arr,
        target,
        low,
        high,
        mid,
        currentIndex: mid,
        foundIndex: mid,
        isFound: true,
        eliminatedIndices: Array.from(eliminated),
        comparisonCount,
        comparisonResult: 'equal',
        type: 'found',
        explanation: `Target ${target} matched middle element arr[${mid}] (${midVal})! Search complete.`,
        line: 7
      }));
      return trace;
    }

    if (midVal < target) {
      // Eliminate left side including mid
      for (let k = low; k <= mid; k++) {
        eliminated.add(k);
      }
      const prevLow = low;
      low = mid + 1;

      trace.push(createSearchStep({
        array: arr,
        target,
        low,
        high,
        mid,
        eliminatedIndices: Array.from(eliminated),
        comparisonCount,
        comparisonResult: 'less',
        type: 'eliminate',
        explanation: `arr[mid] (${midVal}) < target (${target}). Eliminating left portion [${prevLow}..${mid}]. Updating low to ${low}.`,
        line: 9
      }));
    } else {
      // Eliminate right side including mid
      for (let k = mid; k <= high; k++) {
        eliminated.add(k);
      }
      const prevHigh = high;
      high = mid - 1;

      trace.push(createSearchStep({
        array: arr,
        target,
        low,
        high,
        mid,
        eliminatedIndices: Array.from(eliminated),
        comparisonCount,
        comparisonResult: 'greater',
        type: 'eliminate',
        explanation: `arr[mid] (${midVal}) > target (${target}). Eliminating right portion [${mid}..${prevHigh}]. Updating high to ${high}.`,
        line: 11
      }));
    }
  }

  // Not found
  trace.push(createSearchStep({
    array: arr,
    target,
    low,
    high,
    eliminatedIndices: Array.from({ length: n }, (_, i) => i),
    isFound: false,
    foundIndex: -1,
    comparisonCount,
    type: 'not-found',
    explanation: `Search range exhausted (low=${low} > high=${high}). Target ${target} does not exist in array.`,
    line: 13
  }));

  return trace;
}

/**
 * Helper to check if an array is sorted in ascending order.
 */
export function isArraySorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

/**
 * Dispatcher to generate trace for searching.
 */
export function getSearchTrace(algorithmKey, array, target) {
  if (algorithmKey === 'binary') {
    return generateBinarySearchTrace(array, target);
  }
  return generateLinearSearchTrace(array, target);
}
