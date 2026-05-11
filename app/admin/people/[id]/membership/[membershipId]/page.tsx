import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

function personName(first?: string | null, last?: string | null, common?: string | null) {
  return common || `${first || ""} ${last || ""}`.trim() || "Unknown";
}

function parseCountryFromCompetition(name: string) {
  if (name.includes(" - ")) return name.split(" - ")[0].trim();
  if (name.toLowerCase().includes("leban")) return "Lebanon";
  return "N/A";
}

function countryToCode(country: string) {
  const key = country.trim().toLowerCase();
  const map: Record<string, string> = {
    lebanon: "LB",
    world: "UN",
    england: "GB",
    "united kingdom": "GB",
    france: "FR",
    germany: "DE",
    italy: "IT",
    spain: "ES",
    portugal: "PT",
    brazil: "BR",
    argentina: "AR",
    "united states": "US",
  };
  return map[key] || (country.length === 2 ? country.toUpperCase() : "");
}

function codeToFlag(code: string) {
  if (!code || code.length !== 2 || code === "UN") return "🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function countryFlag(country: string) {
  return codeToFlag(countryToCode(country));
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
        ...(membership.startDate ? { date: { gte: membership.startDate } } : {}),
        ...(membership.endDate ? { date: { lte: membership.endDate } } : {}),
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

  const matchRows = appearances.map((a) => {
    const personEvents = a.match.events.filter((e) => e.personId === personId && e.teamId === membership.teamId);
    const goals = personEvents.filter((e) => e.eventType === "goal").length;
    const penaltyGoals = personEvents.filter((e) => e.eventType === "penalty_goal").length;
    const assists = personEvents.filter((e) => eventMatches(e.eventType, ["assist"])).length;
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
      date: a.match.date || "",
      time: a.match.time || "",
      country: parseCountryFromCompetition(a.match.group.season.league.competitionName),
      competition: a.match.group.season.league.competitionName,
      season: a.match.group.season.name,
      shirt,
      teamA: a.match.teamA,
      teamB: a.match.teamB,
      goalsA: a.match.meta?.ftA || "",
      goalsB: a.match.meta?.ftB || "",
      minutes,
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
      captain: 0,
    };
  });

  const grouped = new Map<string, typeof matchRows>();
  for (const r of matchRows) {
    const key = `${r.country}|${r.competition}|${r.season}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const careerRows = Array.from(grouped.entries()).map(([key, rows]) => {
    const [country, competition, season] = key.split("|");
    const shirtNumbers = Array.from(new Set(rows.map((r) => r.shirt).filter(Boolean))).join(", ");
    return {
      country,
      competition,
      season,
      shirtNumbers: shirtNumbers || "-",
      appearances: rows.length,
      minutesPlayed: rows.reduce((s, r) => s + r.minutes, 0),
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

  return (
    <div className="p-6">
      <div className="mb-4 border border-[#040f4f] bg-[#f4a01c] p-2 text-[#040f4f]">
        <span className="font-bold">{personName(membership.person.firstName, membership.person.lastName, membership.person.commonName)} - Player Details</span>
        <span className="float-right">
          <Link href={`/admin/people/${personId}`} className="font-bold hover:underline">View</Link>
        </span>
      </div>

      <div className="mb-4 flex gap-4 border border-[#040f4f] bg-white p-4 text-sm text-[#040f4f]">
        <div className="flex-1 grid grid-cols-2 gap-y-1">
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
        <div className="h-[150px] w-[150px] overflow-hidden border border-[#dfdfdf] bg-gray-50">
          {membership.person.image ? <img src={membership.person.image} alt="Profile" className="h-full w-full object-cover" /> : null}
        </div>
      </div>

      <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Career Stats</div>
      <div className="mb-6 overflow-x-auto border border-[#040f4f] bg-white p-3">
        <table className="w-full table-fixed text-left text-[11px] text-[#040f4f]">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2 text-center"><img src="/planet.png" alt="Country Of Competition" title="Country Of Competition" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center">
                <svg className="inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
              </th>
              <th className="p-2 text-center"></th>
              <th className="p-2 text-center"><img src="/plain-orange-football-shirt.svg" alt="Shirt Numbers" title="Shirt Numbers" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/appearance.png" alt="Number Of Appearances" title="Number Of Appearances" className="inline-block h-4 w-4" /></th>
              <th className="p-2 text-center"><img src="/time-315.png" alt="Minutes Played" title="Minutes Played" className="inline-block h-4 w-4" /></th>
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
                <td className="p-1.5 whitespace-nowrap">{countryFlag(r.country)} {r.country}</td>
                <td className="p-1.5 break-words">{r.competition}</td>
                <td className="p-1.5 whitespace-nowrap">{r.season}</td>
                <td className="p-1.5 text-center">{r.shirtNumbers}</td>
                <td className="p-1.5 text-center">{r.appearances}</td>
                <td className="p-1.5 text-center">{r.minutesPlayed}</td>
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
        </table>
      </div>

      <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Matches</div>
      <div className="overflow-x-auto border border-[#040f4f] bg-white p-3">
        <table className="w-full table-fixed text-left text-[11px] text-[#040f4f]">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2">Date And Time Of The Match</th>
              <th className="p-2">Country Of Competition</th>
              <th className="p-2">Name Of Competition</th>
              <th className="p-2">Team A</th>
              <th className="p-2">Team B</th>
              <th className="p-2">Goals A</th>
              <th className="p-2">Goals B</th>
              <th className="p-2">Minutes Played</th>
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
                <td className="p-1.5 whitespace-nowrap"><Link href={`/admin/matches/${m.matchId}`} className="font-semibold hover:underline">{m.date}{m.time ? ` ${m.time}` : ""}</Link></td>
                <td className="p-1.5 whitespace-nowrap">{m.country}</td>
                <td className="p-1.5 break-words">{m.competition}</td>
                <td className="p-1.5 break-words">{m.teamA}</td>
                <td className="p-1.5 break-words">{m.teamB}</td>
                <td className="p-1.5 text-center">{m.goalsA}</td>
                <td className="p-1.5 text-center">{m.goalsB}</td>
                <td className="p-1.5 text-center">{m.minutes}</td>
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
