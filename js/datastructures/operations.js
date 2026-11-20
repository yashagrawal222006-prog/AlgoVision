/**
 * AlgoVision — Data Structure Operations (step generators)
 *
 * runOperation() executes an operation on a REAL Stack / Queue instance, one
 * instruction at a time, and records a step after every instruction. Each step
 * stores a snapshot taken from the real structure, so what the visualizer draws
 * is always the true state — the last step of an operation always equals the
 * structure's current snapshot.
 *
 * No DOM access here, so this file can be unit-tested in Node.
 */

import { Stack, Queue } from './structures.js';

export const VALUE_MIN = -9999;
export const VALUE_MAX = 9999;
export const CAPACITY_MAX = 20;

/* ------------------------------------------------------------ Validation */

/** Validate the element input. Returns { ok, value } or { ok:false, error }. */
export function parseElement(raw) {
  const text = String(raw ?? '').trim();
  if (text === '') {
    return { ok: false, error: 'Enter a value first. Example: 42' };
  }
  if (!/^[+-]?\d+$/.test(text)) {
    return { ok: false, error: `"${text.length > 12 ? text.slice(0, 12) + '…' : text}" is not a whole number. Use integers only, like 42 or -7.` };
  }
  const value = Number(text);
  if (value < VALUE_MIN || value > VALUE_MAX) {
    return { ok: false, error: `Value must be between ${VALUE_MIN} and ${VALUE_MAX}.` };
  }
  return { ok: true, value: value === 0 ? 0 : value }; // normalises -0
}

/** Validate the optional capacity input. Blank = unlimited (returns 0). */
export function parseCapacity(raw) {
  const text = String(raw ?? '').trim();
  if (text === '') return { ok: true, value: 0 };
  if (!/^\d+$/.test(text)) {
    return { ok: false, error: 'Capacity must be a whole number, or leave it blank for unlimited.' };
  }
  const value = Number(text);
  if (value < 1 || value > CAPACITY_MAX) {
    return { ok: false, error: `Capacity must be between 1 and ${CAPACITY_MAX}, or blank for unlimited.` };
  }
  return { ok: true, value };
}

/* ------------------------------------------------------------ C++ source */
// Each entry: [text, key]. Steps point at lines by key, so the highlight can
// never drift out of sync with the code.

export const STACK_CODE = [
  ['#include <iostream>', null],
  ['#include <vector>', null],
  ['using namespace std;', null],
  ['', null],
  ['class Stack {', null],
  ['  vector<int> data;', null],
  ['  int top = -1;', 'decl.top'],
  ['  int capacity;            // 0 = unlimited', null],
  ['public:', null],
  ['  Stack(int cap = 0) : capacity(cap) {}', null],
  ['', null],
  ['  bool isEmpty() { return top == -1; }', 'fn.isEmpty'],
  ['  bool isFull() { return capacity > 0 && top == capacity - 1; }', 'fn.isFull'],
  ['  int size() { return top + 1; }', null],
  ['', null],
  ['  void push(int x) {', 'push.sig'],
  ['    if (isFull()) {', 'push.check'],
  ['      cout << "Stack Overflow";', 'push.overflow'],
  ['      return;', 'push.overflowRet'],
  ['    }', null],
  ['    top++;', 'push.inc'],
  ['    data.push_back(x);', 'push.write'],
  ['  }', 'push.end'],
  ['', null],
  ['  int pop() {', 'pop.sig'],
  ['    if (isEmpty()) {', 'pop.check'],
  ['      cout << "Stack Underflow";', 'pop.underflow'],
  ['      return -1;', 'pop.underflowRet'],
  ['    }', null],
  ['    int val = data[top];', 'pop.read'],
  ['    data.pop_back();', 'pop.remove'],
  ['    top--;', 'pop.dec'],
  ['    return val;', 'pop.return'],
  ['  }', null],
  ['', null],
  ['  int peek() {', 'peek.sig'],
  ['    if (isEmpty()) {', 'peek.check'],
  ['      cout << "Stack is empty";', 'peek.empty'],
  ['      return -1;', 'peek.emptyRet'],
  ['    }', null],
  ['    return data[top];', 'peek.return'],
  ['  }', null],
  ['', null],
  ['  void clear() {', 'clear.sig'],
  ['    data.clear();', 'clear.data'],
  ['    top = -1;', 'clear.top'],
  ['  }', null],
  ['};', null]
];

