const assert = require('node:assert/strict');
const { test } = require('node:test');
const { matchTime, playersOnField } = require('../lib/substitutions.ts');

const appearances = [
  { personId: 1, teamId: 10, role: 'Starter' },
  { personId: 2, teamId: 10, role: 'Starter' },
  { personId: 3, teamId: 10, role: 'Substitute' },
  { personId: 4, teamId: 10, role: 'Substitute' },
  { personId: 5, teamId: 20, role: 'Starter' },
];
const event = (personId, eventType, minute, extraTime = null, substitutionId = null) => ({
  personId, eventType, minute, extraTime, substitutionId, teamId: 10,
});

test('accepts normal and added-time minutes and rejects conflicting or invalid times', () => {
  assert.deepEqual(matchTime('65'), [65, 0]);
  assert.deepEqual(matchTime("90+3'"), [90, 3]);
  assert.deepEqual(matchTime('90', '3'), [90, 3]);
  assert.equal(matchTime('90+3', '4'), null);
  for (const minute of ['', '-1', 'abc', '3.5']) assert.equal(matchTime(minute), null);
});

test('offers only starters from the selected team before any substitutions', () => {
  assert.deepEqual([...playersOnField(appearances, [], 10, [0, 0])], [1, 2]);
});

test('a substitute becomes eligible to be replaced after coming on', () => {
  const events = [event(1, 'sub_out', '60'), event(3, 'sub_in', '60')];
  assert.deepEqual([...playersOnField(appearances, events, 10, [59, 0])], [1, 2]);
  assert.deepEqual([...playersOnField(appearances, events, 10, [60, 0])], [2, 3]);
  assert.deepEqual([...playersOnField(appearances, [...events, event(3, 'sub_out', '75'), event(4, 'sub_in', '75')], 10, [80, 0])], [2, 4]);
});

test('sent-off and replaced players are excluded', () => {
  const events = [event(1, 'red_card', '25'), event(2, 'second_yellow', '40')];
  assert.equal(playersOnField(appearances, events, 10, [50, 0]).size, 0);
});

test('first-half added time is before the second half, not minute 48', () => {
  const events = [event(1, 'sub_out', '45', '3'), event(3, 'sub_in', '45', '3')];
  assert.deepEqual([...playersOnField(appearances, events, 10, [45, 2])], [1, 2]);
  assert.deepEqual([...playersOnField(appearances, events, 10, [46, 0])], [2, 3]);
});

test('editing a substitution excludes its own pair but keeps other events', () => {
  const events = [event(1, 'sub_out', '60', null, 'pair'), event(3, 'sub_in', '60', null, 'pair'), event(2, 'red_card', '50')];
  assert.deepEqual([...playersOnField(appearances, events, 10, [60, 0], 'pair')], [1]);
});

test('legacy event names and inline added time are respected', () => {
  const events = [event(1, 'so', '90+2'), event(3, 'substitute_in', '90+2')];
  assert.deepEqual([...playersOnField(appearances, events, 10, [90, 3])], [2, 3]);
});

test('opponent events do not alter the selected team', () => {
  assert.deepEqual([...playersOnField(appearances, [{ ...event(1, 'sub_out', '20'), teamId: 20 }], 10, [30, 0])], [1, 2]);
});

test('a team-only own goal does not change players on the field', () => {
  assert.deepEqual([...playersOnField(appearances, [event(null, 'own_goal', '52')], 10, [60, 0])], [1, 2]);
});
