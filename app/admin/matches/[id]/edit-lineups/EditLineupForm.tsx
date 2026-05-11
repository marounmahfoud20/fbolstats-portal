"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMatchLineups } from "@/lib/match-actions";

type Person = { id: number; firstName: string | null; lastName: string | null; commonName: string | null; position: string | null };
type Membership = { id: number; role: string; startDate: string | null; endDate: string | null; person: Person };
type TeamData = { id: number; name: string; memberships: Membership[] } | null;
type ExistingApp = { personId: number; teamId: number | null; role: string };
type LineupRole = "Starter" | "Substitute" | "";

export default function EditLineupForm({  
  matchId, 
  matchDate,
  teamA, 
  teamB, 
  existingAppearances 
}: {
  matchId: number;
  matchDate: string | null;
  teamA: TeamData;
  teamB: TeamData;
  existingAppearances: ExistingApp[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [lineupSelections, setLineupSelections] = useState<Record<string, LineupRole>>(() => {
    const init: Record<string, LineupRole> = {};
    for (const app of existingAppearances) {
      if (app.teamId && (app.role === "Starter" || app.role === "Substitute")) {
        init[`${app.teamId}-${app.personId}`] = app.role;
      }
    }
    return init;
  });

  const [staffSelections, setStaffSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const app of existingAppearances) {
      if (app.teamId && !["Starter", "Substitute", "Captain", "Goalkeeper"].includes(app.role)) {
        init[`${app.teamId}-${app.personId}`] = app.role;
      }
    }
    return init;
  });

  const [captainByTeam, setCaptainByTeam] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const app of existingAppearances) {
      if (app.teamId && app.role === "Captain") {
        init[app.teamId] = String(app.personId);
      }
    }
    return init;
  });

  const [goalkeeperByTeam, setGoalkeeperByTeam] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const app of existingAppearances) {
      if (app.teamId && app.role === "Goalkeeper") {
        init[app.teamId] = String(app.personId);
      }
    }
    return init;
  });

  const handleLineupRoleChange = (teamId: number, personId: number, role: LineupRole) => {
    setLineupSelections((prev) => {
      const copy = { ...prev };
      const key = `${teamId}-${personId}`;
      if (!role) {
        delete copy[key];
      } else {
        copy[key] = role;
      }
      return copy;
    });
  };

  const handleStaffRoleChange = (teamId: number, personId: number, role: string) => {
    setStaffSelections((prev) => {
      const copy = { ...prev };
      const key = `${teamId}-${personId}`;
      if (role === "None") {
        delete copy[key];
      } else {
        copy[key] = role;
      }
      return copy;
    });
  };

  const isMembershipEligible = (startDate: string | null, endDate: string | null) => {
    if (!matchDate) return true;
    const matchTs = Date.parse(matchDate);
    if (Number.isNaN(matchTs)) return true;
    const startTs = startDate ? Date.parse(startDate) : Number.NEGATIVE_INFINITY;
    const endTs = endDate ? Date.parse(endDate) : Number.POSITIVE_INFINITY;
    return matchTs >= startTs && matchTs <= endTs;
  };

  const getEligiblePlayers = (team: TeamData) => {
    if (!team) return [];
    const deduped = new Map<number, Person>();
    for (const m of team.memberships) {
      if (m.role.toLowerCase() !== "player") continue;
      if (!isMembershipEligible(m.startDate, m.endDate)) continue;
      if (!deduped.has(m.person.id)) deduped.set(m.person.id, m.person);
    }
    return Array.from(deduped.values()).sort((a, b) => {
      const aNum = Number.POSITIVE_INFINITY;
      const bNum = Number.POSITIVE_INFINITY;
      if (aNum !== bNum) return aNum - bNum;
      const aName = (a.commonName || `${a.firstName || ""} ${a.lastName || ""}`).trim().toLowerCase();
      const bName = (b.commonName || `${b.firstName || ""} ${b.lastName || ""}`).trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  const handleSave = async () => {
    setLoading(true);
    const appearances: { teamId: number; personId: number; role: string }[] = [];

    for (const [key, role] of Object.entries(lineupSelections)) {
      const [tId, pId] = key.split("-");
      appearances.push({ teamId: parseInt(tId, 10), personId: parseInt(pId, 10), role });
    }

    for (const [key, role] of Object.entries(staffSelections)) {
      const [tId, pId] = key.split("-");
      appearances.push({ teamId: parseInt(tId, 10), personId: parseInt(pId, 10), role });
    }

    for (const [teamId, personId] of Object.entries(captainByTeam)) {
      if (personId) appearances.push({ teamId: parseInt(teamId, 10), personId: parseInt(personId, 10), role: "Captain" });
    }

    for (const [teamId, personId] of Object.entries(goalkeeperByTeam)) {
      if (personId) appearances.push({ teamId: parseInt(teamId, 10), personId: parseInt(personId, 10), role: "Goalkeeper" });
    }

    await saveMatchLineups(matchId, appearances);
    setLoading(false);
    router.push(`/admin/matches/${matchId}`);
  };

  const renderTeamSection = (team: TeamData, eligiblePlayers: Person[]) => {
    if (!team) return <div className="text-gray-400">Team not found in DB</div>;
    const coaches = team.memberships.filter(m => m.role.toLowerCase() !== "player").map(m => m.person);

    return (
      <div className="flex-1 bg-[#030b3a] border border-[#f4a01c]/50 p-4 rounded">
        <h2 className="text-[#f4a01c] font-bold text-lg mb-4">{team.name}</h2>

        <h3 className="font-bold bg-[#dfdfdf] text-[#040f4f] px-2 py-1 mb-2 rounded-sm mt-4">Coaches / Staff</h3>
        {coaches.length === 0 && <p className="text-gray-400 italic">No active staff found.</p>}
        <div className="flex flex-col gap-1">
          {coaches.map(c => {
            const key = `${team.id}-${c.id}`;
            const currentRole = staffSelections[key] || "None";
            const roleName = team.memberships.find(m => m.person.id === c.id)?.role || "Staff";
            return (
              <div key={c.id} className="flex items-center justify-between border-b border-[#f4a01c]/20 pb-1">
                <span className="flex-1 px-2 truncate">{c.commonName || `${c.firstName} ${c.lastName}`} ({roleName})</span>
                <select 
                  className="bg-white text-black text-xs p-1 border border-gray-400 w-24"
                  value={currentRole}
                  onChange={(e) => handleStaffRoleChange(team.id, c.id, e.target.value)}
                >
                  <option value="None">None</option>
                  <option value={roleName}>{roleName}</option>
                  <option value="Coach">Coach</option>
                  <option value="Assistant Coach">Assistant Coach</option>
                </select>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-2">
          <div>
            <label className="block text-xs text-[#f4a01c] mb-1 font-bold">Captain</label>
            <select
              className="w-full bg-white text-black text-xs p-1 border border-gray-400"
              value={captainByTeam[team.id] || ""}
              onChange={(e) => setCaptainByTeam((prev) => ({ ...prev, [team.id]: e.target.value }))}
            >
              <option value="">None</option>
              {eligiblePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.commonName || `${p.firstName || ""} ${p.lastName || ""}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#f4a01c] mb-1 font-bold">Goalkeeper</label>
            <select
              className="w-full bg-white text-black text-xs p-1 border border-gray-400"
              value={goalkeeperByTeam[team.id] || ""}
              onChange={(e) => setGoalkeeperByTeam((prev) => ({ ...prev, [team.id]: e.target.value }))}
            >
              <option value="">None</option>
              {eligiblePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.commonName || `${p.firstName || ""} ${p.lastName || ""}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const teamAEligiblePlayers = getEligiblePlayers(teamA);
  const teamBEligiblePlayers = getEligiblePlayers(teamB);

  const renderEligiblePlayerColumn = (team: TeamData, players: Person[]) => {
    if (!team) return <div className="text-gray-400">Team not found in DB</div>;
    return (
      <div className="flex-1">
        <h3 className="font-bold text-[#040f4f] border-b border-gray-300 pb-1 mb-2">{team.name}</h3>
        <div className="grid grid-cols-[32px_32px_56px_1fr] text-[11px] font-bold text-gray-700 mb-1">
          <span className="text-center">St</span>
          <span className="text-center">Sb</span>
          <span className="text-center">No.</span>
          <span>Player</span>
        </div>
        {players.length === 0 && <p className="text-gray-400 italic text-xs py-2">No eligible players for match date.</p>}
        <div className="space-y-1">
          {players.map((p) => {
            const key = `${team.id}-${p.id}`;
            const currentRole = lineupSelections[key] || "";
            return (
              <div key={p.id} className="grid grid-cols-[32px_32px_56px_1fr] items-center text-xs border-b border-gray-100 pb-1">
                <label className="flex justify-center">
                  <input
                    type="radio"
                    name={`lineup-${team.id}-${p.id}`}
                    checked={currentRole === "Starter"}
                    onChange={() => handleLineupRoleChange(team.id, p.id, "Starter")}
                  />
                </label>
                <label className="flex justify-center">
                  <input
                    type="radio"
                    name={`lineup-${team.id}-${p.id}`}
                    checked={currentRole === "Substitute"}
                    onChange={() => handleLineupRoleChange(team.id, p.id, "Substitute")}
                  />
                </label>
                <span className="text-center font-bold bg-gray-50 border border-gray-200 mx-1">-</span>
                <span className="truncate">{p.commonName || `${p.firstName || ""} ${p.lastName || ""}`}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-4 items-start">
        {renderTeamSection(teamA, teamAEligiblePlayers)}
        {renderTeamSection(teamB, teamBEligiblePlayers)}
      </div>

      <div className="mt-6 border border-[#f4a01c]/50 rounded bg-white p-4 text-[#040f4f]">
        <div className="font-bold mb-3">Eligible Players For This Match</div>
        <div className="flex gap-4">
          {renderEligiblePlayerColumn(teamA, teamAEligiblePlayers)}
          {renderEligiblePlayerColumn(teamB, teamBEligiblePlayers)}
        </div>
      </div>

      <div className="mt-8 text-center border-t border-[#f4a01c]/50 pt-6">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#f4a01c] text-[#040f4f] font-bold px-8 py-2 rounded shadow hover:bg-orange-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Lineups"}
        </button>
      </div>
    </div>
  );
}
