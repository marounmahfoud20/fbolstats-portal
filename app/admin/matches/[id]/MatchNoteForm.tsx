"use client";

import { useActionState, useRef, useState } from "react";
import { saveMatchNote } from "@/lib/match-actions";

export default function MatchNoteForm({ matchId, initialNote }: { matchId: number; initialNote: string | null }) {
  const [note, setNote] = useState(initialNote ?? "");
  const saveInProgress = useRef(false);
  const [result, action, pending] = useActionState(async (_previous: Awaited<ReturnType<typeof saveMatchNote>> | null, formData: FormData) => {
    try {
      return await saveMatchNote(matchId, _previous, formData);
    } finally {
      saveInProgress.current = false;
    }
  }, null);

  return (
    <form id="match-note" action={action} onSubmit={(event) => {
      if (saveInProgress.current || pending) {
        event.preventDefault();
        return;
      }
      saveInProgress.current = true;
    }} className="scroll-mt-4 rounded-md border border-[#c50000] bg-white p-3">
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
