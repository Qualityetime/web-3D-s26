import test from 'node:test';
import assert from 'node:assert/strict';
import { validateJoin, sanitizeBatch } from '../shared/protocol.js';
import { neutralInput } from '../shared/movement.js';

test('room identifiers normalize and invalid joins are rejected', () => {
  assert.deepEqual(validateJoin({ room: ' bones ', name: ' Hunter ' }), { room: 'BONES', name: 'Hunter' });
  for (const auth of [null, {}, { room: '../world', name: 'Hunter' }, { room: 'BONES', name: '' }, { room: 'BONES', name: 'x'.repeat(21) }]) {
    assert.throws(() => validateJoin(auth));
  }
});

test('untrusted movement batches reject invalid values and strip positions and durations', () => {
  const valid = { ...neutralInput(), seq: 1, forward: 1, x: 100, dt: 1000, pitch: 99 };
  const [sanitized] = sanitizeBatch([valid], 0);
  assert.equal(sanitized.x, undefined);
  assert.equal(sanitized.dt, undefined);
  assert.equal(sanitized.pitch, 1.45);
  for (const batch of [[], {}, Array(9).fill(valid), [{ ...valid, yaw: NaN }], [{ ...valid, forward: 100 }], [{ ...valid, seq: 0 }], [{ ...valid, seq: Infinity }], [{ ...valid, sprint: 'yes' }], [{ ...valid, pitch: null }]]) {
    assert.equal(sanitizeBatch(batch, 0), null);
  }
  assert.equal(sanitizeBatch([valid], 1), null, 'replayed command');
  assert.equal(sanitizeBatch([{ ...valid, seq: 300 }], 0), null, 'extreme sequence jump');
});
