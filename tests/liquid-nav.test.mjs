import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaterState, targetWater, advanceWater, getWaterTarget } from '../src/nav-physics.js';

const target = x => ({ x, cy: 41, q: 30, r: 21 });
function setup() {
  const state = createWaterState(); state.width = 700; state.height = 54;
  targetWater(state, target(75), 0); return state;
}
function run(state, start, seconds, fps = 60) {
  for (let i = 1; i <= seconds * fps; i++) advanceWater(state, 1 / fps, start + i * 1000 / fps, () => .5);
}

test('head leads the delayed tail during a click transition', () => {
  const state = setup(); targetWater(state, target(500), 0);
  run(state, 0, .05);
  assert.ok(state.a.x - state.b.x > 20);
  assert.ok(state.sy.s < 1);
});

test('long jump splits into droplets, then merges and settles', () => {
  for (const fps of [30, 60, 120]) {
    const state = setup(); targetWater(state, target(600), 0);
    run(state, 0, .3, fps);
    assert.equal(state.split, true);
    assert.ok(state.satellites.length > 0);
    run(state, 300, 5, fps);
    assert.ok(Math.abs(state.a.x - 600) < .3);
    assert.ok(Math.abs(state.b.x - 600) < .3);
    assert.equal(state.satellites.length, 0);
    assert.equal(state.moving, false);
    assert.equal(state.ripples.length, 0);
  }
});

test('retarget preserves current positions and velocities', () => {
  const state = setup(); targetWater(state, target(600), 0); run(state, 0, .1);
  const before = [state.a.x, state.b.x, state.a.v, state.b.v];
  targetWater(state, target(120), 100);
  assert.deepEqual([state.a.x, state.b.x, state.a.v, state.b.v], before);
  run(state, 100, 5);
  assert.ok(Math.abs(state.a.x - 120) < .3 && Math.abs(state.b.x - 120) < .3);
});

test('pointer wake does not move selection and fades on leave', () => {
  const state = setup(); state.mouse.on = true; run(state, 0, 1);
  assert.ok(state.mouse.strength > .99);
  assert.equal(state.a.x, 75); assert.equal(state.b.x, 75);
  state.mouse.on = false; run(state, 1000, 1);
  assert.ok(state.mouse.strength < .01);
});

test('reduced motion places both capsules immediately without droplets', () => {
  const state = setup(); state.reduced = true; targetWater(state, target(600), 0);
  assert.equal(state.a.x, 600); assert.equal(state.b.x, 600);
  run(state, 0, 1);
  assert.equal(state.satellites.length, 0); assert.equal(state.ripples.length, 0);
});

test('mobile highlight fits inside the reference-sized 48px dock and stays centered', () => {
  for (let index = 0; index < 6; index++) {
    const target = getWaterTarget({left:5+index*41, top:4, width:41, height:40},2);
    assert.equal(target.cy,38);
    assert.equal(target.x,39.5+index*41);
    assert.equal(target.r,18);
    assert.equal(target.q,.5);
    // Smoothly joining two identical shader capsules adds 13/4 px to the radius.
    assert.ok(target.r+13/4<24);
  }
  assert.deepEqual(getWaterTarget({left:6,top:6,width:100,height:42}),{x:70,cy:41,q:29,r:21});
});
