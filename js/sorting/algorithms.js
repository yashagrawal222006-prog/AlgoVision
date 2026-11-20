/**
 * AlgoVision — Sorting Algorithms & Execution Trace Generator
 * Supports: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort.
 * Generates an immutable, step-by-step ordered execution trace for reversible playback.
 */

export const ALGORITHM_INFO = {
  bubble: {
    id: 'bubble',
    name: 'Bubble Sort',
    category: 'Comparison-based Sorting',
    description: 'Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. Larger elements bubble up to the end of the array with each pass.',
    complexities: {
      best: 'O(N)',
      average: 'O(N²)',
      worst: 'O(N²)',
      space: 'O(1)'
    },
    cppCode: [
      'void bubbleSort(vector<int>& arr) {',
      '    int n = arr.size();',
      '    for (int i = 0; i < n - 1; i++) {',
      '        bool swapped = false;',
      '        for (int j = 0; j < n - i - 1; j++) {',
      '            if (arr[j] > arr[j + 1]) {',
      '                swap(arr[j], arr[j + 1]);',
      '                swapped = true;',
      '            }',
      '        }',
      '        if (!swapped) break;',
      '    }',
      '}'
    ]
  },
  selection: {
    id: 'selection',
    name: 'Selection Sort',
    category: 'Comparison-based Sorting',
    description: 'Divides the list into a sorted and unsorted region. Repeatedly finds the minimum element from the unsorted region and swaps it into its final sorted position at the beginning.',
    complexities: {
      best: 'O(N²)',
      average: 'O(N²)',
      worst: 'O(N²)',
      space: 'O(1)'
    },
    cppCode: [
      'void selectionSort(vector<int>& arr) {',
      '    int n = arr.size();',
      '    for (int i = 0; i < n - 1; i++) {',
      '        int minIdx = i;',
      '        for (int j = i + 1; j < n; j++) {',
      '            if (arr[j] < arr[minIdx]) {',
      '                minIdx = j;',
      '            }',
      '        }',
      '        if (minIdx != i) {',
      '            swap(arr[i], arr[minIdx]);',
      '        }',
      '    }',
      '}'
    ]
  },
  insertion: {
    id: 'insertion',
    name: 'Insertion Sort',
    category: 'Comparison-based Sorting',
    description: 'Builds the final sorted array one element at a time. Takes each element and repeatedly shifts greater elements to the right to insert the key into its correct sorted position.',
    complexities: {
      best: 'O(N)',
      average: 'O(N²)',
      worst: 'O(N²)',
      space: 'O(1)'
    },
    cppCode: [
      'void insertionSort(vector<int>& arr) {',
      '    int n = arr.size();',
      '    for (int i = 1; i < n; i++) {',
      '        int key = arr[i];',
      '        int j = i - 1;',
      '        while (j >= 0 && arr[j] > key) {',
      '            arr[j + 1] = arr[j];',
      '            j--;',
      '        }',
      '        arr[j + 1] = key;',
      '    }',
      '}'
    ]
  },
  merge: {
    id: 'merge',
    name: 'Merge Sort',
    category: 'Divide and Conquer',
    description: 'A recursive divide-and-conquer algorithm. Divides the array into two halves, recursively sorts them, and then merges the two sorted halves back into a single ordered array.',
    complexities: {
      best: 'O(N log N)',
      average: 'O(N log N)',
      worst: 'O(N log N)',
      space: 'O(N)'
    },
    cppCode: [
      'void merge(vector<int>& arr, int l, int m, int r) {',
      '    vector<int> left(arr.begin() + l, arr.begin() + m + 1);',
      '    vector<int> right(arr.begin() + m + 1, arr.begin() + r + 1);',
      '    int i = 0, j = 0, k = l;',
      '    while (i < left.size() && j < right.size()) {',
      '        if (left[i] <= right[j]) arr[k++] = left[i++];',
      '        else arr[k++] = right[j++];',
      '    }',
      '    while (i < left.size()) arr[k++] = left[i++];',
      '    while (j < right.size()) arr[k++] = right[j++];',
      '}',
      'void mergeSort(vector<int>& arr, int l, int r) {',
      '    if (l < r) {',
      '        int m = l + (r - l) / 2;',
      '        mergeSort(arr, l, m);',
      '        mergeSort(arr, m + 1, r);',
      '        merge(arr, l, m, r);',
      '    }',
      '}'
    ]
  },
  quick: {
    id: 'quick',
    name: 'Quick Sort',
    category: 'Divide and Conquer',
    description: 'Selects a pivot element and partitions the array around it such that elements smaller than the pivot are on the left, and elements greater are on the right, then recurses on subarrays.',
    complexities: {
      best: 'O(N log N)',
      average: 'O(N log N)',
      worst: 'O(N²)',
      space: 'O(log N)'
    },
    cppCode: [
      'int partition(vector<int>& arr, int low, int high) {',
      '    int pivot = arr[high];',
      '    int i = low - 1;',
      '    for (int j = low; j < high; j++) {',
      '        if (arr[j] < pivot) {',
      '            i++;',
      '            swap(arr[i], arr[j]);',
      '        }',
      '    }',
      '    swap(arr[i + 1], arr[high]);',
      '    return i + 1;',
      '}',
      'void quickSort(vector<int>& arr, int low, int high) {',
      '    if (low < high) {',
      '        int pi = partition(arr, low, high);',
      '        quickSort(arr, low, pi - 1);',
      '        quickSort(arr, pi + 1, high);',
      '    }',
      '}'
    ]
  }
};

