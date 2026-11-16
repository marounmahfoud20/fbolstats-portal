"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMatchEvents } from "./actions";

type EventRow = {
  id: number; kind: "event" | "appearance"; type: string; minute: string;
  team: string; person: string; personId: number | null; detail: string; substitutionId: string | null;
};
const rowKey = (row: EventRow) => `${row.kind}-${row.id}`;

export default function DeleteEventsForm({ matchId, rows }: { matchId: number; rows: EventRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedRows = rows.filter((row) => selected.has(rowKey(row)));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  function toggle(row: EventRow) {
    setSelected((previous) => {
      const next = new Set(previous);
      const checked = !previous.has(rowKey(row));
      for (const candidate of rows) {
        if (rowKey(candidate) === rowKey(row) || (row.substitutionId && candidate.substitutionId === row.substitutionId)) {
          if (checked) next.add(rowKey(candidate));
          else next.delete(rowKey(candidate));
        }
      }
      return next;
    });
  }

  async function removeSelected() {
    if (busy || !selectedRows.length) return;
    if (!window.confirm(`Permanently delete ${selectedRows.length} selected event${selectedRows.length === 1 ? "" : "s"} from this match?`)) return;
    setBusy(true);
    setError("");
    try {
      const result = await deleteMatchEvents(matchId,
        selectedRows.filter((row) => row.kind === "event").map((row) => row.id),
        selectedRows.filter((row) => row.kind === "appearance").map((row) => row.id));
      if (!result.ok) { setError(result.error); return; }
      setSelected(new Set());
      router.replace(`/admin/matches/${matchId}`);
    } catch {
      setError("Could not delete events. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-[#040f4f] bg-white p-3">
      <p className="mb-3 text-xs">Select events to delete. Linked substitution in/out events are selected together. Deleting events does not change the recorded match score.</p>
      <div role="region" aria-label="Match events" tabIndex={0} className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-xs">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2"><input type="checkbox" aria-label="Select all events" disabled={busy || !rows.length} checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map(rowKey)))} /></th>
              <th className="p-2">Event</th><th className="p-2">Minute</th><th className="p-2">Team</th><th className="p-2">Player / Official</th><th className="p-2">ID</th><th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && <tr><td colSpan={7} className="p-6 text-center">No events in this match.</td></tr>}
            {rows.map((row) => (
              <tr key={rowKey(row)} className={`border-b border-gray-200 ${selected.has(rowKey(row)) ? "bg-orange-50" : "hover:bg-gray-50"}`}>
                <td className="p-2"><input type="checkbox" aria-label={`Select ${row.type} for ${row.person}, ${row.kind} ${row.id}`} checked={selected.has(rowKey(row))} disabled={busy} onChange={() => toggle(row)} /></td>
                <td className="p-2 capitalize">{row.type}</td><td className="whitespace-nowrap p-2">{row.minute}</td><td className="p-2">{row.team}</td>
                <td className="p-2">{row.personId === null ? row.person : <Link href={`/admin/people/${row.personId}`} className="font-semibold hover:underline">{row.person}</Link>}</td>
                <td className="p-2">{row.id}</td><td className="p-2">{row.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || !selectedRows.length} onClick={() => { void removeSelected(); }} className="rounded border border-red-800 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 disabled:opacity-50">
          {busy ? "Deleting..." : `Delete Selected (${selectedRows.length})`}
        </button>
        <Link href={`/admin/matches/${matchId}`} className="font-semibold hover:underline">Back to Match</Link>
      </div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </div>
  );
}
