const assert = require('node:assert/strict');
const { test } = require('node:test');
const { groupMembershipAppearances } = require('../lib/membership-appearances.ts');
const { goalkeeperCleanSheet } = require('../lib/substitutions.ts');

const goalkeeper = { personId: 1, teamId: 10, role: 'Starter' };
const substitute = { personId: 2, teamId: 10, role: 'Substitute' };
const event = (personId, teamId, eventType, minute, extraTime = null) => ({ personId, teamId, eventType, minute, extraTime });
const match = (ftA, ftB, events = []) => ({ teamA: 'Lebanon', teamB: 'Yemen', meta: { ftA, ftB }, events });
const credit = (result, appearance = goalkeeper) => goalkeeperCleanSheet({
  appearance, isGoalkeeper: true, teamName: 'Lebanon', match: result,
});

test('awards clean sheets to starting goalkeepers for home and away shutouts', () => {
  const input = { appearance: goalkeeper, isGoalkeeper: true, teamName: 'Lebanon', match: match('2', '0') };
  const away = { ...input, teamName: 'Yemen', appearance: { ...goalkeeper, teamId: 20 } };
  assert.equal(goalkeeperCleanSheet(input), 1);
  assert.equal(goalkeeperCleanSheet(away), 0);
  assert.equal(goalkeeperCleanSheet({ ...away, match: match('0', '2', [event(3, 20, 'goal', '33')]) }), 1);
  assert.equal(credit(input.match, substitute), 0);
  assert.equal(goalkeeperCleanSheet({ ...input, isGoalkeeper: false }), 0);
  assert.equal(goalkeeperCleanSheet({ ...input, teamName: 'Unknown team' }), 0);
});

test('missing or invalid scores do not award a clean sheet', () => {
  assert.equal(credit({ ...match('0', '0'), meta: null }), 0);
  for (const score of [null, '', ' ', 'unknown', '0-0', '-1']) {
    assert.equal(credit(match('0', score)), 0);
    assert.equal(credit(match(score, '0')), 0);
  }
});

test('credits the starter who goes off at 70 before the replacement concedes at 80', () => {
  const result = match('1', '1', [
    event(2, 10, 'sub_in', '70'), event(3, 20, 'goal', '80'),
    event(1, 10, 'sub_out', '70'), event(4, 10, 'goal', '65'),
  ]);
  assert.equal(credit(result), 1);
  assert.equal(credit(result, substitute), 0);
});

test('requires 60 minutes from starters and substitutes, including players sent off', () => {
  assert.equal(credit(match('0', '0', [event(1, 10, 'second_yellow', '59')])), 0);
  assert.equal(credit(match('0', '0', [event(1, 10, 'sub_out', '60')])), 1);
  assert.equal(credit(match('0', '0', [event(2, 10, 'sub_in', '31')]), substitute), 0);
  assert.equal(credit(match('0', '1', [
    event(3, 20, 'penalty_goal', '24'), event(2, 10, 'substitute_in', '30'),
  ]), substitute), 1);
});

test('checks the whole stint for conceded goals, including own goals and stoppage time', () => {
  const exit = event(1, 10, 'sub_out', '90', '2');
  for (const goal of [
    event(null, 10, 'own_goal', '65'),
    event(3, 20, 'penalty_goal', '90+1'),
    event(3, 20, 'goal', '90+2'),
  ]) {
    assert.equal(credit(match('0', '1', [exit, goal])), 0);
  }
  const lateGoal = event(3, 20, 'goal', '90+3');
  assert.equal(credit(match('0', '1', [exit, lateGoal])), 1);
  assert.equal(credit(match('0', '1', [lateGoal])), 0);
  assert.equal(credit(match('1', '0', [event(null, 20, 'own_goal', '65')])), 1);
});

test('requires recorded times for all conceded goals when awarding a partial-match clean sheet', () => {
  const exit = event(1, 10, 'sub_out', '70');
  assert.equal(credit(match('0', '1', [exit])), 0);
  assert.equal(credit(match('0', '1', [exit, event(3, 20, 'goal', null)])), 0);
  assert.equal(credit(match('0', '2', [exit, event(3, 20, 'goal', '80')])), 0);
  assert.equal(credit(match('0', '0', [event(1, 10, 'sub_out', null)])), 0);
});

test('uses the extra-time result and duration when extra time was played', () => {
  const result = match('0', '0', [event(2, 10, 'sub_in', '60'), event(3, 20, 'goal', '110')]);
  result.meta = { ...result.meta, etA: '0', etB: '1' };
  assert.equal(credit(result, substitute), 0);
  assert.equal(credit({ ...result, meta: { ...result.meta, etB: '0' }, events: result.events.slice(0, 1) }, substitute), 1);
});

test('counts a starter, goalkeeper and captain as one match and preserves captaincy', () => {
  const starter = { matchId: 504, role: 'Starter' };
  for (const rows of [
    [starter, { matchId: 504, role: 'Goalkeeper' }, { matchId: 504, role: 'Captain' }],
    [{ matchId: 504, role: 'Captain' }, { matchId: 504, role: 'Goalkeeper' }, starter],
  ]) {
    assert.deepEqual(groupMembershipAppearances(rows), [{ appearance: starter, captain: true }]);
  }
});

test('preserves the substitute role so auxiliary roles do not alter minutes or unused bench counts', () => {
  const substitute = { matchId: 505, role: 'Substitute' };
  assert.deepEqual(groupMembershipAppearances([
    { matchId: 505, role: 'Goalkeeper' }, substitute, { matchId: 505, role: 'Captain' },
  ]), [{ appearance: substitute, captain: true }]);
});

test('retains match order, collapses repeated records and keeps distinct matches', () => {
  const recent = { matchId: 706, role: 'Starter' };
  const earlier = { matchId: 504, role: 'Starter' };
  assert.deepEqual(groupMembershipAppearances([recent, recent, earlier]), [
    { appearance: recent, captain: false }, { appearance: earlier, captain: false },
  ]);
  assert.deepEqual(groupMembershipAppearances([]), []);
});
