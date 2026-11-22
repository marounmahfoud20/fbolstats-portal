import { createNationalTeamMetadata } from "@/lib/page-metadata";

export const generateMetadata = createNationalTeamMetadata(true);

import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MatchNoteIcon from "@/components/MatchNoteIcon";
import { retryDatabaseRead } from "@/lib/database-read";
import { isNationalTeamSection, NATIONAL_TEAM_SECTIONS, nationalCompetitionHref } from "@/lib/national-competitions";

export const dynamic = "force-dynamic";

export default async function NationalTeamMatchesPage({ params }: { params: Promise<{ gender: string }> }) {
  const { gender } = await params;
  if (!isNationalTeamSection(gender)) notFound();
  const section = NATIONAL_TEAM_SECTIONS[gender];
  const matches = await retryDatabaseRead(() => prisma.match.findMany({
    where: { group: { season: { league: { footballType: "national", type: section.category } } } },
    orderBy: [
      { date: { sort: "desc", nulls: "last" } },
      { time: { sort: "desc", nulls: "last" } },
      { id: "desc" },
    ],
    select: {
      id: true, date: true, time: true, teamA: true, teamB: true, venue: true, status: true, note: true,
      meta: { select: { ftA: true, ftB: true } },
      group: { select: { season: { select: { id: true, name: true, league: { select: { id: true, competitionName: true } } } } } },
    },
  }));

  return (
    <div className="min-h-screen bg-white py-10 font-sans text-xs text-[#040f4f]">
      <div className="mx-auto w-full max-w-[980px] px-4">
        <Link href={`/admin/national-teams/${gender}`} className="mb-6 inline-block text-sm font-bold text-[#f4a01c] hover:underline">
          &larr; {section.title}
        </Link>
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{section.title} matches</h1>
          <p className="text-gray-600">All competitions · Newest to oldest</p>
        </header>
        <div className="flex h-10 items-center border border-[#040f4f] bg-[#f2f2f2] px-4">
          <h2 className="text-sm font-bold uppercase tracking-wider">Matches ({matches.length})</h2>
        </div>
        <div className="mb-10 overflow-x-auto border-x border-b border-[#040f4f]">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
              <tr className="h-10">
                <th scope="col" className="px-3" aria-sort="descending">Date</th>
                <th scope="col" className="px-3">Match</th>
                <th scope="col" className="px-3 text-center">Score</th>
                <th scope="col" className="px-3">Competition</th>
                <th scope="col" className="px-3">Edition</th>
                <th scope="col" className="px-3">Venue</th>
                <th scope="col" className="px-3">Status</th>
                <th scope="col" className="px-3"><span className="sr-only">Open match</span></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const edition = match.group.season;
                const competition = edition.league;
                const hasScore = !!match.meta?.ftA?.trim() && !!match.meta?.ftB?.trim();
                return (
                  <tr key={match.id} className="h-12 border-b border-gray-200 hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2">
                      {match.date ? <time dateTime={match.date}>{match.date}</time> : "Date unknown"}
                      {match.time && <span className="block text-gray-500">{match.time}</span>}
                    </td>
                    <td className="px-3 py-2 font-bold">
                      <Link href={`/admin/matches/${match.id}`} className="hover:underline">{match.teamA} vs {match.teamB}</Link>
                      <MatchNoteIcon matchId={match.id} note={match.note} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center font-bold">
                      {hasScore ? `${match.meta!.ftA}–${match.meta!.ftB}` : "—"}
                    </td>
                    <td className="px-3 py-2"><Link href={nationalCompetitionHref(gender, competition.id)} className="hover:underline">{competition.competitionName}</Link></td>
                    <td className="px-3 py-2"><Link href={`/admin/seasons/${edition.id}`} className="hover:underline">{edition.name}</Link></td>
                    <td className="px-3 py-2 text-gray-600">{match.venue || "—"}</td>
                    <td className="px-3 py-2">{match.status}</td>
                    <td className="px-3 py-2 text-right"><Link href={`/admin/matches/${match.id}`} className="font-bold text-blue-600 hover:underline">View</Link></td>
                  </tr>
                );
              })}
              {!matches.length && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No matches recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