/**
 * Creates an immutable trace step object.
 */
function createStep({
  array,
  comparedIndices = [],
  swappedIndices = [],
  sortedIndices = [],
  pivotIndex = null,
  rangeIndices = null,
  type = 'normal',
  comparisons = 0,
  swaps = 0,
  arrayAccesses = 0,
  pass = 0,
  explanation = '',
  line = 1
}) {
  return {
    array: [...array],
    comparedIndices: [...comparedIndices],
    swappedIndices: [...swappedIndices],
    sortedIndices: [...sortedIndices],
    pivotIndex,
    rangeIndices: rangeIndices ? [...rangeIndices] : null,
    type,
    comparisons,
    swaps,
    arrayAccesses,
    pass,
    explanation,
    line
  };
}

/**
 * 1. Bubble Sort Execution Trace Generator
 */
export function generateBubbleSortTrace(initialArray) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let arrayAccesses = 0;
  const sortedIndices = [];

  // Initial step
  trace.push(createStep({
    array: arr,
    explanation: n <= 1 ? 'Array is already trivially sorted.' : 'Starting Bubble Sort. Ready to begin first pass.',
    line: 1,
    type: 'start'
  }));

  if (n <= 1) {
    if (n === 1) sortedIndices.push(0);
    trace.push(createStep({
      array: arr,
      sortedIndices,
      explanation: 'Array contains 1 element and is completely sorted.',
      line: 13,
      type: 'complete'
    }));
    return trace;
  }

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    const currentPass = i + 1;

    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      arrayAccesses += 2; // Reading arr[j] and arr[j+1]

      // Compare step
      trace.push(createStep({
        array: arr,
        comparedIndices: [j, j + 1],
        sortedIndices,
        comparisons,
        swaps,
        arrayAccesses,
        pass: currentPass,
        explanation: `Pass ${currentPass}: Comparing arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]}).`,
        line: 6,
        type: 'compare'
      }));

      if (arr[j] > arr[j + 1]) {
        // Swap elements
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swaps++;
        arrayAccesses += 4; // 2 reads, 2 writes
        swapped = true;

        trace.push(createStep({
          array: arr,
          swappedIndices: [j, j + 1],
          sortedIndices,
          comparisons,
          swaps,
          arrayAccesses,
          pass: currentPass,
          explanation: `Swapping arr[${j}] and arr[${j + 1}] because ${temp} > ${arr[j]}.`,
          line: 7,
          type: 'swap'
        }));
      }
    }

    // Element at n - 1 - i is now in its final sorted position
    sortedIndices.push(n - 1 - i);
    trace.push(createStep({
      array: arr,
      sortedIndices,
      comparisons,
      swaps,
      arrayAccesses,
      pass: currentPass,
      explanation: `Pass ${currentPass} complete: arr[${n - 1 - i}] (${arr[n - 1 - i]}) is now placed in sorted position.`,
      line: 10,
      type: 'sorted'
    }));

    // Early termination if no swaps occurred
    if (!swapped) {
      trace.push(createStep({
        array: arr,
        sortedIndices: Array.from({ length: n }, (_, idx) => idx),
        comparisons,
        swaps,
        arrayAccesses,
        pass: currentPass,
        explanation: 'No swaps occurred in this pass. Array is already completely sorted!',
        line: 11,
        type: 'complete'
      }));
      return trace;
    }
  }

  // Ensure index 0 is marked sorted
  if (!sortedIndices.includes(0)) sortedIndices.push(0);

  trace.push(createStep({
    array: arr,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    arrayAccesses,
    pass: n - 1,
    explanation: 'Bubble Sort completed! All elements are sorted in ascending order.',
    line: 13,
    type: 'complete'
  }));

  return trace;
}

