/**
 * AlgoVision — Data Structure Implementations (Stack & Queue)
 *
 * Pure logic, no DOM. These are the *real* data structures: the visualizer never
 * keeps its own copy of the data, it only renders snapshots taken from these classes.
 *
 *  - Stack: array-backed, with an explicit `top` index (like the C++ shown on screen).
 *  - Queue: singly linked list with `front` / `rear` pointers and a `size` counter.
 *
 * Mutations are exposed as small primitives (incrementTop, writeAtTop, ...) so the
 * step generator can execute an operation one instruction at a time and snapshot
 * the genuine state after each instruction.
 */

/* ------------------------------------------------------------------ Stack */

export class Stack {
  /** @param {number} capacity 0 (or omitted) means unlimited. */
  constructor(capacity = 0) {
    this.capacity = capacity > 0 ? capacity : 0;
    this.slots = [];   // slots[i] holds a value, or null when the slot is allocated but not yet written
    this.top = -1;
  }

  get size() { return this.top + 1; }
  isEmpty() { return this.top === -1; }
  isFull() { return this.capacity > 0 && this.top === this.capacity - 1; }

  // --- primitives (one C++ statement each) ---
  incrementTop() { this.top++; this.slots.length = this.top + 1; this.slots[this.top] = null; }
  writeAtTop(value) { this.slots[this.top] = value; }
  readTop() { return this.slots[this.top]; }
  /** data.pop_back(); top--; */
  removeTop() { const v = this.slots.pop(); this.top--; return v; }
  clearAll() { this.slots = []; this.top = -1; }

  // --- convenience (composed from the primitives) ---
  push(value) {
    if (this.isFull()) throw new Error('Stack overflow');
    this.incrementTop();
    this.writeAtTop(value);
  }
  pop() {
    if (this.isEmpty()) throw new Error('Stack underflow');
    return this.removeTop();
  }
  peek() {
    if (this.isEmpty()) throw new Error('Stack is empty');
    return this.readTop();
  }

  /** Immutable view of the current state, used by the renderer and the tests. */
  snapshot() {
    return {
      kind: 'stack',
      slots: this.slots.slice(),
      top: this.top,
      size: this.size,
      capacity: this.capacity,
      isEmpty: this.isEmpty(),
      isFull: this.isFull()
    };
  }
}

/* ------------------------------------------------------------------ Queue */

class QueueNode {
  constructor(value) { this.data = value; this.next = null; }
}

export class Queue {
  /** @param {number} capacity 0 (or omitted) means unlimited. */
  constructor(capacity = 0) {
    this.capacity = capacity > 0 ? capacity : 0;
    this.front = null;
    this.rear = null;
    this._size = 0;   // the `size` member variable (updated by its own primitive)
  }

  get size() { return this._size; }
  isEmpty() { return this.front === null; }
  isFull() { return this.capacity > 0 && this._size === this.capacity; }

  // --- primitives ---
  createNode(value) { return new QueueNode(value); }
  /** if (isEmpty()) front = rear = node; else { rear->next = node; rear = node; } */
  linkAtRear(node) {
    if (this.front === null) { this.front = node; this.rear = node; }
    else { this.rear.next = node; this.rear = node; }
  }
  incrementSize() { this._size++; }
  /** front = front->next; if (front == nullptr) rear = nullptr;  — returns the unlinked node */
  unlinkFront() {
    const old = this.front;
    this.front = old.next;
    if (this.front === null) this.rear = null;
    old.next = null;
    return old;
  }
  decrementSize() { this._size--; }
  clearAll() { this.front = null; this.rear = null; this._size = 0; }

  // --- convenience ---
  enqueue(value) {
    if (this.isFull()) throw new Error('Queue overflow');
    this.linkAtRear(this.createNode(value));
    this.incrementSize();
  }
  dequeue() {
    if (this.isEmpty()) throw new Error('Queue underflow');
    const node = this.unlinkFront();
    this.decrementSize();
    return node.data;
  }
  peekFront() {
    if (this.isEmpty()) throw new Error('Queue is empty');
    return this.front.data;
  }

  /** Values from front to rear, found by walking the real linked list. */
  toArray() {
    const out = [];
    for (let n = this.front; n !== null; n = n.next) out.push(n.data);
    return out;
  }

  snapshot() {
    const items = this.toArray();
    return {
      kind: 'queue',
      items,
      frontValue: this.front ? this.front.data : null,
      rearValue: this.rear ? this.rear.data : null,
      size: this._size,
      capacity: this.capacity,
      isEmpty: this.isEmpty(),
      isFull: this.isFull()
    };
  }
}
