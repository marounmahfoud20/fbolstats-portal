const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, modules = {}) {
  const source = fs.readFileSync(require.resolve(file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { exports: {}, console, require: name => {
    if (name in modules) return modules[name];
    if (name === 'crypto') return require(name);
    throw Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));

function formHarness({ fail = false, existingAppearances = [] } = {}) {
  const states = [], saves = [], navigation = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const { default: Form } = load('../app/admin/matches/[id]/edit-lineups/EditLineupForm.tsx', {
    react: { useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({ push: path => navigation.push(path), refresh: () => navigation.push('refresh') }) },
    '@/lib/match-actions': { saveMatchLineups: async (...args) => { saves.push(plain(args)); if (fail) throw Error('offline'); } },
    '@/lib/membership-eligibility': { isMembershipActiveOnDate: () => true },
  });
  const people = ['Alpha', 'Beta', 'Hasan Farhat'].map((commonName, i) => ({ id: i + 1, commonName, firstName: null, lastName: null, position: null }));
  const props = { matchId: 878, matchDate: '2026-11-18', teamA: { id: 10, name: 'Lebanon', memberships: people.map(person => ({ id: person.id, role: 'Player', startDate: null, endDate: null, isActive: true, person })) }, teamB: null, existingAppearances, initialShirts: { 1: '9', 2: '' }, suggestedShirts: { '10-1': '4', '10-2': '8', '10-3': '4' } };
  const render = () => { cursor = 0; return Form(props); };
  function walk(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(n => walk(n));
    return [node, ...walk(node.props?.children)];
  }
  const nodes = () => walk(render());
  const find = label => nodes().find(n => n.props?.['aria-label'] === label);
  const save = () => nodes().find(n => n.type === 'button' && n.props.children === 'Save Lineups').props.onClick();
  return { saves, navigation, nodes, find, save };
}

test('multiple pending selections keep candidate rows in place, remain reversible, and only save on demand', async () => {
  const h = formHarness();
  const candidateLabels = () => h.nodes().filter(n => n.type === 'input' && n.props.type === 'checkbox').map(n => n.props['aria-label']);
  const initial = candidateLabels();
  h.find('Select Alpha as starter for Lebanon').props.onChange();
  h.find('Select Beta as substitute for Lebanon').props.onChange();
  h.find('Select Hasan Farhat as starter for Lebanon').props.onChange();
  assert.deepEqual(candidateLabels(), initial);
  assert.equal(h.saves.length, 0);
  h.find('Select Beta as starter for Lebanon').props.onChange();
  assert.equal(h.find('Select Beta as substitute for Lebanon').props.checked, false);
  h.find('Select Beta as starter for Lebanon').props.onChange();
  assert.equal(h.find('Select Beta as starter for Lebanon').props.checked, false);
  await h.save();
  assert.equal(h.saves.length, 1);
  assert.deepEqual(h.saves[0][1], [{ teamId: 10, personId: 1, role: 'Starter' }, { teamId: 10, personId: 3, role: 'Starter' }]);
  assert.equal(h.find('Select Alpha as starter for Lebanon'), undefined);
  assert.ok(h.find('Select Beta as starter for Lebanon'));
  assert.ok(h.navigation.includes('refresh'));
});

test('suggested numbers are editable drafts and current match numbers, including cleared values, take precedence', async () => {
  const h = formHarness();
  assert.equal(h.find('Shirt number for Alpha (10)').props.value, '9');
  assert.equal(h.find('Shirt number for Beta (10)').props.value, '');
  assert.equal(h.find('Shirt number for Hasan Farhat (10)').props.value, '4');
  h.find('Shirt number for Hasan Farhat (10)').props.onChange({ target: { value: '17' } });
  assert.equal(h.saves.length, 0);
  h.find('Select Hasan Farhat as substitute for Lebanon').props.onChange();
  await h.save();
  assert.deepEqual(h.saves[0][2], [{ personId: 3, number: '17' }]);
});

test('failed save keeps selections and edited numbers available to retry', async () => {
  const h = formHarness({ fail: true });
  h.find('Select Hasan Farhat as starter for Lebanon').props.onChange();
  h.find('Shirt number for Hasan Farhat (10)').props.onChange({ target: { value: '' } });
  await h.save();
  assert.equal(h.find('Select Hasan Farhat as starter for Lebanon').props.checked, true);
  assert.equal(h.find('Shirt number for Hasan Farhat (10)').props.value, '');
  assert.ok(h.nodes().some(n => n.props?.role === 'alert'));
  assert.equal(h.navigation.length, 0);
});

test('saved starter/substitute sections do not move players until saving a role change', async () => {
  const h = formHarness({ existingAppearances: [{ personId: 1, teamId: 10, role: 'Starter' }] });
  const role = () => h.find('Lineup role for Alpha (Lebanon)');
  role().props.onChange({ target: { value: 'Substitute' } });
  assert.equal(role().props.value, 'Substitute');
  assert.ok(h.nodes().some(n => n.type === 'h3' && JSON.stringify(n.props.children).includes('Starters') && n.props.children.at(-2) === 1));
  assert.equal(h.saves.length, 0);
  await h.save();
  assert.equal(h.saves[0][1][0].role, 'Substitute');
});

test('edition number lookup scopes by edition, team and prior date, and only uses the matching player appearance', async () => {
  const { getEditionShirtNumbers } = load('../lib/edition-shirt-numbers.ts');
  let query;
  const db = { matchShirtNumber: { findMany: async args => {
    query = plain(args);
    return [
      { personId: 3, number: '4', match: { appearances: [{ personId: 3, teamId: 10 }, { personId: 7, teamId: 20 }] } },
      { personId: 3, number: '8', match: { appearances: [{ personId: 3, teamId: 10 }] } },
      { personId: 9, number: '2', match: { appearances: [{ personId: 7, teamId: 10 }] } },
      { personId: 3, number: '11', match: { appearances: [{ personId: 3, teamId: 20 }] } },
    ];
  } } };
  const numbers = plain(await getEditionShirtNumbers(db, { matchId: 878, seasonId: 55, date: '2026-11-18', teamIds: [10, 20] }));
  assert.deepEqual(numbers, { '10-3': '4', '20-3': '11' });
  assert.deepEqual(query.where.match.group, { seasonId: 55 });
  assert.deepEqual(query.where.match.appearances.some.teamId, { in: [10, 20] });
  assert.deepEqual(query.where.match.OR, [{ date: { lt: '2026-11-18' } }, { date: '2026-11-18', id: { lt: 878 } }]);
  assert.deepEqual(query.where.matchId, { not: 878 });
  assert.deepEqual(query.orderBy[0], { match: { date: 'desc' } });
});

function actionHarness({ fail = false, authenticated = true } = {}) {
  let state = { appearances: [{ personId: 90, teamId: null, role: 'Main Referee' }, { personId: 1, teamId: 10, role: 'Starter' }], shirts: [{ personId: 1, number: '9' }, { personId: 2, number: '' }] };
  const calls = [];
  const db = { $transaction: async run => {
    calls.push('transaction');
    const draft = structuredClone(state);
    const tx = {
      match: { findUnique: async () => ({ id: 878, teamA: 'Lebanon', teamB: 'Iraq', date: '2026-11-18', group: { seasonId: 55 }, shirts: draft.shirts.slice() }) },
      team: { findMany: async () => [{ id: 10 }, { id: 20 }] },
      matchAppearance: {
        deleteMany: async () => { draft.appearances = draft.appearances.filter(a => a.teamId === null); },
        createMany: async ({ data }) => { draft.appearances.push(...data); },
      },
      matchShirtNumber: {
        deleteMany: async ({ where }) => { draft.shirts = draft.shirts.filter(s => !where.personId.in.includes(s.personId)); },
        createMany: async ({ data }) => { if (fail) throw Error('write failed'); draft.shirts.push(...data); },
      },
    };
    const result = await run(tx);
    state = draft;
    return result;
  } };
  const { saveMatchLineups } = load('../lib/match-actions.ts', {
    '@/lib/admin-activity': { withAdminActivity: async (_name, _args, run) => run() },
    '@/lib/prisma': db,
    'next/cache': { revalidatePath: path => calls.push(path) },
    'next/headers': { cookies: async () => ({}) },
    '@/lib/adminAuth': { getAdminUserFromCookies: () => authenticated ? 'admin' : null },
    '@/lib/substitutions': {},
    '@/lib/edition-shirt-numbers': { getEditionShirtNumbers: async () => ({ '10-1': '4', '10-2': '8', '10-3': '4' }) },
  });
  return { saveMatchLineups, state: () => plain(state), calls };
}

test('lineup save preserves referees, applies edition defaults and retains current match overrides', async () => {
  const h = actionHarness();
  await h.saveMatchLineups(878, [1, 2, 3].map(personId => ({ personId, teamId: 10, role: 'Starter' })));
  assert.equal(h.state().appearances[0].role, 'Main Referee');
  assert.equal(h.state().shirts.find(s => s.personId === 1).number, '9');
  assert.equal(h.state().shirts.find(s => s.personId === 2).number, '');
  assert.equal(h.state().shirts.find(s => s.personId === 3).number, '4');
  assert.equal(h.calls.filter(c => c === 'transaction').length, 1);
});

test('explicit number edits and clearing override edition defaults', async () => {
  const h = actionHarness();
  await h.saveMatchLineups(878, [{ personId: 3, teamId: 10, role: 'Substitute' }], [{ personId: 3, number: '' }]);
  assert.equal(h.state().shirts.find(s => s.personId === 3).number, '');
});

test('a shirt write failure rolls back the entire lineup and does not refresh pages', async () => {
  const h = actionHarness({ fail: true });
  const before = h.state();
  await assert.rejects(h.saveMatchLineups(878, [{ personId: 3, teamId: 10, role: 'Starter' }]), /write failed/);
  assert.deepEqual(h.state(), before);
  assert.equal(h.calls.some(c => c.startsWith('/admin/')), false);
});

test('lineup writes require authentication and reject numbers for players outside the lineup', async () => {
  const h = actionHarness({ authenticated: false });
  await assert.rejects(h.saveMatchLineups(878, []), /Unauthorized/);
  assert.equal(h.calls.length, 0);
  const valid = actionHarness();
  const before = valid.state();
  await assert.rejects(valid.saveMatchLineups(878, [], [{ personId: 3, number: '4' }]), /Only lineup players/);
  assert.deepEqual(valid.state(), before);
});