/**
 * 2. Selection Sort Execution Trace Generator
 */
export function generateSelectionSortTrace(initialArray) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let arrayAccesses = 0;
  const sortedIndices = [];

  trace.push(createStep({
    array: arr,
    explanation: n <= 1 ? 'Array is already trivially sorted.' : 'Starting Selection Sort. Finding minimum element for each position.',
    line: 1,
    type: 'start'
  }));

  if (n <= 1) {
    if (n === 1) sortedIndices.push(0);
    trace.push(createStep({
      array: arr,
      sortedIndices,
      explanation: 'Array has 1 element and is completely sorted.',
      line: 14,
      type: 'complete'
    }));
    return trace;
  }

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    const currentPass = i + 1;
    arrayAccesses++; // reading arr[i]

    trace.push(createStep({
      array: arr,
      comparedIndices: [i],
      sortedIndices,
      comparisons,
      swaps,
      arrayAccesses,
      pass: currentPass,
      explanation: `Pass ${currentPass}: Assuming index ${i} (${arr[i]}) is the current minimum.`,
      line: 4,
      type: 'compare'
    }));

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      arrayAccesses += 2; // reading arr[j] and arr[minIdx]

      trace.push(createStep({
        array: arr,
        comparedIndices: [j, minIdx],
        sortedIndices,
        comparisons,
        swaps,
        arrayAccesses,
        pass: currentPass,
        explanation: `Comparing arr[${j}] (${arr[j]}) with current min arr[${minIdx}] (${arr[minIdx]}).`,
        line: 6,
        type: 'compare'
      }));

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        trace.push(createStep({
          array: arr,
          comparedIndices: [minIdx],
          sortedIndices,
          comparisons,
          swaps,
          arrayAccesses,
          pass: currentPass,
          explanation: `New minimum found at index ${minIdx} (${arr[minIdx]}).`,
          line: 7,
          type: 'compare'
        }));
      }
    }

    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swaps++;
      arrayAccesses += 4;

      trace.push(createStep({
        array: arr,
        swappedIndices: [i, minIdx],
        sortedIndices,
        comparisons,
        swaps,
        arrayAccesses,
        pass: currentPass,
        explanation: `Swapping arr[${i}] with minimum element arr[${minIdx}] (${arr[i]}).`,
        line: 11,
        type: 'swap'
      }));
    }

    sortedIndices.push(i);
    trace.push(createStep({
      array: arr,
      sortedIndices,
      comparisons,
      swaps,
      arrayAccesses,
      pass: currentPass,
      explanation: `Position ${i} is now locked with element (${arr[i]}).`,
      line: 13,
      type: 'sorted'
    }));
  }

  // Last element is automatically sorted
  sortedIndices.push(n - 1);
  trace.push(createStep({
    array: arr,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    arrayAccesses,
    pass: n - 1,
    explanation: 'Selection Sort completed! All elements sorted.',
    line: 14,
    type: 'complete'
  }));

  return trace;
}

