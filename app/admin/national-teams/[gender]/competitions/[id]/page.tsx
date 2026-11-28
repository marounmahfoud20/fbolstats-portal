import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Competition", "league");

import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { retryDatabaseRead } from "@/lib/database-read";
import { getNationalTeamView, nationalTeamViewForAge } from "@/lib/national-competitions";

export const dynamic = "force-dynamic";

export default async function NationalCompetitionPage({ params }: { params: Promise<{ gender: string; id: string }> }) {
  const { gender, id } = await params;
  const view = getNationalTeamView(gender);
  if (!view || !/^\d+$/.test(id)) notFound();
  const competitionId = Number(id);
  if (!Number.isSafeInteger(competitionId)) notFound();
  const parentView = getNationalTeamView(nationalTeamViewForAge(view.gender, view.age)) ?? view;
  const competition = await retryDatabaseRead(() => prisma.league.findFirst({
    where: { id: competitionId, footballType: "national", type: view.categoryFilter },
    include: {
      seasons: {
        orderBy: [{ name: "desc" }, { id: "desc" }],
        include: { groups: { select: { _count: { select: { matches: true } } } } },
      },
    },
  }));
  if (!competition) notFound();

  return (
    <div className="min-h-screen bg-white py-10 font-sans text-xs text-[#040f4f]">
      <div className="mx-auto w-full max-w-[980px] px-4">
      <Link href={`/admin/national-teams/${parentView.id}`} className="mb-6 inline-block text-sm font-bold text-[#f4a01c] hover:underline">← {parentView.title}</Link>
      <header className="mb-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{competition.competitionName}</h1>
          <p className="text-gray-600">{view.sections.length > 1 ? competition.type : view.title} · {competition.seasons.length} editions</p>
        </div>
      </header>
      <section>
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 border border-[#040f4f] bg-[#f2f2f2] px-4 py-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">All editions ({competition.seasons.length})</h2>
          <div className="flex items-center gap-3">
            <Link href={`/admin/leagues/${competition.id}/add-season`} className="font-bold text-[#f4a01c] hover:text-[#040f4f]" title="Add edition">+ Add edition</Link>
            <Link href={`/admin/leagues/${competition.id}/edit-seasons`} className="border border-[#040f4f] bg-[#f4a01c] px-2 py-1 font-bold hover:bg-white">Manage editions</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="mb-10 w-full border-x border-b border-[#040f4f] text-left">
            <thead className="border-b border-[#040f4f] bg-[#f2f2f2]"><tr className="h-10"><th className="w-16 px-3">ID</th><th className="px-3">Edition</th><th className="px-3">Start date</th><th className="px-3">End date</th><th className="px-3 text-center">Rounds</th><th className="px-3 text-center">Matches</th><th className="px-3"><span className="sr-only">Edit edition</span></th></tr></thead>
            <tbody>
              {competition.seasons.map((edition) => (
                <tr key={edition.id} className="h-12 border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 text-blue-600"><Link href={`/admin/seasons/${edition.id}`} className="underline">{edition.id}</Link></td>
                  <td className="px-3 font-bold"><Link href={`/admin/seasons/${edition.id}`} className="hover:underline">{edition.name}</Link></td>
                  <td className="whitespace-nowrap px-3 text-gray-600">{edition.startDate || "-"}</td>
                  <td className="whitespace-nowrap px-3 text-gray-600">{edition.endDate || "-"}</td>
                  <td className="px-3 text-center">{edition.groups.length}</td>
                  <td className="px-3 text-center">{edition.groups.reduce((total, group) => total + group._count.matches, 0)}</td>
                  <td className="px-3 text-right"><Link href={`/admin/seasons/${edition.id}/settings`} className="font-bold text-[#f4a01c] hover:underline" aria-label={`Edit ${edition.name}`}>Edit</Link></td>
                </tr>
              ))}
              {!competition.seasons.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No editions yet. Add the first edition to this competition.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  );
}
