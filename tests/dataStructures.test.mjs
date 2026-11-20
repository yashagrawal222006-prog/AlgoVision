/**
 * AlgoVision — Data Structures logic tests.
 * Run:  node tests/dataStructures.test.mjs
 * No dependencies; uses Node's built-in assert.
 */
import assert from 'node:assert/strict';
import { Stack, Queue } from '../js/datastructures/structures.js';
import {
  runOperation, parseElement, parseCapacity, createStructure, makeIdleStep,
  STACK_CODE, QUEUE_CODE, lineIndexForKey, VALUE_MIN, VALUE_MAX
} from '../js/datastructures/operations.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}
const lastStep = (res) => res.steps[res.steps.length - 1];
const stackVals = (s) => s.slots.slice();

/** The visual state (last step) must equal the real structure's state. */
function assertInSync(struct, res) {
  assert.deepEqual(lastStep(res).state, struct.snapshot());
}

console.log('Input validation');
test('rejects empty / whitespace', () => {
  assert.equal(parseElement('').ok, false);
  assert.equal(parseElement('   ').ok, false);
  assert.equal(parseElement(undefined).ok, false);
});
test('rejects text, decimals, mixed, symbols', () => {
  for (const bad of ['abc', '1.5', '12a', '--3', '1e3', '0x10', '1,2', '∞'])
    assert.equal(parseElement(bad).ok, false, bad);
});
test('rejects out-of-range numbers', () => {
  assert.equal(parseElement(String(VALUE_MAX + 1)).ok, false);
  assert.equal(parseElement(String(VALUE_MIN - 1)).ok, false);
});
test('accepts valid integers incl. negative, plus sign, boundaries, spaces', () => {
  assert.deepEqual(parseElement(' 42 '), { ok: true, value: 42 });
  assert.equal(parseElement('-7').value, -7);
  assert.equal(parseElement('+5').value, 5);
  assert.equal(parseElement('-0').value, 0);
  assert.equal(Object.is(parseElement('-0').value, -0), false);
  assert.equal(parseElement(String(VALUE_MAX)).ok, true);
  assert.equal(parseElement(String(VALUE_MIN)).ok, true);
});
test('capacity: blank = unlimited, 1..20 ok, others rejected', () => {
  assert.deepEqual(parseCapacity(''), { ok: true, value: 0 });
  assert.equal(parseCapacity('5').value, 5);
  for (const bad of ['0', '-1', '21', '2.5', 'x']) assert.equal(parseCapacity(bad).ok, false, bad);
});

