const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadPage(findUnique) {
  const source = fs.readFileSync(path.join(__dirname, '../app/admin/teams/[id]/players/past/page.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {};
  const mocks = {
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); } },
    '@/lib/page-metadata': { createEntityMetadata: () => async () => ({}) },
    '@/lib/prisma': { team: { findUnique } },
    '@/lib/database-read': { retryDatabaseRead: read => read(), isDatabaseConnectionError: error => error.code === 'P1001' },
    '@/lib/people-format': { nationalityFlag: () => '', resolvePositionName: value => value },
    '@/lib/countries': { resolveCountryName: value => value },
  };
  vm.runInNewContext(compiled, { exports, require: id => id in mocks ? mocks[id] : require(id) });
  return exports.default;
}

function membership(id, overrides = {}) {
  return { id, isActive: false, role: 'Player', startDate: '2022-10-19', endDate: '2025-08-31', person: { id, firstName: 'Player', lastName: String(id), commonName: `Former ${String(id).padStart(2, '0')}`, matchName: null, dob: null, position: 'Forward', nationality: 'Lebanon' }, ...overrides };
}

test('renders the full inactive-player roster beyond 25 rows, excluding active players and staff', async () => {
  const rows = Array.from({ length: 41 }, (_, i) => membership(i + 1));
  rows[0].role = 'player';
  rows[0].endDate = '2023-06-30';
  rows[2].endDate = '2024-06-30';
  rows[3].endDate = null;
  rows[40].person.commonName = null;
  rows[40].person.matchName = 'Zara Match Name';
  rows.push(membership(98, { isActive: true }), membership(99, { role: 'coach' }));
  let reads = 0;
  const Page = loadPage(async query => {
    reads++;
    assert.equal(query.where.id, 574);
    const relation = query.include.memberships;
    assert.equal(relation.include.person, true);
    const memberships = rows.filter(row => row.isActive === relation.where.isActive && (relation.where.role.mode === 'insensitive' ? row.role.toLowerCase() === relation.where.role.equals.toLowerCase() : row.role === relation.where.role.equals));
    return { id: 574, name: 'Lebanon Under 20 Women', memberships: relation.take ? memberships.slice(0, relation.take) : memberships };
  });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: '574' }) }));
  assert.equal(reads, 1);
  assert.match(html, /Lebanon Under 20 Women \(41\)/);
  assert.match(html, /Former 01/);
  assert.match(html, /Zara Match Name/);
  assert.doesNotMatch(html, /Former 98|Former 99/);
  assert.match(html, /href="\/admin\/people\/41"/);
  assert.match(html, /href="\/admin\/people\/41\/membership\/41"/);
  assert.match(html, /2022-10-19/);
  assert.match(html, /2025-08-31/);
  assert.ok(html.indexOf('Former 02') < html.indexOf('Former 03'));
  assert.ok(html.indexOf('Former 40') < html.indexOf('Former 03'));
  assert.ok(html.indexOf('Former 03') < html.indexOf('Former 01'));
  assert.ok(html.indexOf('Former 01') < html.indexOf('Former 04'));
  assert.ok(html.indexOf('Former 05') < html.indexOf('Former 06'));
});

test('shows an empty state only when the team has no historical players', async () => {
  const Page = loadPage(async () => ({ id: 574, name: 'Lebanon Under 20 Women', memberships: [] }));
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: '574' }) }));
  assert.match(html, /No past players found for this team/);
});

test('rejects invalid and missing teams', async () => {
  let reads = 0;
  const Page = loadPage(async () => { reads++; return null; });
  for (const id of ['574abc', '0', '-1', '9007199254740992']) await assert.rejects(Page({ params: Promise.resolve({ id }) }), /NOT_FOUND/);
  assert.equal(reads, 0);
  await assert.rejects(Page({ params: Promise.resolve({ id: '574' }) }), /NOT_FOUND/);
});

test('reports database outages separately from an empty roster', async () => {
  const Page = loadPage(async () => { throw Object.assign(new Error('Offline'), { code: 'P1001' }); });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: '574' }) }));
  assert.match(html, /role="alert"/);
  assert.match(html, /Retry loading past players/);
  assert.doesNotMatch(html, /No past players found/);
});
