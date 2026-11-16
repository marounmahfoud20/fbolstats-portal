const assert = require('node:assert/strict');
const { test } = require('node:test');
const { parseDayFirstDate } = require('../lib/date-input.ts');

test('reads dates as DD/MM/YYYY and converts to sortable storage format', () => {
  assert.deepEqual(parseDayFirstDate('05/06/2026'), { day: '05', month: '06', year: '2026', iso: '2026-06-05' });
  assert.equal(parseDayFirstDate('29/02/2024').iso, '2024-02-29');
  assert.ok(parseDayFirstDate('01/01/2027').iso > parseDayFirstDate('31/12/2026').iso);
});

test('rejects impossible dates and incorrect formats', () => {
  for (const value of ['', '2026-06-05', '5/6/2026', '06/15/2026', '31/04/2026', '29/02/2025', '00/01/2026', '01/01/0000']) {
    assert.equal(parseDayFirstDate(value), null, value);
  }
});