console.log('Stack');
test('empty stack: pop / peek underflow, state unchanged', () => {
  const s = new Stack();
  for (const op of ['pop', 'peek']) {
    const r = runOperation(s, op);
    assert.equal(r.status, 'error');
    assert.equal(lastStep(r).status, 'error');
    assert.deepEqual(s.snapshot(), { kind: 'stack', slots: [], top: -1, size: 0, capacity: 0, isEmpty: true, isFull: false });
    assertInSync(s, r);
  }
});
test('push produces the documented 4 steps and updates the stack', () => {
  const s = new Stack();
  const r = runOperation(s, 'push', 10);
  assert.equal(r.status, 'success');
  assert.equal(r.steps.length, 4);
  assert.match(r.steps[0].title, /full/i);
  assert.match(r.steps[1].title, /increment top/i);
  assert.match(r.steps[2].title, /insert 10/i);
  assert.match(r.steps[3].title, /update/i);
  // after "top++" the slot exists but is empty; after insert it holds 10
  assert.deepEqual(r.steps[1].state.slots, [null]);
  assert.equal(r.steps[1].state.top, 0);
  assert.deepEqual(r.steps[2].state.slots, [10]);
  assert.equal(r.steps[2].enter, 0);
  assert.deepEqual(stackVals(s), [10]);
  assertInSync(s, r);
});
test('multiple pushes keep order and top index', () => {
  const s = new Stack();
  [1, 2, 3, 4].forEach(v => assertInSync(s, runOperation(s, 'push', v)));
  assert.deepEqual(stackVals(s), [1, 2, 3, 4]);
  assert.equal(s.top, 3);
  assert.equal(s.size, 4);
});
test('multiple pops are LIFO and finish empty', () => {
  const s = new Stack();
  [1, 2, 3].forEach(v => runOperation(s, 'push', v));
  const got = [];
  for (let i = 0; i < 3; i++) { const r = runOperation(s, 'pop'); got.push(r.result); assertInSync(s, r); }
  assert.deepEqual(got, [3, 2, 1]);
  assert.equal(s.isEmpty(), true);
  assert.equal(s.top, -1);
  assert.equal(runOperation(s, 'pop').status, 'error'); // underflow after emptying
});
test('pop steps: read -> remove (ghost) -> return', () => {
  const s = new Stack(); runOperation(s, 'push', 7); runOperation(s, 'push', 9);
  const r = runOperation(s, 'pop');
  assert.equal(r.steps.length, 4);
  assert.deepEqual(r.steps[1].state.slots, [7, 9]);        // still there while being read
  assert.equal(r.steps[1].focus.index, 1);
  assert.deepEqual(r.steps[2].state.slots, [7]);           // removed
  assert.deepEqual(r.steps[2].ghost, { value: 9, index: 1 });
  assert.equal(r.result, 9);
});
test('peek returns top without modifying', () => {
  const s = new Stack(); runOperation(s, 'push', 5); runOperation(s, 'push', 8);
  const before = s.snapshot();
  const r = runOperation(s, 'peek');
  assert.equal(r.result, 8);
  assert.deepEqual(s.snapshot(), before);
  assertInSync(s, r);
});
test('capacity overflow is rejected without changing the stack', () => {
  const s = new Stack(2);
  runOperation(s, 'push', 1); runOperation(s, 'push', 2);
  const before = s.snapshot();
  const r = runOperation(s, 'push', 3);
  assert.equal(r.status, 'error'); assert.equal(r.error, 'Overflow');
  assert.deepEqual(s.snapshot(), before);
  assertInSync(s, r);
  // popping makes room again
  runOperation(s, 'pop');
  assert.equal(runOperation(s, 'push', 3).status, 'success');
  assert.deepEqual(stackVals(s), [1, 3]);
});
test('capacity 1 edge case', () => {
  const s = new Stack(1);
  assert.equal(runOperation(s, 'push', 1).status, 'success');
  assert.equal(runOperation(s, 'push', 2).status, 'error');
  assert.equal(s.isFull(), true);
});
test('duplicates and negatives are stored as-is', () => {
  const s = new Stack();
  [5, 5, -3, 0, 5].forEach(v => runOperation(s, 'push', v));
  assert.deepEqual(stackVals(s), [5, 5, -3, 0, 5]);
  assert.equal(runOperation(s, 'pop').result, 5);
});
test('clear empties the stack; clearing an empty stack is harmless', () => {
  const s = new Stack();
  assert.equal(runOperation(s, 'clear').status, 'success');
  [1, 2, 3].forEach(v => runOperation(s, 'push', v));
  const r = runOperation(s, 'clear');
  assert.equal(r.status, 'success');
  assert.equal(s.top, -1); assert.deepEqual(stackVals(s), []);
  assertInSync(s, r);
});

