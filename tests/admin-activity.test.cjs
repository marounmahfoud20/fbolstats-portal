const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { activityDetails } = require('../lib/activity-details.ts');

function loadModule(file, modules) {
  const source = fs.readFileSync(require.resolve(file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { exports: {}, console: { error: () => {} }, require: (name) => {
    assert.ok(name in modules, `Unexpected import ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('activity details contain only record IDs, never passwords, session data or player details', () => {
  const form = new FormData();
  form.set('personId', '141');
  form.set('password', 'secret');
  form.set('username', 'private-user');
  form.set('firstname[0]', 'Private player');
  const result = activityDetails({ formData: form, matchId: 505, payload: { teamId: 13, minute: '52', passwordHash: 'secret-hash' } });
  assert.ok(result.includes('personId: 141'));
  assert.ok(result.includes('matchId: 505'));
  assert.ok(result.includes('teamId: 13'));
  for (const value of ['secret', 'private', '52', 'passwordHash']) assert.equal(result.includes(value), false);
  assert.equal(activityDetails({ password: 'secret', id: 'not-an-id' }), null);
});

function harness(username = 'editor') {
  const logs = [];
  const modules = {
    'next/headers': { cookies: async () => ({}), headers: async () => new Map([['x-admin-activity-path', '/admin/matches/505']]) },
    'next/dist/client/components/redirect-error': { isRedirectError: (error) => error.redirect === true },
    '@/lib/prisma': { adminAccount: { findUnique: async () => ({ id: 7 }) } },
    '@/lib/adminAuth': { getAdminUserFromCookies: () => username },
    '@/lib/activity-details': { activityDetails },
    '@/lib/activity-log': { recordAdminActivity: async (entry) => { logs.push(entry); } },
  };
  return { ...loadModule('../lib/admin-activity.ts', modules), logs };
}

test('logs successful saves with a stable account ID and the affected record', async () => {
  const { withAdminActivity, logs } = harness();
  const result = await withAdminActivity('saveMatchCore', { matchId: 505 }, async () => ({ ok: true }));
  assert.equal(result.ok, true);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].accountId, 7);
  assert.equal(logs[0].username, 'editor');
  assert.equal(logs[0].success, true);
  assert.equal(logs[0].details, 'matchId: 505');
});

test('logs failed results and exceptions without storing error messages', async () => {
  const { withAdminActivity, logs } = harness();
  await withAdminActivity('saveMatchCore', {}, async () => ({ ok: false, error: 'sensitive value' }));
  await assert.rejects(withAdminActivity('saveMatchCore', {}, async () => { throw new Error('sensitive value'); }));
  assert.equal(logs.length, 2);
  assert.ok(logs.every((entry) => entry.success === false));
  assert.equal(JSON.stringify(logs).includes('sensitive'), false);
});

test('successful redirects remain redirects, and unauthenticated requests are not attributed to an account', async () => {
  const { withAdminActivity, logs } = harness();
  const redirect = Object.assign(new Error('redirect'), { redirect: true });
  await assert.rejects(withAdminActivity('logout', {}, async () => { throw redirect; }), (error) => error === redirect);
  assert.equal(logs[0].success, true);
  assert.equal(logs[0].kind, 'logout');
  const anonymous = harness(null);
  assert.equal(await anonymous.withAdminActivity('save', {}, async () => 1), 1);
  assert.equal(anonymous.logs.length, 0);
});

test('activity logs page rejects a non-owner before reading any account or logs', async () => {
  const modules = {
    'react/jsx-runtime': {}, 'next/link': {},
    'next/headers': { cookies: async () => ({}) },
    'next/navigation': { redirect: () => { throw new Error('redirect'); }, notFound: () => { throw new Error('not found'); } },
    '@/lib/prisma': {},
    '@/lib/adminAuth': { getAdminUserFromCookies: () => 'editor', isGodAdmin: () => false },
  };
  const page = loadModule('../app/admin/administrator/[id]/activity/page.tsx', modules).default;
  await assert.rejects(page({ params: Promise.resolve({ id: '7' }), searchParams: Promise.resolve({}) }), /redirect/);
});
