import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Membership Details", "person");

import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MatchNoteIcon from "@/components/MatchNoteIcon";
import { groupMembershipAppearances } from "@/lib/membership-appearances";
import { resolvePositionName } from "@/lib/people-format";
import { goalkeeperCleanSheet } from "@/lib/substitutions";
import { matchAssistCredits } from "@/lib/goal-assist-events";

function personName(first?: string | null, last?: string | null, common?: string | null) {
  return common || `${first || ""} ${last || ""}`.trim() || "Unknown";
}

function toNum(v?: string | null) {
  const n = Number.parseInt(v || "", 10);
  return Number.isFinite(n) ? n : 0;
}

function minuteFromEvent(ev: { minute: string | null; extraTime: string | null }) {
  return toNum(ev.minute) + toNum(ev.extraTime);
}

function minuteWithinRegulation(ev: { minute: string | null; extraTime: string | null }) {
  return Math.min(90, Math.max(0, minuteFromEvent(ev)));
}

function eventMatches(type: string, keys: string[]) {
  const t = type.toLowerCase();
  return keys.some((k) => t === k || t.includes(k));
}

type MatchEventLite = { eventType: string; minute: string | null; extraTime: string | null };

function computeMinutes(role: string, events: MatchEventLite[]) {
  const inEv = events.filter((e) => eventMatches(e.eventType, ["sub_in", "substitute_in", "si"])).sort((a, b) => minuteWithinRegulation(a) - minuteWithinRegulation(b))[0];
  const outEv = events.filter((e) => eventMatches(e.eventType, ["sub_out", "substitute_out", "so", "red_card", "second_yellow"])).sort((a, b) => minuteWithinRegulation(a) - minuteWithinRegulation(b))[0];
  const inMin = inEv ? minuteWithinRegulation(inEv) : null;
  const outMin = outEv ? minuteWithinRegulation(outEv) : null;
  if (inMin !== null && outMin !== null) return Math.max(0, outMin - inMin);
  if (inMin !== null) return Math.max(0, 90 - inMin);
  if (outMin !== null) return Math.max(0, outMin);
  if (role.toLowerCase() === "starter") return 90;
  return 0;
}