export const QUEUE_CODE = [
  ['#include <iostream>', null],
  ['using namespace std;', null],
  ['', null],
  ['struct Node {', null],
  ['  int data;', null],
  ['  Node* next;', null],
  ['};', null],
  ['', null],
  ['class Queue {', null],
  ['  Node* front = nullptr;', 'decl.front'],
  ['  Node* rear = nullptr;', 'decl.rear'],
  ['  int size = 0;', 'decl.size'],
  ['  int capacity;            // 0 = unlimited', null],
  ['public:', null],
  ['  Queue(int cap = 0) : capacity(cap) {}', null],
  ['', null],
  ['  bool isEmpty() { return front == nullptr; }', 'fn.isEmpty'],
  ['  bool isFull() { return capacity > 0 && size == capacity; }', 'fn.isFull'],
  ['', null],
  ['  void enqueue(int x) {', 'enq.sig'],
  ['    if (isFull()) {', 'enq.check'],
  ['      cout << "Queue Overflow";', 'enq.overflow'],
  ['      return;', 'enq.overflowRet'],
  ['    }', null],
  ['    Node* node = new Node{x, nullptr};', 'enq.create'],
  ['    if (isEmpty()) {', 'enq.checkEmpty'],
  ['      front = rear = node;', 'enq.linkFirst'],
  ['    } else {', null],
  ['      rear->next = node;', 'enq.linkNext'],
  ['      rear = node;', 'enq.moveRear'],
  ['    }', null],
  ['    size++;', 'enq.size'],
  ['  }', 'enq.end'],
  ['', null],
  ['  int dequeue() {', 'deq.sig'],
  ['    if (isEmpty()) {', 'deq.check'],
  ['      cout << "Queue Underflow";', 'deq.underflow'],
  ['      return -1;', 'deq.underflowRet'],
  ['    }', null],
  ['    Node* temp = front;', 'deq.temp'],
  ['    int val = temp->data;', 'deq.read'],
  ['    front = front->next;', 'deq.advance'],
  ['    if (front == nullptr) rear = nullptr;', 'deq.fixRear'],
  ['    delete temp;', 'deq.delete'],
  ['    size--;', 'deq.size'],
  ['    return val;', 'deq.return'],
  ['  }', null],
  ['', null],
  ['  int getFront() {', 'front.sig'],
  ['    if (isEmpty()) {', 'front.check'],
  ['      cout << "Queue is empty";', 'front.empty'],
  ['      return -1;', 'front.emptyRet'],
  ['    }', null],
  ['    return front->data;', 'front.return'],
  ['  }', null],
  ['', null],
  ['  void clear() {', 'clear.sig'],
  ['    while (!isEmpty()) dequeue();', 'clear.loop'],
  ['  }', 'clear.end'],
  ['};', null]
];

/* ------------------------------------------------------------ Structure info */

export const STRUCTURE_INFO = {
  stack: {
    name: 'Stack',
    category: 'LIFO — Last In, First Out',
    description:
      'A stack only lets you touch one end, called the top. Push places a new element on the top, pop removes the top element, and peek reads it without removing it. The last element pushed is always the first one popped, like a pile of plates.',
    complexities: [
      { label: 'Push', value: 'O(1)', cls: 'best' },
      { label: 'Pop', value: 'O(1)', cls: 'avg' },
      { label: 'Peek', value: 'O(1)', cls: 'worst' },
      { label: 'Space', value: 'O(N)', cls: 'space' }
    ],
    code: STACK_CODE,
    ops: [
      { op: 'push', label: 'Push', needsValue: true },
      { op: 'pop', label: 'Pop', needsValue: false },
      { op: 'peek', label: 'Peek', needsValue: false }
    ],
    inputPlaceholder: 'Value to push, e.g. 42',
    emptyHint: 'The stack is empty. Push a value to get started.'
  },
  queue: {
    name: 'Queue',
    category: 'FIFO — First In, First Out',
    description:
      'A queue adds elements at the rear and removes them from the front. Enqueue appends at the rear, dequeue removes the front element, and front reads it without removing it. The first element added is always the first one served, like people in a line.',
    complexities: [
      { label: 'Enqueue', value: 'O(1)', cls: 'best' },
      { label: 'Dequeue', value: 'O(1)', cls: 'avg' },
      { label: 'Front', value: 'O(1)', cls: 'worst' },
      { label: 'Space', value: 'O(N)', cls: 'space' }
    ],
    code: QUEUE_CODE,
    ops: [
      { op: 'enqueue', label: 'Enqueue', needsValue: true },
      { op: 'dequeue', label: 'Dequeue', needsValue: false },
      { op: 'front', label: 'Front', needsValue: false }
    ],
    inputPlaceholder: 'Value to enqueue, e.g. 42',
    emptyHint: 'The queue is empty. Enqueue a value to get started.'
  }
};

