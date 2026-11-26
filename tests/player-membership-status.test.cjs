const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(path, modules) {
  const source = readFileSync(require.resolve(path), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const scope = { exports: {}, require: (name) => modules[name] ?? require(name) };
  vm.runInNewContext(outputText, scope);
  return scope.exports;
}

const dates = load("../lib/date-input.ts", {});
const status = load("../lib/player-membership-status.ts", { "./date-input": dates });
const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, String(value));
  return data;
};
const json = (value) => JSON.parse(JSON.stringify(value));

function harness(existing = []) {
  const writes = [];
  const model = {
    update: async (args) => writes.push(json(args)),
    updateMany: async (args) => writes.push(json(args)),
    findMany: async () => existing,
  };
  const actions = load("../lib/actions.ts", {
    "@/lib/admin-activity": { withAdminActivity: (_name, _args, run) => run() },
    "@/lib/prisma": {
      membership: model,
      $transaction: async (run) => run({ membership: model }),
    },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect() {} },
    "next/headers": { cookies: async () => ({}) },
    "@/lib/adminAuth": { getAdminUserFromCookies: () => "admin" },
    "@/lib/memberships": { createMembershipIfMissing: async (data) => writes.push(json(data)) },
    "@/lib/player-membership-status": status,
  });
  return { actions, writes };
}

const dated = { endDay: "31", endMonth: "12", endYear: "2026" };
const player = { personId: 2, teamId: 3, membershipId: 4, role: "Player" };

test("Player membership status matches a complete calendar end date", () => {
  assert.equal(status.readPlayerEndDate(form({})), null);
  assert.equal(status.readPlayerEndDate(form({ endYear: "2026" })), undefined);
  assert.equal(status.readPlayerEndDate(form({ ...dated, endMonth: "2" })), undefined);
  assert.equal(status.readPlayerEndDate(form(dated)), "2026-12-31");
  assert.equal(status.playerMembershipStatusError(true, null), undefined);
  assert.equal(status.playerMembershipStatusError(false, "2026-12-31"), undefined);
  assert.ok(status.playerMembershipStatusError(false, null));
  assert.ok(status.playerMembershipStatusError(true, "2026-12-31"));
});

test("single adds and edits reject mismatched Player status and allow a dated closure or reopening", async () => {
  const { actions, writes } = harness();
  assert.equal((await actions.addMembership(form({ ...player, ...dated, active: "yes" }))).ok, false);
  assert.equal((await actions.updateMembership(form({ ...player, role: "player", active: "no" }))).ok, false);
  assert.equal(writes.length, 0);

  await actions.updateMembership(form({ ...player, ...dated, active: "no" }));
  await actions.updateMembership(form({ ...player, active: "yes" }));
  assert.deepEqual(writes.map(({ data }) => [data.isActive, data.endDate]), [
    [false, "2026-12-31"],
    [true, null],
  ]);
});

test("bulk editing preserves untouched undated history and aborts before writes if any edited row is invalid", async () => {
  const existing = [
    { id: 4, teamId: 3, role: "Player", isActive: false, startDate: null, endDate: null },
    { id: 5, teamId: 6, role: "Player", isActive: true, startDate: null, endDate: null },
  ];
  const { actions, writes } = harness(existing);
  const data = form({
    personId: 2, teamId_4: 3, role_4: "Player", active_4: "no",
    teamId_5: 6, role_5: "Player", active_5: "no", endDay_5: "31", endMonth_5: "12", endYear_5: "2026",
    newRowCount: 1, new_teamId_0: 7, new_role_0: "Player", new_active_0: "no",
  });
  for (const { id } of existing) data.append("membershipId", id);
  assert.equal((await actions.bulkUpdateMemberships(data)).ok, false);
  assert.equal(writes.length, 0);

  data.delete("new_teamId_0");
  await actions.bulkUpdateMemberships(data);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].where, { id: 5, personId: 2 });
  assert.equal(writes[0].data.endDate, "2026-12-31");
});

test("historical additions require an end date and staff status remains independent", async () => {
  const { actions, writes } = harness();
  assert.equal((await actions.addHistoricalPlayers(form({ teamId: 3, firstName_0: "Player" }))).ok, false);
  assert.equal(writes.length, 0);
  await actions.updateMembership(form({ ...player, role: "coach", active: "no" }));
  assert.equal(writes[0].data.isActive, false);
  assert.equal(writes[0].data.endDate, null);
});
