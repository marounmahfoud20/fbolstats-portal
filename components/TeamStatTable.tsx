import Link from 'next/link';
import { TEAM_STAT_LABELS, type TeamStatKind, type TeamStatRow } from '@/lib/team-stats';

export default function TeamStatTable({
  teamId,
  kind,
  rows,
  preview = false,
}: {
  teamId: number;
  kind: TeamStatKind;
  rows: TeamStatRow[];
  preview?: boolean;
}) {
  const displayedRows = preview ? rows.slice(0, 10) : rows;

  return (
    <section className="border border-[#040f4f] bg-white text-[#040f4f]">
      <h2 className="border-b border-[#040f4f] bg-[#f4a01c] p-2 font-bold">{TEAM_STAT_LABELS[kind]}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-[#f2f2f2]">
            <tr>
              <th className="w-12 p-2 text-center">#</th>
              <th className="p-2">Player</th>
              <th className="w-24 p-2 text-center">{kind === 'appearances' ? 'Apps' : kind === 'goals' ? 'Goals' : 'Assists'}</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length ? displayedRows.map((row, index) => (
              <tr key={row.personId} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-2 text-center text-gray-500">{index + 1}</td>
                <td className="p-2">
                  <Link href={`/admin/people/${row.personId}`} className="font-semibold hover:underline">{row.name}</Link>
                </td>
                <td className="p-2 text-center font-bold">{row.total}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="p-4 text-center text-gray-500">No statistics recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {preview && (
        <div className="border-t border-gray-200 p-2 text-center">
          <Link href={`/admin/teams/${teamId}/stats/${kind}`} className="inline-block border border-[#040f4f] bg-white px-3 py-1.5 font-bold hover:bg-[#f2f2f2]">
            Show full table
          </Link>
        </div>
      )}
    </section>
  );
}
