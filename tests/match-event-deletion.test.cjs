const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { matchEventIdsToDelete } = require('../lib/match-event-deletion.ts');

function actionHarness({ authenticated = true, fail = false } = {}) {
  const calls = [];
  const events = [{ id: 1, substitutionId: 'pair' }, { id: 2, substitutionId: 'pair' }, { id: 3, substitutionId: null }];
  const tx = {
    matchEvent: {
      findMany: async (query) => { calls.push(['find', query]); return events; },
      deleteMany: async (query) => { calls.push(['events', query]); return { count: query.where.id.in.length }; },
    },
    matchAppearance: {
      deleteMany: async (query) => { calls.push(['appearances', query]); return { count: query.where.id.in.length }; },
    },
  };
  const modules = {
    '@/lib/admin-activity': { withAdminActivity: async (_action, _args, run) => run() },
    'next/headers': { cookies: async () => ({}) },
    'next/cache': { revalidatePath: (path) => calls.push(['revalidate', path]) },
    '@/lib/adminAuth': { getAdminUserFromCookies: () => authenticated ? 'admin' : null },
    '@/lib/match-event-deletion': { matchEventIdsToDelete },
    '@/lib/prisma': { $transaction: async (run, options) => {
      calls.push(['transaction', options]);
      if (fail) throw new Error('Database unavailable');
      return run(tx);
    } },
  };
  const source = fs.readFileSync(require.resolve('../app/admin/matches/[id]/delete-events/actions.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const context = { exports: {}, require: (name) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(compiled, context);
  return { run: context.exports.deleteMatchEvents, calls };
}

test('deleting either side of a substitution includes both sides and excludes other events', () => {
  const events = [{ id: 1, substitutionId: 'pair' }, { id: 2, substitutionId: 'pair' }, { id: 3, substitutionId: null }];
  assert.deepEqual(matchEventIdsToDelete(events, [1]), [1, 2]);
  assert.deepEqual(matchEventIdsToDelete(events, [2]), [1, 2]);
  assert.deepEqual(matchEventIdsToDelete(events, [3]), [3]);
  assert.deepEqual(matchEventIdsToDelete(events, [999]), []);
});

test('deletion is authenticated and invalid or empty requests never reach the database', async () => {
  const unauthenticated = actionHarness({ authenticated: false });
  assert.equal((await unauthenticated.run(505, [1], [])).ok, false);
  assert.equal(unauthenticated.calls.length, 0);
  const harness = actionHarness();
  for (const args of [[505, [], []], [0, [1], []], [505, [-1], []], [505, [1.2], []], [505, [], ['2']], [505, null, []]]) {
    assert.equal((await harness.run(...args)).ok, false);
  }
  assert.equal(harness.calls.length, 0);
});

test('bulk deletion scopes reads and both deletes to the match and uses a single transaction', async () => {
  const { run, calls } = actionHarness();
  const result = await run(505, [1, 999], [7]);
  assert.equal(result.ok, true);
  assert.equal(result.deleted, 3);
  const normalized = JSON.parse(JSON.stringify(calls));
  assert.equal(normalized.filter(([kind]) => kind === 'transaction').length, 1);
  assert.deepEqual(normalized.find(([kind]) => kind === 'find')[1].where, { matchId: 505 });
  assert.deepEqual(normalized.find(([kind]) => kind === 'events')[1].where, { matchId: 505, id: { in: [1, 2] } });
  assert.deepEqual(normalized.find(([kind]) => kind === 'appearances')[1].where, { matchId: 505, id: { in: [7] } });
  assert.ok(normalized.some(([kind, path]) => kind === 'revalidate' && path === '/admin/matches/505'));
});

test('database failure returns an error without reporting deletion or refreshing pages', async () => {
  const { run, calls } = actionHarness({ fail: true });
  assert.equal((await run(505, [1], [])).ok, false);
  assert.equal(calls.some(([kind]) => kind === 'revalidate'), false);
});
