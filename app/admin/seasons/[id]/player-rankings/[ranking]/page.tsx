import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

const rankingMeta: Record<string, { title: string; eventLabel: string }> = {
  goalscorers: {
    title: "Goalscorers",
    eventLabel: "Goal",
  },
  "own-goals": {
    title: "Own Goals",
    eventLabel: "Own Goal",
  },
  "clean-sheets": {
    title: "Clean Sheets",
    eventLabel: "Clean Sheet",
  },
  bookings: {
    title: "Bookings",
    eventLabel: "Booking",
  },
  assists: {
    title: "Assists",
    eventLabel: "Assist",
  },
};

type Row = {
  personId: number;
  nationality: string;
  name: string;
  count: number;
};

const COUNTRY_TO_CODE: Record<string, string> = {
  lebanon: "LB",
  syria: "SY",
  iraq: "IQ",
  iran: "IR",
  jordan: "JO",
  palestine: "PS",
  saudi: "SA",
  egypt: "EG",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  france: "FR",
  germany: "DE",
  spain: "ES",
  italy: "IT",
  portugal: "PT",
  brazil: "BR",
  argentina: "AR",
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
};

function fullName(person: { id: number; commonName: string | null; firstName: string | null; lastName: string | null }) {
  return person.commonName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || `Player ${person.id}`;
}

function codeToFlag(code: string) {
  const up = code.toUpperCase();
  if (up.length !== 2) return "??";
  return String.fromCodePoint(...[...up].map((c) => 127397 + c.charCodeAt(0)));
}

function nationalityFlag(nationality: string) {
  if (!nationality || nationality === "-") return "??";
  const cleaned = nationality.trim();
  if (/^\d+$/.test(cleaned)) return null;
  const key = cleaned.toLowerCase();
  const code = COUNTRY_TO_CODE[key] || (nationality.length === 2 ? nationality.toUpperCase() : "");
  return code ? codeToFlag(code) : "??";
}

function nationalityCell(nationality: string) {
  const cleaned = (nationality || "").trim();
  if (!cleaned || cleaned === "-") return "??";

  if (/^\d+$/.test(cleaned)) {
    return (
      <img
        src={`https://dsg-backend.com/resources/img/flags/16x16/${cleaned}.png`}
        alt={cleaned}
        className="w-4 h-4 inline-block align-middle"
      />
    );
  }

  return nationalityFlag(cleaned);
}

function sortRows(rowsMap: Map<number, Row>) {
  return Array.from(rowsMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
}

export default async function SeasonPlayerRankingPage({
  params,
}: {
  params: Promise<{ id: string; ranking: string }>;
}) {
  const resolvedParams = await params;
  const seasonId = parseInt(resolvedParams.id);
  const ranking = resolvedParams.ranking;

  if (isNaN(seasonId)) notFound();

  const rankingInfo = rankingMeta[ranking];
  if (!rankingInfo) notFound();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      league: true,
      groups: {
        include: {
          matches: {
            include: {
              meta: true,
              events: {
                include: {
                  person: true,
                },
              },
              appearances: {
                include: {
                  person: true,
                },
              },
            },
          },
        },
      },
      teams: {
        include: {
          team: true,
        },
      },
    },
  });

  if (!season) notFound();

  const rowsMap = new Map<number, Row>();
  const increment = (person: { id: number; nationality: string | null; commonName: string | null; firstName: string | null; lastName: string | null }, value = 1) => {
    const existing = rowsMap.get(person.id);
    if (existing) {
      existing.count += value;
      return;
    }
    rowsMap.set(person.id, {
      personId: person.id,
      nationality: person.nationality || "-",
      name: fullName(person),
      count: value,
    });
  };

  if (ranking === "goalscorers") {
    for (const group of season.groups) {
      for (const match of group.matches) {
        for (const ev of match.events) {
          if (ev.eventType === "goal" || ev.eventType === "penalty_goal") increment(ev.person);
        }
      }
    }
  }

  if (ranking === "own-goals") {
    for (const group of season.groups) {
      for (const match of group.matches) {
        for (const ev of match.events) {
          if (ev.eventType === "own_goal") increment(ev.person);
        }
      }
    }
  }

  if (ranking === "bookings") {
    for (const group of season.groups) {
      for (const match of group.matches) {
        for (const ev of match.events) {
          if (ev.eventType === "red_card" || ev.eventType === "second_yellow" || ev.eventType === "yellow_card") {
            increment(ev.person);
          }
        }
      }
    }
  }

  if (ranking === "assists") {
    for (const group of season.groups) {
      for (const match of group.matches) {
        for (const ev of match.events) {
          if (ev.eventType === "assist") increment(ev.person);
        }
      }
    }
  }

  if (ranking === "clean-sheets") {
    const seasonTeamByName = new Map<string, number>();
    for (const st of season.teams) seasonTeamByName.set(st.team.name, st.teamId);

    for (const group of season.groups) {
      for (const match of group.matches) {
        const scoreA = Number.parseInt(match.meta?.ftA || "", 10);
        const scoreB = Number.parseInt(match.meta?.ftB || "", 10);
        if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) continue;

        const teamAId = seasonTeamByName.get(match.teamA);
        const teamBId = seasonTeamByName.get(match.teamB);

        if (scoreB === 0 && teamAId) {
          const keepersA = match.appearances.filter((a) => {
            const pos = a.person.position?.toLowerCase() || "";
            return a.role === "Starter" && a.teamId === teamAId && pos.includes("goal");
          });
          for (const gk of keepersA) increment(gk.person);
        }

        if (scoreA === 0 && teamBId) {
          const keepersB = match.appearances.filter((a) => {
            const pos = a.person.position?.toLowerCase() || "";
            return a.role === "Starter" && a.teamId === teamBId && pos.includes("goal");
          });
          for (const gk of keepersB) increment(gk.person);
        }
      }
    }
  }

  const rows = sortRows(rowsMap);

  return (
    <div className="min-h-screen bg-white text-[#040f4f] pb-20 font-sans text-[11px]">
      <div className="w-[980px] mx-auto pt-6 pb-2">
        <Link
          href={`/admin/seasons/${season.id}`}
          className="text-[#f4a01c] text-sm font-bold hover:underline inline-flex items-center"
        >
          &larr; Back to {season.name}
        </Link>
      </div>

      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center h-[28px] mt-4 px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">
          {rankingInfo.title} - {season.league.competitionName} {season.name}
        </span>
      </div>

      <table className="w-[980px] mx-auto border-x border-b border-[#040f4f] mb-6 border-collapse bg-white">
        <thead>
          <tr className="bg-[#f2f2f2] text-[#040f4f] h-8 border-b border-[#040f4f]">
            <th className="w-20 text-left pl-3">Rank</th>
            <th className="w-44 text-left">Nationality</th>
            <th className="text-left">Name</th>
            <th className="w-24 text-left">{rankingInfo.eventLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500 font-bold">
                No data found in season matches for this ranking yet.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.personId} className="h-8 border-b border-gray-200 hover:bg-gray-50">
                <td className="pl-3 font-bold">{idx + 1}</td>
                <td title={row.nationality}>{nationalityCell(row.nationality)}</td>
                <td className="font-bold">{row.name}</td>
                <td>{row.count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
