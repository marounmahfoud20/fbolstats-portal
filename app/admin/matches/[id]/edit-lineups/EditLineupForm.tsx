"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { shirtNumberOrder } from "@/lib/edition-shirt-numbers";
import { saveMatchLineups } from "@/lib/match-actions";
import { isMembershipActiveOnDate } from "@/lib/membership-eligibility";

type Person = { id: number; firstName: string | null; lastName: string | null; commonName: string | null; position: string | null };
type Membership = { id: number; role: string; startDate: string | null; endDate: string | null; isActive: boolean; person: Person };
type TeamData = { id: number; name: string; memberships: Membership[] } | null;
type ExistingApp = { personId: number; teamId: number | null; role: string };
type LineupRole = "Starter" | "Substitute" | "";

export default function EditLineupForm({  
  matchId, 
  matchDate,
  teamA, 
  teamB, 
  existingAppearances,
  initialShirts,
  suggestedShirts = {},
}: {
  matchId: number;
  matchDate: string | null;
  teamA: TeamData;
  teamB: TeamData;
  existingAppearances: ExistingApp[];
  initialShirts: Record<number, string>;
  suggestedShirts?: Record<string, string>;
}) {
  const router = useRouter();
  const saveInProgress = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shirtDrafts, setShirtDrafts] = useState<Record<string, string>>({});

  const [lineupSelections, setLineupSelections] = useState<Record<string, LineupRole>>(() => {
    const init: Record<string, LineupRole> = {};
    for (const app of existingAppearances) {
      if (app.teamId && (app.role === "Starter" || app.role === "Substitute")) {
        init[`${app.teamId}-${app.personId}`] = app.role;
      }
    }
    return init;
  });

  // Keep rows in their saved sections while the user makes multiple selections.
  const [savedLineupSelections, setSavedLineupSelections] = useState(lineupSelections);
  const savedShirtNumber = (teamId: number, personId: number) =>
    initialShirts[personId] ?? suggestedShirts[`${teamId}-${personId}`] ?? "";
  const shirtNumber = (teamId: number, personId: number) =>
    shirtDrafts[`${teamId}-${personId}`] ?? savedShirtNumber(teamId, personId);

  const renderShirtInput = (teamId: number, player: Person) => (
    <input
      inputMode="numeric"
      maxLength={3}
      aria-label={`Shirt number for ${player.commonName || `${player.firstName || ""} ${player.lastName || ""}`.trim()} (${teamId})`}
      value={shirtNumber(teamId, player.id)}
      onChange={(event) => setShirtDrafts(prev => ({ ...prev, [`${teamId}-${player.id}`]: event.target.value.replace(/\D/g, "") }))}
      className="h-7 w-full min-w-8 border border-gray-300 bg-white text-center font-bold text-[#040f4f] focus:border-blue-500"
    />
  );

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

  const handleAddStaff = (teamId: number, membership: Membership) => {
    const key = `${teamId}-${membership.person.id}`;
    setStaffSelections((prev) => ({ ...prev, [key]: membership.role || "Coach" }));
  };

  const getEligiblePlayers = (team: TeamData) => {
    if (!team) return [];
    const deduped = new Map<number, Person>();
    for (const m of team.memberships) {
      if (m.role.toLowerCase() !== "player") continue;
      if (!isMembershipActiveOnDate(m, matchDate)) continue;
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
    if (saveInProgress.current) return;
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
      if (personId) {
        appearances.push({ teamId: parseInt(teamId, 10), personId: parseInt(personId, 10), role: "Captain" });
      }
    }

    for (const [teamId, personId] of Object.entries(goalkeeperByTeam)) {
      if (personId) {
        appearances.push({ teamId: parseInt(teamId, 10), personId: parseInt(personId, 10), role: "Goalkeeper" });
      }
    }

    const shirts = appearances
      .filter(a => a.role === "Starter" || a.role === "Substitute")
      .map(a => ({ personId: a.personId, number: shirtNumber(a.teamId, a.personId) }));
    saveInProgress.current = true;
    setLoading(true);
    setError("");
    try {
      await saveMatchLineups(matchId, appearances, shirts);
      setSavedLineupSelections({ ...lineupSelections });
      router.push(`/admin/matches/${matchId}`);
      router.refresh();
    } catch {
      setError("Could not save the lineup. Your selections and shirt numbers are still here. Please try again.");
    } finally {
      saveInProgress.current = false;
      setLoading(false);
    }
  };

  const renderTeamSection = (team: TeamData, eligiblePlayers: Person[]) => {
    if (!team) return <div className="text-gray-400">Team not found in DB</div>;
    const startingPlayers = eligiblePlayers.filter((player) => lineupSelections[`${team.id}-${player.id}`] === "Starter");
    const retainedAssignmentOption = (personId: string | undefined) => {
      if (!personId || startingPlayers.some((player) => String(player.id) === personId)) return null;
      const person = team.memberships.find((membership) => String(membership.person.id) === personId)?.person;
      const name = person?.commonName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || `Person ${personId}`;
      return <option value={personId} hidden disabled>{name}</option>;
    };
    const staffByPerson = new Map<number, Membership>();
    for (const membership of team.memberships) {
      if (membership.role.toLowerCase() === "player" || !isMembershipActiveOnDate(membership, matchDate)) continue;
      if (!staffByPerson.has(membership.person.id)) staffByPerson.set(membership.person.id, membership);
    }
    const staffCandidates = Array.from(staffByPerson.values());
    const coachCandidates = staffCandidates
      .filter(({ role }) => role.toLowerCase().includes("coach"))
      .sort((a, b) => {
        const nameA = a.person.commonName || `${a.person.firstName || ""} ${a.person.lastName || ""}`.trim();
        const nameB = b.person.commonName || `${b.person.firstName || ""} ${b.person.lastName || ""}`.trim();
        return nameA.localeCompare(nameB);
      });
    const selectedStaff = Object.entries(staffSelections)
      .filter(([key, role]) => key.startsWith(`${team.id}-`) && !!role)
      .map(([key, role]) => ({ personId: Number(key.slice(`${team.id}-`.length)), role }))
      .flatMap((selection) => {
        const membership = staffByPerson.get(selection.personId);
        return membership ? [{ ...selection, membership }] : [];
      });

    return (
      <div className="flex-1 bg-[#030b3a] border border-[#f4a01c]/50 p-4 rounded">
        <h2 className="text-[#f4a01c] font-bold text-lg mb-4">{team.name}</h2>

        {(["Starter", "Substitute"] as const).map((role) => {
          const selectedPlayers = eligiblePlayers
            .filter((player) => savedLineupSelections[`${team.id}-${player.id}`] === role)
            .sort((a, b) => shirtNumberOrder(savedShirtNumber(team.id, a.id)) - shirtNumberOrder(savedShirtNumber(team.id, b.id)));
          return (
            <section key={role} className="mb-4">
              <h3 className="font-bold bg-[#dfdfdf] text-[#040f4f] px-2 py-1 mb-2 rounded-sm">
                {role === "Starter" ? "Starters" : "Substitutes"} ({selectedPlayers.length})
              </h3>
              {selectedPlayers.length === 0 && <p className="text-gray-400 italic">No players selected.</p>}
              <div className="space-y-1">
                {selectedPlayers.map((player) => {
                  const name = player.commonName || `${player.firstName || ""} ${player.lastName || ""}`.trim() || `Player ${player.id}`;
                  return (
                    <div key={player.id} className="flex items-center gap-2 border-b border-[#f4a01c]/20 pb-1">
                      <span className="w-12 shrink-0">
                        {renderShirtInput(team.id, player)}
                      </span>
                      <span className="min-w-0 flex-1 break-words">{name}</span>
                      <select
                        aria-label={`Lineup role for ${name} (${team.name})`}
                        className="bg-white text-black text-xs p-1 border border-gray-400"
                        value={lineupSelections[`${team.id}-${player.id}`] || ""}
                        onChange={(event) => handleLineupRoleChange(team.id, player.id, event.target.value as LineupRole)}
                      >
                        <option value="Starter">Starter</option>
                        <option value="Substitute">Substitute</option>
                        <option value="">Remove</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <h3 className="font-bold bg-[#dfdfdf] text-[#040f4f] px-2 py-1 mb-2 rounded-sm mt-4">Coaches / Staff</h3>
        <select
          value=""
          onChange={(e) => {
            const membership = coachCandidates.find((candidate) => String(candidate.person.id) === e.target.value);
            if (membership) handleAddStaff(team.id, membership);
          }}
          className="w-full bg-white text-black text-xs p-2 border border-gray-400 mb-2"
          aria-label={`Select an active coach for ${team.name}`}
        >
          <option value="">Select an active coach...</option>
          {coachCandidates.map((membership) => {
            const name = membership.person.commonName || `${membership.person.firstName || ""} ${membership.person.lastName || ""}`.trim() || `Person ${membership.person.id}`;
            return (
              <option key={membership.person.id} value={membership.person.id}>
                {name} ({membership.role})
              </option>
            );
          })}
        </select>
        {staffCandidates.length === 0 && <p className="text-gray-400 italic">No active staff found.</p>}
        {staffCandidates.length > 0 && coachCandidates.length === 0 && <p className="text-gray-400 italic">No active coaches for this match date.</p>}
        <div className="flex flex-col gap-1">
          {selectedStaff.map(({ personId, role: currentRole, membership }) => {
            const c = membership.person;
            const roleName = membership.role || "Staff";
            return (
              <div key={c.id} className="flex items-center justify-between border-b border-[#f4a01c]/20 pb-1">
                <span className="flex-1 px-2 truncate">{c.commonName || `${c.firstName || ""} ${c.lastName || ""}`.trim()} ({roleName})</span>
                <select 
                  className="bg-white text-black text-xs p-1 border border-gray-400 w-24"
                  value={currentRole}
                  onChange={(e) => handleStaffRoleChange(team.id, personId, e.target.value)}
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
              {retainedAssignmentOption(captainByTeam[team.id])}
              {startingPlayers.map((p) => (
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
              {retainedAssignmentOption(goalkeeperByTeam[team.id])}
              {startingPlayers.map((p) => (
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
    const availablePlayers = players.filter((player) => !savedLineupSelections[`${team.id}-${player.id}`]);
    return (
      <div className="flex-1">
        <h3 className="font-bold text-[#040f4f] border-b border-gray-300 pb-1 mb-2">{team.name}</h3>
        <div className="grid grid-cols-[32px_32px_56px_1fr] text-[11px] font-bold text-gray-700 mb-1">
          <span className="text-center">St</span>
          <span className="text-center">Sb</span>
          <span className="text-center">No.</span>
          <span>Player</span>
        </div>
        {availablePlayers.length === 0 && <p className="text-gray-400 italic text-xs py-2">{players.length === 0 ? "No eligible players for match date." : "All eligible players have been selected."}</p>}
        <div className="space-y-1">
          {availablePlayers.map((p) => {
            const key = `${team.id}-${p.id}`;
            const currentRole = lineupSelections[key] || "";
            return (
              <div key={p.id} className="grid grid-cols-[32px_32px_56px_1fr] items-center text-xs border-b border-gray-100 pb-1">
                <label className="flex justify-center">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.commonName || `${p.firstName || ""} ${p.lastName || ""}`.trim()} as starter for ${team.name}`}
                    name={`lineup-${team.id}-${p.id}`}
                    checked={currentRole === "Starter"}
                    onChange={() => handleLineupRoleChange(team.id, p.id, currentRole === "Starter" ? "" : "Starter")}
                  />
                </label>
                <label className="flex justify-center">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.commonName || `${p.firstName || ""} ${p.lastName || ""}`.trim()} as substitute for ${team.name}`}
                    name={`lineup-${team.id}-${p.id}`}
                    checked={currentRole === "Substitute"}
                    onChange={() => handleLineupRoleChange(team.id, p.id, currentRole === "Substitute" ? "" : "Substitute")}
                  />
                </label>
                <span className="mx-1">
                  {renderShirtInput(team.id, p)}
                </span>
                <span className="truncate">{p.commonName || `${p.firstName || ""} ${p.lastName || ""}`}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <fieldset disabled={loading} className="min-w-0">
      <div className="flex gap-4 items-start">
        {renderTeamSection(teamA, teamAEligiblePlayers)}
        {renderTeamSection(teamB, teamBEligiblePlayers)}
      </div>

      <div className="mt-6 border border-[#f4a01c]/50 rounded bg-white p-4 text-[#040f4f]">
        <div className="font-bold mb-3">Eligible Players For This Match</div>
        <p className="mb-3 text-xs">Choose starters and substitutes, then save. Players stay in place and shirt numbers remain editable until you save the lineup.</p>
        <div className="flex gap-4">
          {renderEligiblePlayerColumn(teamA, teamAEligiblePlayers)}
          {renderEligiblePlayerColumn(teamB, teamBEligiblePlayers)}
        </div>
      </div>

      <div className="mt-8 text-center border-t border-[#f4a01c]/50 pt-6">
        {error && <p role="alert" className="mb-3 text-red-300">{error}</p>}
        <button 
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-[#f4a01c] text-[#040f4f] font-bold px-8 py-2 rounded shadow hover:bg-orange-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Lineups"}
        </button>
      </div>
    </fieldset>
  );
}