console.log('Queue');
test('empty queue: dequeue / front underflow, state unchanged', () => {
  const q = new Queue();
  for (const op of ['dequeue', 'front']) {
    const r = runOperation(q, op);
    assert.equal(r.status, 'error');
    assert.equal(q.isEmpty(), true);
    assert.equal(q.front, null); assert.equal(q.rear, null); assert.equal(q.size, 0);
    assertInSync(q, r);
  }
});
test('enqueue into empty queue sets front = rear', () => {
  const q = new Queue();
  const r = runOperation(q, 'enqueue', 10);
  assert.equal(r.status, 'success');
  assert.equal(q.front, q.rear);
  assert.deepEqual(q.toArray(), [10]);
  assert.equal(q.size, 1);
  assert.equal(r.steps[1].pending.value, 10);              // node exists but is not linked yet
  assert.deepEqual(r.steps[1].state.items, []);
  assert.deepEqual(r.steps[3].state.items, [10]);          // linked
  assert.equal(r.steps[3].state.size, 0);                  // ...size++ has not run yet
  assert.equal(r.steps[4].state.size, 1);
  assertInSync(q, r);
});
test('multiple enqueues keep FIFO order, front stays, rear moves', () => {
  const q = new Queue();
  [1, 2, 3, 4].forEach(v => assertInSync(q, runOperation(q, 'enqueue', v)));
  assert.deepEqual(q.toArray(), [1, 2, 3, 4]);
  assert.equal(q.front.data, 1); assert.equal(q.rear.data, 4);
  assert.equal(q.size, 4);
});
test('dequeue is FIFO, front advances, ends empty with rear = null', () => {
  const q = new Queue();
  [1, 2, 3].forEach(v => runOperation(q, 'enqueue', v));
  const got = [];
  for (let i = 0; i < 3; i++) {
    const r = runOperation(q, 'dequeue'); got.push(r.result); assertInSync(q, r);
  }
  assert.deepEqual(got, [1, 2, 3]);
  assert.equal(q.front, null); assert.equal(q.rear, null); assert.equal(q.size, 0);
  assert.equal(runOperation(q, 'dequeue').status, 'error');
});
test('dequeue steps: temp -> read -> advance (ghost) -> delete/size -> return', () => {
  const q = new Queue(); runOperation(q, 'enqueue', 4); runOperation(q, 'enqueue', 6);
  const r = runOperation(q, 'dequeue');
  assert.equal(r.steps.length, 6);
  assert.equal(r.steps[1].tempPtr, true);
  assert.deepEqual(r.steps[3].state.items, [6]);
  assert.deepEqual(r.steps[3].ghost, { value: 4, index: 0 });
  assert.equal(r.steps[3].state.size, 2);                  // size-- not yet executed
  assert.equal(r.steps[4].state.size, 1);
  assert.equal(r.result, 4);
});
test('front returns first element without modifying', () => {
  const q = new Queue(); runOperation(q, 'enqueue', 5); runOperation(q, 'enqueue', 8);
  const before = q.snapshot();
  const r = runOperation(q, 'front');
  assert.equal(r.result, 5);
  assert.deepEqual(q.snapshot(), before);
  assertInSync(q, r);
});
test('capacity overflow is rejected; dequeue frees space', () => {
  const q = new Queue(2);
  runOperation(q, 'enqueue', 1); runOperation(q, 'enqueue', 2);
  const before = q.snapshot();
  const r = runOperation(q, 'enqueue', 3);
  assert.equal(r.status, 'error'); assert.equal(r.error, 'Overflow');
  assert.deepEqual(q.snapshot(), before); assertInSync(q, r);
  runOperation(q, 'dequeue');
  assert.equal(runOperation(q, 'enqueue', 3).status, 'success');
  assert.deepEqual(q.toArray(), [2, 3]);
});
test('single element: front === rear, dequeue resets both', () => {
  const q = new Queue(); runOperation(q, 'enqueue', 9);
  assert.equal(q.front, q.rear);
  runOperation(q, 'dequeue');
  assert.equal(q.front, null); assert.equal(q.rear, null);
  runOperation(q, 'enqueue', 3);                           // reusable after becoming empty
  assert.deepEqual(q.toArray(), [3]);
  assert.equal(q.front, q.rear);
});
test('clear empties the queue', () => {
  const q = new Queue();
  assert.equal(runOperation(q, 'clear').status, 'success');
  [1, 2, 3].forEach(v => runOperation(q, 'enqueue', v));
  const r = runOperation(q, 'clear');
  assert.equal(q.isEmpty(), true); assert.equal(q.size, 0); assert.equal(q.rear, null);
  assertInSync(q, r);
});

console.log('Invalid operations');
test('unknown operation / wrong structure / bad value all throw and change nothing', () => {
  const s = new Stack(), q = new Queue();
  runOperation(s, 'push', 1); runOperation(q, 'enqueue', 1);
  const ss = s.snapshot(), qs = q.snapshot();
  assert.throws(() => runOperation(s, 'enqueue', 1));
  assert.throws(() => runOperation(q, 'push', 1));
  assert.throws(() => runOperation(s, 'explode'));
  assert.throws(() => runOperation(s, 'push'));            // missing value
  assert.throws(() => runOperation(s, 'push', 'abc'));
  assert.throws(() => runOperation(q, 'enqueue', 1.5));
  assert.throws(() => runOperation({}, 'push', 1));
  assert.throws(() => createStructure('tree'));
  assert.deepEqual(s.snapshot(), ss); assert.deepEqual(q.snapshot(), qs);
});
test('Stack/Queue classes themselves throw on misuse', () => {
  assert.throws(() => new Stack().pop(), /underflow/i);
  assert.throws(() => new Stack().peek());
  assert.throws(() => { const s = new Stack(1); s.push(1); s.push(2); }, /overflow/i);
  assert.throws(() => new Queue().dequeue(), /underflow/i);
  assert.throws(() => new Queue().peekFront());
  assert.throws(() => { const q = new Queue(1); q.enqueue(1); q.enqueue(2); }, /overflow/i);
});