export function createStructure(kind, capacity = 0) {
  if (kind === 'stack') return new Stack(capacity);
  if (kind === 'queue') return new Queue(capacity);
  throw new Error(`Unknown data structure: ${kind}`);
}

/** Line index (0-based) for a code key, or -1. */
export function lineIndexForKey(code, key) {
  return code.findIndex(([, k]) => k === key);
}

/* ------------------------------------------------------------ Step recorder */

const fmtCap = (c) => (c > 0 ? String(c) : 'unlimited');

/** Variable table for the "current variable values" panel. */
function buildVars(state, locals) {
  const members = [];
  if (state.kind === 'stack') {
    members.push(['top', String(state.top)]);
    members.push(['size()', String(state.size)]);
    members.push(['capacity', fmtCap(state.capacity)]);
    members.push(['isEmpty()', String(state.isEmpty)]);
    members.push(['isFull()', String(state.isFull)]);
  } else {
    members.push(['front', state.items.length ? `→ ${state.frontValue}` : 'nullptr']);
    members.push(['rear', state.items.length ? `→ ${state.rearValue}` : 'nullptr']);
    members.push(['size', String(state.size)]);
    members.push(['capacity', fmtCap(state.capacity)]);
    members.push(['isEmpty()', String(state.isEmpty)]);
    members.push(['isFull()', String(state.isFull)]);
  }
  return { members, locals: locals.map(([k, v]) => [k, String(v)]) };
}

class Recorder {
  constructor(struct, label, opName) {
    this.struct = struct;
    this.label = label;
    this.opName = opName;
    this.steps = [];
  }

  /**
   * Record a step using the structure's CURRENT state.
   * opts: title, desc, keys[], focus {index|all}, enter, ghost {value,index},
   *       pending {value}, tempPtr, status, locals [[name,value]]
   */
  add(opts) {
    const state = this.struct.snapshot();
    const locals = opts.locals || [];
    this.steps.push({
      opLabel: this.label,
      opName: this.opName,
      title: opts.title,
      desc: opts.desc,
      keys: opts.keys || [],
      state,
      vars: buildVars(state, locals),
      focus: opts.focus ?? null,
      enter: opts.enter ?? null,
      ghost: opts.ghost ?? null,
      pending: opts.pending ?? null,
      tempPtr: !!opts.tempPtr,
      status: opts.status || 'info',
      index: 0,
      total: 0,
      final: false
    });
  }

  finish() {
    const total = this.steps.length;
    this.steps.forEach((s, i) => { s.index = i; s.total = total; s.final = i === total - 1; });
    return this.steps;
  }
}

/* ------------------------------------------------------------ Stack operations */

function stackPush(stack, x) {
  const r = new Recorder(stack, `Push(${x})`, 'push');
  const L = [['x', x]];

  r.add({
    title: 'Check whether the stack is full',
    desc: stack.capacity > 0
      ? `isFull() checks top == capacity - 1. Here top = ${stack.top} and capacity = ${stack.capacity}, so the stack is ${stack.isFull() ? 'full' : 'not full'}.`
      : `isFull() is always false because this stack has unlimited capacity (top = ${stack.top}).`,
    keys: ['push.sig', 'push.check'], locals: L
  });

  if (stack.isFull()) {
    r.add({
      title: 'Overflow — push rejected',
      desc: `Overflow: the stack is full (${stack.size} of ${stack.capacity}), so ${x} cannot be added. The stack is unchanged.`,
      keys: ['push.overflow', 'push.overflowRet'], status: 'error', locals: L
    });
    return { steps: r.finish(), status: 'error', error: 'Overflow', result: null, label: r.label };
  }

  stack.incrementTop();
  r.add({
    title: 'Increment top',
    desc: `top moves up from ${stack.top - 1} to ${stack.top}. A new slot is reserved, but it holds no value yet.`,
    keys: ['push.inc'], focus: { index: stack.top }, locals: L
  });

  stack.writeAtTop(x);
  r.add({
    title: `Insert ${x} at the top`,
    desc: `${x} is stored at data[${stack.top}]. It is now the top element, so it will be the first one popped.`,
    keys: ['push.write'], focus: { index: stack.top }, enter: stack.top, locals: L
  });

  r.add({
    title: 'Update the visualization',
    desc: `Push(${x}) is complete. The stack now holds ${stack.size} element${stack.size === 1 ? '' : 's'} and top = ${stack.top}.`,
    keys: ['push.end'], focus: { index: stack.top }, status: 'success', locals: L
  });
  return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
}

