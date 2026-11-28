const assert = require('node:assert/strict');
const { test } = require('node:test');
const { matchAssistCredits } = require('../lib/goal-assist-events.ts');

test('assists count from linked goals and legacy events without counting both for the same goal', () => {
  const events = [
    { id: 1, matchId: 5, teamId: 3, eventType: 'goal', minute: '90', extraTime: '3', personId: 9, assistPersonId: 23 },
    { id: 2, matchId: 5, teamId: 3, eventType: 'assist', minute: '90+3', extraTime: null, personId: 23, assistPersonId: null },
    { id: 3, matchId: 5, teamId: 3, eventType: 'goal', minute: '34', extraTime: null, personId: 18, assistPersonId: 7 },
    { id: 4, matchId: 5, teamId: 3, eventType: 'goal', minute: '22', extraTime: null, personId: 7, assistPersonId: null },
    { id: 5, matchId: 5, teamId: 3, eventType: 'assist', minute: '22', extraTime: null, personId: 5, assistPersonId: null },
    { id: 6, matchId: 6, teamId: 3, eventType: 'assist', minute: '90+3', extraTime: null, personId: 23, assistPersonId: null },
  ];
  assert.deepEqual(matchAssistCredits(events), [
    { personId: 23, teamId: 3 },
    { personId: 7, teamId: 3 },
    { personId: 5, teamId: 3 },
    { personId: 23, teamId: 3 },
  ]);
});