console.log('Step integrity');
test('every step is well-formed and C++ keys exist in the listing', () => {
  const check = (struct, code, ops) => {
    for (const [op, v] of ops) {
      const r = runOperation(struct, op, v);
      r.steps.forEach((st, i) => {
        assert.equal(st.index, i); assert.equal(st.total, r.steps.length);
        assert.equal(st.final, i === r.steps.length - 1);
        assert.ok(st.title && st.desc);
        assert.ok(st.keys.length > 0, `${op} step ${i} has no code line`);
        st.keys.forEach(k => assert.ok(lineIndexForKey(code, k) >= 0, `missing key ${k}`));
        assert.ok(['info', 'success', 'error'].includes(st.status));
        assert.ok(st.vars.members.length >= 5);
      });
      assert.equal(lastStep(r).status === 'error', r.status === 'error');
    }
  };
  check(new Stack(2), STACK_CODE, [['pop'], ['peek'], ['push', 1], ['push', 2], ['push', 3], ['peek'], ['pop'], ['clear'], ['clear']]);
  check(new Queue(2), QUEUE_CODE, [['dequeue'], ['front'], ['enqueue', 1], ['enqueue', 2], ['enqueue', 3], ['front'], ['dequeue'], ['dequeue'], ['clear'], ['clear']]);
});
test('code keys are unique', () => {
  for (const code of [STACK_CODE, QUEUE_CODE]) {
    const keys = code.map(([, k]) => k).filter(Boolean);
    assert.equal(new Set(keys).size, keys.length);
  }
});
test('every step snapshot is internally consistent', () => {
  const s = new Stack(5);
  const ops = [['push', 1], ['push', 2], ['pop'], ['push', 3], ['peek'], ['clear']];
  for (const [op, v] of ops) {
    runOperation(s, op, v).steps.forEach(st => {
      assert.equal(st.state.slots.length, st.state.top + 1);
      assert.equal(st.state.size, st.state.top + 1);
      assert.equal(st.state.isEmpty, st.state.top === -1);
    });
  }
  const q = new Queue(5);
  for (const [op, v] of [['enqueue', 1], ['enqueue', 2], ['dequeue'], ['enqueue', 3], ['front'], ['clear']]) {
    runOperation(q, op, v).steps.forEach(st => {
      assert.equal(st.state.isEmpty, st.state.items.length === 0);
      assert.equal(st.state.frontValue, st.state.items.length ? st.state.items[0] : null);
      assert.equal(st.state.rearValue, st.state.items.length ? st.state.items.at(-1) : null);
    });
  }
});
test('idle step mirrors the structure', () => {
  const s = new Stack(); runOperation(s, 'push', 3);
  assert.deepEqual(makeIdleStep(s, 'x').state, s.snapshot());
});

console.log('Randomised comparison against reference arrays (5000 ops each)');
function rng(seed) { let x = seed; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32; }
test('Stack matches a plain array model; visual state always equals real state', () => {
  const rand = rng(1), s = new Stack(6), model = [];
  for (let i = 0; i < 5000; i++) {
    const pick = rand(); let r;
    if (pick < 0.45) {
      const v = Math.floor(rand() * 200) - 100; r = runOperation(s, 'push', v);
      if (model.length < 6) model.push(v);
    } else if (pick < 0.85) {
      r = runOperation(s, 'pop');
      if (model.length) assert.equal(r.result, model.pop()); else assert.equal(r.status, 'error');
    } else if (pick < 0.98) {
      r = runOperation(s, 'peek');
      if (model.length) assert.equal(r.result, model.at(-1)); else assert.equal(r.status, 'error');
    } else { r = runOperation(s, 'clear'); model.length = 0; }
    assert.deepEqual(stackVals(s), model); assert.equal(s.top, model.length - 1);
    assertInSync(s, r);
  }
});
test('Queue matches a plain array model; visual state always equals real state', () => {
  const rand = rng(2), q = new Queue(6), model = [];
  for (let i = 0; i < 5000; i++) {
    const pick = rand(); let r;
    if (pick < 0.45) {
      const v = Math.floor(rand() * 200) - 100; r = runOperation(q, 'enqueue', v);
      if (model.length < 6) model.push(v);
    } else if (pick < 0.85) {
      r = runOperation(q, 'dequeue');
      if (model.length) assert.equal(r.result, model.shift()); else assert.equal(r.status, 'error');
    } else if (pick < 0.98) {
      r = runOperation(q, 'front');
      if (model.length) assert.equal(r.result, model[0]); else assert.equal(r.status, 'error');
    } else { r = runOperation(q, 'clear'); model.length = 0; }
    assert.deepEqual(q.toArray(), model); assert.equal(q.size, model.length);
    assert.equal(q.front === null, model.length === 0); assert.equal(q.rear === null, model.length === 0);
    assertInSync(q, r);
  }
});

console.log(`\n${passed} tests passed${process.exitCode ? ' — WITH FAILURES' : ''}`);
