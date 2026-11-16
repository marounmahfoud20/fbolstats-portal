const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { matchTime } = require('../lib/substitutions.ts');

function harness({ authenticated = true, teamName = 'Maldives', fail = false } = {}) {
  const calls = [];
  const save = async (query) => {
    calls.push(query);
    if (fail) throw new Error('Save failed');
    return { id: 9, ...query.data };
  };
  const modules = {
    '@/lib/admin-activity': { withAdminActivity: async (_action, _args, run) => run() },
    'next/headers': { cookies: async () => ({}) },
    'next/cache': { revalidatePath: () => {} },
    '@/lib/adminAuth': { getAdminUserFromCookies: () => authenticated ? 'admin' : null },
    '@/lib/substitutions': { matchTime },
    '@/lib/prisma': {
      match: { findUnique: async () => ({ teamA: 'Lebanon', teamB: 'Maldives' }) },
      team: { findUnique: async () => ({ name: teamName }) },
      matchEvent: { create: save, update: save },
    },
  };
  const source = fs.readFileSync(require.resolve('../lib/team-own-goal-actions.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const context = { exports: {}, require: (name) => { assert.ok(name in modules); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  return { run: context.exports.saveTeamOwnGoal, calls };
}

test('records an own goal against the committing team without inventing a player', async () => {
  const { run, calls } = harness();
  const result = await run(505, { teamId: 20, minute: '52', extraTime: '' });
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].data)), {
    matchId: 505, teamId: 20, personId: null, eventType: 'own_goal', minute: '52', extraTime: null,
  });
  assert.equal(result.event.teamName, 'Maldives');
  assert.equal(result.event.personId, null);
});

test('requires an admin and a participating team', async () => {
  for (const options of [{ authenticated: false }, { teamName: 'Unrelated team' }]) {
    const { run, calls } = harness(options);
    assert.equal((await run(505, { teamId: 20, minute: '52', extraTime: '' })).ok, false);
    assert.equal(calls.length, 0);
  }
});

test('rejects invalid minutes and IDs without writes', async () => {
  const { run, calls } = harness();
  for (const payload of [
    { teamId: 0, minute: '52', extraTime: '' },
    { teamId: 20, minute: '-1', extraTime: '' },
    { teamId: 20, minute: '', extraTime: '' },
    { teamId: 20, minute: '45+2', extraTime: '3' },
    { teamId: 20, minute: '52', extraTime: '', eventId: -1 },
  ]) assert.equal((await run(505, payload)).ok, false);
  assert.equal(calls.length, 0);
});

test('editing is scoped to a team-only own goal in the same match and preserves added time', async () => {
  const { run, calls } = harness();
  assert.equal((await run(505, { teamId: 20, eventId: 9, minute: '90+3', extraTime: '' })).ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].where)), { id: 9, matchId: 505, personId: null, eventType: 'own_goal' });
  assert.equal(calls[0].data.minute, '90');
  assert.equal(calls[0].data.extraTime, '3');
});

test('save failures return an error', async () => {
  const { run } = harness({ fail: true });
  assert.equal((await run(505, { teamId: 20, minute: '52', extraTime: '' })).ok, false);
});