function stackPop(stack) {
  const r = new Recorder(stack, 'Pop()', 'pop');

  r.add({
    title: 'Check whether the stack is empty',
    desc: `isEmpty() checks top == -1. Here top = ${stack.top}, so the stack is ${stack.isEmpty() ? 'empty' : 'not empty'}.`,
    keys: ['pop.sig', 'pop.check']
  });

  if (stack.isEmpty()) {
    r.add({
      title: 'Underflow — nothing to pop',
      desc: 'Underflow: there are no elements to remove, so pop fails. The stack is unchanged.',
      keys: ['pop.underflow', 'pop.underflowRet'], status: 'error'
    });
    return { steps: r.finish(), status: 'error', error: 'Underflow', result: null, label: r.label };
  }

  const val = stack.readTop();
  const idx = stack.top;
  r.add({
    title: 'Read the top element',
    desc: `val = data[${idx}] = ${val}. This is the most recently pushed element.`,
    keys: ['pop.read'], focus: { index: idx }, locals: [['val', val]]
  });

  stack.removeTop();
  r.add({
    title: 'Remove it and decrement top',
    desc: `data.pop_back() removes ${val}, then top-- moves top down to ${stack.top}.`,
    keys: ['pop.remove', 'pop.dec'], ghost: { value: val, index: idx }, locals: [['val', val]]
  });

  r.add({
    title: `Return ${val}`,
    desc: `Pop() returns ${val}. The stack now holds ${stack.size} element${stack.size === 1 ? '' : 's'}.`,
    keys: ['pop.return'], status: 'success', locals: [['val', val]]
  });
  return { steps: r.finish(), status: 'success', error: null, result: val, label: r.label };
}

function stackPeek(stack) {
  const r = new Recorder(stack, 'Peek()', 'peek');

  r.add({
    title: 'Check whether the stack is empty',
    desc: `isEmpty() checks top == -1. Here top = ${stack.top}, so the stack is ${stack.isEmpty() ? 'empty' : 'not empty'}.`,
    keys: ['peek.sig', 'peek.check']
  });

  if (stack.isEmpty()) {
    r.add({
      title: 'Stack is empty — nothing to peek',
      desc: 'The stack is empty, so there is no top element to read. The stack is unchanged.',
      keys: ['peek.empty', 'peek.emptyRet'], status: 'error'
    });
    return { steps: r.finish(), status: 'error', error: 'Empty', result: null, label: r.label };
  }

  const val = stack.readTop();
  r.add({
    title: 'Return the top element without removing it',
    desc: `Peek() returns data[${stack.top}] = ${val}. Nothing is removed, so the stack is unchanged.`,
    keys: ['peek.return'], focus: { index: stack.top }, status: 'success', locals: [['result', val]]
  });
  return { steps: r.finish(), status: 'success', error: null, result: val, label: r.label };
}

function stackClear(stack) {
  const r = new Recorder(stack, 'Clear()', 'clear');
  if (stack.isEmpty()) {
    r.add({
      title: 'Already empty',
      desc: 'The stack has no elements, so there is nothing to clear.',
      keys: ['clear.sig'], status: 'info'
    });
    return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
  }
  const n = stack.size;
  r.add({
    title: 'Clear every element',
    desc: `clear() will discard all ${n} element${n === 1 ? '' : 's'}.`,
    keys: ['clear.sig', 'clear.data'], focus: { all: true }
  });
  stack.clearAll();
  r.add({
    title: 'Reset top to -1',
    desc: 'data is now empty and top = -1, which is the empty-stack state.',
    keys: ['clear.top'], status: 'success'
  });
  return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
}

/* ------------------------------------------------------------ Queue operations */

