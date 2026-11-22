import { StickyNote } from "lucide-react";
import Link from "next/link";

export default function MatchNoteIcon({ matchId, note }: { matchId: number; note: string | null }) {
  if (!note?.trim()) return null;

  return (
    <Link
      href={`/admin/matches/${matchId}#match-note`}
      aria-label="Read match note"
      title="Read match note"
      className="ml-2 inline-flex align-middle text-amber-700 hover:text-amber-900"
    >
      <StickyNote size={14} aria-hidden="true" />
    </Link>
  );
}
