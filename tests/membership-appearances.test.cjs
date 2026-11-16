const assert = require('node:assert/strict');
const { test } = require('node:test');
const { groupMembershipAppearances, membershipCleanSheet } = require('../lib/membership-appearances.ts');

test('awards clean sheets to starting goalkeepers for home and away shutouts', () => {
  const input = { role: 'Starter', isGoalkeeper: true, teamName: 'Lebanon', match: {
    teamA: 'Lebanon', teamB: 'Yemen', meta: { ftA: '2', ftB: '0' },
  } };
  assert.equal(membershipCleanSheet(input), 1);
  assert.equal(membershipCleanSheet({ ...input, teamName: 'Yemen' }), 0);
  assert.equal(membershipCleanSheet({ ...input, match: { ...input.match, meta: { ftA: '0', ftB: '0' } }, teamName: 'Yemen' }), 1);
  assert.equal(membershipCleanSheet({ ...input, role: 'Substitute' }), 0);
  assert.equal(membershipCleanSheet({ ...input, isGoalkeeper: false }), 0);
  assert.equal(membershipCleanSheet({ ...input, teamName: 'Unknown team' }), 0);
});

test('missing or invalid scores do not award a clean sheet', () => {
  const input = { role: 'Starter', isGoalkeeper: true, teamName: 'Lebanon', match: {
    teamA: 'Lebanon', teamB: 'Yemen', meta: null,
  } };
  assert.equal(membershipCleanSheet(input), 0);
  for (const score of [null, '', ' ', 'unknown', '0-0', '-1']) {
    assert.equal(membershipCleanSheet({ ...input, match: { ...input.match, meta: { ftA: '0', ftB: score } } }), 0);
    assert.equal(membershipCleanSheet({ ...input, match: { ...input.match, meta: { ftA: score, ftB: '0' } } }), 0);
  }
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