/**
 * 3. Insertion Sort Execution Trace Generator
 */
export function generateInsertionSortTrace(initialArray) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0; // count shifts as swaps/moves
  let arrayAccesses = 0;
  const sortedIndices = [0];

  trace.push(createStep({
    array: arr,
    sortedIndices: n > 0 ? [0] : [],
    explanation: n <= 1 ? 'Array is already sorted.' : 'Starting Insertion Sort. Index 0 is considered sorted by definition.',
    line: 1,
    type: 'start'
  }));

  if (n <= 1) {
    trace.push(createStep({
      array: arr,
      sortedIndices: n === 1 ? [0] : [],
      explanation: 'Array has 1 element and is sorted.',
      line: 12,
      type: 'complete'
    }));
    return trace;
  }

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    const currentPass = i;
    arrayAccesses++; // reading arr[i]

    trace.push(createStep({
      array: arr,
      comparedIndices: [i],
      sortedIndices: Array.from({ length: i }, (_, idx) => idx),
      comparisons,
      swaps,
      arrayAccesses,
      pass: currentPass,
      explanation: `Pass ${currentPass}: Selected key arr[${i}] (${key}) to insert into sorted left portion.`,
      line: 4,
      type: 'compare'
    }));

    while (j >= 0) {
      comparisons++;
      arrayAccesses++; // reading arr[j]

      trace.push(createStep({
        array: arr,
        comparedIndices: [j, j + 1],
        sortedIndices: Array.from({ length: i }, (_, idx) => idx),
        comparisons,
        swaps,
        arrayAccesses,
        pass: currentPass,
        explanation: `Comparing key (${key}) with arr[${j}] (${arr[j]}).`,
        line: 6,
        type: 'compare'
      }));

      if (arr[j] > key) {
        arr[j + 1] = arr[j];
        swaps++; // shift operation counted
        arrayAccesses += 2; // read arr[j] and write arr[j+1]

        trace.push(createStep({
          array: arr,
          swappedIndices: [j + 1],
          sortedIndices: Array.from({ length: i }, (_, idx) => idx),
          comparisons,
          swaps,
          arrayAccesses,
          pass: currentPass,
          explanation: `Shifted arr[${j}] (${arr[j + 1]}) to index ${j + 1}.`,
          line: 7,
          type: 'swap'
        }));
        j--;
      } else {
        break;
      }
    }

    arr[j + 1] = key;
    arrayAccesses++; // write key

    trace.push(createStep({
      array: arr,
      swappedIndices: [j + 1],
      sortedIndices: Array.from({ length: i + 1 }, (_, idx) => idx),
      comparisons,
      swaps,
      arrayAccesses,
      pass: currentPass,
      explanation: `Inserted key (${key}) at position ${j + 1}.`,
      line: 10,
      type: 'sorted'
    }));
  }

  trace.push(createStep({
    array: arr,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    arrayAccesses,
    pass: n - 1,
    explanation: 'Insertion Sort complete! All elements placed in order.',
    line: 12,
    type: 'complete'
  }));

  return trace;
}

/**
 * 4. Merge Sort Execution Trace Generator
 */
