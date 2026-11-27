"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMatchShirtNumber } from "@/lib/match-actions";

export default function MatchShirtNumberEditor({ matchId, personId, playerName, number }: {
  matchId: number;
  personId: number;
  playerName: string;
  number: string;
}) {
  const router = useRouter();
  const saveInProgress = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(number);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (saveInProgress.current) return;
    if (draft === number) {
      setEditing(false);
      return;
    }
    saveInProgress.current = true;
    setSaving(true);
    setError("");
    try {
      await saveMatchShirtNumber(matchId, personId, draft);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not save shirt number. Click the number to try again.");
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex w-full min-w-8 flex-col items-center text-[#040f4f]">
      {editing ? (
        <input
          autoFocus
          inputMode="numeric"
          maxLength={3}
          aria-label={`Shirt number for ${playerName}`}
          aria-invalid={!!error}
          value={draft}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => { void save(); }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          className="h-7 w-full min-w-8 border border-blue-500 bg-white text-center font-bold disabled:opacity-60"
        />
      ) : (
        <button
          type="button"
          aria-label={`${number ? "Edit" : "Add"} shirt number for ${playerName}`}
          title="Click to add or edit shirt number"
          onClick={() => { setDraft(number); setError(""); setEditing(true); }}
          className="h-7 w-full min-w-8 cursor-text border border-gray-300 bg-white text-center font-bold hover:border-blue-500 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {number || "\u00a0"}
        </button>
      )}
      {error && <span role="alert" className="text-xs font-normal text-red-700">{error}</span>}
    </span>
  );
}