function queueEnqueue(queue, x) {
  const r = new Recorder(queue, `Enqueue(${x})`, 'enqueue');
  const L = [['x', x]];

  r.add({
    title: 'Check whether the queue is full',
    desc: queue.capacity > 0
      ? `isFull() checks size == capacity. Here size = ${queue.size} and capacity = ${queue.capacity}, so the queue is ${queue.isFull() ? 'full' : 'not full'}.`
      : `isFull() is always false because this queue has unlimited capacity (size = ${queue.size}).`,
    keys: ['enq.sig', 'enq.check'], locals: L
  });

  if (queue.isFull()) {
    r.add({
      title: 'Overflow — enqueue rejected',
      desc: `Overflow: the queue is full (${queue.size} of ${queue.capacity}), so ${x} cannot be added. The queue is unchanged.`,
      keys: ['enq.overflow', 'enq.overflowRet'], status: 'error', locals: L
    });
    return { steps: r.finish(), status: 'error', error: 'Overflow', result: null, label: r.label };
  }

  const node = queue.createNode(x);
  r.add({
    title: 'Create a new node',
    desc: `A new node holding ${x} is allocated with next = nullptr. It is not part of the queue yet.`,
    keys: ['enq.create'], pending: { value: x }, locals: [...L, ['node', `→ ${x}`]]
  });

  const wasEmpty = queue.isEmpty();
  r.add({
    title: 'Check whether the queue is empty',
    desc: wasEmpty
      ? 'front is nullptr, so the queue is empty. The new node will become both front and rear.'
      : 'The queue already has elements, so the new node will be linked after the current rear.',
    keys: ['enq.checkEmpty'], pending: { value: x }, locals: [...L, ['node', `→ ${x}`]]
  });

  queue.linkAtRear(node);
  const last = queue.size; // size has not been incremented yet, so this is the new node's index
  r.add({
    title: wasEmpty ? 'Set front and rear to the new node' : 'Link the node and move rear',
    desc: wasEmpty
      ? `front = rear = node. Both pointers now point at ${x}.`
      : `rear->next = node links ${x} after the old rear, then rear = node moves the REAR pointer to ${x}.`,
    keys: wasEmpty ? ['enq.linkFirst'] : ['enq.linkNext', 'enq.moveRear'],
    enter: last, focus: { index: last }, locals: [...L, ['node', `→ ${x}`]]
  });

  queue.incrementSize();
  r.add({
    title: 'Increment size',
    desc: `size++ updates the counter to ${queue.size}.`,
    keys: ['enq.size'], focus: { index: queue.size - 1 }, locals: L
  });

  r.add({
    title: 'Update the visualization',
    desc: `Enqueue(${x}) is complete. The queue holds ${queue.size} element${queue.size === 1 ? '' : 's'}; ${x} is at the rear.`,
    keys: ['enq.end'], focus: { index: queue.size - 1 }, status: 'success', locals: L
  });
  return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
}

function queueDequeue(queue) {
  const r = new Recorder(queue, 'Dequeue()', 'dequeue');

  r.add({
    title: 'Check whether the queue is empty',
    desc: `isEmpty() checks front == nullptr. The queue is ${queue.isEmpty() ? 'empty' : 'not empty'}.`,
    keys: ['deq.sig', 'deq.check']
  });

  if (queue.isEmpty()) {
    r.add({
      title: 'Underflow — nothing to dequeue',
      desc: 'Underflow: there are no elements to remove, so dequeue fails. The queue is unchanged.',
      keys: ['deq.underflow', 'deq.underflowRet'], status: 'error'
    });
    return { steps: r.finish(), status: 'error', error: 'Underflow', result: null, label: r.label };
  }

  const val = queue.front.data;
  r.add({
    title: 'Point temp at the front node',
    desc: `temp = front, so temp points at ${val}. We keep temp so the node can be freed after front moves on.`,
    keys: ['deq.temp'], focus: { index: 0 }, tempPtr: true, locals: [['temp', `→ ${val}`]]
  });

  r.add({
    title: 'Read the value',
    desc: `val = temp->data = ${val}. This is the element that has waited longest.`,
    keys: ['deq.read'], focus: { index: 0 }, tempPtr: true, locals: [['temp', `→ ${val}`], ['val', val]]
  });

  const removed = queue.unlinkFront();
  r.add({
    title: 'Advance front',
    desc: queue.isEmpty()
      ? `front = front->next gives nullptr, so the queue is now empty and rear is also set to nullptr.`
      : `front = front->next moves the FRONT pointer to ${queue.front.data}. The old front node is detached.`,
    keys: ['deq.advance', 'deq.fixRear'],
    ghost: { value: removed.data, index: 0 }, tempPtr: true,
    locals: [['temp', `→ ${val}`], ['val', val]]
  });

  queue.decrementSize();
  r.add({
    title: 'Delete the node and decrement size',
    desc: `delete temp frees the old node, and size-- updates the counter to ${queue.size}.`,
    keys: ['deq.delete', 'deq.size'], locals: [['val', val]]
  });

  r.add({
    title: `Return ${val}`,
    desc: `Dequeue() returns ${val}. The queue now holds ${queue.size} element${queue.size === 1 ? '' : 's'}.`,
    keys: ['deq.return'], status: 'success', locals: [['val', val]]
  });
  return { steps: r.finish(), status: 'success', error: null, result: val, label: r.label };
}