export function generateMergeSortTrace(initialArray) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0; // count assignments during merge
  let arrayAccesses = 0;
  let passCount = 0;

  trace.push(createStep({
    array: arr,
    explanation: n <= 1 ? 'Array is already sorted.' : 'Starting Merge Sort. Recursively splitting array into subarrays.',
    line: 12,
    type: 'start'
  }));

  if (n <= 1) {
    trace.push(createStep({
      array: arr,
      sortedIndices: n === 1 ? [0] : [],
      explanation: 'Array has 1 element and is sorted.',
      line: 19,
      type: 'complete'
    }));
    return trace;
  }

  function merge(l, m, r) {
    passCount++;
    const leftPart = arr.slice(l, m + 1);
    const rightPart = arr.slice(m + 1, r + 1);
    arrayAccesses += (r - l + 1);

    trace.push(createStep({
      array: arr,
      rangeIndices: [l, r],
      comparisons,
      swaps,
      arrayAccesses,
      pass: passCount,
      explanation: `Merging left subarray [${l}..${m}] and right subarray [${m + 1}..${r}].`,
      line: 1,
      type: 'normal'
    }));

    let i = 0;
    let j = 0;
    let k = l;

    while (i < leftPart.length && j < rightPart.length) {
      comparisons++;
      arrayAccesses += 2;

      trace.push(createStep({
        array: arr,
        comparedIndices: [l + i, m + 1 + j],
        rangeIndices: [l, r],
        comparisons,
        swaps,
        arrayAccesses,
        pass: passCount,
        explanation: `Comparing left element (${leftPart[i]}) and right element (${rightPart[j]}).`,
        line: 6,
        type: 'compare'
      }));

      if (leftPart[i] <= rightPart[j]) {
        arr[k] = leftPart[i];
        swaps++;
        arrayAccesses++;
        trace.push(createStep({
          array: arr,
          swappedIndices: [k],
          rangeIndices: [l, r],
          comparisons,
          swaps,
          arrayAccesses,
          pass: passCount,
          explanation: `Placing ${leftPart[i]} at index ${k}.`,
          line: 6,
          type: 'swap'
        }));
        i++;
      } else {
        arr[k] = rightPart[j];
        swaps++;
        arrayAccesses++;
        trace.push(createStep({
          array: arr,
          swappedIndices: [k],
          rangeIndices: [l, r],
          comparisons,
          swaps,
          arrayAccesses,
          pass: passCount,
          explanation: `Placing ${rightPart[j]} at index ${k}.`,
          line: 7,
          type: 'swap'
        }));
        j++;
      }
      k++;
    }

    while (i < leftPart.length) {
      arr[k] = leftPart[i];
      swaps++;
      arrayAccesses += 2;
      trace.push(createStep({
        array: arr,
        swappedIndices: [k],
        rangeIndices: [l, r],
        comparisons,
        swaps,
        arrayAccesses,
        pass: passCount,
        explanation: `Copying remaining left element ${leftPart[i]} to index ${k}.`,
        line: 9,
        type: 'swap'
      }));
      i++;
      k++;
    }

    while (j < rightPart.length) {
      arr[k] = rightPart[j];
      swaps++;
      arrayAccesses += 2;
      trace.push(createStep({
        array: arr,
        swappedIndices: [k],
        rangeIndices: [l, r],
        comparisons,
        swaps,
        arrayAccesses,
        pass: passCount,
        explanation: `Copying remaining right element ${rightPart[j]} to index ${k}.`,
        line: 10,
        type: 'swap'
      }));
      j++;
      k++;
    }

    // Subarray l..r is now internally sorted
    trace.push(createStep({
      array: arr,
      rangeIndices: [l, r],
      sortedIndices: (l === 0 && r === n - 1) ? Array.from({ length: n }, (_, idx) => idx) : [],
      comparisons,
      swaps,
      arrayAccesses,
      pass: passCount,
      explanation: `Subarray [${l}..${r}] successfully merged in sorted order.`,
      line: 11,
      type: (l === 0 && r === n - 1) ? 'complete' : 'sorted'
    }));
  }

  function mergeSort(l, r) {
    if (l < r) {
      const m = Math.floor(l + (r - l) / 2);
      mergeSort(l, m);
      mergeSort(m + 1, r);
      merge(l, m, r);
    }
  }

  mergeSort(0, n - 1);

  trace.push(createStep({
    array: arr,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    arrayAccesses,
    pass: passCount,
    explanation: 'Merge Sort complete! All subarrays merged into sorted array.',
    line: 19,
    type: 'complete'
  }));

  return trace;
}

/**
 * 5. Quick Sort Execution Trace Generator (Lomuto partition scheme)
 */