export default async function MembershipPage(props: { params: Promise<{ id: string; membershipId: string }> }) {
  const params = await props.params;
  const personId = parseInt(params.id, 10);
  const membershipId = parseInt(params.membershipId, 10);
  if (!personId || !membershipId) notFound();

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { person: true, team: true },
  });
  if (!membership || membership.personId !== personId) notFound();

  const appearances = await prisma.matchAppearance.findMany({
    where: {
      personId,
      teamId: membership.teamId,
      match: {
        date: {
          ...(membership.startDate ? { gte: membership.startDate } : {}),
          ...(membership.endDate ? { lte: membership.endDate } : {}),
        },
      },
    },
    include: {
      match: {
        include: {
          meta: true,
          group: { include: { season: { include: { league: true } } } },
          events: true,
          shirts: true,
        },
      },
    },
    orderBy: [{ match: { date: "desc" } }, { match: { time: "desc" } }],
  });

  const goalkeeperMatches = new Set(appearances.filter((a) => a.role.toLowerCase() === "goalkeeper").map((a) => a.matchId));
  const goalkeeperPosition = resolvePositionName(membership.person.position).toLowerCase().includes("goal");

  const matchRows = groupMembershipAppearances(appearances).map(({ appearance: a, captain }) => {
    const personEvents = a.match.events.filter((e) => e.personId === personId && e.teamId === membership.teamId);
    const goals = personEvents.filter((e) => e.eventType === "goal").length;
    const penaltyGoals = personEvents.filter((e) => e.eventType === "penalty_goal").length;
    const assists = matchAssistCredits(a.match.events)
      .filter(credit => credit.personId === personId && credit.teamId === membership.teamId).length;
    const ownGoals = personEvents.filter((e) => e.eventType === "own_goal").length;
    const yellow = personEvents.filter((e) => e.eventType === "yellow_card").length;
    const secondYellow = personEvents.filter((e) => e.eventType === "second_yellow").length;
    const red = personEvents.filter((e) => e.eventType === "red_card").length;
    const subIn = personEvents.filter((e) => eventMatches(e.eventType, ["sub_in", "substitute_in", "si"])).length;
    const subOut = personEvents.filter((e) => eventMatches(e.eventType, ["sub_out", "substitute_out", "so"])).length;
    const minutes = computeMinutes(a.role, personEvents);
    const shirt = a.match.shirts.find((s) => s.personId === personId)?.number || "";
    return {
      matchId: a.match.id,
      note: a.match.note,
      date: a.match.date || "",
      time: a.match.time || "",
      competition: a.match.group.season.league.competitionName,
      season: a.match.group.season.name,
      shirt,
      teamA: a.match.teamA,
      teamB: a.match.teamB,
      goalsA: a.match.meta?.ftA || "",
      goalsB: a.match.meta?.ftB || "",
      minutes,
      cleanSheets: goalkeeperCleanSheet({
        appearance: a,
        isGoalkeeper: goalkeeperPosition || goalkeeperMatches.has(a.matchId),
        teamName: membership.team.name,
        match: a.match,
      }),
      starterBench: a.role.toLowerCase() === "starter" ? "Starter" : "Bench",
      goals,
      penaltyGoals,
      assists,
      ownGoals,
      yellow,
      secondYellow,
      red,
      subIn,
      subOut,
      unusedSub: a.role.toLowerCase() === "substitute" && subIn === 0 ? 1 : 0,
      captain: captain ? 1 : 0,
    };
  });

  const grouped = new Map<string, typeof matchRows>();
  for (const r of matchRows) {
    const key = JSON.stringify([r.competition, r.season]);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const careerRows = Array.from(grouped.entries()).map(([key, rows]) => {
    const [competition, season] = JSON.parse(key) as [string, string];
    const shirtNumbers = Array.from(new Set(rows.map((r) => r.shirt).filter(Boolean))).join(", ");
    return {
      competition,
      season,
      shirtNumbers: shirtNumbers || "-",
      appearances: rows.length,
      minutesPlayed: rows.reduce((s, r) => s + r.minutes, 0),
      cleanSheets: rows.reduce((s, r) => s + r.cleanSheets, 0),
      goals: rows.reduce((s, r) => s + r.goals + r.penaltyGoals, 0),
      assists: rows.reduce((s, r) => s + r.assists, 0),
      ownGoals: rows.reduce((s, r) => s + r.ownGoals, 0),
      yellow: rows.reduce((s, r) => s + r.yellow, 0),
      secondYellow: rows.reduce((s, r) => s + r.secondYellow, 0),
      red: rows.reduce((s, r) => s + r.red, 0),
      subIn: rows.reduce((s, r) => s + r.subIn, 0),
      subOut: rows.reduce((s, r) => s + r.subOut, 0),
      unusedSub: rows.reduce((s, r) => s + r.unusedSub, 0),
      captain: rows.reduce((s, r) => s + r.captain, 0),
    };
  });

  const careerTotals = careerRows.reduce((totals, row) => ({
    appearances: totals.appearances + row.appearances,
    minutesPlayed: totals.minutesPlayed + row.minutesPlayed,
    cleanSheets: totals.cleanSheets + row.cleanSheets,
    goals: totals.goals + row.goals,
    assists: totals.assists + row.assists,
    ownGoals: totals.ownGoals + row.ownGoals,
    yellow: totals.yellow + row.yellow,
    secondYellow: totals.secondYellow + row.secondYellow,
    red: totals.red + row.red,
    subIn: totals.subIn + row.subIn,
    subOut: totals.subOut + row.subOut,
    unusedSub: totals.unusedSub + row.unusedSub,
    captain: totals.captain + row.captain,
  }), {
    appearances: 0,
    minutesPlayed: 0,
    cleanSheets: 0,
    goals: 0,
    assists: 0,
    ownGoals: 0,
    yellow: 0,
    secondYellow: 0,
    red: 0,
    subIn: 0,
    subOut: 0,
    unusedSub: 0,
    captain: 0,
  });

  return (
    <div className="min-w-0 p-2 sm:p-4 lg:p-6">
      <div className="mb-4 border border-[#040f4f] bg-[#f4a01c] p-2 text-[#040f4f]">
        <span className="font-bold">{personName(membership.person.firstName, membership.person.lastName, membership.person.commonName)} - Player Details</span>
        <span className="float-right">
          <Link href={`/admin/people/${personId}`} className="font-bold hover:underline">View</Link>
        </span>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row border border-[#040f4f] bg-white p-4 text-sm text-[#040f4f]">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(100px,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 break-words">
          <div className="font-bold">People ID</div><div>{membership.person.id}</div>
          <div className="font-bold">Firstname</div><div>{membership.person.firstName || "N/A"}</div>
          <div className="font-bold">Lastname</div><div>{membership.person.lastName || "N/A"}</div>
          <div className="font-bold">Matchname</div><div>{membership.person.matchName || "N/A"}</div>
          <div className="font-bold">Date Of Birth</div><div>{membership.person.dob || "N/A"}</div>
          <div className="font-bold">Place Of Birth</div><div>{membership.person.placeOfBirth || "N/A"}</div>
          <div className="font-bold">Country Of Birth</div><div>{membership.person.countryOfBirth || "N/A"}</div>
          <div className="font-bold">Nationality</div><div>{membership.person.nationality || "N/A"}</div>
          <div className="font-bold">Position</div><div>{membership.person.position || "N/A"}</div>
          <div className="font-bold">Gender</div><div>{membership.person.gender || "N/A"}</div>
        </div>
        <div className="h-[150px] w-[150px] shrink-0 overflow-hidden border border-[#dfdfdf] bg-gray-50">
          {membership.person.image ? <img src={membership.person.image} alt="Profile" className="h-full w-full object-cover" /> : null}
        </div>
      </div>

      <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Career Stats</div>
      <div role="region" aria-label="Career stats ? scroll horizontally to see all columns" tabIndex={0} className="mb-6 max-w-full overflow-x-auto border border-[#040f4f] bg-white p-3">
        <table className="w-full min-w-[1100px] table-auto whitespace-nowrap text-left text-[11px] text-[#040f4f]">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2 text-center">
                <svg className="inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
              </th>
              <th className="p-2 text-center"></th>
              <th className="p-2 text-center"><img src="/plain-orange-football-shirt.svg" alt="Shirt Numbers" title="Shirt Numbers" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/appearance.png" alt="Number Of Appearances" title="Number Of Appearances" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/time-315.png" alt="Minutes Played" title="Minutes Played" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center" title="Clean Sheets">CS</th>
              <th className="p-2 text-center"><img src="/Goal.png" alt="Goals" title="Goals (Goal + Penalty Goal)" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/Assist.png" alt="Assists" title="Assists" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/Own Goal.png" alt="Own Goals" title="Own Goals" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/Yellow_card_icon.svg.png" alt="Yellow Card" title="Yellow Card" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/Yellow to Red.png" alt="Second Yellow Card" title="Second Yellow Card" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/Red_card.svg.png" alt="Red Cards" title="Red Cards" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/subin.png" alt="Subbed In" title="Subbed In" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/subout.png" alt="Subbed Out" title="Subbed Out" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/bench.png" alt="Games As Unused Sub" title="Games As Unused Sub" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/captain.png" alt="Games As Captain" title="Games As Captain" className="inline-block h-4 w-4" /></th>
            </tr>
          </thead>
          <tbody>
            {careerRows.length === 0 ? (
              <tr><td colSpan={16} className="p-4 text-center">No Career Stats Available.</td></tr>
            ) : careerRows.map((r, i) => (
              <tr key={`${r.competition}-${r.season}-${i}`} className="border-b border-gray-200">
                <td className="p-1.5 whitespace-nowrap">{r.competition}</td>
                <td className="p-1.5 whitespace-nowrap">{r.season}</td>
                <td className="p-1.5 text-center">{r.shirtNumbers}</td>
                <td className="p-1.5 text-center">{r.appearances}</td>
                <td className="p-1.5 text-center">{r.minutesPlayed}</td>
                <td className="p-1.5 text-center">{r.cleanSheets}</td>
                <td className="p-1.5 text-center">{r.goals}</td>
                <td className="p-1.5 text-center">{r.assists}</td>
                <td className="p-1.5 text-center">{r.ownGoals}</td>
                <td className="p-1.5 text-center">{r.yellow}</td>
                <td className="p-1.5 text-center">{r.secondYellow}</td>
                <td className="p-1.5 text-center">{r.red}</td>
                <td className="p-1.5 text-center">{r.subIn}</td>
                <td className="p-1.5 text-center">{r.subOut}</td>
                <td className="p-1.5 text-center">{r.unusedSub}</td>
                <td className="p-1.5 text-center">{r.captain}</td>
              </tr>
            ))}
          </tbody>
          {careerRows.length > 0 && (
            <tfoot className="border-t-2 border-[#040f4f] bg-[#f2f2f2] font-bold">
              <tr>
                <td colSpan={3} className="p-2">Total</td>
                <td className="p-1.5 text-center">{careerTotals.appearances}</td>
                <td className="p-1.5 text-center">{careerTotals.minutesPlayed}</td>
                <td className="p-1.5 text-center">{careerTotals.cleanSheets}</td>
                <td className="p-1.5 text-center">{careerTotals.goals}</td>
                <td className="p-1.5 text-center">{careerTotals.assists}</td>
                <td className="p-1.5 text-center">{careerTotals.ownGoals}</td>
                <td className="p-1.5 text-center">{careerTotals.yellow}</td>
                <td className="p-1.5 text-center">{careerTotals.secondYellow}</td>
                <td className="p-1.5 text-center">{careerTotals.red}</td>
                <td className="p-1.5 text-center">{careerTotals.subIn}</td>
                <td className="p-1.5 text-center">{careerTotals.subOut}</td>
                <td className="p-1.5 text-center">{careerTotals.unusedSub}</td>
                <td className="p-1.5 text-center">{careerTotals.captain}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Matches</div>
      <div role="region" aria-label="Matches ? scroll horizontally to see all columns" tabIndex={0} className="max-w-full overflow-x-auto border border-[#040f4f] bg-white p-3">
        <table className="w-full min-w-[1600px] table-auto whitespace-nowrap text-left text-[11px] text-[#040f4f]">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2">Date And Time Of The Match</th>
              <th className="p-2">Name Of Competition</th>
              <th className="p-2">Team A</th>
              <th className="p-2">Team B</th>
              <th className="p-2">Goals A</th>
              <th className="p-2">Goals B</th>
              <th className="p-2">Minutes Played</th>
              <th className="p-2">Clean Sheets</th>
              <th className="p-2">Starter Or Bench</th>
              <th className="p-2">Goals</th>
              <th className="p-2">Penalty Goals</th>
              <th className="p-2">Assists</th>
              <th className="p-2">Own Goal</th>
              <th className="p-2">Yellow Card</th>
              <th className="p-2">Second Yellow Card</th>
              <th className="p-2">Red Card</th>
            </tr>
          </thead>
          <tbody>
            {matchRows.length === 0 ? (
              <tr><td colSpan={16} className="p-4 text-center">No Matches Available For This Membership.</td></tr>
            ) : matchRows.map((m) => (
              <tr key={m.matchId} className="border-b border-gray-200">
                <td className="p-1.5 whitespace-nowrap">
                  <Link href={`/admin/matches/${m.matchId}`} className="font-semibold hover:underline">{m.date}{m.time ? ` ${m.time}` : ""}</Link>
                  <MatchNoteIcon matchId={m.matchId} note={m.note} />
                </td>
                <td className="p-1.5 whitespace-nowrap">{m.competition}</td>
                <td className="p-1.5 whitespace-nowrap">{m.teamA}</td>
                <td className="p-1.5 whitespace-nowrap">{m.teamB}</td>
                <td className="p-1.5 text-center">{m.goalsA}</td>
                <td className="p-1.5 text-center">{m.goalsB}</td>
                <td className="p-1.5 text-center">{m.minutes}</td>
                <td className="p-1.5 text-center">{m.cleanSheets}</td>
                <td className="p-1.5 text-center">{m.starterBench}</td>
                <td className="p-1.5 text-center">{m.goals}</td>
                <td className="p-1.5 text-center">{m.penaltyGoals}</td>
                <td className="p-1.5 text-center">{m.assists}</td>
                <td className="p-1.5 text-center">{m.ownGoals}</td>
                <td className="p-1.5 text-center">{m.yellow}</td>
                <td className="p-1.5 text-center">{m.secondYellow}</td>
                <td className="p-1.5 text-center">{m.red}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