function queueFront(queue) {
  const r = new Recorder(queue, 'Front()', 'front');

  r.add({
    title: 'Check whether the queue is empty',
    desc: `isEmpty() checks front == nullptr. The queue is ${queue.isEmpty() ? 'empty' : 'not empty'}.`,
    keys: ['front.sig', 'front.check']
  });

  if (queue.isEmpty()) {
    r.add({
      title: 'Queue is empty — no front element',
      desc: 'The queue is empty, so there is no front element to read. The queue is unchanged.',
      keys: ['front.empty', 'front.emptyRet'], status: 'error'
    });
    return { steps: r.finish(), status: 'error', error: 'Empty', result: null, label: r.label };
  }

  const val = queue.front.data;
  r.add({
    title: 'Return the front element without removing it',
    desc: `Front() returns front->data = ${val}. Nothing is removed, so the queue is unchanged.`,
    keys: ['front.return'], focus: { index: 0 }, status: 'success', locals: [['result', val]]
  });
  return { steps: r.finish(), status: 'success', error: null, result: val, label: r.label };
}

function queueClear(queue) {
  const r = new Recorder(queue, 'Clear()', 'clear');
  if (queue.isEmpty()) {
    r.add({
      title: 'Already empty',
      desc: 'The queue has no elements, so there is nothing to clear.',
      keys: ['clear.sig'], status: 'info'
    });
    return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
  }
  const n = queue.size;
  r.add({
    title: 'Dequeue until empty',
    desc: `clear() keeps dequeuing until the queue is empty, discarding all ${n} element${n === 1 ? '' : 's'}.`,
    keys: ['clear.sig', 'clear.loop'], focus: { all: true }
  });
  queue.clearAll();
  r.add({
    title: 'Queue is empty',
    desc: 'front and rear are nullptr and size = 0, which is the empty-queue state.',
    keys: ['clear.end'], status: 'success'
  });
  return { steps: r.finish(), status: 'success', error: null, result: null, label: r.label };
}

/* ------------------------------------------------------------ Public API */

const OPERATIONS = {
  stack: { push: stackPush, pop: stackPop, peek: stackPeek, clear: stackClear },
  queue: { enqueue: queueEnqueue, dequeue: queueDequeue, front: queueFront, clear: queueClear }
};

/**
 * Execute one operation on a real structure and return its recorded steps.
 * Throws for an unknown structure/operation or a missing/invalid value, so
 * invalid calls can never silently change the data.
 */
export function runOperation(struct, opName, value) {
  const kind = struct instanceof Stack ? 'stack' : struct instanceof Queue ? 'queue' : null;
  if (!kind) throw new Error('Unsupported data structure');
  const fn = OPERATIONS[kind][opName];
  if (!fn) throw new Error(`Operation "${opName}" is not supported by a ${kind}`);
  if (opName === 'push' || opName === 'enqueue') {
    if (!Number.isInteger(value)) throw new Error(`${opName} needs an integer value`);
    return fn(struct, value);
  }
  return fn(struct);
}

/** A first step that shows the structure's current state, used as the idle/baseline step. */
export function makeIdleStep(struct, desc) {
  const state = struct.snapshot();
  return {
    opLabel: null, opName: null, title: 'Ready', desc,
    keys: [], state, vars: buildVars(state, []),
    focus: null, enter: null, ghost: null, pending: null, tempPtr: false,
    status: 'info', index: 0, total: 0, final: true, idle: true
  };
}