export function generateQuickSortTrace(initialArray) {
  const trace = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let arrayAccesses = 0;
  let passCount = 0;
  const sortedIndices = [];

  trace.push(createStep({
    array: arr,
    explanation: n <= 1 ? 'Array is already sorted.' : 'Starting Quick Sort. Partitioning arrays around chosen pivots.',
    line: 13,
    type: 'start'
  }));

  if (n <= 1) {
    trace.push(createStep({
      array: arr,
      sortedIndices: n === 1 ? [0] : [],
      explanation: 'Array has 1 element and is sorted.',
      line: 19,
      type: 'complete'
    }));
    return trace;
  }

  function partition(low, high) {
    passCount++;
    const pivot = arr[high];
    arrayAccesses++; // reading pivot arr[high]
    let i = low - 1;

    trace.push(createStep({
      array: arr,
      pivotIndex: high,
      rangeIndices: [low, high],
      sortedIndices,
      comparisons,
      swaps,
      arrayAccesses,
      pass: passCount,
      explanation: `Partition range [${low}..${high}]: Selected pivot arr[${high}] (${pivot}).`,
      line: 2,
      type: 'pivot'
    }));

    for (let j = low; j < high; j++) {
      comparisons++;
      arrayAccesses++; // reading arr[j]

      trace.push(createStep({
        array: arr,
        comparedIndices: [j, high],
        pivotIndex: high,
        rangeIndices: [low, high],
        sortedIndices,
        comparisons,
        swaps,
        arrayAccesses,
        pass: passCount,
        explanation: `Comparing arr[${j}] (${arr[j]}) with pivot (${pivot}).`,
        line: 5,
        type: 'compare'
      }));

      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          swaps++;
          arrayAccesses += 4;

          trace.push(createStep({
            array: arr,
            swappedIndices: [i, j],
            pivotIndex: high,
            rangeIndices: [low, high],
            sortedIndices,
            comparisons,
            swaps,
            arrayAccesses,
            pass: passCount,
            explanation: `Swapping arr[${i}] and arr[${j}] to place smaller element on the left of boundary.`,
            line: 7,
            type: 'swap'
          }));
        }
      }
    }

    // Place pivot at index i + 1
    const finalPivotPos = i + 1;
    if (finalPivotPos !== high) {
      const temp = arr[finalPivotPos];
      arr[finalPivotPos] = arr[high];
      arr[high] = temp;
      swaps++;
      arrayAccesses += 4;

      trace.push(createStep({
        array: arr,
        swappedIndices: [finalPivotPos, high],
        pivotIndex: finalPivotPos,
        rangeIndices: [low, high],
        sortedIndices,
        comparisons,
        swaps,
        arrayAccesses,
        pass: passCount,
        explanation: `Swapping pivot into its correct partition boundary position at index ${finalPivotPos}.`,
        line: 10,
        type: 'swap'
      }));
    }

    sortedIndices.push(finalPivotPos);
    trace.push(createStep({
      array: arr,
      pivotIndex: finalPivotPos,
      sortedIndices,
      comparisons,
      swaps,
      arrayAccesses,
      pass: passCount,
      explanation: `Pivot element (${arr[finalPivotPos]}) is now at its final sorted position at index ${finalPivotPos}.`,
      line: 11,
      type: 'sorted'
    }));

    return finalPivotPos;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      if (!sortedIndices.includes(low)) {
        sortedIndices.push(low);
      }
    }
  }

  quickSort(0, n - 1);

  trace.push(createStep({
    array: arr,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    arrayAccesses,
    pass: passCount,
    explanation: 'Quick Sort complete! All partition segments sorted.',
    line: 19,
    type: 'complete'
  }));

  return trace;
}

/**
 * Main dispatcher to generate trace for any algorithm.
 */
export function getAlgorithmTrace(algorithmKey, array) {
  switch (algorithmKey) {
    case 'bubble':
      return generateBubbleSortTrace(array);
    case 'selection':
      return generateSelectionSortTrace(array);
    case 'insertion':
      return generateInsertionSortTrace(array);
    case 'merge':
      return generateMergeSortTrace(array);
    case 'quick':
      return generateQuickSortTrace(array);
    default:
      return generateBubbleSortTrace(array);
  }
}
