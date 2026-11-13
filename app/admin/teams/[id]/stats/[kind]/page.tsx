import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Player Statistics", "team", {"titleParam":"kind","titles":{"appearances":"Top Appearances","goals":"Top Goalscorer","assists":"Top Assists"}});

import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import TeamStatTable from '@/components/TeamStatTable';
import { getTeamStats, TEAM_STAT_LABELS, type TeamStatKind } from '@/lib/team-stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const kinds: TeamStatKind[] = ['appearances', 'goals', 'assists'];

export default async function FullTeamStatsPage(props: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind: rawKind } = await props.params;
  const teamId = Number.parseInt(id, 10);
  if (!Number.isFinite(teamId) || !kinds.includes(rawKind as TeamStatKind)) notFound();
  const kind = rawKind as TeamStatKind;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
  if (!team) notFound();

  const rows = await getTeamStats(team.id, kind);

  return (
    <div className="min-h-screen bg-white p-6 text-[#040f4f]">
      <div className="mx-auto w-full max-w-[900px]">
        <Link href={`/admin/teams/${team.id}`} className="mb-4 inline-block text-sm font-bold text-[#f4a01c] hover:underline">← Back to {team.name}</Link>
        <div className="mb-4 border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold">{TEAM_STAT_LABELS[kind]} — {team.name}</h1>
          <p className="text-xs">All {rows.length} ranked players</p>
        </div>
        <TeamStatTable teamId={team.id} kind={kind} rows={rows} />
      </div>
    </div>
  );
}
