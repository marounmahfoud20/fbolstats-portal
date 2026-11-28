const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const sections = require('../lib/national-competitions.ts');
const plain = value => JSON.parse(JSON.stringify(value));

function load(file, modules) {
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const context = { exports: {}, require: name => {
    assert.ok(name in modules, `Unexpected import: ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('every youth age has separate male and female categories without changing senior categories', () => {
  assert.equal(sections.NATIONAL_TEAM_SECTIONS.men.category, 'Men');
  assert.equal(sections.NATIONAL_TEAM_SECTIONS.women.category, 'Women');
  const categories = new Set();
  for (const gender of ['men', 'women']) for (const age of sections.NATIONAL_TEAM_AGES) {
    const key = `${gender}-u${age}`;
    assert.equal(sections.isNationalTeamSection(key), true);
    const section = sections.NATIONAL_TEAM_SECTIONS[key];
    assert.equal(section.gender, gender);
    assert.equal(section.age, age);
    assert.equal(sections.nationalTeamSection({ footballType: 'national', type: section.category }), key);
    assert.equal(sections.nationalCompetitionHref(key, 123), `/admin/national-teams/${key}/competitions/123`);
    assert.equal(categories.has(section.category), false);
    categories.add(section.category);
    assert.equal(sections.nationalTeamSection({ footballType: 'club', type: section.category }), null);
  }
  for (const invalid of ['__proto__', 'constructor', 'men-u99', 'women-u0', 'men-u17/matches', 'youth']) {
    assert.equal(sections.isNationalTeamSection(invalid), false);
  }
});

function actionHarness(authenticated = true) {
  const competitions = [{ id: 1, competitionName: 'Friendlies', footballType: 'national', type: 'Men' }];
  const writes = [], redirects = [];
  const action = load('../lib/national-competition-actions.ts', {
    '@/lib/admin-activity': { withAdminActivity: async (_name, _args, run) => run() },
    'next/headers': { cookies: async () => ({}) },
    'next/navigation': { redirect: href => redirects.push(href) },
    'next/cache': { revalidatePath: () => {} },
    '@/lib/adminAuth': { getAdminUserFromCookies: () => authenticated ? 'admin' : null },
    '@/lib/national-competitions': sections,
    '@/lib/prisma': { league: {
      findFirst: async ({ where }) => competitions.find(c => c.footballType === where.footballType && c.type === where.type && c.competitionName.toLowerCase() === where.competitionName.equals.toLowerCase()),
      create: async ({ data }) => { writes.push(plain(data)); const c = { id: competitions.length + 1, ...data }; competitions.push(c); return c; },
    } },
  });
  const form = (section, view) => new Map([['section', section], ['name', 'Friendlies'], ['view', view]]);
  return { create: (section, view) => action.createNationalCompetition(form(section, view)), writes, redirects };
}

test('creating same-named youth competitions isolates genders and age groups and reuses only the same section', async () => {
  const h = actionHarness();
  for (const key of ['men-u17', 'women-u17', 'men-u20', 'men-u17', 'men']) await h.create(key);
  assert.deepEqual(h.writes.map(w => w.type), ['Men U17', 'Women U17', 'Men U20']);
  assert.ok(h.writes.every(w => w.footballType === 'national'));
  assert.deepEqual(h.redirects, [
    '/admin/national-teams/men-u17/competitions/2',
    '/admin/national-teams/women-u17/competitions/3',
    '/admin/national-teams/men-u20/competitions/4',
    '/admin/national-teams/men-u17/competitions/2',
    '/admin/national-teams/men/competitions/1',
  ]);
});

test('invalid sections and unauthenticated competition creation cannot write records', async () => {
  const h = actionHarness();
  await assert.rejects(h.create('men-u99'), /competition name/);
  assert.equal(h.writes.length, 0);
  const unauthenticated = actionHarness(false);
  await assert.rejects(unauthenticated.create('men-u17'), /Sign in/);
  assert.equal(unauthenticated.writes.length, 0);
});

test('creating a competition from a combined view requires an age in that view', async () => {
  const h = actionHarness();
  await assert.rejects(h.create('women-u19', 'women-u17-u16'), /Select an age group/);
  assert.equal(h.writes.length, 0);
  await h.create('women-u16', 'women-u17-u16');
  assert.equal(h.writes[0].type, 'Women U16');
  assert.deepEqual(h.redirects, ['/admin/national-teams/women-u17-u16/competitions/2']);
});

const jsx = (type, props) => ({ type, props });
function pageHarness(file, prisma) {
  return load(file, {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': 'a',
    'next/navigation': {
      notFound: () => { throw Error('not found'); },
      redirect: href => { throw Error(`redirect to ${href}`); },
    },
    '@/lib/prisma': prisma,
    '@/components/MatchNoteIcon': 'match-note-icon',
    '@/lib/database-read': { retryDatabaseRead: fn => fn() },
    '@/lib/national-competitions': sections,
    '@/lib/page-metadata': { createNationalTeamMetadata: () => ({}), createEntityMetadata: () => ({}) },
    '@/lib/national-competition-actions': { createNationalCompetition: () => {} },
    './CompetitionSubmitButton': 'button',
    './NationalTeamNavigation': 'nav',
  }).default;
}

test('combined youth views query all and only their age categories', async () => {
  const queries = [];
  const prisma = {
    league: { findMany: async query => { queries.push(plain(query.where)); return []; } },
    match: { findMany: async query => { queries.push(plain(query.where)); return []; } },
  };
  const hub = pageHarness('../app/admin/national-teams/[gender]/page.tsx', prisma);
  const matches = pageHarness('../app/admin/national-teams/[gender]/matches/page.tsx', prisma);
  await hub({ params: Promise.resolve({ gender: 'men-u23' }) });
  await hub({ params: Promise.resolve({ gender: 'women-u20-u19-u18' }) });
  await matches({ params: Promise.resolve({ gender: 'women-u15-u14-u13' }) });
  await assert.rejects(hub({ params: Promise.resolve({ gender: 'women-u19' }) }), /redirect to \/admin\/national-teams\/women-u20-u19-u18$/);
  await assert.rejects(matches({ params: Promise.resolve({ gender: 'women-u13' }) }), /redirect to \/admin\/national-teams\/women-u15-u14-u13\/matches$/);
  assert.deepEqual(queries, [
    { footballType: 'national', type: 'Men U23' },
    { footballType: 'national', type: { in: ['Women U20', 'Women U19', 'Women U18'] } },
    { group: { season: { league: { footballType: 'national', type: { in: ['Women U15', 'Women U14', 'Women U13'] } } } } },
  ]);
});

test('competition detail refuses a competition from a different youth section', async () => {
  const page = pageHarness('../app/admin/national-teams/[gender]/competitions/[id]/page.tsx', {
    league: { findFirst: async ({ where }) => {
      const type = { 50: 'Men U17', 51: 'Women U16' }[where.id];
      return type && where.footballType === 'national' && (where.type === type || where.type.in?.includes(type))
        ? { id: where.id, competitionName: 'WAFF Championship', type, seasons: [] } : null;
    } },
  });
  await page({ params: Promise.resolve({ gender: 'men-u17', id: '50' }) });
  await assert.rejects(page({ params: Promise.resolve({ gender: 'women-u17', id: '50' }) }), /not found/);
  await assert.rejects(page({ params: Promise.resolve({ gender: 'men-u20', id: '50' }) }), /not found/);
  await page({ params: Promise.resolve({ gender: 'women-u17-u16', id: '51' }) });
  await page({ params: Promise.resolve({ gender: 'women-u16', id: '51' }) });
  await assert.rejects(page({ params: Promise.resolve({ gender: 'women-u15-u14-u13', id: '51' }) }), /not found/);
});

test('navigation renders one option per Women’s age group and individual ages for Men', () => {
  const pushed = [];
  const Navigation = load('../app/admin/national-teams/[gender]/NationalTeamNavigation.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': 'a',
    'next/navigation': { useRouter: () => ({ push: href => pushed.push(href) }) },
    '@/lib/national-competitions': sections,
  }).default;
  const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? Array.from(node).flatMap(walk) : [node, ...walk(node.props?.children)];
  const nodes = walk(Navigation({ view: sections.getNationalTeamView('women-u17-u16') }));
  assert.ok(nodes.some(n => n.props?.href === '/admin/national-teams/men-u17'));
  const select = nodes.find(n => n.type === 'select');
  assert.equal(select.props.value, 'women-u17-u16');
  assert.deepEqual(nodes.filter(n => n.type === 'option').map(n => [n.props.value, n.props.children]), [
    ['women', 'Senior'],
    ['women-u23', 'U23'],
    ['women-u22', 'U22'],
    ['women-u21', 'U21'],
    ['women-u20-u19-u18', 'U20, U19, U18'],
    ['women-u17-u16', 'U17, U16'],
    ['women-u15-u14-u13', 'U15, U14, U13'],
  ]);
  const men = walk(Navigation({ view: sections.getNationalTeamView('men-u16') }));
  assert.ok(men.some(n => n.props?.href === '/admin/national-teams/women-u17-u16'));
  assert.deepEqual(men.filter(n => n.type === 'option').map(n => n.props.value),
    ['men', ...sections.NATIONAL_TEAM_AGES.map(age => `men-u${age}`)]);
  select.props.onChange({ target: { value: 'women-u20-u19-u18' } });
  select.props.onChange({ target: { value: 'women' } });
  assert.deepEqual(pushed, ['/admin/national-teams/women-u20-u19-u18', '/admin/national-teams/women']);
});
