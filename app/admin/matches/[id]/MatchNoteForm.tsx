"use client";

import { useActionState, useState } from "react";
import { saveMatchNote } from "@/lib/match-actions";

export default function MatchNoteForm({ matchId, initialNote }: { matchId: number; initialNote: string | null }) {
  const [note, setNote] = useState(initialNote ?? "");
  const [result, action, pending] = useActionState(saveMatchNote.bind(null, matchId), null);

  return (
    <form id="match-note" action={action} className="mt-4 scroll-mt-4 border border-[#040f4f] p-4">
      <label htmlFor="match-note-text" className="mb-2 block font-bold">Match note</label>
      <textarea
        id="match-note-text"
        name="note"
        rows={4}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        readOnly={pending}
        className="block w-full rounded border border-gray-400 p-2"
      />
      <div className="mt-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded bg-[#040f4f] px-4 py-2 font-bold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        {!pending && result?.ok && result.note === (note.trim() ? note : null) && <span role="status">Saved</span>}
        {!pending && result?.ok === false && <span role="alert" className="text-red-700">{result.error}</span>}
      </div>
    </form>
  );
}
