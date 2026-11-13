import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { retryDatabaseRead } from "@/lib/database-read";
import { createNationalCompetition } from "@/lib/national-competition-actions";
import { isNationalTeamSection, NATIONAL_TEAM_SECTIONS, nationalCompetitionHref } from "@/lib/national-competitions";
import CompetitionSubmitButton from "./CompetitionSubmitButton";

export const dynamic = "force-dynamic";

export default async function NationalTeamPage({ params }: { params: Promise<{ gender: string }> }) {
  const { gender } = await params;
  if (!isNationalTeamSection(gender)) notFound();
  const section = NATIONAL_TEAM_SECTIONS[gender];
  const competitions = await retryDatabaseRead(() => prisma.league.findMany({
    where: { footballType: "national", type: section.category },
    orderBy: { competitionName: "asc" },
    include: { seasons: { select: { id: true, groups: { select: { _count: { select: { matches: true } } } } } } },
  }));
  const editionCount = competitions.reduce((total, competition) => total + competition.seasons.length, 0);
  const matchCount = competitions.reduce((total, competition) => total + competition.seasons.reduce((sum, edition) => sum + edition.groups.reduce((count, group) => count + group._count.matches, 0), 0), 0);

  return (
    <div className="min-h-screen bg-white py-10 font-sans text-xs text-[#040f4f]">
      <div className="mx-auto w-full max-w-[980px] px-4">
      <nav aria-label="National teams" className="mb-6 flex gap-2">
        {(["men", "women"] as const).map((key) => (
          <Link key={key} href={`/admin/national-teams/${key}`} aria-current={key === gender ? "page" : undefined} className={`border border-[#040f4f] px-4 py-1.5 font-bold ${key === gender ? "bg-[#f4a01c]" : "bg-white hover:bg-[#f2f2f2]"}`}>
            {key === "men" ? "Men" : "Women"}
          </Link>
        ))}
      </nav>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{section.title}</h1>
          <p className="text-gray-600">{competitions.length} competitions · {editionCount} editions · {matchCount} matches</p>
        </div>
        <Link href={`/admin/national-teams/${gender}/matches`} className="border border-[#040f4f] bg-[#f4a01c] px-4 py-2 font-bold hover:bg-white">
          View all matches
        </Link>
      </header>

      <div className="flex h-10 items-center border border-[#040f4f] bg-[#f2f2f2] px-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">Competitions ({competitions.length})</h2>
      </div>
        <details className="border-x border-b border-[#040f4f] bg-[#f9f9f9] p-3">
          <summary className="cursor-pointer font-bold text-[#f4a01c]">+ Add competition</summary>
          <form action={createNationalCompetition} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="section" value={gender} />
            <label className="flex flex-col gap-1 font-bold">
              Competition name
              <input name="name" placeholder="e.g. Arab Cup" required maxLength={150} className="border border-[#040f4f] px-2 py-1.5 text-[#040f4f]" />
            </label>
            <CompetitionSubmitButton />
          </form>
        </details>
      <div className="mb-10 overflow-x-auto border-x border-b border-[#040f4f]">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr className="h-10"><th className="w-16 px-3">ID</th><th className="px-3">Competition</th><th className="w-24 px-3 text-center">Editions</th><th className="w-24 px-3 text-center">Matches</th><th className="w-32 px-3"><span className="sr-only">Open competition</span></th></tr>
          </thead>
          <tbody>
        {competitions.map((competition) => {
          const matches = competition.seasons.reduce((total, edition) => total + edition.groups.reduce((sum, group) => sum + group._count.matches, 0), 0);
          return (
            <tr key={competition.id} className="h-10 border-b border-gray-200 hover:bg-gray-50">
              <td className="px-3 text-gray-500">{competition.id}</td>
              <td className="px-3 font-bold"><Link href={nationalCompetitionHref(gender, competition.id)} className="hover:underline">{competition.competitionName}</Link></td>
              <td className="px-3 text-center">{competition.seasons.length}</td>
              <td className="px-3 text-center">{matches}</td>
              <td className="px-3 text-right"><Link href={nationalCompetitionHref(gender, competition.id)} className="font-bold text-blue-600 hover:underline">View editions</Link></td>
            </tr>
          );
        })}
          {!competitions.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No competitions yet. Add a competition to start recording its editions.</td></tr>}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
